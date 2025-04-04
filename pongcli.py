#!/usr/bin/env python3

import requests
import json
import sys
import asyncio
import websockets
import time
import signal
import urllib3
import ssl
import curses
import argparse
import getpass

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def login_user(username, password, host, port):
    """Authenticate user and get access token"""
    login_url = f"https://{host}:{port}/api/auth/login"
    login_data = {"username": username, "password": password}
    try:
        response = requests.post(
            login_url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(login_data),
            verify=False
        )
        response.raise_for_status()
        token = response.json().get('access_token')
        if not token:
            print("❌ Error: No access token received")
            sys.exit(1)
        return token
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("❌ Error: Invalid server response")
        sys.exit(1)

def check_in_progress_match(token, host, port):
    """Check if there's a match in progress for the user"""
    url = f"https://{host}:{port}/api/pong/match/in-progress/"
    try:
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            verify=False
        )
        response.raise_for_status()
        data = response.json()
        match_data = data.get('match')
        if not match_data:
            return None
        return match_data.get('game_key')
    except requests.exceptions.RequestException as e:
        print(f"❌ Error checking match: {e}")
        return None
    except json.JSONDecodeError:
        print("❌ Error: Invalid server response")
        return None

async def send_move(ws, direction, stdscr=None, debug_y=15):
    """Send movement command to the server"""
    try:
        message = json.dumps({"action": "move", "direction": direction})
        if stdscr:
            stdscr.addstr(debug_y, 0, f"Sending: {message}" + " " * 20)
            stdscr.refresh()
        await ws.send(message)
        if stdscr:
            stdscr.addstr(debug_y+1, 0, f"Move sent: {direction}" + " " * 20)
            stdscr.refresh()
    except Exception as e:
        if stdscr:
            stdscr.addstr(debug_y+2, 0, f"Error sending move: {str(e)}" + " " * 20)
            stdscr.refresh()

async def send_ready(ws, stdscr=None, debug_y=15):
    """Send ready signal to the server"""
    try:
        message = json.dumps({"action": "ready"})
        if stdscr:
            stdscr.addstr(debug_y, 0, "Sending ready signal...")
            stdscr.refresh()
        await ws.send(message)
        if stdscr:
            stdscr.addstr(debug_y, 0, "Ready signal sent")
            stdscr.refresh()
    except Exception as e:
        if stdscr:
            stdscr.addstr(debug_y, 0, f"Error sending ready signal: {e}")
            stdscr.refresh()

def render_game_curses(stdscr, state):
    """Render the game state using curses"""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    if not state or 'players' not in state:
        stdscr.addstr(0, 0, "Waiting for game state...")
        stdscr.refresh()
        return

    height = max_y - 8  
    width = max_x - 2   

    def scale_x(x): 
        return int(x * width / 700)
    def scale_y(y): 
        return int(y * height / 500)

    board = [[' ' for _ in range(width)] for _ in range(height)]
    for x in range(width):
        board[0][x] = '='
        board[height-1][x] = '='
    for y in range(height):
        if y % 2 == 0 and width // 2 < width:
            board[y][width // 2] = '|'

    players_list = []
    for player_key, player_data in state['players'].items():
        side = "left" if player_key == "player1" else "right"
        x_pos = scale_x(player_data['x'])
        y_pos = scale_y(player_data['y'])
        players_list.append({
            'side': side,
            'username': player_data['username'],
            'score': player_data['score'],
            'x': x_pos,
            'y': y_pos,
            'connected': player_data['connected']
        })
        for i in range(-2, 3):
            yy = y_pos + i
            if 0 <= yy < height and 0 <= x_pos < width:
                board[yy][x_pos] = '█'

    ball_x = scale_x(state.get('ball', {'x': 0})['x'])
    ball_y = scale_y(state.get('ball', {'y': 0})['y'])
    if 0 <= ball_y < height and 0 <= ball_x < width:
        board[ball_y][ball_x] = '●'

    for i, row in enumerate(board):
        try:
            stdscr.addnstr(i, 0, "|" + "".join(row) + "|", max_x)
        except curses.error:
            pass

    try:
        left_player = next((p for p in players_list if p['side'] == 'left'), {})
        right_player = next((p for p in players_list if p['side'] == 'right'), {})
        score_str = f"Score: {left_player.get('score', 0)} - {right_player.get('score', 0)}"
        info_str = f"{'🟢' if left_player.get('connected', False) else '🔴'} {left_player.get('username', 'Player 1')} vs {right_player.get('username', 'Player 2')} {'🟢' if right_player.get('connected', False) else '🔴'}"
        controls_str = "Controls: W = Up, S = Down, Q = Quit"

        stdscr.addnstr(height, 0, score_str, max_x)
        stdscr.addnstr(height+1, 0, info_str, max_x)
        stdscr.addnstr(height+2, 0, controls_str, max_x)
    except curses.error:
        pass

    stdscr.refresh()

async def curses_input_listener(stdscr, queue):
    """Listen for keyboard input in non-blocking mode"""
    while True:
        try:
            key = stdscr.getch()
            if key != -1:
                await queue.put(key)
            await asyncio.sleep(0.02)  
        except Exception as e:
            await asyncio.sleep(0.1)

async def process_input_curses(queue, ws, running, stdscr):
    """Process keyboard input and send appropriate commands"""
    last_move_time = 0
    while running[0]:
        try:
            key = await asyncio.wait_for(queue.get(), 0.1)
            current_time = time.time()
            if current_time - last_move_time > 0.1:
                if key in (ord('w'), ord('W')):
                    await send_move(ws, "UP", stdscr, 19)
                    last_move_time = current_time
                elif key in (ord('s'), ord('S')):
                    await send_move(ws, "DOWN", stdscr, 19)
                    last_move_time = current_time
                elif key in (ord('q'), ord('Q')):
                    running[0] = False
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            stdscr.addstr(18, 0, f"Input error: {e}")
            stdscr.refresh()
            await asyncio.sleep(1)

async def keep_connection_alive(ws, running, stdscr):
    """Send periodic pings to keep the websocket connection alive"""
    while running[0]:
        try:
            await ws.ping()
            await asyncio.sleep(15)  
        except Exception as e:
            stdscr.addstr(17, 0, f"Ping error: {e}")
            stdscr.refresh()
            await asyncio.sleep(5)

async def pong_game_client_curses(token, game_key, stdscr, host, port):
    """Main game client function that handles the websocket connection and game state"""
    uri = f"wss://{host}:{port}/ws/pong/{game_key}"
    stdscr.clear()
    stdscr.addstr(0, 0, f"Connecting to game {game_key}...")
    stdscr.refresh()
    try:
        headers = {"Authorization": f"Bearer {token}"}
        ssl_context = ssl._create_unverified_context()
        async with websockets.connect(
            uri, 
            additional_headers=headers,
            ssl=ssl_context
        ) as ws:
            stdscr.addstr(1, 0, "⭐ WebSocket connection established!")
            stdscr.refresh()
            running = [True]
            input_queue = asyncio.Queue()

            listener_task = asyncio.create_task(curses_input_listener(stdscr, input_queue))
            process_task = asyncio.create_task(process_input_curses(input_queue, ws, running, stdscr))
            heartbeat_task = asyncio.create_task(keep_connection_alive(ws, running, stdscr))
            await send_ready(ws, stdscr)
            stdscr.addstr(2, 0, "Waiting for game messages...")
            stdscr.refresh()
            while running[0]:
                try:
                    message = await asyncio.wait_for(ws.recv(), 0.1)
                    data = json.loads(message)
                    status = data.get('status')
                    stdscr.refresh()
                    if status == 'game_update':
                        current_state = data.get('state')
                        render_game_curses(stdscr, current_state)
                    elif status == 'game_over':
                        winner = data.get('winner')
                        stdscr.addstr(3, 0, f"🏆 Game Over! Winner: {winner}")
                        stdscr.addstr(4, 0, "Exiting in 5 seconds...")
                        stdscr.refresh()
                        await asyncio.sleep(5)
                        running[0] = False
                        break
                    elif status == 'reconnected':
                        current_state = data.get('state')
                        render_game_curses(stdscr, current_state)
                        stdscr.addstr(3, 0, "Reconnected to existing game!")
                    elif status == 'game_starting':
                        stdscr.addstr(3, 0, "Game starting soon...")
                    elif status == 'player_ready':
                        stdscr.addstr(3, 0, "Player ready signal received!")
                    else:
                        stdscr.addstr(3, 0, f"Unknown status: {status}")
                    stdscr.refresh()
                except asyncio.TimeoutError:
                    pass  
                except Exception as e:
                    stdscr.addstr(5, 0, f"Error in game loop: {e}")
                    stdscr.refresh()
                    await asyncio.sleep(2)
            listener_task.cancel()
            process_task.cancel()
            heartbeat_task.cancel()
            try:
                await listener_task
                await process_task
                await heartbeat_task
            except asyncio.CancelledError:
                pass
            return True
    except websockets.exceptions.WebSocketException as e:
        stdscr.addstr(5, 0, f"WebSocket error: {e}")
        stdscr.refresh()
        await asyncio.sleep(3)
        return False
    except Exception as e:
        stdscr.addstr(5, 0, f"Connection error: {e}")
        stdscr.refresh()
        await asyncio.sleep(3)
        return False

async def wait_for_match_curses(token, stdscr, host, port):
    """Wait for an available match or join an in-progress match"""
    stdscr.clear()
    stdscr.addstr(0, 0, "Looking for available match...")
    stdscr.refresh()
    attempt = 1
    running = True
    while running:
        game_key = check_in_progress_match(token, host, port)
        if game_key:
            stdscr.clear()
            stdscr.addstr(0, 0, f"✅ Match found! Game key: {game_key}")
            stdscr.addstr(1, 0, "Controls: W = Up, S = Down, Q = Quit")
            stdscr.refresh()
            result = await pong_game_client_curses(token, game_key, stdscr, host, port)
            if result is False:
                stdscr.addstr(2, 0, "Reconnecting to match search...")
                stdscr.refresh()
                await asyncio.sleep(2)
                continue
            else:
                stdscr.addstr(2, 0, "Match completed. Looking for new match...")
                stdscr.refresh()
        dots = "." * (attempt % 4)
        stdscr.addstr(3, 0, f"Searching for match{dots.ljust(3)}")
        stdscr.refresh()
        attempt += 1
        await asyncio.sleep(1)

async def main_curses(stdscr, token, host, port):
    """Set up curses and start the game client"""
    curses.cbreak()
    curses.noecho()
    stdscr.keypad(True)
    stdscr.nodelay(True)  
    await wait_for_match_curses(token, stdscr, host, port)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Pong Game Client')
    parser.add_argument('-u', '--username', help='Username for login')
    parser.add_argument('--host', default='localhost', help='Server hostname (default: localhost)')
    parser.add_argument('-p', '--port', default='5090', help='Server port (default: 5090)')
    return parser.parse_args()

def main():
    """Main program entry point"""
    def signal_handler(sig, frame):
        print("\nProgram terminated by user.")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    args = parse_arguments()
    
    username = args.username if args.username else input("Enter your username: ")
    password = getpass.getpass("Enter your password: ")
    
    token = login_user(username, password, args.host, args.port)
    print("\n✅ Login successful!")
    
    try:
        curses.wrapper(lambda stdscr: asyncio.run(main_curses(stdscr, token, args.host, args.port)))
    except KeyboardInterrupt:
        print("\nProgram terminated by user.")
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    main()

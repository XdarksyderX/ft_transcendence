#!/usr/bin/env python3

import requests
import json
import sys
import asyncio
import websockets
import os
import time
import termios
import tty
import signal
import select

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def login_user(username, password):
    login_url = "http://localhost:5090/api/auth/login"
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(
            login_url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(login_data)
        )
        
        response.raise_for_status()
        token = response.json().get('access_token')
        
        if not token:
            print("❌ Error: No access token received in response")
            sys.exit(1)
            
        return token
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("❌ Error: Invalid server response")
        sys.exit(1)

def check_in_progress_match(token):
    url = "http://localhost:5090/api/pong/match/in-progress/"
    
    try:
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        match_data = data.get('match')
        
        if not match_data:
            return None
        
        game_key = match_data.get('game_key')
        return game_key
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error checking in-progress match: {e}")
        return None
    except json.JSONDecodeError:
        print("❌ Error: Invalid response from server")
        return None

# Better: nonblocking entry system
async def get_input(queue):
    while True:
        if select.select([sys.stdin], [], [], 0)[0]:
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            try:
                tty.setraw(sys.stdin.fileno())
                ch = sys.stdin.read(1)
                await queue.put(ch)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        await asyncio.sleep(0.05)

async def send_move(ws, direction):
    try:
        # Debug log
        print(f"Sending move: {direction}")
        message = json.dumps({"action": "move", "direction": direction})
        await ws.send(message)
    except Exception as e:
        print(f"Error sending move: {e}")

async def send_ready(ws):
    try:
        message = json.dumps({"action": "ready"})
        await ws.send(message)
        print("✅ Ready signal sent!")
    except Exception as e:
        print(f"Error sending ready signal: {e}")

def render_game(state):
    clear_screen()
    
    if not state or 'players' not in state:
        print("Waiting for game state...")
        return
    
    players_data = state['players']
    ball = state.get('ball', {'x': 0, 'y': 0})
    
    # Default dimensions - adjust as needed
    width = 80
    height = 24
    
    # Scale coordinates from game dimensions to terminal dimensions
    # Assuming game coordinates are based on a canvas of about 700x500
    def scale_x(x): return int(x * width / 700)
    def scale_y(y): return int(y * height / 500)
    
    # Create empty board
    board = [[' ' for _ in range(width)] for _ in range(height)]
    
    # Add borders
    for x in range(width):
        board[0][x] = '='
        board[height-1][x] = '='
    
    # Add center line
    for y in range(height):
        if y % 2 == 0:
            board[y][width // 2] = '|'
    
    # Add player paddles
    players_list = []
    
    # Extract player data into a consistent format
    for player_key, player_data in players_data.items():
        side = "left" if player_key == "player1" else "right"
        x_pos = scale_x(player_data['x'])
        y_pos = scale_y(player_data['y'])
        
        # Store player data for score display
        players_list.append({
            'side': side,
            'username': player_data['username'],
            'score': player_data['score'],
            'x': x_pos,
            'y': y_pos,
            'connected': player_data['connected']
        })
        
        # Draw paddle (5 units tall)
        for i in range(-2, 3):  # 5 units centered on y_pos
            y = y_pos + i
            if 0 <= y < height:
                board[y][x_pos] = '█'
    
    # Add ball
    ball_x = scale_x(ball['x'])
    ball_y = scale_y(ball['y'])
    if 0 <= ball_y < height and 0 <= ball_x < width:
        board[ball_y][ball_x] = '●'
    
    # Print the board
    print("-" * (width + 2))
    for row in board:
        print('|' + ''.join(row) + '|')
    print("-" * (width + 2))
    
    # Print scores
    left_player = next((p for p in players_list if p['side'] == 'left'), {})
    right_player = next((p for p in players_list if p['side'] == 'right'), {})
    
    left_score = left_player.get('score', 0)
    right_score = right_player.get('score', 0)
    left_username = left_player.get('username', "Player 1")
    right_username = right_player.get('username', "Player 2")
    
    # Show connection status
    left_status = "🟢" if left_player.get('connected', False) else "🔴"
    right_status = "🟢" if right_player.get('connected', False) else "🔴"
    
    print(f"\nScore: {left_score} - {right_score}")
    print(f"{left_status} {left_username} vs {right_username} {right_status}")
    print("\nControls: W = Up, S = Down, Q = Quit")


async def process_input(queue, ws, running):
    while running[0]:
        try:
            key = await asyncio.wait_for(queue.get(), 0.1)
            
            # No imprimir la tecla presionada
            if key.lower() == 'w':
                await send_move(ws, "up")
            elif key.lower() == 's':
                await send_move(ws, "down")
            elif key.lower() == 'q':
                print("Quitting game...")
                running[0] = False
                
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            print(f"Error processing input: {e}")

async def pong_game_client(token, game_key):
    uri = f"ws://localhost:5090/ws/pong/{game_key}"
    
    print(f"Connecting to game {game_key}...")
    
    try:
        # Debug information
        print(f"Attempting connection to: {uri}")
        print(f"With Authorization header: Bearer {token[:10]}...")
        
        # IMPORTANT: Sending correct token as authorization header
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        async with websockets.connect(uri, additional_headers=headers) as ws:
            print("⭐ WebSocket connection established!")
            running = [True]
            
            # Set up input queue
            input_queue = asyncio.Queue()
            input_task = asyncio.create_task(get_input(input_queue))
            process_task = asyncio.create_task(process_input(input_queue, ws, running))
            
            # Send ready signal
            await send_ready(ws)
            
            # Show for debug
            print("Waiting for game messages...")
            
            while running[0]:
                try:
                    # Receive game state con timeout breve
                    message = await asyncio.wait_for(ws.recv(), 0.1)
                    data = json.loads(message)
                    
                    status = data.get('status')
                    print(f"Game status: {status}")
                    
                    if status == 'game_update':
                        current_state = data.get('state')
                        render_game(current_state)
                    elif status == 'game_over':
                        winner = data.get('winner')
                        print(f"\n🏆 Game Over! Winner: {winner}")
                        print("Exiting in 5 seconds...")
                        await asyncio.sleep(5)
                        running[0] = False
                        break
                    elif status == 'reconnected':
                        current_state = data.get('state')
                        render_game(current_state)
                        print("Reconnected to existing game!")
                    elif status == 'game_starting':
                        print("Game starting soon...")
                    elif status == 'player_ready':
                        print("Player ready signal received!")
                    else:
                        print(f"Unknown status: {status}")
                        print(f"Message content: {message[:100]}...")
                    
                except asyncio.TimeoutError:
                    # No message, keep waiting
                    pass
                except Exception as e:
                    print(f"Error in game loop: {e}")
                    import traceback
                    traceback.print_exc()
                    running[0] = False
                    break
            
            input_task.cancel()
            process_task.cancel()
            
            try:
                await input_task
            except asyncio.CancelledError:
                pass
            
            try:
                await process_task
            except asyncio.CancelledError:
                pass
            
            return True
    
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"WebSocket connection error: Invalid status code: {e}")
        print(f"This usually means the server rejected the connection or authentication.")
        return False
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def wait_for_match(token):
    print("Looking for available match...")
    attempt = 1
    running = True
    
    while running:
        game_key = check_in_progress_match(token)
        
        if game_key:
            print(f"\n✅ Match found! Game key: {game_key}")
            print("\nControls: W = Up, S = Down, Q = Quit")
            
            result = await pong_game_client(token, game_key)
            
            if result is False:
                print("Reconnecting to match search...")
                # Short pause to avoid fast reconnections
                await asyncio.sleep(2)
                continue
            else:
                print("Match completed. Looking for new match...")
        
        dots = "." * (attempt % 4)
        print(f"\rSearching for match{dots.ljust(3)}", end="", flush=True)
        attempt += 1
        
        # Check for 'q' key press
        if sys.stdin.isatty() and select.select([sys.stdin], [], [], 0)[0]:
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                ch = sys.stdin.read(1)
                if ch in ('q', 'Q'):
                    print("\nExiting search...")
                    running = False
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        
        await asyncio.sleep(1)

def main():
    # Set up terminal to handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\nProgram terminated by user.")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    
    token = login_user(username, password)
    print("\n✅ Login successful!")
    
    try:
        asyncio.run(wait_for_match(token))
    except KeyboardInterrupt:
        print("\nProgram terminated by user.")

if __name__ == "__main__":
    main()

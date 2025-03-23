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
    login_url = "http://localhost:5000/api/auth/login"
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
    url = "http://localhost:5000/api/pong/match/in-progress/"
    
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

def get_key():
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch

async def key_input(queue):
    while True:
        if sys.stdin.isatty():
            if select_stdin():
                fd = sys.stdin.fileno()
                old_settings = termios.tcgetattr(fd)
                try:
                    tty.setraw(fd)
                    ch = sys.stdin.read(1)
                    await queue.put(ch)
                except Exception as e:
                    print(f"Error reading input: {e}")
                finally:
                    termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        await asyncio.sleep(0.05)

async def send_move(ws, direction):
    try:
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
    
    players = state['players']
    ball = state.get('ball', {'x': 0, 'y': 0})
    
    width = state.get('width', 80)
    height = state.get('height', 24)
    
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
    
    # Add paddles
    for player in players:
        x = 2 if player['side'] == 'left' else width - 3
        for i in range(player['size']):
            y = player['y'] + i
            if 0 <= y < height:
                board[y][x] = '█'
    
    # Add ball
    ball_x = int(ball['x'])
    ball_y = int(ball['y'])
    if 0 <= ball_y < height and 0 <= ball_x < width:
        board[ball_y][ball_x] = '●'
    
    # Print the board
    print("-" * (width + 2))
    for row in board:
        print('|' + ''.join(row) + '|')
    print("-" * (width + 2))
    
    # Print scores
    left_score = next((p['score'] for p in players if p['side'] == 'left'), 0)
    right_score = next((p['score'] for p in players if p['side'] == 'right'), 0)
    
    print(f"\nScore: {left_score} - {right_score}")
    
    # Print player usernames
    left_player = next((p['username'] for p in players if p['side'] == 'left'), "Player 1")
    right_player = next((p['username'] for p in players if p['side'] == 'right'), "Player 2")
    
    print(f"{left_player} vs {right_player}")
    print("\nControls: W = Up, S = Down, Q = Quit")

def select_stdin():
    rlist, _, _ = select.select([sys.stdin], [], [], 0)
    return rlist

async def process_input(queue, ws, running):
    while running[0]:
        try:
            key = await asyncio.wait_for(queue.get(), 0.1)
            
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
	uri = f"ws://localhost:5000/ws/pong/{game_key}"
	
	print(f"Connecting to game {game_key}...")
	
	try:
		# Include authorization header in websocket connection
		headers = {
			"Authorization": f"Bearer {token}"
		}
		
		# Connect with authorization headers
		async with websockets.connect(uri, additional_headers=headers) as ws:
			running = [True]
			
			# Set up input queue
			input_queue = asyncio.Queue()
			input_task = asyncio.create_task(key_input(input_queue))
			process_task = asyncio.create_task(process_input(input_queue, ws, running))
			
			# Send ready signal
			await send_ready(ws)
			
			while running[0]:
				try:
					# Receive game state
					message = await asyncio.wait_for(ws.recv(), 0.1)
					data = json.loads(message)
					
					status = data.get('status')
					
					if status == 'game_state':
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
					
				except asyncio.TimeoutError:
					pass
				except Exception as e:
					print(f"Error in game loop: {e}")
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
	
	except Exception as e:
		print(f"WebSocket connection error: {e}")
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
                continue
            else:
                print("Match completed. Looking for new match...")
        
        dots = "." * (attempt % 4)
        print(f"\rSearching for match{dots.ljust(3)}", end="", flush=True)
        attempt += 1
        
        # Check for 'q' key press without requiring root
        if sys.stdin.isatty():
            if select_stdin():
                ch = get_key()
                if ch in ('q', 'Q'):
                    print("\nExiting search...")
                    running = False
        
        await asyncio.sleep(3)

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

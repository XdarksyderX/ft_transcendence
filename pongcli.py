#!/usr/bin/env python3
import requests
import json
import sys
import asyncio
import websockets
import os
import time
import signal
import urllib3
import ssl
import curses

# Desactivar advertencias de certificados inseguros
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def login_user(username, password):
    login_url = "https://localhost:5090/api/auth/login"
    login_data = {"username": username, "password": password}
    try:
        response = requests.post(
            login_url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(login_data),
            verify=False  # Ignorar verificación del certificado
        )
        response.raise_for_status()
        token = response.json().get('access_token')
        if not token:
            print("❌ Error: No se recibió el access token")
            sys.exit(1)
        return token
    except requests.exceptions.RequestException as e:
        print(f"❌ Error en la petición: {e}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("❌ Error: Respuesta inválida del servidor")
        sys.exit(1)

def check_in_progress_match(token):
    url = "https://localhost:5090/api/pong/match/in-progress/"
    try:
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            verify=False  # Ignorar verificación del certificado
        )
        response.raise_for_status()
        data = response.json()
        match_data = data.get('match')
        if not match_data:
            return None
        return match_data.get('game_key')
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al verificar partida: {e}")
        return None
    except json.JSONDecodeError:
        print("❌ Error: Respuesta inválida del servidor")
        return None

async def send_move(ws, direction):
    try:
        # Se envía el movimiento
        message = json.dumps({"action": "move", "direction": direction})
        await ws.send(message)
    except Exception as e:
        # En modo debug se imprime el error
        print(f"Error enviando movimiento: {e}")

async def send_ready(ws):
    try:
        message = json.dumps({"action": "ready"})
        await ws.send(message)
    except Exception as e:
        print(f"Error enviando señal de listo: {e}")

def render_game_curses(stdscr, state):
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()  # Dimensiones de la ventana

    if not state or 'players' not in state:
        stdscr.addstr(0, 0, "Waiting for game state...")
        stdscr.refresh()
        return

    # Ajusta el board a las dimensiones disponibles
    height = max_y - 5  # Deja algunas filas para mensajes y controles
    width = max_x - 2   # Deja márgenes

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
            if 0 <= yy < height and x_pos < width:
                board[yy][x_pos] = '█'

    ball_x = scale_x(state.get('ball', {'x': 0})['x'])
    ball_y = scale_y(state.get('ball', {'y': 0})['y'])
    if 0 <= ball_y < height and 0 <= ball_x < width:
        board[ball_y][ball_x] = '●'

    # Dibuja el board en pantalla, controlando que no se excedan los límites
    for i, row in enumerate(board):
        try:
            stdscr.addnstr(i, 0, "|" + "".join(row) + "|", max_x)
        except curses.error:
            pass  # Si falla, se ignora la línea

    # Información adicional en las últimas líneas
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
    """Escucha teclas usando stdscr.getch() en modo no bloqueante."""
    while True:
        key = stdscr.getch()
        if key != -1:
            await queue.put(key)
        await asyncio.sleep(0.05)

async def process_input_curses(queue, ws, running):
    while running[0]:
        try:
            key = await asyncio.wait_for(queue.get(), 0.1)
            if key in (ord('w'), ord('W')):
                await send_move(ws, "up")
            elif key in (ord('s'), ord('S')):
                await send_move(ws, "down")
            elif key in (ord('q'), ord('Q')):
                running[0] = False
        except asyncio.TimeoutError:
            pass

async def pong_game_client_curses(token, game_key, stdscr):
    uri = f"wss://localhost:5090/ws/pong/{game_key}"
    stdscr.addstr(4, 0, f"Connecting to game {game_key}...")
    stdscr.refresh()
    try:
        headers = {"Authorization": f"Bearer {token}"}
        ssl_context = ssl._create_unverified_context()
        async with websockets.connect(uri, additional_headers=headers, ssl=ssl_context) as ws:
            stdscr.addstr(5, 0, "⭐ WebSocket connection established!")
            stdscr.refresh()
            running = [True]
            input_queue = asyncio.Queue()
            # Inicia el listener de teclas basado en curses
            listener_task = asyncio.create_task(curses_input_listener(stdscr, input_queue))
            process_task = asyncio.create_task(process_input_curses(input_queue, ws, running))
            await send_ready(ws)
            stdscr.addstr(6, 0, "Waiting for game messages...")
            stdscr.refresh()
            while running[0]:
                try:
                    message = await asyncio.wait_for(ws.recv(), 0.1)
                    data = json.loads(message)
                    status = data.get('status')
                    stdscr.addstr(7, 0, f"Game status: {status}            ")
                    stdscr.refresh()
                    if status == 'game_update':
                        current_state = data.get('state')
                        render_game_curses(stdscr, current_state)
                    elif status == 'game_over':
                        winner = data.get('winner')
                        stdscr.addstr(8, 0, f"🏆 Game Over! Winner: {winner}")
                        stdscr.addstr(9, 0, "Exiting in 5 seconds...")
                        stdscr.refresh()
                        await asyncio.sleep(5)
                        running[0] = False
                        break
                    elif status == 'reconnected':
                        current_state = data.get('state')
                        render_game_curses(stdscr, current_state)
                        stdscr.addstr(10, 0, "Reconnected to existing game!")
                    elif status == 'game_starting':
                        stdscr.addstr(10, 0, "Game starting soon...")
                    elif status == 'player_ready':
                        stdscr.addstr(10, 0, "Player ready signal received!")
                    else:
                        stdscr.addstr(10, 0, f"Unknown status: {status}")
                    stdscr.refresh()
                except asyncio.TimeoutError:
                    pass
                except Exception as e:
                    stdscr.addstr(11, 0, f"Error in game loop: {e}")
                    stdscr.refresh()
                    running[0] = False
                    break
            listener_task.cancel()
            process_task.cancel()
            try:
                await listener_task
            except asyncio.CancelledError:
                pass
            try:
                await process_task
            except asyncio.CancelledError:
                pass
            return True
    except websockets.exceptions.InvalidStatusCode as e:
        stdscr.addstr(12, 0, f"WebSocket connection error: Invalid status code: {e}")
        stdscr.refresh()
        return False
    except Exception as e:
        stdscr.addstr(12, 0, f"WebSocket connection error: {e}")
        stdscr.refresh()
        return False

async def wait_for_match_curses(token, stdscr):
    stdscr.clear()
    stdscr.addstr(0, 0, "Looking for available match...")
    stdscr.refresh()
    attempt = 1
    running = True
    while running:
        game_key = check_in_progress_match(token)
        if game_key:
            stdscr.clear()
            stdscr.addstr(0, 0, f"✅ Match found! Game key: {game_key}")
            stdscr.addstr(1, 0, "Controls: W = Up, S = Down, Q = Quit")
            stdscr.refresh()
            result = await pong_game_client_curses(token, game_key, stdscr)
            if result is False:
                stdscr.addstr(2, 0, "Reconnecting to match search...")
                stdscr.refresh()
                await asyncio.sleep(2)
                continue
            else:
                stdscr.addstr(2, 0, "Match completed. Looking for new match...")
        dots = "." * (attempt % 4)
        stdscr.addstr(3, 0, f"Searching for match{dots.ljust(3)}")
        stdscr.refresh()
        attempt += 1
        await asyncio.sleep(1)

async def main_curses(stdscr, token):
    # Configuración inicial de curses
    curses.cbreak()
    curses.noecho()
    stdscr.keypad(True)
    stdscr.nodelay(True)  # No bloquear al leer teclas
    await wait_for_match_curses(token, stdscr)

def main():
    # Manejo de señales
    def signal_handler(sig, frame):
        print("\nProgram terminated by user.")
        sys.exit(0)
    signal.signal(signal.SIGINT, signal_handler)
    # Solicitar usuario y contraseña antes de iniciar curses
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    token = login_user(username, password)
    print("\n✅ Login successful!")
    try:
        # Inicia la interfaz curses y ejecuta la parte asíncrona
        curses.wrapper(lambda stdscr: asyncio.run(main_curses(stdscr, token)))
    except KeyboardInterrupt:
        print("\nProgram terminated by user.")

if __name__ == "__main__":
    main()

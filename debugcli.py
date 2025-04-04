#!/usr/bin/env python3
import requests
import json
import sys
import asyncio
import websockets
import signal
import urllib3
import ssl
import curses
import time

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
        message = json.dumps({"action": "move", "direction": direction})
        await ws.send(message)
        print(f"Sent move: {direction}")
    except Exception as e:
        print(f"Error enviando movimiento: {e}")

async def input_loop(stdscr, ws):
    # Configuramos la ventana en modo no bloqueante y mostramos instrucciones
    stdscr.nodelay(True)
    stdscr.clear()
    stdscr.addstr(0, 0, "Modo movimiento: Presiona W para arriba, S para abajo, Q para salir.")
    stdscr.refresh()
    while True:
        key = stdscr.getch()
        if key != -1:
            if key in (ord('w'), ord('W')):
                await send_move(ws, "up")
            elif key in (ord('s'), ord('S')):
                await send_move(ws, "down")
            elif key in (ord('q'), ord('Q')):
                stdscr.addstr(2, 0, "Saliendo...")
                stdscr.refresh()
                break
        await asyncio.sleep(0.1)

async def websocket_client(stdscr, token):
    game_key = check_in_progress_match(token)
    if not game_key:
        stdscr.addstr(1, 0, "No se encontró partida en curso.")
        stdscr.refresh()
        await asyncio.sleep(3)
        return
    uri = f"wss://localhost:5090/ws/pong/{game_key}"
    stdscr.addstr(1, 0, f"Conectando a partida: {game_key}")
    stdscr.refresh()
    headers = {"Authorization": f"Bearer {token}"}
    ssl_context = ssl._create_unverified_context()
    try:
        async with websockets.connect(uri, additional_headers=headers, ssl=ssl_context) as ws:
            stdscr.addstr(2, 0, "Conexión establecida. Enviando señal de listo...")
            stdscr.refresh()
            # Enviar señal de listo
            ready_msg = json.dumps({"action": "ready"})
            await ws.send(ready_msg)
            # Inicia el bucle de captura de teclas y envío de movimientos
            await input_loop(stdscr, ws)
    except websockets.exceptions.InvalidStatusCode as e:
        stdscr.addstr(3, 0, f"Error en WebSocket: Código de estado inválido: {e}")
        stdscr.refresh()
        await asyncio.sleep(3)
    except Exception as e:
        stdscr.addstr(3, 0, f"Error en WebSocket: {e}")
        stdscr.refresh()
        await asyncio.sleep(3)

async def main_async(stdscr, token):
    # Configuración básica de curses
    curses.cbreak()
    curses.noecho()
    stdscr.keypad(True)
    await websocket_client(stdscr, token)

def main():
    def signal_handler(sig, frame):
        print("\nPrograma terminado por el usuario.")
        sys.exit(0)
    signal.signal(signal.SIGINT, signal_handler)
    # Solicitar credenciales antes de iniciar curses
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    token = login_user(username, password)
    print("\n✅ Login successful!")
    # Iniciar curses; no se renderiza el juego, solo se envían comandos de movimiento
    curses.wrapper(lambda stdscr: asyncio.run(main_async(stdscr, token)))
    print("Programa finalizado.")

if __name__ == "__main__":
    main()

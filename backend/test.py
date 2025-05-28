import threading
import time
from typing import Optional

from websockets.sync.server import Server, ServerConnection, serve

serverObj: Optional[Server] = None

# This flag will help us shut the server down
# shutdown_flag = threading.Event()

def echo(websocket: ServerConnection):
    print("Client connected")

    for message in websocket:
        websocket.send(f"Echo: {message}")
        print(f"Handled message: {message}")
        # if shutdown_flag.is_set():
        #     break

    print('Client disconnected')

def start_server():
    global serverObj
    print("WebSocket server starting on ws://localhost:8765")
    serverObj = serve(echo, "localhost", 8769)
    try:
        serverObj.serve_forever()
    except KeyboardInterrupt:
        pass  # Catch Ctrl+C inside thread (won't usually hit here)
    print("WebSocket server shut down.")

def main():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    try:
        while server_thread.is_alive():
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nCtrl+C caught, setting shutdown flag...")
        # shutdown_flag.set()
        print("Waiting for server to shut down...")
        serverObj.shutdown()
        print("Server stopped. Go touch grass now.")

if __name__ == "__main__":
    main()

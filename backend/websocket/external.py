"""
This file is used to bootup the websocket server without millennium so just from the terminal
"""

from .server import initialize_server, run_server, shutdown_server

if __name__ == "__main__":
    initialize_server()
    run_server()
    try:
        input("Press Enter to exit...")
    except KeyboardInterrupt:
        pass
    shutdown_server()

"""
WebSocket server implementation for Extendium plugin.
"""

import threading
import time
import uuid
from typing import Optional

from logger.logger import logger  # pylint: disable=import-error
from websockets.exceptions import ConnectionClosed
from websockets.sync.server import Server, ServerConnection, serve

from .client_manager import ClientManager
from .message_handler import MessageHandler
from .request_handler import RequestHandler

# Global instances
_server: Optional[Server] = None
_client_manager: Optional[ClientManager] = None
_request_handler: Optional[RequestHandler] = None
_message_handler: Optional[MessageHandler] = None
_cleanup_thread: Optional[threading.Thread] = None
_running = False


class WebSocketClientAdapter:
    """
    Adapter class to maintain compatibility with the existing code that expects
    the client structure from the websocket-server package.
    """
    def __init__(self, websocket: ServerConnection):
        self.websocket = websocket
        self.id = str(uuid.uuid4())
        self.data = {'id': self.id}

    def get(self, key, default=None):
        return self.data.get(key, default)

    def __getitem__(self, key):
        return self.data[key]

    def __setitem__(self, key, value):
        self.data[key] = value

class MessageAdapter:
    """
    Adapter to maintain compatibility with the existing MessageHandler that expects
    a server with a send_message method.
    """
    def send_message(self, client: WebSocketClientAdapter, message: str) -> None:
        try:
            client.websocket.send(message)
        except ConnectionClosed:
            logger.error("Failed to send message to client: connection closed")
        except Exception as e:
            logger.error(f"Error sending message: {e}")

def handle_client(websocket: ServerConnection) -> None:
    """
    Main handler for each client connection.

    Args:
        websocket: The WebSocket connection object
    """

    # Create client adapter
    client = WebSocketClientAdapter(websocket)

    try:
        # Process messages in a loop
        for message in websocket:
            if _message_handler:
                _message_handler.process_message(client, message)
    except ConnectionClosed:
        pass
    except Exception as e:
        logger.error(f"Error handling client: {e}")
    finally:
        # Handle client disconnection (equivalent to _client_left)
        if _client_manager:
            _client_manager.remove_client(client.id)

def _cleanup_routine() -> None:
    """Periodically clean up old pending requests."""
    global _request_handler, _running

    while _running and _request_handler:
        # Clean up requests older than 30 seconds
        _request_handler.cleanup_old_requests(30)
        time.sleep(10)  # Sleep for 10 seconds between cleanups

def initialize_server() -> None:
    """
    Initialize the WebSocket server.

    Args:
        port: The port to listen on
        host: The host address to bind to

    Returns:
        The initialized WebSocket server
    """
    global _server, _client_manager, _request_handler, _message_handler

    if _server:
        logger.warning("WebSocket server already initialized")
        return _server

    # Create instances
    _client_manager = ClientManager()
    _request_handler = RequestHandler()

    # Create message adapter for compatibility
    message_adapter = MessageAdapter()

    # Create message handler with the adapter
    _message_handler = MessageHandler(message_adapter, _client_manager, _request_handler)

def run_server(port: int, host: str = "localhost") -> None:
    """Run the WebSocket server in a separate thread."""
    global _server, _cleanup_thread, _running

    if _running:
        logger.log("WebSocket server already running")
        return

    _running = True

    # Start cleanup thread
    _cleanup_thread = threading.Thread(target=_cleanup_routine)
    _cleanup_thread.daemon = True
    _cleanup_thread.start()

    # Start server in a separate thread
    def start_server():
        global _server
        _server = serve(handle_client, host, port)
        try:
            _server.serve_forever()
        except Exception as e:
            logger.error(f"Error in WebSocket server: {e}")

    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()

    logger.log(f"WebSocket server is running on {host}:{port}")

def shutdown_server() -> None:
    """Shutdown the WebSocket server."""
    global _server, _running, _cleanup_thread

    if not _running:
        logger.error("WebSocket server not running")
        return

    _running = False

    if _cleanup_thread:
        _cleanup_thread.join(timeout=1)

    if _server:
        try:
            _server.shutdown()
        except Exception as e:
            logger.error(f"Error shutting down WebSocket server: {e}")

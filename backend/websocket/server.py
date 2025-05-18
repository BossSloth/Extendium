"""
WebSocket server implementation for Extendium plugin.
"""

import threading
import time
import uuid
from typing import Optional

from logger import logger
from websocket_server import WebsocketServer

from .client_manager import ClientManager
from .message_handler import MessageHandler
from .request_handler import RequestHandler

# Global instances
_server: Optional[WebsocketServer] = None
_client_manager: Optional[ClientManager] = None
_request_handler: Optional[RequestHandler] = None
_message_handler: Optional[MessageHandler] = None
_cleanup_thread: Optional[threading.Thread] = None
_running = False


def _new_client(client, server: WebsocketServer) -> None:
    """
    Handle new client connection.

    Args:
        client: The new client
        server: The WebSocket server
    """
    # Assign a unique ID to the client
    client['id'] = str(uuid.uuid4())


def _client_left(client, server: WebsocketServer) -> None:
    """
    Handle client disconnection.

    Args:
        client: The client that left
        server: The WebSocket server
    """
    global _client_manager

    if _client_manager:
        client_id = client.get('id')
        _client_manager.remove_client(client_id)


def _message_received(client, server: WebsocketServer, message: str) -> None:
    """
    Handle received message.

    Args:
        client: The client that sent the message
        server: The WebSocket server
        message: The message received
    """
    global _message_handler

    if _message_handler:
        _message_handler.process_message(client, message)


def _cleanup_routine() -> None:
    """Periodically clean up old pending requests."""
    global _request_handler, _running

    while _running and _request_handler:
        # Clean up requests older than 30 seconds
        _request_handler.cleanup_old_requests(30)
        time.sleep(10)  # Sleep for 10 seconds between cleanups


def initialize_server(port: int = 8765, loglevel: int = 1) -> WebsocketServer:
    """
    Initialize the WebSocket server.

    Args:
        port: The port to listen on
        loglevel: The logging level

    Returns:
        The initialized WebSocket server
    """
    global _server, _client_manager, _request_handler, _message_handler

    if _server:
        logger.warning("WebSocket server already initialized")
        return _server

    # Create instances
    _server = WebsocketServer(port=port, loglevel=loglevel)
    _client_manager = ClientManager()
    _request_handler = RequestHandler()
    _message_handler = MessageHandler(_server, _client_manager, _request_handler)

    # Set up callbacks
    _server.set_fn_new_client(_new_client)
    _server.set_fn_client_left(_client_left)
    _server.set_fn_message_received(_message_received)

    logger.log(f"WebSocket server initialized on port {port}")
    return _server


def run_server() -> None:
    """Run the WebSocket server in a separate thread."""
    global _server, _cleanup_thread, _running

    if not _server:
        logger.error("WebSocket server not initialized")
        return

    if _running:
        logger.log("WebSocket server already running")
        return

    _running = True

    # Start cleanup thread
    _cleanup_thread = threading.Thread(target=_cleanup_routine)
    _cleanup_thread.daemon = True
    _cleanup_thread.start()

    # Start server in a separate thread
    server_thread = threading.Thread(target=_server.run_forever)
    server_thread.daemon = True
    server_thread.start()


def shutdown_server() -> None:
    """Shutdown the WebSocket server."""
    global _server, _running, _cleanup_thread

    if not _server:
        logger.error("WebSocket server not initialized")
        return

    _running = False

    if _cleanup_thread:
        _cleanup_thread.join(timeout=1)

    try:
        _server.shutdown_gracefully()
        logger.log("WebSocket server shut down gracefully")
    except Exception as e:
        logger.error(f"Error shutting down WebSocket server: {e}")

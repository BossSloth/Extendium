"""
Client manager for WebSocket connections.
Handles tracking and managing connected clients.
"""

from typing import Any, Dict, List, Optional

from logger import logger
from websocket_server import WebsocketServer

from .message_types import ClientType


class ClientManager:
    """
    Manages WebSocket clients.
    Tracks frontend and webkit clients separately.
    """

    def __init__(self):
        """Initialize the client manager."""
        self._frontend_client = None
        self._webkit_clients: List[Dict[str, Any]] = []

    @property
    def frontend_client(self) -> Optional[Dict[str, Any]]:
        """Get the frontend client."""
        return self._frontend_client

    @frontend_client.setter
    def frontend_client(self, client: Dict[str, Any]):
        """Set the frontend client."""
        self._frontend_client = client

    @property
    def webkit_clients(self) -> List[Dict[str, Any]]:
        """Get all webkit clients."""
        return self._webkit_clients

    def add_webkit_client(self, client: Dict[str, Any]):
        """
        Add a webkit client.

        Args:
            client: The WebSocket client object
        """
        self._webkit_clients.append(client)

    def remove_client(self, client_id: str) -> bool:
        """
        Remove a client by its ID.

        Args:
            client_id: The ID of the client to remove

        Returns:
            bool: True if client was removed, False otherwise
        """
        # Check if it's the frontend client
        if self._frontend_client and self._frontend_client.get('id') == client_id:
            self._frontend_client = None
            return True

        # Check if it's a webkit client
        for i, client in enumerate(self._webkit_clients):
            if client.get('id') == client_id:
                del self._webkit_clients[i]
                return True

        return False

    def has_frontend_client(self) -> bool:
        """Check if a frontend client is connected."""
        return self._frontend_client is not None

    def has_webkit_clients(self) -> bool:
        """Check if any webkit clients are connected."""
        return len(self._webkit_clients) > 0

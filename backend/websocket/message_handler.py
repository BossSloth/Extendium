"""
Message handler for WebSocket communication.
Processes different types of messages and routes them appropriately.
"""

import json
from typing import Any, Dict, Optional

from logger.logger import logger  # pylint: disable=import-error

from .client_manager import ClientManager
from .message_types import ClientType, MessageType
from .request_handler import RequestHandler


class MessageAdapter:
    def send_message(self, client: Dict[str, Any], message: str):
        pass

class MessageHandler:
    """
    Handles processing and routing of WebSocket messages.
    """

    def __init__(self, server: MessageAdapter, client_manager: ClientManager, request_handler: RequestHandler):
        """
        Initialize the message handler.

        Args:
            server: The WebSocket server instance
            client_manager: The client manager instance
            request_handler: The request handler instance
        """
        self._server = server
        self._client_manager = client_manager
        self._request_handler = request_handler
        self._message_handlers = {
            MessageType.IDENTIFY.value: self._handle_identify,
            MessageType.WEBKIT_MESSAGE.value: self._handle_webkit_message,
            MessageType.FRONTEND_RESPONSE.value: self._handle_frontend_response,
            MessageType.ERROR.value: self._handle_error,
        }

    def process_message(self, client: Dict[str, Any], message: str) -> None:
        """
        Process an incoming WebSocket message.

        Args:
            client: The client that sent the message
            message: The message string
        """
        try:
            data = json.loads(message)
            message_type = data.get('type')

            if message_type in self._message_handlers:
                self._message_handlers[message_type](client, data)
            else:
                logger.error(f"Unknown message type: {message_type}")
                self._send_error(client, data.get('requestId'), "Unknown message type")
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON message: {message}")
            self._send_error(client, None, "Invalid JSON message")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            self._send_error(client, data.get('requestId') if 'data' in locals() else None, f"Error: {str(e)}")

    def _handle_identify(self, client: Dict[str, Any], data: Dict[str, Any]) -> None:
        client_type = data.get('clientType')

        if client_type == ClientType.FRONTEND.value:
            self._client_manager.frontend_client = client
        elif client_type == ClientType.WEBKIT.value:
            self._client_manager.add_webkit_client(client)
        else:
            logger.error(f"Unknown client type: {client_type}")
            self._send_error(client, None, f"Unknown client type: {client_type}")

    def _handle_webkit_message(self, client: Dict[str, Any], data: Dict[str, Any]) -> None:
        """
        Handle a message from a webkit client to the frontend.

        Args:
            client: The client that sent the message
            data: The message data
        """
        if not self._client_manager.has_frontend_client():
            logger.error("No frontend client connected to receive message")
            self._send_error(client, data.get('requestId'), "No frontend client connected")
            return

        request_id = data.get('requestId')

        if request_id:
            # Store the request for later response matching
            self._request_handler.add_request(request_id, client)

            # Forward message to frontend
            self._server.send_message(self._client_manager.frontend_client, json.dumps(data))
        else:
            logger.error("Missing requestId in webkit message")
            self._send_error(client, request_id, "Missing requestId")

    def _handle_frontend_response(self, client: Dict[str, Any], data: Dict[str, Any]) -> None:
        """
        Handle a response from the frontend to a webkit client.

        Args:
            client: The client that sent the message
            data: The message data
        """
        request_id = data.get('requestId')

        if not request_id:
            logger.error("Missing requestId in frontend response")
            self._send_error(client, None, "Missing requestId in response")
            return

        request = self._request_handler.get_request(request_id)
        if request:
            webkit_client = request['client']
            # Send response back to the webkit client
            self._server.send_message(webkit_client, json.dumps(data))
            # Clean up the pending request
            self._request_handler.remove_request(request_id)
        else:
            logger.error(f"Received response for unknown request: {request_id}")
            self._send_error(client, request_id, f"Unknown request: {request_id}")

    def _handle_error(self, client: Dict[str, Any], data: Dict[str, Any]) -> None:
        logger.error(f"Received error: {data['error']} requestId: {data['requestId']} extensionName: {data['extensionName']}")

    def _send_error(self, client: Dict[str, Any], request_id: Optional[str], error_message: str) -> None:
        """
        Send an error message to a client.

        Args:
            client: The client to send the error to
            request_id: The ID of the request that caused the error
            error_message: The error message
        """
        error_data = {
            'type': MessageType.ERROR.value,
            'error': error_message
        }

        if request_id:
            error_data['requestId'] = request_id

        self._server.send_message(client, json.dumps(error_data))

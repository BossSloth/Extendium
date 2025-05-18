"""
Message type definitions for WebSocket communication.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, TypedDict, Union


class MessageType(Enum):
    """Message types for WebSocket communication."""
    IDENTIFY = "identify"
    WEBKIT_MESSAGE = "webkit_message"
    FRONTEND_RESPONSE = "frontend_response"
    ERROR = "error"

class ClientType(Enum):
    """Types of clients that can connect to the WebSocket server."""
    FRONTEND = "frontend"
    WEBKIT = "webkit"


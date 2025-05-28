"""
Request handler for WebSocket communication.
Manages pending requests and their responses.
"""

import time
from typing import Any, Dict, Optional

from logger.logger import logger  # pylint: disable=import-error


class RequestHandler:
    """
    Handles tracking and managing WebSocket requests.
    """

    def __init__(self):
        self._pending_requests: Dict[str, Dict[str, Any]] = {}

    def add_request(self, request_id: str, client: Dict[str, Any]) -> None:
        self._pending_requests[request_id] = {
            'client': client,
            'timestamp': time.time()
        }

    def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        return self._pending_requests.get(request_id)

    def remove_request(self, request_id: str) -> bool:
        if request_id in self._pending_requests:
            del self._pending_requests[request_id]
            return True
        return False

    def cleanup_old_requests(self, max_age_seconds: int) -> int:
        current_time = time.time()
        to_remove = []

        for request_id, request_data in self._pending_requests.items():
            if current_time - request_data['timestamp'] > max_age_seconds:
                to_remove.append(request_id)

        for request_id in to_remove:
            del self._pending_requests[request_id]

        if to_remove:
            logger.log(f"Cleaned up {len(to_remove)} stale requests")

        return len(to_remove)

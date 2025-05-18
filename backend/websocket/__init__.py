"""
WebSocket module for Extendium plugin.
Handles communication between frontend and webkit clients.
"""
from .server import initialize_server, run_server, shutdown_server

__all__ = ['initialize_server', 'run_server', 'shutdown_server']

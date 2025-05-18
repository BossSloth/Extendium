import json
import threading
import uuid
from time import sleep

from logger import logger
from websocket_server import WebsocketServer

# Dictionary to track clients: frontend and webkit clients
clients = {
    'frontend': None,  # Single frontend client
    'webkit': {}  # Multiple webkit clients identified by extension name
}

# Dictionary to track pending requests
pending_requests = {}

def new_client(client, server: WebsocketServer):
    # Client will identify itself in a separate message
    client['id'] = str(uuid.uuid4())
    logger.log(f"New client connected: {client['id']}")

def client_left(client, server: WebsocketServer):
    client_id = client.get('id')
    logger.log(f"Client disconnected: {client_id}")

    # Remove client from tracking
    if clients['frontend'] and clients['frontend'].get('id') == client_id:
        clients['frontend'] = None
        logger.log("Frontend client disconnected")

    # Check if it's a webkit client
    for ext_name, webkit_client in list(clients['webkit'].items()):
        if webkit_client.get('id') == client_id:
            del clients['webkit'][ext_name]
            logger.log(f"Webkit client for {ext_name} disconnected")
            break

def message_received(client, server: WebsocketServer, message):
    try:
        # Parse the message
        data = json.loads(message)
        message_type = data.get('type')

        # Handle client identification
        if message_type == 'identify':
            handle_identify(client, server, data)
        # Handle message from webkit to frontend
        elif message_type == 'webkit_message':
            handle_webkit_message(client, server, data)
        # Handle response from frontend to webkit
        elif message_type == 'frontend_response':
            handle_frontend_response(client, server, data)
        else:
            logger.error(f"Unknown message type: {message_type}")
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON message: {message}")
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")

def handle_identify(client, server, data):
    client_type = data.get('clientType')

    if client_type == 'frontend':
        clients['frontend'] = client
        logger.log(f"Frontend client identified: {client['id']}")
    elif client_type == 'webkit':
        extension_name = data.get('extensionName')
        if extension_name:
            clients['webkit'][extension_name] = client
            client['extensionName'] = extension_name
            logger.log(f"Webkit client identified for extension {extension_name}: {client['id']}")
        else:
            logger.error("Webkit client did not provide extension name")
    else:
        logger.error(f"Unknown client type: {client_type}")

def handle_webkit_message(client, server, data):
    if not clients['frontend']:
        logger.error("No frontend client connected to receive message")
        # Send error back to webkit
        response = {
            'type': 'error',
            'requestId': data.get('requestId'),
            'error': 'No frontend client connected'
        }
        server.send_message(client, json.dumps(response))
        return

    # Store the request in pending requests
    request_id = data.get('requestId')
    extension_name = data.get('extensionName')

    if request_id and extension_name:
        pending_requests[request_id] = {
            'client': client,
            'extensionName': extension_name,
            'timestamp': data.get('timestamp')
        }

        # Forward message to frontend
        server.send_message(clients['frontend'], json.dumps(data))
    else:
        logger.error(f"Missing requestId or extensionName in webkit message")

def handle_frontend_response(client, server, data):
    request_id = data.get('requestId')

    if request_id in pending_requests:
        webkit_client = pending_requests[request_id]['client']
        # Send response back to the webkit client
        server.send_message(webkit_client, json.dumps(data))
        # Clean up the pending request
        del pending_requests[request_id]
    else:
        logger.error(f"Received response for unknown request: {request_id}")

server = WebsocketServer(port=8765, loglevel=0)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)

#!/usr/bin/env python

import http.server
import socketserver
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.request import (HTTPErrorProcessor, HTTPHandler, Request,
                            build_opener)

from logger import logger


class NoExceptionErrorProcessor(HTTPErrorProcessor):
    def http_response(self, request, response):
        return response

    def https_response(self, request, response):
        return response

# Proxy request handler
class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle_request()

    def do_POST(self):
        self._handle_request()

    def do_PUT(self):
        self._handle_request()

    def do_DELETE(self):
        self._handle_request()

    def do_OPTIONS(self):
        # Handle preflight requests for CORS
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_cors_headers(self):
        # Add CORS headers to allow requests from any origin
        self.send_header('Access-Control-Allow-Origin', 'https://steamloopback.host')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Max-Age', '86400')  # 24 hours

    def add_special_case_headers(self, path, headers):
        if path.startswith('https://extension.steamdb.info'):
            headers['Origin'] = 'https://github.com/BossSloth/Steam-SteamDB-extension'

    def _handle_request(self):
        try:
            # Forward the request to the actual destination
            if self.path.startswith('/proxy/'):
                # Remove the /proxy/ prefix
                target_url = self.path[7:]
                if not target_url.startswith('http'):
                    target_url = 'https://' + target_url

                # Create a request with the same headers
                headers = {key: val for key, val in self.headers.items()
                          if key.lower() not in ('host', 'connection', 'transfer-encoding')}

                # Add security headers
                headers['Sec-Fetch-Site'] = 'cross-site'
                headers['Sec-Fetch-Mode'] = 'cors'
                headers['Sec-Fetch-Dest'] = 'empty'
                self.add_special_case_headers(target_url, headers)

                # Get request body for POST/PUT requests
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None

                # Create the request
                req = Request(target_url, data=body, headers=headers, method=self.command)

                try:
                    # Create a custom opener that doesn't raise exceptions for HTTP error codes
                    opener = build_opener(NoExceptionErrorProcessor())

                    # Forward the request and get the response
                    response = opener.open(req)

                    # Send the response status code
                    self.send_response(response.status)

                    # Add CORS headers
                    self._send_cors_headers()

                    # Get response data first to determine content length
                    response_data = response.read()

                    # Send the response headers (except those that might conflict with CORS or chunked encoding)
                    for header, value in response.getheaders():
                        if header.lower() not in ('access-control-allow-origin', 'access-control-allow-methods',
                                                'access-control-allow-headers', 'access-control-max-age', 'access-control-allow-credentials',
                                                'transfer-encoding', 'content-length'):
                            self.send_header(header, value)

                    # Set content length explicitly to avoid chunked encoding
                    self.send_header('Content-Length', str(len(response_data)))
                    self.end_headers()

                    # Send the response body
                    self.wfile.write(response_data)

                except URLError as e:
                    self.send_response(500)
                    self._send_cors_headers()
                    error_message = str(e).encode()
                    self.send_header('Content-Length', str(len(error_message)))
                    self.end_headers()
                    self.wfile.write(error_message)
            else:
                # Handle other requests or serve local content
                self.send_response(404)
                self._send_cors_headers()
                not_found_message = b"Not found"
                self.send_header('Content-Length', str(len(not_found_message)))
                self.end_headers()
                self.wfile.write(not_found_message)

        except Exception as e:
            logger.error(f"Proxy error: {str(e)}")
            self.send_response(500)
            self._send_cors_headers()
            error_message = f"Internal server error: {str(e)}".encode()
            self.send_header('Content-Length', str(len(error_message)))
            self.end_headers()
            self.wfile.write(error_message)

    def log_message(self, format, *args):
        pass

class CORSProxy:
    def __init__(self, port: int, host: str = '127.0.0.1'):
        self.host = host
        self.port = port
        self.server = None
        self.server_thread = None

    def start(self):
        """Start the proxy server"""
        try:
            # Create the server
            handler = ProxyHandler
            self.server = socketserver.ThreadingTCPServer((self.host, self.port), handler)
            self.server.allow_reuse_address = True

            logger.log(f"Starting CORS proxy server on http://{self.host}:{self.port}")

            # Start the server in a thread
            self.server_thread = threading.Thread(target=self.server.serve_forever)
            self.server_thread.daemon = True
            self.server_thread.start()

            return True
        except Exception as e:
            logger.error(f"Failed to start proxy server: {str(e)}")
            return False

    def stop(self):
        """Stop the proxy server"""
        if self.server:
            logger.log("Stopping proxy server")
            self.server.shutdown()
            self.server.server_close()
            self.server = None
            self.server_thread = None
            return True
        return False

if __name__ == "__main__":
    proxy = CORSProxy(port=8792)
    proxy.start()

    try:
        while True:
            time.sleep(0.5)
    except KeyboardInterrupt:
        proxy.stop()

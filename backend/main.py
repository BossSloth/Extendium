import json
import os
from os import path
from typing import Optional

import Millennium
import requests
from cors_proxy import CORSProxy
from logger.logger import logger  # pylint: disable=import-error
from websocket import initialize_server, run_server, shutdown_server

EXTENSIONS_DIR = '/steamui/extensions'
EXTENSIONS_URL = 'https://steamloopback.host/extensions'

cors_proxy: Optional[CORSProxy] = None

def GetPluginDir():
    return path.abspath(PLUGIN_BASE_DIR) # pylint: disable=undefined-variable

def GetExtensionsDir():
    return Millennium.steam_path() + EXTENSIONS_DIR


def GetExtensionManifests():
    # Get all the manifest.json files in the extensions directory
    extensions_dir = GetExtensionsDir()
    manifests = {}

    if os.path.exists(extensions_dir):
        for ext_folder in os.listdir(extensions_dir):
            manifest_path = os.path.join(extensions_dir, ext_folder, "manifest.json")
            if os.path.isfile(manifest_path):
                try:
                    with open(manifest_path, 'r', encoding='utf-8') as f:
                        manifest_data = json.load(f)
                        manifests[ext_folder] = manifest_data
                except Exception as e:
                    logger.error(f"Error reading manifest {manifest_path}: {str(e)}")

    return manifests

def GetExtensionsInfos():
    return json.dumps({
        'extensionsDir': GetExtensionsDir(),
        'pluginDir': GetPluginDir(),
        'manifests': GetExtensionManifests()
    })

STEAM_ID = None

def GetSteamId():
    global STEAM_ID
    if STEAM_ID is None:
        STEAM_ID = Millennium.call_frontend_method('getSteamId') # pylint: disable=assignment-from-no-return,no-value-for-parameter
    return STEAM_ID

#TODO: cors requests currently don't work like in the steamdb extension and we can't do this because of the issue below
def BackendFetch(url: str, headersJson: str):
    # TODO: problem this is triggered from within sendmessage and millennium does not allow two backend functions to run somehow this needs to split up?
    logger.log(f"Fetching {url}")
    headers = json.loads(headersJson)

    try:
        response = requests.get(url, headers=headers, timeout=30)

        result = {
            'status': response.status_code,
            'url': response.url,
            'headers': dict(response.headers),
            'body': response.text
        }

        return json.dumps(result)
    except Exception as e:
        logger.error(f"Error fetching {url}: {str(e)}")
        return None

# TODO: do the same as millennium does for the file proxy but for chrome-extension:// url

def PrepareExtensionFiles():
    extensions_dir = GetExtensionsDir()

    if not os.path.exists(extensions_dir):
        return

    for ext_folder in os.listdir(extensions_dir):
        ext_path = os.path.join(extensions_dir, ext_folder)
        if os.path.isdir(ext_path):
            for root, _, files in os.walk(ext_path):
                for file in files:
                    file_extension = os.path.splitext(file)[1].lower()
                    file_path = os.path.join(root, file)

                    # Define file processing rules
                    processing_rules = {
                        '.css': [
                            ("url('/", f"url('{EXTENSIONS_URL}/{ext_folder}/"),
                            ("url(chrome-extension://__MSG_@@extension_id__/", f"url({EXTENSIONS_URL}/{ext_folder}/"),
                        ],
                        '.html': [
                            ("href=\"/", f"href=\"{EXTENSIONS_URL}/{ext_folder}/"),
                            ("src=\"/", f"src=\"{EXTENSIONS_URL}/{ext_folder}/"),
                        ],
                        '.js': [
                            ("globalThis.chrome", "chrome")
                        ]
                    }

                    # Handle root folder references in JS files
                    if file_extension == '.js':
                        ext_root_folders = [d for d in os.listdir(ext_path) if os.path.isdir(os.path.join(ext_path, d))]
                        for dir_name in ext_root_folders:
                            processing_rules['.js'].append((f"'/{dir_name}", f"'{EXTENSIONS_URL}/{ext_folder}/{dir_name}"))


                    # Process file if we have rules for its extension
                    if file_extension in processing_rules:
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()

                            modified_content = content
                            for find_pattern, replace_pattern in processing_rules[file_extension]:
                                modified_content = modified_content.replace(find_pattern, replace_pattern)

                            if content != modified_content:
                                with open(file_path, 'w', encoding='utf-8') as f:
                                    f.write(modified_content)
                                logger.log(f"Updated {file_extension} file: {file_path}")
                        except Exception as e:
                            logger.error(f"Error processing {file_extension} file {file_path}: {str(e)}")

class Plugin:
    def _front_end_loaded(self):
        pass

    def _load(self):
        global cors_proxy

        logger.log(f"bootstrapping Extendium, millennium {Millennium.version()}")

        try:
            Millennium.add_proxy_pattern(r"steamui\/extensions") # pylint: disable=no-member
        except Exception:
            pass

        try:
            PrepareExtensionFiles()
        except Exception as e:
            logger.error(f"Error preparing extension files: {e}")

        try:
            # Initialize and run the WebSocket server
            initialize_server()
            run_server(port=8791)
        except Exception as e:
            logger.error(f"Error running websocket server: {e}")

        try:
            # Initialize and run the CORS proxy server
            cors_proxy = CORSProxy(port=8792)
            cors_proxy.start()
        except Exception as e:
            logger.error(f"Error running CORS proxy server: {e}")

        Millennium.ready()  # this is required to tell Millennium that the backend is ready.

    def _unload(self):
        try:
            shutdown_server()
        except Exception as e:
            logger.error(f"Error shutting down websocket server: {e}")
        try:
            cors_proxy.stop()
        except Exception as e:
            logger.error(f"Error shutting down CORS proxy server: {e}")
        logger.log("unloading")

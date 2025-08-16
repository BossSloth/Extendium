# pylint: disable=invalid-name
import json
import os
import re
import shutil
import struct
import tempfile
import zipfile
from os import path
from typing import Optional

import Millennium
import requests
from cors_proxy import CORSProxy
from logger.logger import logger  # pylint: disable=import-error
from websocket import initialize_server, run_server, shutdown_server

EXTENSIONS_DIR = '\\.extensions'
EXTENDIUM_INFO_FILE = 'extendium.info'

cors_proxy: Optional[CORSProxy] = None

def GetPluginDir():
    return path.abspath(PLUGIN_BASE_DIR) # pylint: disable=undefined-variable

def GetExtensionsDir():
    return GetPluginDir() + EXTENSIONS_DIR

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
                        # Check for manifest version
                        if manifest_data.get('manifest_version') != 3:
                            logger.error(f"Extension {ext_folder} has an invalid manifest version: {manifest_data.get('manifest_version')}. Only manifest version 3 is supported.")
                            continue

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

def RemoveExtension(name: str):
    extensions_dir = GetExtensionsDir()
    ext_dir = os.path.join(extensions_dir, name)
    if os.path.exists(ext_dir):
        shutil.rmtree(ext_dir)
    Millennium.call_frontend_method('removeExtension', params=[name])

USER_INFO = None

def GetUserInfo():
    global USER_INFO
    if USER_INFO is None:
        USER_INFO = Millennium.call_frontend_method('getUserInfo') # pylint: disable=assignment-from-no-return,no-value-for-parameter
    return USER_INFO

def extract_zip_from_crx(crx_data: bytes) -> bytes:
    # Check magic number (first 4 bytes) == Cr24
    if crx_data[0:4] != b'Cr24':
        raise ValueError("Not a valid CRX file.")

    version = struct.unpack('<I', crx_data[4:8])[0]

    if version == 2:
        pub_key_len = struct.unpack('<I', crx_data[8:12])[0]
        sig_len = struct.unpack('<I', crx_data[12:16])[0]
        header_len = 16 + pub_key_len + sig_len
    elif version == 3:
        pub_key_len = struct.unpack('<I', crx_data[8:12])[0]
        header_len = 12 + pub_key_len
    else:
        raise ValueError(f"Unsupported CRX version {version}.")

    zip_data = crx_data[header_len:]
    return zip_data

def DownloadExtensionFromUrl(url: str, name: str):
    extensions_dir = GetExtensionsDir()

    if not os.path.exists(extensions_dir):
        os.makedirs(extensions_dir)

    # Download the extension
    logger.log(f"Downloading extension from {url}")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        crx_data = response.content
        zip_data = extract_zip_from_crx(crx_data)

        # Extract the extension directly to the extensions directory
        ext_dir = os.path.join(extensions_dir, name)

        # Remove existing directory if it exists
        if os.path.exists(ext_dir):
            shutil.rmtree(ext_dir)

        # Create a temporary file and extract the zip
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            temp_file.write(zip_data)
            temp_file_path = temp_file.name

        with zipfile.ZipFile(temp_file_path, 'r') as zip_ref:
            zip_ref.extractall(ext_dir)

        # Clean up
        os.unlink(temp_file_path)

        logger.log(f"Extension successfully extracted to {ext_dir}")
        PrepareExtensionFiles()
        return True
    except requests.RequestException as e:
        logger.error(f"Failed to download extension: {str(e)} {e.__traceback__}")
        return False
    except (ValueError, zipfile.BadZipFile) as e:
        logger.error(f"Failed to process extension file: {str(e)} {e.__traceback__}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error installing extension: {str(e)} {e.__traceback__}")
        return False


# TODO: do the same as millennium does for the file proxy but for chrome-extension:// url
def PrepareExtensionFiles():
    dir_path = GetExtensionsDir().replace('\\', '/')
    extension_url = f"https://js.millennium.app/{dir_path}"
    extensions_dir = GetExtensionsDir()

    if not os.path.exists(extensions_dir):
        return

    for ext_folder in os.listdir(extensions_dir):
        ext_path = os.path.join(extensions_dir, ext_folder)
        if os.path.isdir(ext_path):
            ext_folder = ext_folder.replace('\\', '/')
            full_dir_path = f"{extension_url}/{ext_folder}"
            # Define file processing rules
            processing_rules = {
                '.css': [
                    {'pattern': r'url\((?!")chrome-extension:\/\/__MSG_@@extension_id__\/(.+?)\)', 'replacement': f"url(\"{full_dir_path}/\\g<1>\")", 'is_regex': True},
                    {'pattern': "url('/", 'replacement': f"url('{full_dir_path}/"},
                    {'pattern': r"url\((['\"])chrome-extension://__MSG_@@extension_id__/", 'replacement': f"url(\g<1>{full_dir_path}/", 'is_regex': True},
                ],
                '.html': [
                    {'pattern': "href=\"/", 'replacement': f"href=\"{full_dir_path}/"},
                    {'pattern': "src=\"/", 'replacement': f"src=\"{full_dir_path}/"},
                ],
                '.js': [
                    {'pattern': "globalThis.chrome", 'replacement': "chrome"},
                    {'pattern': ".bind(null,this)", 'replacement': ".bind(null,windowProxy)"},
                ]
            }

            # Handle root folder references in JS files
            ext_root_folders = [d for d in os.listdir(ext_path) if os.path.isdir(os.path.join(ext_path, d))]
            for dir_name in ext_root_folders:
                processing_rules['.js'].append({'pattern': f"(['\"])\/{re.escape(dir_name)}", 'replacement': f"\\g<1>{full_dir_path}/{dir_name}", 'is_regex': True})
                processing_rules['.css'].append({'pattern': f"url\((['\"])\/{re.escape(dir_name)}", 'replacement': f"url(\\g<1>{full_dir_path}/{dir_name}", 'is_regex': True})
                processing_rules['.css'].append({'pattern': f"url\((/{re.escape(dir_name)}/.+?)\)", 'replacement': f"url(\"{full_dir_path}\\g<1>\")", 'is_regex': True})

            for root, _, files in os.walk(ext_path):
                for file in files:
                    file_extension = os.path.splitext(file)[1].lower()
                    file_path = os.path.join(root, file)
                    relative_path = EXTENSIONS_DIR + '/' + os.path.relpath(file_path, extensions_dir)

                    # Process file if we have rules for its extension
                    if file_extension in processing_rules:
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()

                            modified_content = content
                            previous_content = content

                            processed_patterns = []
                            for rule in processing_rules[file_extension]:
                                find_pattern = rule['pattern']
                                replace_pattern = rule['replacement']
                                is_regex = rule.get('is_regex', False)

                                if is_regex:
                                    modified_content = re.sub(find_pattern, replace_pattern, modified_content)
                                else:
                                    modified_content = modified_content.replace(find_pattern, replace_pattern)

                                if previous_content != modified_content:
                                    processed_patterns.append(find_pattern)

                                previous_content = modified_content

                            if content != modified_content:
                                with open(file_path, 'w', encoding='utf-8') as f:
                                    f.write(modified_content)
                                logger.log(f"Updated {file_extension} file: {relative_path} with patterns: {processed_patterns}")
                        except Exception as e:
                            logger.error(f"Error processing {file_extension} file {relative_path}: {str(e)}")

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

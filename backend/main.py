# pylint: disable=invalid-name
import base64
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

EXTENSIONS_DIR = '.extensions'
EXTENDIUM_EXTERNAL_LINKS_FILE = 'external-links.json'

cors_proxy: Optional[CORSProxy] = None

def GetPluginDir():
    return path.abspath(PLUGIN_BASE_DIR) # pylint: disable=undefined-variable

def GetExtensionsDir():
    return os.path.join(GetPluginDir(), EXTENSIONS_DIR)

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

def GetExtensionMetadatas():
    extensions_dir = GetExtensionsDir()
    metadatas = {}

    if os.path.exists(extensions_dir):
        for ext_folder in os.listdir(extensions_dir):
            metadata_path = os.path.join(extensions_dir, ext_folder, "metadata.json")
            if os.path.isfile(metadata_path):
                try:
                    with open(metadata_path, 'r', encoding='utf-8') as f:
                        metadata_data = json.load(f)
                        metadatas[ext_folder] = metadata_data
                except Exception as e:
                    logger.error(f"Error reading metadata {metadata_path}: {str(e)}")

    return metadatas

def GetExternalLinks():
    external_links_path = os.path.join(GetPluginDir(), EXTENDIUM_EXTERNAL_LINKS_FILE)
    if os.path.isfile(external_links_path):
        try:
            with open(external_links_path, 'r', encoding='utf-8') as f:
                external_links = json.load(f)
                return external_links
        except Exception as e:
            logger.error(f"Error reading external links {external_links_path}: {str(e)}")
    return []

def UpdateExternalLinks(external_links: str):
    external_links_path = os.path.join(GetPluginDir(), EXTENDIUM_EXTERNAL_LINKS_FILE)
    try:
        with open(external_links_path, 'w', encoding='utf-8') as f:
            f.write(external_links)
    except Exception as e:
        logger.error(f"Error writing external links {external_links_path}: {str(e)}")

def GetExtensionsInfos():
    return json.dumps({
        'extensionsDir': GetExtensionsDir(),
        'pluginDir': GetPluginDir(),
        'manifests': GetExtensionManifests(),
        'metadatas': GetExtensionMetadatas(),
        'externalLinks': GetExternalLinks(),
    })

def RemoveExtension(name: str):
    extensions_dir = GetExtensionsDir()
    ext_dir = os.path.join(extensions_dir, name)
    if os.path.exists(ext_dir):
        shutil.rmtree(ext_dir)
    Millennium.call_frontend_method('removeExtension', params=[name])

USER_INFO: Optional[str] = None

def GetUserInfo():
    global USER_INFO
    if USER_INFO is None or not USER_INFO.startswith('{'):
        USER_INFO = Millennium.call_frontend_method('getUserInfo') # pylint: disable=assignment-from-no-return
    return USER_INFO

def CheckForUpdates():
    metadatas = GetExtensionMetadatas()
    manifests = GetExtensionManifests()
    foundUpdates = {}
    for [name, metadata] in metadatas.items():
        try:
            page = requests.get(metadata['url'], timeout=30, headers={
                'Accept-Language': 'en-US',
            })
            version = re.search(r'version\\": \\"([^\\]+)', page.text)

            if version:
                if version.group(1) != manifests[name]['version']:
                    logger.log(f"New version found for extension '{name}': {version.group(1)}")
                    foundUpdates[name] = metadata
            else:
                logger.error(f"Update version not found for extension '{name}'")
        except Exception as e:
            logger.error(f"Error checking for updates for extension '{name}': {str(e)}")

    return json.dumps(foundUpdates)

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

def DownloadExtensionFromUrl(url: str, metadata: str, name: str):
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

        # Write metadata to the extension directory
        with open(os.path.join(ext_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
            f.write(base64.b64decode(metadata).decode('utf-8'))

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
                processing_rules['.js'].append({'pattern': f"(['\"])\/{re.escape(dir_name)}\/", 'replacement': f"\\g<1>{full_dir_path}/{dir_name}/", 'is_regex': True})
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
        # didn't touch this, but this should probably be self.cors_proxy.
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
        global cors_proxy
        logger.log("Starting plugin unload process...")

        # sig stop the WebSocket server, and wait for the thread to die
        try:
            logger.log("Shutting down WebSocket server...")
            shutdown_server()

            logger.log("WebSocket server shutdown completed")
        except Exception as e:
            logger.error(f"Error shutting down websocket server: {e}")

        # sig stop the CORS proxy server, and wait for the thread to die
        try:
            logger.log("Shutting down CORS proxy server...")
            if cors_proxy:
                cors_proxy.stop()
                cors_proxy = None  # Reset global reference
                logger.log("CORS proxy server shutdown completed")
        except Exception as e:
            logger.error(f"Error shutting down CORS proxy server: {e}")

        try:
            logger.log("Cleaning up HTTP connection pools...")

            # close any existing sessions in the requests module
            try:
                default_session = getattr(requests.sessions, 'Session', None)
                if default_session and hasattr(requests, 'get'):
                    # force creation and closure of a session to clear pools
                    temp_session = requests.Session()
                    temp_session.close()
            except Exception:
                pass

            session = requests.Session()
            session.close()

            logger.log("HTTP connection pools cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up HTTP connection pools: {e}")

        logger.log("Plugin unload process completed")

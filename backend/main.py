import json
import os
from os import path

import Millennium
import PluginUtils  # type: ignore

logger = PluginUtils.Logger()

EXTENSIONS_DIR = '/steamui/extensions'
EXTENSIONS_URL = 'https://steamloopback.host/extensions'

def GetPluginDir():
    return path.abspath(PLUGIN_BASE_DIR)

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

    return json.dumps(manifests)

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
                            ("url('/", f"url('{EXTENSIONS_URL}/{ext_folder}/")
                        ],
                        '.html': [
                            ("href=\"/", f"href=\"{EXTENSIONS_URL}/{ext_folder}/"),
                            ("src=\"/", f"src=\"{EXTENSIONS_URL}/{ext_folder}/")
                        ],
                        '.js': []
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
        logger.log(f"bootstrapping Extendium, millennium {Millennium.version()}")

        try:
            PrepareExtensionFiles()
        except Exception as e:
            logger.error(f"Error preparing extension files: {e}")

        Millennium.ready()  # this is required to tell Millennium that the backend is ready.
    def _unload(self):
        logger.log("unloading")

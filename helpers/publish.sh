#!/bin/bash
export RELEASE_VERSION="$1"

helpers/generate-metadata.sh
python3 helpers/build_zip.py
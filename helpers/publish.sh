#!/bin/bash
export RELEASE_VERSION="$1"

helpers/generate-metadata.sh
bun helpers/build_zip.ts
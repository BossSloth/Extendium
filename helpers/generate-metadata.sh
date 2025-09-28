#!/bin/bash

commit_id=$(git rev-parse HEAD)
plugin_id=$(git rev-list --max-parents=0 HEAD)

echo "{\"id\": \"$plugin_id\", \"commitId\": \"$commit_id\"}" > metadata.json
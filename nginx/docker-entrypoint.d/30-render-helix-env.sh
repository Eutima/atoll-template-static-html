#!/bin/sh
# Renders the Helix runtime config into a static JS file at container
# start, from whatever env vars Atoll (or `docker run -e`) set on this
# container. Kept out of /etc/nginx/templates/ deliberately — that
# directory is nginx's own conf.d templating feature
# (20-envsubst-on-templates.sh ships *.template files there into
# /etc/nginx/conf.d/*.conf); reusing it for a static JS asset would
# collide with that mechanism.
set -eu

# `export` is required here, not just a shell-local default — envsubst
# runs as a separate process and only sees variables actually exported
# into the environment, not shell variables set via `: "${VAR:=x}"`.
export HELIX_ENABLED="${HELIX_ENABLED:-false}"
export HELIX_BASE_URL="${HELIX_BASE_URL:-}"
export HELIX_OAUTH_CLIENT_ID="${HELIX_OAUTH_CLIENT_ID:-}"
export HELIX_OAUTH_TENANT="${HELIX_OAUTH_TENANT:-}"
export HELIX_WORKSPACE_TENANT="${HELIX_WORKSPACE_TENANT:-}"

envsubst '${HELIX_ENABLED} ${HELIX_BASE_URL} ${HELIX_OAUTH_CLIENT_ID} ${HELIX_OAUTH_TENANT} ${HELIX_WORKSPACE_TENANT}' \
  < /etc/nginx/helix/env.template.js \
  > /usr/share/nginx/html/assets/env.js

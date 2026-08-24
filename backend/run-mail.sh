#!/usr/bin/env bash
# Starts the RWB backend with real email delivery enabled, loading SMTP
# credentials from .env (gitignored). Usage:
#
#   cd backend
#   cp .env.example .env     # then fill in YOUR values
#   bash run-mail.sh
#
# The launcher refuses to start when mail is enabled but credentials are
# missing — otherwise every registration would fail instead of emailing.

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=.env
if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Copy .env.example to .env and fill in your SMTP credentials." >&2
  exit 1
fi

set -a
# Strip CRLF line endings — .env saved on Windows would otherwise append a
# trailing \r to the last value (usually MAIL_PASSWORD) and break SMTP auth.
# shellcheck disable=SC1090
source <(tr -d '\r' < "$ENV_FILE")
set +a

if [ "${MAIL_ENABLED:-false}" = "true" ]; then
  missing=""
  [ -z "${MAIL_HOST:-}" ]     && missing="$missing MAIL_HOST"
  [ -z "${MAIL_USERNAME:-}" ] && missing="$missing MAIL_USERNAME"
  [ -z "${MAIL_PASSWORD:-}" ] && missing="$missing MAIL_PASSWORD"
  [ -z "${MAIL_FROM:-}" ]     && missing="$missing MAIL_FROM"
  if [ -n "$missing" ]; then
    echo "error: mail is enabled but these are empty in $ENV_FILE:$missing" >&2
    echo "Fill them in first (see .env.example for Gmail/Outlook/relay values)." >&2
    exit 1
  fi
  echo "mail enabled -> verification links will be emailed via $MAIL_HOST:$MAIL_PORT"
else
  echo "mail disabled (MAIL_ENABLED not 'true') -> dev fallback, token returned by API"
fi

exec java -jar target/rwb-review-backend-0.1.0-SNAPSHOT.jar

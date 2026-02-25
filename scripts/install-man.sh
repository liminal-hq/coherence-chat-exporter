#!/bin/bash

# Coherence Chat Exporter - Man Page Installer
# Installs the man page to the user's local man directory (XDG standard).

set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

MAN_SOURCE="$PROJECT_ROOT/man/coherence.1"
MAN_DIR="${HOME}/.local/share/man/man1"
MAN_DEST="${MAN_DIR}/coherence.1"

echo "Installing Coherence man page..."

# Check if source exists
if [ ! -f "$MAN_SOURCE" ]; then
    echo "Error: Man page source '$MAN_SOURCE' not found."
    exit 1
fi

# Create directory if it doesn't exist
if [ ! -d "$MAN_DIR" ]; then
    echo "Creating directory: $MAN_DIR"
    mkdir -p "$MAN_DIR"
fi

# Copy the file
echo "Copying $MAN_SOURCE to $MAN_DEST"
cp "$MAN_SOURCE" "$MAN_DEST"

# Set permissions (readable by user)
chmod 644 "$MAN_DEST"

# Note: Future install steps (e.g. binary installation) will be added here.
# TODO: Add binary installation logic.

# Update man database if mandb is available
if command -v mandb >/dev/null 2>&1; then
    echo "Updating man database..."
    mandb -q "$HOME/.local/share/man" || echo "Warning: failed to run mandb."
else
    echo "mandb not found, skipping database update."
fi

echo "Success! You can now view the man page by running: man coherence"
echo "Ensure '$HOME/.local/share/man' is in your MANPATH if it doesn't show up."

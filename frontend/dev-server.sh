#!/bin/bash
# APEX Frontend Dev Server Workaround for iCloud Drive
# This script copies the project to /tmp, runs Vite from there, and keeps files in sync

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMP_DIR="/tmp/apex-frontend-dev"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  APEX Dev Server (iCloud Workaround)  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Clean up on exit
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  if [ -d "$TEMP_DIR" ]; then
    # Sync any changes back to source (excluding node_modules)
    echo "Syncing changes back to iCloud Drive..."
    rsync -av --exclude 'node_modules' --exclude '.vite' --exclude 'dist' \
      "$TEMP_DIR/" "$SOURCE_DIR/" 2>/dev/null || true
  fi
  kill $VITE_PID 2>/dev/null || true
  echo -e "${GREEN}Cleanup complete!${NC}"
}

trap cleanup EXIT INT TERM

# Create temp directory
echo -e "${BLUE}Step 1:${NC} Creating temporary workspace..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy project files (excluding node_modules first, we'll link it)
echo -e "${BLUE}Step 2:${NC} Copying project files to /tmp..."
rsync -a --exclude 'node_modules' --exclude '.vite' --exclude 'dist' \
  "$SOURCE_DIR/" "$TEMP_DIR/"

# Create symlink for node_modules to avoid copying large files
echo -e "${BLUE}Step 3:${NC} Linking node_modules..."
if [ -d "$SOURCE_DIR/node_modules" ]; then
  ln -s "$SOURCE_DIR/node_modules" "$TEMP_DIR/node_modules"
else
  echo -e "${YELLOW}Warning: node_modules not found. Run 'npm install' first.${NC}"
  exit 1
fi

# Start Vite from temp directory
echo -e "${BLUE}Step 4:${NC} Starting Vite dev server..."
cd "$TEMP_DIR"

# Start Vite in background
npm run dev &
VITE_PID=$!

echo -e "${GREEN}✓ Vite server started!${NC}"
echo -e ""
echo -e "  ${GREEN}Local:${NC}   http://localhost:5173/"
echo -e ""
echo -e "${YELLOW}Note:${NC} Files are being served from /tmp/apex-frontend-dev"
echo -e "${YELLOW}Note:${NC} Changes will be synced back to iCloud Drive on exit"
echo -e ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop the server and sync changes back"
echo -e ""

# Keep script running and watch for the Vite process
wait $VITE_PID

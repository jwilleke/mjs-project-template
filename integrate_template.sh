#!/bin/bash

# This script integrates the project template into the current directory.
# It should be run from within an existing project folder.

# If a GitHub URL is provided as the first argument, clone it.
if [ -n "$1" ]; then
  REPO_URL="$1"
  TEMP_DIR=$(mktemp -d)
  echo "Cloning repository from $REPO_URL to $TEMP_DIR..."
  git clone "$REPO_URL" "$TEMP_DIR"
  if [ $? -ne 0 ]; then
    echo "Error: Failed to clone repository."
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  TEMPLATE_DIR="$TEMP_DIR"
  CLEANUP_TEMP_DIR=true
else
  TEMPLATE_DIR="$(dirname "$0")"
  CLEANUP_TEMP_DIR=false
fi
DEST_DIR="$(pwd)"

echo "Integrating template from: $TEMPLATE_DIR"
echo "Into current directory: $DEST_DIR"

# Check for files that would be overwritten
OVERWRITTEN_FILES=()
for file in "$TEMPLATE_DIR"/*; do
  if [ -e "$DEST_DIR/$(basename "$file")" ]; then
    OVERWRITTEN_FILES+=("$(basename "$file")")
  fi
done

if [ ${#OVERWRITTEN_FILES[@]} -gt 0 ]; then
  echo "\nWarning: The following files in the destination directory will be overwritten:"
  for file in "${OVERWRITTEN_FILES[@]}"; do
    echo "- $file"
  done
  read -p "Do you want to proceed and overwrite these files? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Integration cancelled."
    exit 1
  fi
fi

# Use rsync to copy files, excluding the script itself if it exists in the template
# and ensuring directories are merged not replaced
# -a: archive mode (preserves permissions, timestamps, etc.)
# -v: verbose
# --exclude=integrate_template.sh: don't copy the script itself
# "$TEMPLATE_DIR/" ensures the *contents* are copied, not the directory itself

rsync -av --exclude="integrate_template.sh" "$TEMPLATE_DIR/" "$DEST_DIR"

echo "\nProject template integrated successfully!"

# Clean up temporary directory if it was created
if [ "$CLEANUP_TEMP_DIR" = true ]; then
  echo "Cleaning up temporary directory: $TEMP_DIR"
  rm -rf "$TEMP_DIR"
fi

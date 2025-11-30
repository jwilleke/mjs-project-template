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

# Determine the destination directory
if [ -n "$2" ]; then
  DEST_DIR="$2"
else
  DEST_DIR="$(pwd)"
fi

# Ensure the destination directory exists
mkdir -p "$DEST_DIR"
if [ $? -ne 0 ]; then
  echo "Error: Failed to create destination directory $DEST_DIR."
  if [ "$CLEANUP_TEMP_DIR" = true ]; then
    rm -rf "$TEMP_DIR"
  fi
  exit 1
fi


echo "Integrating template from: $TEMPLATE_DIR"
echo "Into current directory: $DEST_DIR"

# Categorize files: overwritten and new
ALL_TEMPLATE_FILES=()
for file in "$TEMPLATE_DIR"/*; do
  BASENAME=$(basename "$file")
  if [ "$BASENAME" != "integrate_template.sh" ]; then
    ALL_TEMPLATE_FILES+=("$BASENAME")
  fi
done

OVERWRITTEN_FILES=()
NEW_FILES=()
for file in "${ALL_TEMPLATE_FILES[@]}"; do
  if [ -e "$DEST_DIR/$file" ]; then
    OVERWRITTEN_FILES+=("$file")
  else
    NEW_FILES+=("$file")
  fi
done

echo ""
if [ ${#OVERWRITTEN_FILES[@]} -gt 0 ]; then
  echo "Warning: The following files in the destination directory will be overwritten:"
  for file in "${OVERWRITTEN_FILES[@]}"; do
    echo "- $file"
  done
fi

if [ ${#NEW_FILES[@]} -gt 0 ]; then
  echo "Info: The following new files will be copied to the destination directory:"
  for file in "${NEW_FILES[@]}"; do
    echo "- $file"
  done
fi

if [ ${#OVERWRITTEN_FILES[@]} -gt 0 ] || [ ${#NEW_FILES[@]} -gt 0 ]; then
  echo "\nChoose an action:"
  echo "  [C]ancel integration"
  echo "  [N]ormal copy (copy new files, skip existing)"
  echo "  [O]verwrite all (copy all files, overwrite existing)"
  read -p "Enter your choice (C/N/O): " -n 1 -r
  echo

  case "$REPLY" in
    [Cc] )
      echo "Integration cancelled."
      if [ "$CLEANUP_TEMP_DIR" = true ]; then
        rm -rf "$TEMP_DIR"
      fi
      exit 1
      ;;
    [Nn] )
      echo "Proceeding with normal copy (copying new files, skipping existing)."
      # Copy only new files
      # Use rsync with --ignore-existing to not overwrite
      rsync -av --ignore-existing --exclude="integrate_template.sh" "$TEMPLATE_DIR/" "$DEST_DIR"
      ;;
    [Oo] )
      echo "Proceeding to overwrite all files."
      # Overwrite all files
      rsync -av --exclude="integrate_template.sh" "$TEMPLATE_DIR/" "$DEST_DIR"
      ;;
    * )
      echo "Invalid choice. Integration cancelled."
      if [ "$CLEANUP_TEMP_DIR" = true ]; then
        rm -rf "$TEMP_DIR"
      fi
      exit 1
      ;;
  esac
else
  echo "No template files to integrate."
fi

echo "\nProject template integrated successfully!"

# Clean up temporary directory if it was created
if [ "$CLEANUP_TEMP_DIR" = true ]; then
  echo "Cleaning up temporary directory: $TEMP_DIR"
  rm -rf "$TEMP_DIR"
fi

#!/bin/bash

# Script to generate Tauri icons from runstack.png
# Follows Tauri icon requirements: https://github.com/tauri-apps/tauri/blob/1.x/tooling/cli/src/helpers/icns.json
# Requires: sips (macOS built-in), iconutil (macOS built-in), ImageMagick (optional, recommended for .ico)

set -e

ICONS_DIR="src-tauri/icons"
SOURCE_IMAGE="$ICONS_DIR/runstack.png"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "❌ Error: Source image not found at $SOURCE_IMAGE"
  exit 1
fi

# Verify source image format
echo "🔍 Verifying source image..."
IMAGE_INFO=$(sips -g pixelWidth -g pixelHeight -g format "$SOURCE_IMAGE" 2>/dev/null)
if ! echo "$IMAGE_INFO" | grep -q "format: png"; then
  echo "⚠️  Warning: Source image should be PNG format"
fi

echo "🎨 Generating Tauri icons from $SOURCE_IMAGE..."
echo ""

# ============================================================================
# Generate PNG icons (Tauri requirements: 32x32, 128x128, 128x128@2x, icon.png)
# ============================================================================
echo "📐 Generating PNG icons (Tauri required sizes)..."

# 32x32.png - Required by Tauri
sips -z 32 32 "$SOURCE_IMAGE" --out "$ICONS_DIR/32x32.png" > /dev/null
echo "✅ Generated 32x32.png"

# 128x128.png - Required by Tauri
sips -z 128 128 "$SOURCE_IMAGE" --out "$ICONS_DIR/128x128.png" > /dev/null
echo "✅ Generated 128x128.png"

# 128x128@2x.png (256x256) - Required by Tauri for Retina displays
sips -z 256 256 "$SOURCE_IMAGE" --out "$ICONS_DIR/128x128@2x.png" > /dev/null
echo "✅ Generated 128x128@2x.png (256x256)"

# icon.png - Recommended by Tauri (typically 512x512 or 1024x1024)
# Use the source image if it's already 1024x1024, otherwise resize to 512x512
SOURCE_SIZE=$(sips -g pixelWidth "$SOURCE_IMAGE" | grep pixelWidth | awk '{print $2}')
if [ "$SOURCE_SIZE" -ge 1024 ]; then
  cp "$SOURCE_IMAGE" "$ICONS_DIR/icon.png"
  echo "✅ Copied icon.png (source is 1024x1024)"
else
  sips -z 512 512 "$SOURCE_IMAGE" --out "$ICONS_DIR/icon.png" > /dev/null
  echo "✅ Generated icon.png (512x512)"
fi

# Optional: 64x64.png (sometimes needed)
sips -z 64 64 "$SOURCE_IMAGE" --out "$ICONS_DIR/64x64.png" > /dev/null
echo "✅ Generated 64x64.png (optional)"

echo ""

# ============================================================================
# Generate macOS .icns file
# Required sizes per Tauri: https://github.com/tauri-apps/tauri/blob/1.x/tooling/cli/src/helpers/icns.json
# ============================================================================
echo "🍎 Generating macOS .icns file..."

# Create temporary iconset directory
ICONSET_DIR="$ICONS_DIR/RunStack.iconset"
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# Generate all required sizes for .icns according to Tauri specifications
# Each size needs both standard and @2x (Retina) versions
echo "   Generating iconset layers..."

# 16x16 and 16x16@2x (32x32)
sips -z 16 16 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null
sips -z 32 32 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null

# 32x32 and 32x32@2x (64x64)
sips -z 32 32 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null
sips -z 64 64 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null

# 128x128 and 128x128@2x (256x256)
sips -z 128 128 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null
sips -z 256 256 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null

# 256x256 and 256x256@2x (512x512)
sips -z 256 256 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null
sips -z 512 512 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null

# 512x512 and 512x512@2x (1024x1024)
sips -z 512 512 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null
sips -z 1024 1024 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null

# Convert iconset to .icns
iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"
rm -rf "$ICONSET_DIR"
echo "✅ Generated icon.icns with all required layers"
echo ""

# ============================================================================
# Generate Windows .ico file
# Tauri requirements: layers for 16, 24, 32, 48, 64, and 256 pixels
# The 32px layer should be first for optimal display
# ============================================================================
echo "🪟 Generating Windows .ico file..."

# Create a temporary directory for ico generation
ICO_TEMP_DIR=$(mktemp -d)

# Generate all required sizes for .ico (Tauri requirements)
echo "   Generating .ico layers..."
sips -z 16 16 "$SOURCE_IMAGE" --out "$ICO_TEMP_DIR/16x16.png" > /dev/null
sips -z 24 24 "$SOURCE_IMAGE" --out "$ICO_TEMP_DIR/24x24.png" > /dev/null
sips -z 32 32 "$SOURCE_IMAGE" --out "$ICO_TEMP_DIR/32x32.png" > /dev/null
sips -z 48 48 "$SOURCE_IMAGE" --out "$ICO_TEMP_DIR/48x48.png" > /dev/null
sips -z 64 64 "$SOURCE_IMAGE" --out "$ICO_TEMP_DIR/64x64.png" > /dev/null
sips -z 256 256 "$SOURCE_IMAGE" --out "$ICO_TEMP_DIR/256x256.png" > /dev/null

# Check if ImageMagick is available (required for proper multi-layer .ico)
if command -v magick &> /dev/null; then
  echo "   Using ImageMagick for .ico generation..."
  # Order matters: 32px first for optimal display, then others
  magick "$ICO_TEMP_DIR/32x32.png" "$ICO_TEMP_DIR/16x16.png" "$ICO_TEMP_DIR/24x24.png" "$ICO_TEMP_DIR/48x48.png" "$ICO_TEMP_DIR/64x64.png" "$ICO_TEMP_DIR/256x256.png" "$ICONS_DIR/icon.ico"
  echo "✅ Generated icon.ico with all required layers (32px first)"
elif command -v convert &> /dev/null; then
  echo "   Using ImageMagick (legacy) for .ico generation..."
  # Order matters: 32px first for optimal display, then others
  convert "$ICO_TEMP_DIR/32x32.png" "$ICO_TEMP_DIR/16x16.png" "$ICO_TEMP_DIR/24x24.png" "$ICO_TEMP_DIR/48x48.png" "$ICO_TEMP_DIR/64x64.png" "$ICO_TEMP_DIR/256x256.png" "$ICONS_DIR/icon.ico"
  echo "✅ Generated icon.ico with all required layers (32px first)"
else
  echo "   ⚠️  ImageMagick not found. Creating basic .ico from 256x256..."
  echo "   ⚠️  This will only include one layer. For full Tauri compliance, install ImageMagick."
  sips -s format ico "$ICO_TEMP_DIR/256x256.png" --out "$ICONS_DIR/icon.ico" > /dev/null
  echo "✅ Generated icon.ico (basic, single layer)"
  echo ""
  echo "   💡 To generate a proper multi-layer .ico file, install ImageMagick:"
  echo "      brew install imagemagick"
  echo ""
  echo "   ⚠️  Note: The current .ico may not meet all Tauri requirements."
fi

rm -rf "$ICO_TEMP_DIR"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "🎉 All icons generated successfully!"
echo ""
echo "📦 Generated files:"
echo "   PNG icons:"
echo "     ✓ 32x32.png"
echo "     ✓ 128x128.png"
echo "     ✓ 128x128@2x.png (256x256)"
echo "     ✓ icon.png"
echo "     ✓ 64x64.png (optional)"
echo ""
echo "   macOS:"
echo "     ✓ icon.icns (with all required layers: 16, 32, 128, 256, 512, 1024)"
echo ""
echo "   Windows:"
if command -v magick &> /dev/null || command -v convert &> /dev/null; then
  echo "     ✓ icon.ico (with all required layers: 16, 24, 32, 48, 64, 256)"
else
  echo "     ⚠️  icon.ico (basic, single layer - install ImageMagick for full compliance)"
fi
echo ""
echo "📋 All icons meet Tauri requirements:"
echo "   • PNG: RGBA format, square dimensions"
echo "   • ICNS: All required sizes (16-1024px with @2x variants)"
if command -v magick &> /dev/null || command -v convert &> /dev/null; then
  echo "   • ICO: All required sizes (16, 24, 32, 48, 64, 256) with 32px first"
else
  echo "   • ICO: ⚠️  Install ImageMagick for full compliance"
fi

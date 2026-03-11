#!/bin/bash
# Run this ONCE after `npx cap add ios && npx cap sync ios`
# It copies the app icon and sets up everything Xcode needs.

set -e

ICON_SRC="public/app-icon-1024.png"
ICON_DEST="ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024@1x.png"
CONTENTS_JSON="ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json"

echo "📱 BountyBay iOS Post-Sync Setup"
echo "================================"

# 1. Copy app icon
if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$ICON_DEST"
  echo "✅ App icon copied"
  
  # Write the Contents.json to reference our icon
  cat > "$CONTENTS_JSON" << 'EOF'
{
  "images" : [
    {
      "filename" : "AppIcon-1024@1x.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF
  echo "✅ Icon manifest updated"
else
  echo "⚠️  Icon not found at $ICON_SRC"
fi

# 2. Set NSAppTransportSecurity in Info.plist
PLIST="ios/App/App/Info.plist"
if [ -f "$PLIST" ]; then
  # Add Allow Arbitrary Loads if not present
  if ! grep -q "NSAllowsArbitraryLoads" "$PLIST"; then
    /usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity dict" "$PLIST" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" "$PLIST" 2>/dev/null || true
    echo "✅ NSAppTransportSecurity configured"
  else
    echo "✅ NSAppTransportSecurity already set"
  fi
fi

echo ""
echo "================================"
echo "✅ Done! Now open Xcode and just set:"
echo "   1. Team → BountyBay Inc."
echo "   2. Build number → increment it"
echo "   3. Archive & upload"
echo ""



## The Problem

You submitted the iOS app with Google Sign-In visible. Apple will likely reject it because native apps with Google OAuth need to follow Apple's specific requirements (Sign in with Apple must also be offered if you offer any social login).

Your code already has logic to hide Google Sign-In on native platforms (`Capacitor.isNativePlatform()`), but this only works when the app runs inside the native Capacitor shell with the bundled `dist` files. If you built the app pointing to the live web URL (via `CAP_SERVER_URL`), the app loads the website inside a WebView, and `isNativePlatform()` still returns `true` — so the Google button should have been hidden.

## What You Need to Do

There are two paths depending on what Apple says:

### If Apple rejects it (most likely scenario)
1. **Wait for the rejection email** — it will tell you exactly what to fix
2. The code fix is already in place (Google auth is hidden on native). We just need to make sure your build was using the bundled app, not the live URL
3. **Rebuild and resubmit** — same process you did before on MacinCloud:
   - `git pull` (to get latest code)
   - `npm install && npm run build && npx cap sync ios`
   - Open Xcode, archive, upload
   - Go to App Store Connect, select the new build, submit for review

### If Apple hasn't responded yet
You can proactively upload a new build now with the same steps above. In App Store Connect, you can replace the build attached to your version before it gets reviewed.

## Verification Step

Before rebuilding, we should verify the Google button is truly hidden. On your MacinCloud session (or whenever you rebuild), after running `npx cap sync ios` and opening in Xcode, run the app in the iOS Simulator and navigate to the login screen. The Google Sign-In button should not be visible.

## No Code Changes Needed

The code already correctly hides Google auth on native platforms. The fix is just ensuring you rebuild and resubmit.


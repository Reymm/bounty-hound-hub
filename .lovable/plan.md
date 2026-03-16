

# Get BountyBay Ready for Apple Store Resubmission

Based on the rejection history (Guideline 4.2 - Minimum Functionality) and current state, here's exactly what needs to happen:

---

## What's blocking you right now

| Item | Status | Impact |
|------|--------|--------|
| Firebase project (FCM) | Not created | Push notifications won't fire, no badge |
| Native Share Sheet | Code uses `navigator.share` (web API) — works but not using `@capacitor/share` | Apple wants native feel |
| Test account content | Unknown if `emma_iso` has active bounties to demo | Reviewer needs clear paths to test |

---

## Plan — 3 things to ship

### 1. Upgrade Share to use `@capacitor/share` (native iOS share sheet)

Currently `ShareBountyButton.tsx` uses the Web Share API (`navigator.share`). On native iOS, `@capacitor/share` provides the real native share sheet with full app list.

**Changes:**
- Install `@capacitor/share`
- Update `ShareBountyButton.tsx`: detect native platform → use `Share.share()` from Capacitor instead of `navigator.share`
- Falls back to current web behavior on non-native

This is ~15 minutes of work and immediately visible to Apple reviewers.

### 2. Firebase + FCM setup (you do this manually)

This is not code — it's configuration you need to do:

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project "BountyBay"
2. Add iOS app with bundle ID `co.bountybay.app`
3. Download `GoogleService-Info.plist` → drag into Xcode project root
4. Project Settings → Cloud Messaging → enable "Cloud Messaging API (Legacy)" → copy Server Key
5. Give me the Server Key → I store it as `FCM_SERVER_KEY` secret in Supabase

Once done: push notifications + app icon badge will work.

### 3. Ensure test account has demo content for reviewer

The reviewer logs in as `emma_iso` and needs to see:
- Active bounties to browse
- Ability to post a bounty
- Ability to claim/comment on a bounty
- Messages accessible

I can seed demo bounties if needed, but you should verify the test account has content by logging in as `emma_iso` before submitting.

---

## Build sequence

1. **I implement** the native share sheet upgrade (code change, ~15 min)
2. **You set up** Firebase and give me the Server Key
3. **You verify** `emma_iso` has content to demo
4. **You rebuild**: `git pull → npm run build → npx cap sync ios → ./scripts/ios-post-sync.sh → Archive → TestFlight`

---

## What to tell Apple in the resubmission notes

> "This update adds native iOS Share Sheet integration via Capacitor, Push Notifications with APNs/FCM for real-time alerts on bounty claims and messages, Haptic Feedback on key actions, and Pull-to-Refresh on all list views. The test account (emma_iso) has active bounties demonstrating the full marketplace loop: browse → post → claim → message → fulfill."


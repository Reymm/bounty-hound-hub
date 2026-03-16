

## Google Play Store Submission Plan

### Prerequisites
- Google Play Developer account ($25 one-time fee): https://play.google.com/console/signup
- Android Studio installed on your computer
- The GitHub repo (now private) cloned locally

### Step 1: Build the Android APK/AAB

```text
cd bountybay
git pull
npm install
npm run build
npx cap sync android
npx cap open android
```

This opens Android Studio. Wait for Gradle sync to finish (can take a few minutes first time).

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)** (Google Play requires this)
3. **Create new keystore** (SAVE THIS FILE AND PASSWORDS — you need them for every future update):
   - Key store path: pick a safe location outside the project folder
   - Password: choose something strong
   - Key alias: `bountybay`
   - Key password: same or different
   - Fill in at least your name in the certificate fields
4. Click **Next**, select **release**, click **Create**
5. The .aab file will be in `android/app/release/`

### Step 2: Google Play Console Setup

1. Go to https://play.google.com/console
2. **Create app**:
   - App name: **BountyBay**
   - Default language: English (US)
   - App type: App
   - Free or paid: Free
   - Declarations: check both boxes
3. Complete the **Dashboard checklist** (Privacy policy, app access, content rating, target audience, etc.):
   - Privacy policy URL: `https://bountybay.co/legal/privacy`
   - App category: **Shopping**
   - Contact email: your email
   - Content rating: fill out the questionnaire (no violence, no mature content)

### Step 3: Store Listing

- **Short description:** Post a bounty. Get it found.
- **Full description:** Same as your App Store description
- **Screenshots:** You need at minimum:
  - 2 phone screenshots (min 320px, max 3840px, 16:9 or 9:16)
  - You can reuse your App Store screenshots
- **Feature graphic:** 1024x500 px (required) — this is the banner at top of listing
- **App icon:** 512x512 px (you already have `public/android-chrome-512x512.png`)

### Step 4: Closed Testing (MANDATORY for new accounts)

Google requires **20 testers for 14 continuous days** before you can publish to production.

1. Go to **Testing → Closed testing → Create track**
2. Name it "Beta testers"
3. Upload your .aab file
4. Create a testers list — add 20 email addresses
5. Use a Fiverr service (~$20-50) to get real testers, or recruit from your network
6. **Roll out** the closed test
7. Wait 14 days

### Step 5: Production Release

After the 14-day closed testing period:
1. Go to **Production → Create new release**
2. Upload the same (or updated) .aab
3. Write release notes
4. **Submit for review** — Google review typically takes 1-3 days for new apps

### Important Notes

- **Keep your keystore file safe.** If you lose it, you can never update the app.
- The 14-day closed testing clock starts when you roll out to testers, so do this ASAP.
- The Bundle ID is already set to `co.bountybay.app` in your Capacitor config.

### Timeline

```text
Day 0:  Build AAB, create store listing, start closed testing
Day 14: Closed testing complete, submit for production review
Day 15-17: Google review (1-3 days)
Day 17+: Live on Google Play
```


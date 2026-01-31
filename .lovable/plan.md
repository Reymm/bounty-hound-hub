
# Plan: Fix Favicon - Replace Corrupted File with Actual BB Logo

## Root Cause Found

I discovered why the favicon shows the homepage: **The `public/favicon.png` file has been replaced with a screenshot of the homepage instead of the actual BB logo.**

When I opened `public/favicon.png` to inspect it, it literally shows screenshots of the BountyBay homepage - that's what Safari is displaying because that's literally what the favicon.png file contains now.

The actual BB logo is stored externally at:
`https://storage.googleapis.com/gpt-engineer-file-uploads/.../favicon better BB.png`

## Solution

### Step 1: Download and Replace the Favicon

I need to fetch the correct BB logo from the Google Cloud Storage URL referenced in your OG meta tags and replace the corrupted `public/favicon.png` file:

```text
1. Fetch: https://storage.googleapis.com/gpt-engineer-file-uploads/V7ghVgsFwWSBH4eOg4aoiLyUlGi1/uploads/1761531821540-favicon%20better%20BB.png

2. Save as: public/favicon.png (replacing the corrupted screenshot file)
```

### Step 2: Update Cache Buster Version

Increment the version number to v=6 in both files to force all browsers to re-fetch:

| File | Change |
|------|--------|
| `index.html` | Update `?v=5` → `?v=6` on all favicon links |
| `src/pages/Index.tsx` | Update `?v=5` → `?v=6` on Helmet favicon links |

## Why This Happened

At some point, an operation likely overwrote the `public/favicon.png` file with incorrect content. This explains why:
- Other pages show the BB logo (they might be using cached correct version)
- Homepage shows the screenshot (loading the corrupted file fresh)

## After Implementation

1. The favicon.png file will be the actual BB logo
2. Cache buster v=6 will force all browsers to re-download
3. Clear your browser cache after publishing to verify

## Files to Modify

| File | Action |
|------|--------|
| `public/favicon.png` | **Replace with actual BB logo from external URL** |
| `index.html` | Update version to v=6 |
| `src/pages/Index.tsx` | Update version to v=6 |

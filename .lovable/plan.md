
# Plan: Fix Lovable Heart Icon Appearing as Favicon

## Problem Analysis

After thorough investigation, I've identified the root cause. The Lovable heart icon is appearing because:

1. **The Cloudflare Worker's OG HTML template has NO favicon link** - When crawlers or certain conditions trigger the worker's HTML response (lines 111-150 in `.lovable/cloudflare-worker.js`), the generated HTML doesn't include `<link rel="icon">` tags. Browsers may then fall back to a default or cached icon.

2. **The `*.lovable.app` subdomains may serve default Lovable branding** - The Lovable platform infrastructure likely serves a default favicon for any requests to `bountybay.lovable.app` before your app's `index.html` is even processed. This is a platform-level behavior that your code can't fully override for the preview/published URLs on `*.lovable.app`.

3. **iOS Safari aggressively caches favicons** - Even when fixed, old icons persist in the tab switcher until browser history is cleared.

## Solution

### Step 1: Add Favicon to Cloudflare Worker OG HTML

Update `.lovable/cloudflare-worker.js` to include proper favicon links in the `ogHtml()` function. This ensures that even crawler responses include the correct favicon.

```text
Update ogHtml function to add after line 124:

  <link rel="icon" type="image/png" href="https://bountybay.co/favicon.png">
  <link rel="apple-touch-icon" href="https://bountybay.co/favicon.png">
```

### Step 2: Use Absolute URLs for Favicon in index.html

Change the relative favicon paths to absolute URLs pointing to your custom domain. This helps ensure the correct icon is served regardless of which subdomain is being accessed:

```text
index.html changes (lines 27-28):

Before:
  <link rel="icon" type="image/png" href="/favicon.png?v=3">
  <link rel="apple-touch-icon" href="/favicon.png?v=3">

After:
  <link rel="icon" type="image/png" href="https://bountybay.co/favicon.png?v=4">
  <link rel="apple-touch-icon" href="https://bountybay.co/favicon.png?v=4">
```

### Step 3: Add Additional Favicon Formats for Better Browser Support

Add more comprehensive favicon declarations to ensure maximum browser compatibility:

```text
Add to index.html after the existing favicon lines:

  <link rel="shortcut icon" href="https://bountybay.co/favicon.png?v=4">
  <link rel="icon" type="image/png" sizes="32x32" href="https://bountybay.co/favicon.png?v=4">
  <link rel="icon" type="image/png" sizes="16x16" href="https://bountybay.co/favicon.png?v=4">
```

## Important Note: `*.lovable.app` Domain Limitation

**For the `bountybay.lovable.app` and preview subdomains**, the Lovable platform may inject default branding at the infrastructure level that you cannot override through code. The only guaranteed way to have full control over all branding elements is to use your custom domain (`bountybay.co`) which bypasses Lovable's default infrastructure handling.

**On your custom domain `bountybay.co`**, these changes will ensure the correct favicon appears everywhere.

## Files to Modify

| File | Change |
|------|--------|
| `.lovable/cloudflare-worker.js` | Add favicon links to `ogHtml()` function |
| `index.html` | Use absolute URLs for favicons + add additional formats |

## After Implementation

1. Publish the changes
2. Test on `bountybay.co` (your custom domain) - should show BB logo
3. Clear Safari history on your device to remove cached old icons
4. Note: `*.lovable.app` subdomains may still show the Lovable heart due to platform-level behavior - this is expected when using the Lovable-hosted URLs


# Improve Social Sharing Previews

## Summary

Update the social media preview metadata to show the bounty amount prominently and indicate the bounty type (Lead Only vs Find & Ship). Also remove LinkedIn from the share options since it's not relevant.

---

## Changes Overview

### 1. Edge Function: `bounty-meta/index.ts`

**New Title Format:**
```
Help me find: $150 Bounty — Nixon Hoodie From 2012 | BountyBay
```

- Keeps "Help me find:" (emotional hook you like)
- Adds dollar amount right after (the money hook)
- Truncates title to ~45 chars if too long
- Ends with brand

**New Description Format:**
```
Lead Only bounty. Grey Nixon hoodie from 2012, size Large...
```

- Starts with bounty type (Lead Only / Find & Ship)
- Follows with truncated description (~85 chars)
- Prevents mobile text walls

**Database Query Update:**
- Add `requires_shipping` to the SELECT query to determine bounty type

### 2. Share Button: `ShareBountyButton.tsx`

**Remove:**
- LinkedIn option (lines 47, 120-125)

**Keep:**
- Native Share (mobile)
- Facebook  
- Twitter / X
- Reddit
- Pinterest (ISO community)
- Copy Link

---

## Technical Details

### File: `supabase/functions/bounty-meta/index.ts`

```text
Line 30-37: Add requires_shipping to SELECT query
Line 53-55: New title/description logic
```

**Title logic:**
```javascript
const truncatedTitle = bounty.title.length > 45 
  ? bounty.title.slice(0, 42) + '...' 
  : bounty.title;

const title = `Help me find: $${bounty.amount.toLocaleString()} Bounty — ${truncatedTitle} | BountyBay`;
```

**Description logic:**
```javascript
const bountyType = bounty.requires_shipping ? 'Find & Ship' : 'Lead Only';
const rawDesc = bounty.description || '';
const shortDesc = rawDesc.slice(0, 80);
const description = `${bountyType} bounty. ${shortDesc}${rawDesc.length > 80 ? '...' : ''}`;
```

### File: `src/components/bounty/ShareBountyButton.tsx`

```text
Line 47: Remove linkedin from shareLinks object
Lines 120-125: Remove LinkedIn menu item
```

---

## Expected Results

**Before (current):**
```
Help me find: Looking for a Lead on a Nixon Hoodie From Around 2012 (Grey, Size Large) — Lead Only | BountyBay

I had this Nixon hoodie around 2012. It was a pullover hoodie, grey, size Large, with a clean Nixon logo on the chest and branding down...
```

**After:**
```
Help me find: $5 Bounty — Nixon Hoodie From Around 2012 | BountyBay

Lead Only bounty. I had this Nixon hoodie around 2012. It was a pullover hoodie, grey...
```

---

## Testing

After deployment, test with these links (replace BOUNTY_ID with a real ID):

| Tool | URL |
|------|-----|
| Facebook Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | https://cards-dev.twitter.com/validator |
| Direct Preview | https://auth.bountybay.co/functions/v1/bounty-meta?id=36b513a7-1e23-4e1b-a900-a612a6ccf4fc |

Test bounty IDs from your database:
- `36b513a7-1e23-4e1b-a900-a612a6ccf4fc` (Nixon Hoodie - $5)
- `2e5d1265-b41b-4653-a2ec-0d27eeeb0322` (Laser Gun - $10)

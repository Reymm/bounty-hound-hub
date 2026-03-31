
Direct answers

1. The verification indicator is not on your current page anymore.
- You are on `/me/profile`.
- `src/pages/Profile.tsx` does not render any verification badge, status row, or “verified” marker at all.
- So on your own profile page: it is currently missing.

2. Where it is now
Right now verification is spread across other places instead of being visible on your main profile:
- `src/pages/Verification.tsx` — the dedicated “Hunter Verification” page
- `src/components/bounty/ClaimDialog.tsx` — shows “Step 1: Verify Identity”, “Step 2: Set Up Payouts”, and “Ready to claim!”
- `src/components/layout/TopNav.tsx` — mobile menu only has a Verification row with a green check if both steps are complete
- `src/pages/PublicProfile.tsx` — public profiles can still show a “Verified” badge

3. When it was changed
I cannot prove the exact date from the current code snapshot alone.
What I can say clearly:
- the recent claim-counter fix did not remove this
- that last change only touched `src/lib/api/supabase.ts`
- it did not edit `src/pages/Profile.tsx`, `src/pages/Verification.tsx`, `src/components/layout/TopNav.tsx`, or `src/pages/PublicProfile.tsx`
So the missing badge on your profile predates the last claim-counter work.

4. Why this happened
From the current code, this looks like a refactor/regression, not a good UX choice.
What appears to have happened:
- verification got moved into a dedicated `/verification` flow
- claim gating was added inside `ClaimDialog`
- a mobile-only shortcut was added in the nav
- but your own profile page was not kept in sync
That is why it now feels like the status “disappeared.”

5. Why it has felt slow
The recent slow work was spent tracing a real data-flow bug in the claims count, because the UI was getting the wrong count from the API layer.
But on your actual complaint here, your frustration makes sense:
- the app should have an obvious verification status surface
- it currently does not on desktop `/me/profile`
- so even if backend status is correct, the UX is bad and confusing

6. How a user knows if they are verified now
Current answer:
- Best place: `/verification`
  - Step 1 = identity
  - Step 2 = payouts
  - if both are done, it shows the green “You’re All Set!” state
- In the claim modal:
  - it shows `✓ Identity verified`
  - `✓ Payouts ready`
  - `Ready to claim!`
- On mobile:
  - the menu has a Verification row with a green `✓`
- On desktop `/me/profile`:
  - they do not get a clear visible verification indicator right now
That is the core problem.

Important technical issue I found
There is also inconsistent verification logic in the data mapping:
- `src/lib/api/supabase.ts:966-967`
- `src/lib/api/supabase.ts:1023-1024`

Right now `idvStatus` is being set from `stripe_connect_onboarding_complete`, not from the dedicated `identity_verified` field.
So even the public “Verified” badge logic is muddy/inconsistent.

What I would fix next
1. Restore a visible verification status card/badge on `/me/profile`
- show Identity Verified / Pending
- show Payouts Ready / Pending
- add a button to `/verification`

2. Add a desktop-accessible verification link/status in the account menu
- not just mobile

3. Clean up the status model so the app uses one meaning consistently
- identity badge should come from `identity_verified`
- payout readiness should come from `stripe_connect_payouts_enabled`
- “claim ready” should mean both are complete

4. Keep `/verification` as the detailed setup page
- but not the only place users can see their status

Technical details
- Missing on own profile: `src/pages/Profile.tsx`
- Dedicated status page: `src/pages/Verification.tsx`
- Mobile-only indicator: `src/components/layout/TopNav.tsx:536-559`
- Claim gating/status: `src/components/bounty/ClaimDialog.tsx:461-595`
- Public badge still exists: `src/pages/PublicProfile.tsx:136-140`
- Inconsistent mapping source: `src/lib/api/supabase.ts:966-967` and `1023-1024`

Bottom line
- yes, the verification indicator is effectively gone from your own profile page
- no, the recent claim-counter fix did not cause that
- yes, the current verification UX is fragmented and confusing
- right now the only reliable user-facing place to check is `/verification`
- the clean fix is to put verification status back on your profile/settings surfaces and make the badge logic consistent everywhere

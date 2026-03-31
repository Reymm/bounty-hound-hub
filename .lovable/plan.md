

## Plan: Add Mandatory "Verified Link" Verification Requirement

### What
Auto-include a **"Verified link to listing or source"** requirement on every bounty, so it's always present and cannot be removed. Users can still add up to 9 more custom requirements on top of it.

### Why
Every recent bounty already includes a link-based verification requirement. Making it mandatory ensures consistency and strengthens proof quality across all bounties.

### Changes

**1. `src/pages/PostBounty.tsx`**
- Initialize `verificationRequirements` state with `["Verified link to listing or source"]` instead of `[]`
- Update `removeVerificationRequirement` to prevent removing this mandatory item (skip if it matches the mandatory string)
- Update the badge rendering to visually distinguish the mandatory requirement (e.g., no X button, or a lock icon)
- Adjust the max count logic: still 10 total, but the mandatory one is always slot 1
- Update the draft restore logic to ensure the mandatory requirement is always present even in restored drafts

**2. `src/pages/EditBounty.tsx`**
- When loading existing bounty requirements, ensure the mandatory requirement is present (inject it if missing from older bounties)
- Prevent removal of the mandatory requirement in the edit UI

**3. `src/lib/validators.ts`**
- Add a `.refine()` to `verificationRequirements` in `postBountySchema` that checks the array includes the mandatory link requirement

### Technical Details
- Mandatory requirement constant: `MANDATORY_VERIFICATION = "Verified link to listing or source"`
- Defined once in `src/lib/constants.ts` and imported wherever needed
- The mandatory badge will render without an X/remove button and with a subtle lock or shield icon to indicate it's required
- Existing bounties missing this requirement won't be retroactively updated in the DB, but the edit page will inject it client-side if absent


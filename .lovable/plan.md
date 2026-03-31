

## Plan: Remove Two Bounties

### What
Cancel/remove two bounties from the platform:
1. "1999 Light Grey Rattle Elephant Plush" — found on another site
2. "Axe Relapse Body Spray (Limited Edition 2004)"

### How
- Update both bounties' `status` to `cancelled` in the database
- Check for any associated escrow transactions and update those too

### Technical Details
- Use Supabase data update (not migration) to set `status = 'cancelled'` on both bounty IDs
- Also check/cancel any escrow_transactions tied to these bounties


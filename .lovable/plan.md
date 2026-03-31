

## Plan: Promo Code System — "HELPFIND15"

You want to let people post bounties for free using a promo code you give them. The code covers the $15 bounty from your saved card. 20 uses max.

### How it works

1. You message someone, tell them about BountyBay, offer to cover their first $15 bounty
2. They go to Post Bounty, fill in details, enter code `HELPFIND15` instead of their card
3. The bounty gets created using your pre-saved Stripe payment method
4. When a claim is accepted, your card gets charged — not theirs

### Database changes (1 migration)

**New table: `promo_codes`**
- `id` (uuid, PK)
- `code` (text, unique) — e.g. "HELPFIND15"
- `sponsor_id` (uuid, FK to auth.users) — your user ID
- `stripe_payment_method_id` (text) — your saved card from Stripe
- `stripe_customer_id` (text) — your Stripe customer ID
- `max_amount` (numeric) — max bounty amount per use ($15)
- `max_uses` (integer) — total allowed uses (20)
- `times_used` (integer, default 0)
- `is_active` (boolean, default true)
- `expires_at` (timestamptz, nullable)
- `created_at`, `updated_at`

RLS: select for authenticated (to validate codes), insert/update restricted to service_role.

### Edge function: `validate-promo-code`

- Takes `{ code }`, returns whether it's valid, the max amount, and remaining uses
- No auth required (so potential users can check before signing up)

### Edge function: `confirm-escrow-and-create-bounty` (modify)

- Accept optional `promo_code` field
- If promo code provided and valid:
  - Skip requiring a setup_intent_id from the user
  - Instead, use the sponsor's `stripe_payment_method_id` and `stripe_customer_id` from the promo_codes table
  - Create the escrow record linked to the sponsor's payment method
  - Increment `times_used` on the promo code
  - Cap bounty amount at `max_amount` ($15)

### Edge function: `create-escrow-payment` (modify)

- Accept optional `promo_code`
- If valid promo code: skip creating a SetupIntent entirely, return a flag `promo_sponsored: true` so the UI knows to skip the card form

### UI changes: `src/pages/PostBounty.tsx`

- Add a "Have a promo code?" collapsible input field on the details step (above or below the bounty amount)
- When a valid promo code is entered:
  - Lock the bounty amount to $15 (or whatever `max_amount` is)
  - Show a green badge: "Sponsored — your bounty is covered!"
  - Skip the payment step entirely — go straight from details to processing
  - Call `confirm-escrow-and-create-bounty` with `promo_code` instead of `setup_intent_id`

### Setting up your card

You'll need a one-time admin step to save your Stripe payment method ID and customer ID into the `promo_codes` table. We can either:
- Build a small admin UI for creating promo codes
- Or just insert the record via SQL after you save a card on any bounty (we grab the payment method from your existing escrow records)

### Files changed
- **New migration**: `promo_codes` table
- **New edge function**: `validate-promo-code`
- **Modified edge function**: `create-escrow-payment`
- **Modified edge function**: `confirm-escrow-and-create-bounty`
- **Modified**: `src/pages/PostBounty.tsx` — promo code input + skip-payment flow


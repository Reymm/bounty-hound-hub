

## Plan: Seed HELPFIND15 Promo Code

You don't need to do anything manually. Here's what I'll do:

### The Problem
The `promo_codes` table exists but is empty. It needs your Stripe customer ID and payment method ID to link your card. Your payment method is already saved (`pm_1TH7P6HQ9JaJlRZTQAkXkV4M`), but the Stripe customer ID isn't stored anywhere in the database.

### The Fix (2 steps)

**Step 1: Look up your Stripe customer ID**
- Create a temporary edge function (or modify an existing one) that calls `stripe.customers.list({ email: 'matt@bountybay.co' })` and returns the customer ID
- Call it once to get the ID

**Step 2: Insert the promo code record**
- Run a database migration that inserts the `HELPFIND15` row into `promo_codes` with:
  - `sponsor_id`: `8f050746-36d4-4ac7-99d8-a2419e09cc55` (your user ID)
  - `stripe_payment_method_id`: `pm_1TH7P6HQ9JaJlRZTQAkXkV4M` (your saved card)
  - `stripe_customer_id`: (from step 1)
  - `max_amount`: 15
  - `max_uses`: 20
  - `is_active`: true

### Files changed
- Temporary edge function to look up Stripe customer ID (can delete after)
- New migration to INSERT the promo code row

### Result
After this, anyone who enters `HELPFIND15` on the Post Bounty page will get a free $15 bounty charged to your card.


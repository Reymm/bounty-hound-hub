// Payment threshold: bounties UNDER this amount = card saved only (deferred charge)
// Bounties AT or ABOVE this amount = immediate authorization hold
// 
// IMPORTANT: This value must also be updated in:
// - supabase/functions/create-escrow-payment/index.ts (IMMEDIATE_CHARGE_THRESHOLD)
// 
// Current: $10 for testing, planned production values: $75 or $150
export const FREE_POST_THRESHOLD = 10;

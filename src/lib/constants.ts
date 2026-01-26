// Payment threshold: bounties UNDER this amount = card saved only (deferred charge)
// Bounties AT or ABOVE this amount = immediate authorization hold
// 
// IMPORTANT: This value must also be updated in:
// - supabase/functions/create-escrow-payment/index.ts (IMMEDIATE_CHARGE_THRESHOLD)
// 
// Production value: $75 (currently $5 for testing)
export const FREE_POST_THRESHOLD = 5;

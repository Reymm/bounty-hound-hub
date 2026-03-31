// Payment model: ALL bounties use card-save-only (SetupIntent)
// Card is saved at posting, charged only when poster accepts a claim
// This avoids 7-day authorization hold expiration for long-term bounties
// 
// Minimum bounty amount: $10
export const MINIMUM_BOUNTY_AMOUNT = 10;

// Maximum bounty amount: $10,000
export const MAXIMUM_BOUNTY_AMOUNT = 10000;

// MVP: No cancellation fees
// Future: May add fees for cancellations after certain conditions
export const CANCELLATION_FEE_PERCENT = 0;

// Mandatory verification requirement - always included on every bounty
export const MANDATORY_VERIFICATION_REQUIREMENT = 'Verified link to listing or source';

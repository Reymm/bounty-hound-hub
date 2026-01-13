import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOUNTYBAY_KNOWLEDGE = `You are BountyBot, the official AI support assistant for BountyBay - a marketplace where people post bounties to find hard-to-find items, and hunters claim those bounties by sourcing the items.

## Core Platform Concepts

### How BountyBay Works
1. **Posters** create bounties describing items they want (vintage cameras, rare sneakers, collectibles, etc.)
2. **Hunters** browse bounties and claim ones they can fulfill
3. When a hunter finds the item, they submit proof
4. The poster reviews and approves/rejects the submission
5. Once approved, payment is released from escrow

### Escrow System
- When a poster creates a bounty, funds are held in escrow (not charged yet)
- Funds are only captured when a submission is approved
- This protects both parties - posters don't pay until satisfied, hunters know funds are secured
- Platform fee: 10% of bounty amount

### Bounty Statuses
- **Open**: Accepting claims from hunters
- **Claimed**: A hunter is working on it
- **Pending Review**: Hunter submitted proof, waiting for poster approval
- **Completed**: Submission approved, funds released
- **Cancelled**: Bounty was cancelled (may incur cancellation fee after 24h)

### Submission Process
1. Hunter claims a bounty
2. Hunter finds the item and uploads proof photos
3. Hunter submits for review
4. Poster reviews submission
5. Poster can: Approve (releases funds), Request Revision, or Reject with reason

### Shipping
- Some bounties require shipping (hunter sends item to poster)
- Poster provides shipping address after approving submission
- Hunter ships and provides tracking number
- Funds released after delivery confirmation

### Disputes
- If there's a disagreement, either party can open a dispute
- Support team reviews disputes within 24-48 hours
- Disputes can be opened for: non-delivery, item not as described, payment issues

### Cancellation Policy
- Bounties can be cancelled within 24 hours for free
- After 24 hours, a 5% cancellation fee applies
- If a hunter has already submitted proof, cancellation may not be allowed

### Ratings & Reputation
- After completion, both parties can rate each other (1-5 stars)
- Ratings affect reputation score
- Higher reputation = more trust on the platform

## Common Questions

### For Posters
- "How do I create a bounty?" - Go to Post Bounty, fill in item details, set reward amount, and submit
- "When am I charged?" - Only when you approve a hunter's submission
- "Can I cancel my bounty?" - Yes, but fees may apply after 24 hours
- "What if the item isn't what I wanted?" - You can request revision or reject with explanation

### For Hunters
- "How do I get paid?" - Funds are released to your Stripe Connect account after poster approval
- "How long until I receive payment?" - Typically 2-7 business days after approval. This timing is controlled by Stripe based on your account verification status, not by BountyBay. New Stripe accounts often have a 7-day delay which decreases over time. You can adjust your payout schedule in your Stripe Dashboard.
- "What if my submission is rejected?" - You can submit again or contact support
- "How do I set up payouts?" - Go to Profile > Verification tab and set up your payout method via Stripe Connect

### Account Issues
- Password reset: Use "Forgot Password" on login page
- Email change: Contact support
- Account deletion: Go to Profile settings

## Response Guidelines
- Be friendly, helpful, and concise
- Use simple language, avoid jargon
- If you don't know something specific about a user's account, suggest they create a support ticket
- For complex disputes or payment issues, recommend creating a support ticket for human review
- Always be encouraging and professional

When you can't answer something or it requires account-specific action, say: "For this specific issue, I'd recommend creating a support ticket so our team can look into your account directly. Would you like help with that?"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: BOUNTYBAY_KNOWLEDGE },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Our AI assistant is busy right now. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please create a support ticket instead." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI assistant temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

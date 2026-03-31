

## Plan: Add Original Post + Testimonial to Dandy Tickle Bounty Detail Page

For bounty ID `c0b22a93-65b6-4ba8-82d9-6817a66b2f60`, add two hardcoded sections right after the Description card (line 581) in `src/pages/BountyDetail.tsx`:

### 1. "Original Post" Card
- Shown only for this bounty ID
- Displays the original Facebook post text as a blockquote
- Below it, a "View original Facebook post" link to `https://www.facebook.com/share/p/1GQHWjZXke/` (opens new tab)

### 2. "Poster's Feedback" Card
- A testimonial-style card with a quote icon and success accent
- Summarized version of the follow-up story:
  > *"Over 20 years ago, Rachel and I found a toy at Woolworths that sang Happy Birthday — she named it 'Clowny.' Rachel is non-verbal and severely disabled, but she absolutely loves birthdays and Christmas. She plays with her toys constantly and they wear out. Since Woolworths closed, replacements became impossible to find. She's going to be absolutely thrilled to have a new Clowny!"*

### File changed
- `src/pages/BountyDetail.tsx` — insert after the Description `</Card>` (line 581), gated by `bounty.id === 'c0b22a93-...'`


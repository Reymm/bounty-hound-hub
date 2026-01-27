

# Fix Social Media Previews - Deploy the Edge Function

## The Problem
The `bounty-meta` edge function code exists in Lovable but is **NOT deployed** to your Supabase project. When Facebook tries to fetch `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta?id=...`, it gets a 404 error.

## Solution Options

### Option A: Recover Supabase Access (Recommended)
1. Go to https://supabase.com/dashboard and click "Forgot Password"
2. Use your email to reset password
3. Once logged in, go to **Functions** section
4. Deploy the `bounty-meta` function

### Option B: Use Supabase CLI (If you have it installed)
Run this command from your project directory:
```bash
supabase functions deploy bounty-meta --project-ref lenyuvobgktgdearflim
```

### Option C: Alternative - Use Lovable's Domain for Previews
Since Lovable CAN deploy to its own infrastructure, we could:
1. Create a special route at `bountybay.lovable.app/share/[id]` 
2. This page serves OG meta tags and redirects to the main site
3. Share links would use the Lovable URL for social platforms

This would work immediately without needing Supabase access.

## What Was Working Before
The same exact approach - Supabase Edge Function serving OG tags. The function just needs to be deployed again.

## Recommended Next Step
**Try Supabase password reset first** - it's the quickest path since the code is already correct. If that fails, I can implement Option C immediately.


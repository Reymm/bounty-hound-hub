import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const moderationSchema = z.object({
  title: z.string()
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  tags: z.array(z.string().max(50, 'Each tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([])
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validation = moderationSchema.safeParse(rawBody);
    
    if (!validation.success) {
      console.log('Validation failed:', validation.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.issues.map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title = '', description = '', tags = [] } = validation.data;

    // Combine all text content for moderation
    const contentToModerate = [
      title,
      description,
      ...tags
    ].filter(Boolean).join(' ');

    console.log('Moderating content:', contentToModerate.substring(0, 100) + '...');

    // Use Lovable AI Gateway with Claude for content moderation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation system for a marketplace where people post bounties to find items. Analyze the content and determine if it violates these policies:

BLOCK ONLY if content contains:
- Direct promotion of violence, weapons, or illegal activities
- Sexual content involving minors or explicit sexual services
- Human trafficking or exploitation
- Direct hate speech or targeted harassment
- Illegal drugs or controlled substances

ALLOW normal marketplace content including:
- Collectibles, toys, memorabilia (including toy weapons, prop items)
- Clothing, fabrics, textiles, crafts
- Electronics, cameras, technology
- Books, comics, media
- Everyday items and products
- General references to legal products

Respond ONLY with a JSON object in this exact format:
{"flagged": true/false, "categories": ["category1", "category2"], "reason": "brief explanation"}`
          },
          {
            role: 'user',
            content: contentToModerate
          }
        ],
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error ${response.status}:`, errorText);
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Raw moderation response:', content);
    
    // Parse the JSON response from Claude
    let moderation;
    try {
      moderation = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse moderation response:', parseError);
      throw new Error('Invalid moderation response format');
    }

    console.log('Moderation result:', JSON.stringify(moderation, null, 2));

    const isViolation = moderation.flagged === true;
    const violationDetails = isViolation ? {
      categories: moderation.categories || [],
      reason: moderation.reason || 'Content violates community guidelines'
    } : null;

    return new Response(JSON.stringify({
      allowed: !isViolation,
      flagged: isViolation,
      violation_details: violationDetails,
      message: isViolation 
        ? 'Content violates community guidelines and cannot be posted.'
        : 'Content approved for posting.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    
    // CRITICAL: Block content when moderation fails (fail secure, not fail open)
    return new Response(JSON.stringify({
      allowed: false,
      flagged: true,
      error: 'Moderation service error',
      message: 'Unable to verify content safety. Please try again or contact support if the issue persists.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

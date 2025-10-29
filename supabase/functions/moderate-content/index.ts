import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: contentToModerate,
        model: 'text-moderation-latest'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const moderation = data.results[0];

    console.log('Moderation result:', JSON.stringify(moderation, null, 2));

    // Check if content violates policies
    const isViolation = moderation.flagged;
    const categories = moderation.categories;
    const categoryScores = moderation.category_scores;

    let violationDetails = null;
    if (isViolation) {
      // Find which categories were flagged
      const flaggedCategories = Object.keys(categories).filter(
        category => categories[category]
      );
      
      violationDetails = {
        categories: flaggedCategories,
        scores: categoryScores
      };
    }

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

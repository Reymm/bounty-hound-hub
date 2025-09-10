import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  title: string;
  description: string;
  tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, tags = [] }: ModerationRequest = await req.json();

    // Combine all text content for moderation
    const contentToModerate = [
      title,
      description,
      ...tags
    ].join(' ');

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
      throw new Error(`OpenAI API error: ${response.status}`);
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
    
    // On moderation API error, allow content but log the error
    return new Response(JSON.stringify({
      allowed: true,
      flagged: false,
      error: 'Moderation service temporarily unavailable',
      message: 'Content posted without moderation check due to service issue.'
    }), {
      status: 200, // Don't block posting on API errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
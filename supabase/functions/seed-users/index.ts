import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEED-USERS] ${step}${detailsStr}`);
};

// 67 realistic persona profiles (test4 through test70)
// avatar_id maps to pravatar.cc - gender-matched to name
const PERSONAS = [
  { suffix: 4, username: "mike_collects", avatar_id: 11, bio: "Looking for vintage 80s action figures to complete my collection.", region: "Toronto, ON" },
  { suffix: 5, username: "sarah_vintage", avatar_id: 9, bio: "Searching for rare thrift store finds. Mid-century modern obsessed.", region: "Vancouver, BC" },
  { suffix: 6, username: "jake_needs", avatar_id: 14, bio: "Need help tracking down discontinued tech products.", region: "Austin, TX" },
  { suffix: 7, username: "emma_iso", avatar_id: 5, bio: "Desperately seeking a specific estate sale piece. Help me find it!", region: "New York, NY" },
  { suffix: 8, username: "mama_bear32", avatar_id: 18, bio: "Mom of two looking for comfort items for my kids. If you have what we need, let's talk.", region: "Nashville, TN" },
  { suffix: 9, username: "travelin_kate", avatar_id: 15, bio: "Need PSA graded sports cards. Specific years and players.", region: "Chicago, IL" },
  { suffix: 10, username: "lisalovesretro", avatar_id: 20, bio: "Looking for a specific designer piece from the 2012 runway.", region: "Los Angeles, CA" },
  { suffix: 11, username: "bella_atl", avatar_id: 33, bio: "", region: "Atlanta, GA" },
  { suffix: 12, username: "maria_garcia", avatar_id: 23, bio: "Searching for mid-century modern furniture. Eames, Knoll, Herman Miller.", region: "Miami, FL" },
  { suffix: 13, username: "alex_wants", avatar_id: 35, bio: "Need someone to find a specific vintage board game for me.", region: "Seattle, WA" },
  { suffix: 14, username: "rachelantics", avatar_id: 24, bio: "Looking for 90s vintage clothing. Specific band tees needed.", region: "Portland, OR" },
  { suffix: 15, username: "tom_restore", avatar_id: 37, bio: "Need rare classic car parts. Mustang, Camaro, Chevelle.", region: "Detroit, MI" },
  { suffix: 16, username: "nadia_mtl", avatar_id: 25, bio: "Searching for lost media. Old TV recordings, unreleased music.", region: "Montreal, QC" },
  { suffix: 17, username: "ben_comics", avatar_id: 42, bio: "Looking for key issue comics. Silver age Marvel preferred.", region: "Denver, CO" },
  { suffix: 18, username: "ashley_tx", avatar_id: 26, bio: "Need help finding a family heirloom that was sold at auction.", region: "Dallas, TX" },
  { suffix: 19, username: "carlos_retro", avatar_id: 46, bio: "Searching for retro gaming consoles. CIB Neo Geo, TurboGrafx.", region: "Houston, TX" },
  { suffix: 20, username: "jen_reads", avatar_id: 29, bio: "ISO first edition books. Specific titles from the 1960s.", region: "Boston, MA" },
  { suffix: 21, username: "ryan_watches", avatar_id: 50, bio: "Looking for vintage watches. Omega Speedmaster pre-moon.", region: "Phoenix, AZ" },
  { suffix: 22, username: "kate_sf", avatar_id: 32, bio: "Trying to reconnect with a childhood friend. Last seen in 2005.", region: "San Francisco, CA" },
  { suffix: 23, username: "marcus_kicks", avatar_id: 51, bio: "Need someone to find limited edition sneaker collabs.", region: "Philadelphia, PA" },
  { suffix: 24, username: "olivia_rings", avatar_id: 34, bio: "Searching for a specific vintage engagement ring style.", region: "San Diego, CA" },
  { suffix: 25, username: "daniel_wood", avatar_id: 52, bio: "Looking for antique woodworking tools. Stanley planes, Disston saws.", region: "Minneapolis, MN" },
  { suffix: 26, username: "sophie_cam", avatar_id: 36, bio: "ISO vintage cameras. Leica M3, Hasselblad 500C.", region: "Charlotte, NC" },
  { suffix: 27, username: "jason_builds", avatar_id: 53, bio: "Need rare electronic components for a restoration project.", region: "San Antonio, TX" },
  { suffix: 28, username: "megan_yyc", avatar_id: 38, bio: "Searching for a biological relative. Adoption reunion.", region: "Calgary, AB" },
  { suffix: 29, username: "chris_cars", avatar_id: 54, bio: "Need a specific transmission for a 1969 Camaro rebuild.", region: "Indianapolis, IN" },
  { suffix: 30, username: "amy_90s", avatar_id: 39, bio: "Looking for vintage Polly Pocket compacts. 1989-1995 era.", region: "Columbus, OH" },
  { suffix: 31, username: "brett_time", avatar_id: 55, bio: "ISO a specific Rolex Submariner ref. Willing to pay premium.", region: "Raleigh, NC" },
  { suffix: 32, username: "heather_craft", avatar_id: 40, bio: "Searching for discontinued craft supplies. Specific yarn brands.", region: "Kansas City, MO" },
  { suffix: 33, username: "kevin_games", avatar_id: 56, bio: "Need complete-in-box retro games. N64, SNES, Genesis.", region: "Tampa, FL" },
  { suffix: 34, username: "laura_plants", avatar_id: 41, bio: "Looking for rare houseplants. Variegated monstera, pink princess.", region: "Jacksonville, FL" },
  { suffix: 35, username: "matt_tools", avatar_id: 57, bio: "Searching for vintage power tools in working condition.", region: "Las Vegas, NV" },
  { suffix: 36, username: "nicole_chanel", avatar_id: 43, bio: "Need a specific Chanel bag from the 2008 collection.", region: "Scottsdale, AZ" },
  { suffix: 37, username: "patrick_wwii", avatar_id: 58, bio: "Looking for WWII memorabilia. Letters, medals, uniforms.", region: "Richmond, VA" },
  { suffix: 38, username: "rebecca_quilt", avatar_id: 44, bio: "Searching for vintage quilt patterns from the 1940s.", region: "Salt Lake City, UT" },
  { suffix: 39, username: "steve_lures", avatar_id: 59, bio: "Need pre-war wooden fishing lures. Creek Chub, Heddon.", region: "Milwaukee, WI" },
  { suffix: 40, username: "tiffany_scent", avatar_id: 45, bio: "ISO discontinued perfumes. Tom Ford, Guerlain, vintage Dior.", region: "Savannah, GA" },
  { suffix: 41, username: "vince_moto", avatar_id: 60, bio: "Need rare Harley-Davidson parts for a knucklehead rebuild.", region: "Tucson, AZ" },
  { suffix: 42, username: "wendy_games", avatar_id: 47, bio: "Looking for sealed vintage board games. 70s and 80s era.", region: "Pittsburgh, PA" },
  { suffix: 43, username: "xavier_drip", avatar_id: 61, bio: "ISO rare Supreme and BAPE pieces from 2005-2010.", region: "Brooklyn, NY" },
  { suffix: 44, username: "yasmin_clay", avatar_id: 48, bio: "Searching for a specific studio pottery piece. Signed ceramics.", region: "Charleston, SC" },
  { suffix: 45, username: "zach_con", avatar_id: 62, bio: "Need signed comic con memorabilia from specific events.", region: "San Jose, CA" },
  { suffix: 46, username: "amber_pyrex", avatar_id: 49, bio: "Looking for vintage Pyrex and kitchen collectibles.", region: "St. Louis, MO" },
  { suffix: 47, username: "blake_coins", avatar_id: 63, bio: "Need specific error coins for my collection. US Mint errors.", region: "Sacramento, CA" },
  { suffix: 48, username: "claire_glass", avatar_id: 1, bio: "Searching for depression glass and carnival glass pieces.", region: "Cincinnati, OH" },
  { suffix: 49, username: "dylan_crt", avatar_id: 64, bio: "ISO Sony Trinitron CRT for retro gaming setup.", region: "Orlando, FL" },
  { suffix: 50, username: "erin_stamps", avatar_id: 10, bio: "Looking for rare stamps. Inverted Jenny, Penny Black.", region: "Ottawa, ON" },
  { suffix: 51, username: "frank_planes", avatar_id: 65, bio: "Need vintage Stanley planes. No. 1, No. 2, bedrock series.", region: "Cleveland, OH" },
  { suffix: 52, username: "grace_dolls", avatar_id: 16, bio: "Searching for retired American Girl dolls. Specific outfits needed.", region: "Memphis, TN" },
  { suffix: 53, username: "henry_maps", avatar_id: 66, bio: "Looking for antique maps. Pre-1800 North American cartography.", region: "Boise, ID" },
  { suffix: 54, username: "irene_yarn", avatar_id: 21, bio: "Need discontinued yarn colorways. Madelinetosh, Hedgehog Fibres.", region: "Burlington, VT" },
  { suffix: 55, username: "james_hotrod", avatar_id: 67, bio: "Searching for rare speed parts for a hot rod build.", region: "Albuquerque, NM" },
  { suffix: 56, username: "kayla_thrift", avatar_id: 1, bio: "Looking for undervalued vintage pieces at thrift stores.", region: "Omaha, NE" },
  { suffix: 57, username: "liam_type", avatar_id: 68, bio: "Need a specific Olivetti or Hermes typewriter model.", region: "Asheville, NC" },
  { suffix: 58, username: "mona_neon", avatar_id: 10, bio: "Searching for vintage neon signs and tin advertising.", region: "Louisville, KY" },
  { suffix: 59, username: "noah_knives", avatar_id: 69, bio: "ISO rare pocket knives. Pre-war Case, vintage Buck.", region: "Baltimore, MD" },
  { suffix: 60, username: "opal_fiber", avatar_id: 16, bio: "Looking for a working antique spinning wheel.", region: "Madison, WI" },
  { suffix: 61, username: "peter_trains", avatar_id: 70, bio: "Need specific HO scale model trains. Brass imports.", region: "Knoxville, TN" },
  { suffix: 62, username: "quinn_camp", avatar_id: 22, bio: "Searching for vintage camping gear. 1960s Coleman, canvas tents.", region: "Boulder, CO" },
  { suffix: 63, username: "rosa_stitch", avatar_id: 21, bio: "Looking for vintage cross-stitch patterns. Specific designers.", region: "Spokane, WA" },
  { suffix: 64, username: "sam_bikes", avatar_id: 30, bio: "Need a vintage Schwinn Stingray in original condition.", region: "Providence, RI" },
  { suffix: 65, username: "theresa_cook", avatar_id: 29, bio: "ISO signed first edition cookbooks. Julia Child, James Beard.", region: "New Orleans, LA" },
  { suffix: 66, username: "ulrich_brew", avatar_id: 31, bio: "Looking for rare breweriana. Pre-prohibition beer trays and signs.", region: "Fort Worth, TX" },
  { suffix: 67, username: "valerie_sew", avatar_id: 32, bio: "Need parts for a vintage Singer sewing machine restoration.", region: "Hartford, CT" },
  { suffix: 68, username: "will_fly", avatar_id: 28, bio: "Searching for handmade bamboo fly fishing rods.", region: "Anchorage, AK" },
  { suffix: 69, username: "ximena_vinyl", avatar_id: 34, bio: "Looking for rare Latin music vinyl. Fania Records pressings.", region: "Miami, FL" },
  { suffix: 70, username: "yorick_astro", avatar_id: 27, bio: "Need a vintage telescope. Unitron, Questar, Cave Astrola.", region: "Flagstaff, AZ" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_support_admin')
      .eq('id', userData.user.id)
      .single();
    
    if (!profile?.is_support_admin) {
      throw new Error("Admin access required");
    }
    logStep("Admin verified", { userId: userData.user.id });

    const body = await req.json();
    const { action = 'create_users', password = 'BountyBay2025!' } = body;
    const baseEmail = "kaylaannrey";

    if (action === 'create_users') {
      let created = 0;
      let skipped = 0;
      let errors: string[] = [];

      // Process in batches of 5
      for (let i = 0; i < PERSONAS.length; i += 5) {
        const batch = PERSONAS.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(async (persona) => {
          const email = `${baseEmail}+test${persona.suffix}@gmail.com`;
          
          // Check if user already exists by trying to find their profile by username
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('username', persona.username)
            .maybeSingle();
          
          if (existingProfile) {
            logStep("User already exists, skipping", { username: persona.username });
            return 'skipped';
          }

          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });

          if (authError) {
            // If user exists in auth but not in profiles, skip
            if (authError.message.includes('already been registered')) {
              return 'skipped';
            }
            throw new Error(`Auth error for ${email}: ${authError.message}`);
          }

          if (!authData.user) throw new Error(`No user returned for ${email}`);

          // Update profile with persona data including avatar
          const avatarUrl = `https://i.pravatar.cc/150?img=${persona.avatar_id}`;
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              username: persona.username,
              bio: persona.bio,
              region: persona.region,
              avatar_url: avatarUrl,
              average_rating: 0,
              total_ratings_received: 0,
              reputation_score: 5.0,
            })
            .eq('id', authData.user.id);

          if (profileError) {
            logStep("Profile update error", { username: persona.username, error: profileError });
          }

          logStep("Created user", { email, username: persona.username });
          return 'created';
        }));

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value === 'created') created++;
            else skipped++;
          } else {
            errors.push(result.reason?.message || 'Unknown error');
            logStep("Error in batch", { error: result.reason?.message });
          }
        }
      }

      logStep("Seeding complete", { created, skipped, errors: errors.length });

      return new Response(JSON.stringify({
        success: true,
        created,
        skipped,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        total_personas: PERSONAS.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'update_profiles') {
      // Update existing profiles by matching via email (stable identifier)
      let updated = 0;
      let notFound = 0;
      let errors: string[] = [];

      for (let i = 0; i < PERSONAS.length; i += 5) {
        const batch = PERSONAS.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(async (persona) => {
          const email = `${baseEmail}+test${persona.suffix}@gmail.com`;
          const avatarUrl = `https://i.pravatar.cc/150?img=${persona.avatar_id}`;
          
          // Look up user by email to get their ID
          const { data: users, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) throw new Error(`List error: ${listError.message}`);
          
          const user = users.users.find(u => u.email === email);
          if (!user) return 'not_found';

          const { data, error } = await supabase
            .from('profiles')
            .update({
              username: persona.username,
              bio: persona.bio,
              region: persona.region,
              avatar_url: avatarUrl,
            })
            .eq('id', user.id)
            .select('id')
            .maybeSingle();

          if (error) throw new Error(`Update error for ${persona.username}: ${error.message}`);
          if (!data) return 'not_found';
          
          logStep("Updated profile", { email, username: persona.username });
          return 'updated';
        }));

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value === 'updated') updated++;
            else notFound++;
          } else {
            errors.push(result.reason?.message || 'Unknown error');
          }
        }
      }

      logStep("Profile update complete", { updated, notFound, errors: errors.length });

      return new Response(JSON.stringify({
        success: true,
        updated,
        not_found: notFound,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

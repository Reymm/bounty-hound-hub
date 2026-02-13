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
const PERSONAS = [
  { suffix: 4, username: "mike_collects", full_name: "Mike R.", bio: "Vintage toy collector. Always looking for 80s action figures.", region: "Toronto, ON" },
  { suffix: 5, username: "sarah_vintage", full_name: "Sarah T.", bio: "Thrift store queen. I find rare gems for a living.", region: "Vancouver, BC" },
  { suffix: 6, username: "jakethetracker", full_name: "Jake M.", bio: "Skip tracer by day, bounty hunter by night.", region: "Calgary, AB" },
  { suffix: 7, username: "emma_finds", full_name: "Emma L.", bio: "Estate sale addict. If it exists, I'll find it.", region: "Montreal, QC" },
  { suffix: 8, username: "vinylvince", full_name: "Vince D.", bio: "Record store owner. 20k+ vinyl collection.", region: "Austin, TX" },
  { suffix: 9, username: "collectorcraig", full_name: "Craig P.", bio: "Sports cards and memorabilia. PSA graded or bust.", region: "Chicago, IL" },
  { suffix: 10, username: "lisafinds", full_name: "Lisa W.", bio: "Professional sourcer for rare fashion items.", region: "New York, NY" },
  { suffix: 11, username: "dustin_hunts", full_name: "Dustin K.", bio: "Sneakerhead with connections. Size doesn't matter, I'll find it.", region: "Los Angeles, CA" },
  { suffix: 12, username: "maria_garcia", full_name: "Maria G.", bio: "Antique dealer specializing in mid-century modern.", region: "Miami, FL" },
  { suffix: 13, username: "alexscouts", full_name: "Alex N.", bio: "Garage sale warrior. Every weekend, rain or shine.", region: "Seattle, WA" },
  { suffix: 14, username: "rachelantics", full_name: "Rachel B.", bio: "Vintage clothing reseller. 90s is my era.", region: "Portland, OR" },
  { suffix: 15, username: "tomfindsit", full_name: "Tom H.", bio: "Auto parts hunter. Classic car restoration specialist.", region: "Detroit, MI" },
  { suffix: 16, username: "nadia_seeks", full_name: "Nadia S.", bio: "Lost media researcher. If the internet forgot it, I remember.", region: "Ottawa, ON" },
  { suffix: 17, username: "benthedigger", full_name: "Ben C.", bio: "Comic book collector since 1992. CGC submissions weekly.", region: "Denver, CO" },
  { suffix: 18, username: "ashley_hunts", full_name: "Ashley R.", bio: "Professional organizer who finds lost treasures in the process.", region: "Nashville, TN" },
  { suffix: 19, username: "carlostracker", full_name: "Carlos V.", bio: "Tech gear hunter. Retro gaming specialist.", region: "Houston, TX" },
  { suffix: 20, username: "jen_discovers", full_name: "Jen M.", bio: "Book scout. First editions are my weakness.", region: "Boston, MA" },
  { suffix: 21, username: "ryanhunter", full_name: "Ryan O.", bio: "Pawn shop regular. One man's trash is another's treasure.", region: "Phoenix, AZ" },
  { suffix: 22, username: "katelocates", full_name: "Kate F.", bio: "Genealogy researcher. Reuniting families since 2018.", region: "San Francisco, CA" },
  { suffix: 23, username: "marcusmoves", full_name: "Marcus J.", bio: "Sneaker reseller turned bounty hunter. If the shoe fits...", region: "Atlanta, GA" },
  { suffix: 24, username: "olivia_finds", full_name: "Olivia P.", bio: "Jewelry appraiser. I know diamonds from glass.", region: "Dallas, TX" },
  { suffix: 25, username: "danielscouter", full_name: "Daniel L.", bio: "Flea market legend. 15 years of weekend hunting.", region: "Philadelphia, PA" },
  { suffix: 26, username: "sophieseeks", full_name: "Sophie A.", bio: "Vintage camera collector. Leica, Hasselblad, Rolleiflex.", region: "Minneapolis, MN" },
  { suffix: 27, username: "jasondigger", full_name: "Jason T.", bio: "Electronics repair tech. I find parts nobody else can.", region: "San Diego, CA" },
  { suffix: 28, username: "megan_tracks", full_name: "Megan D.", bio: "Adoption search specialist. Helping families reconnect.", region: "Edmonton, AB" },
  { suffix: 29, username: "chrislocator", full_name: "Chris W.", bio: "Auto salvage yard operator. If it's a car part, I have it.", region: "Indianapolis, IN" },
  { suffix: 30, username: "amyexplorer", full_name: "Amy K.", bio: "Toy collector. Polly Pocket, Barbie, Hot Wheels.", region: "Columbus, OH" },
  { suffix: 31, username: "brettfinds", full_name: "Brett S.", bio: "Watch enthusiast. Omega, Seiko, Rolex hunter.", region: "Charlotte, NC" },
  { suffix: 32, username: "heather_digs", full_name: "Heather N.", bio: "Craft supplies hoarder turned sourcer.", region: "Winnipeg, MB" },
  { suffix: 33, username: "kevinseeker", full_name: "Kevin R.", bio: "Video game collector. CIB or nothing.", region: "San Antonio, TX" },
  { suffix: 34, username: "laurahunts", full_name: "Laura C.", bio: "Plant collector. Rare houseplants are my obsession.", region: "Raleigh, NC" },
  { suffix: 35, username: "mattscouts", full_name: "Matt B.", bio: "Power tool junkie. DeWalt, Milwaukee, Makita.", region: "Kansas City, MO" },
  { suffix: 36, username: "nicole_finds", full_name: "Nicole E.", bio: "Handbag authenticator and reseller.", region: "Las Vegas, NV" },
  { suffix: 37, username: "patrickdigger", full_name: "Patrick G.", bio: "Military memorabilia collector. History buff.", region: "Jacksonville, FL" },
  { suffix: 38, username: "rebeccaseeks", full_name: "Rebecca H.", bio: "Quilter seeking vintage fabrics and patterns.", region: "Salt Lake City, UT" },
  { suffix: 39, username: "stevetracker", full_name: "Steve I.", bio: "Fishing lure collector. Pre-war wooden lures.", region: "Milwaukee, WI" },
  { suffix: 40, username: "tiffanyfinds", full_name: "Tiffany J.", bio: "Perfume collector. Discontinued fragrances are my thing.", region: "Tampa, FL" },
  { suffix: 41, username: "vincelocates", full_name: "Vince L.", bio: "Motorcycle parts specialist. Harley, Indian, Triumph.", region: "Tucson, AZ" },
  { suffix: 42, username: "wendy_hunts", full_name: "Wendy M.", bio: "Board game collector. Sealed vintage games.", region: "Richmond, VA" },
  { suffix: 43, username: "xavierscouts", full_name: "Xavier N.", bio: "Streetwear collector. Supreme, BAPE, Palace.", region: "Brooklyn, NY" },
  { suffix: 44, username: "yasminfinds", full_name: "Yasmin O.", bio: "Ceramic art collector. Studio pottery enthusiast.", region: "Savannah, GA" },
  { suffix: 45, username: "zachtracker", full_name: "Zach P.", bio: "Comic con regular. Signed memorabilia hunter.", region: "San Jose, CA" },
  { suffix: 46, username: "amberseeks", full_name: "Amber Q.", bio: "Vintage kitchen gadget collector.", region: "Pittsburgh, PA" },
  { suffix: 47, username: "blakedigger", full_name: "Blake R.", bio: "Coin collector. Error coins are my specialty.", region: "St. Louis, MO" },
  { suffix: 48, username: "clairelocates", full_name: "Claire S.", bio: "Antique glass collector. Depression glass, carnival glass.", region: "Cincinnati, OH" },
  { suffix: 49, username: "dylanscouts", full_name: "Dylan T.", bio: "Retro gaming setup builder. CRT TVs and all.", region: "Orlando, FL" },
  { suffix: 50, username: "erinfinds", full_name: "Erin U.", bio: "Stamp collector. Rare postmarks and covers.", region: "Halifax, NS" },
  { suffix: 51, username: "franktracker", full_name: "Frank V.", bio: "Tool collector. Stanley planes and vintage hand tools.", region: "Cleveland, OH" },
  { suffix: 52, username: "gracehunts", full_name: "Grace W.", bio: "Doll collector. American Girl, Madame Alexander.", region: "Memphis, TN" },
  { suffix: 53, username: "henrydigger", full_name: "Henry X.", bio: "Map and atlas collector. Antique cartography.", region: "Boise, ID" },
  { suffix: 54, username: "ireneseeks", full_name: "Irene Y.", bio: "Yarn hoarder. Discontinued colorways needed.", region: "Burlington, VT" },
  { suffix: 55, username: "jameslocates", full_name: "James Z.", bio: "Hot rod builder. Looking for rare speed parts.", region: "Albuquerque, NM" },
  { suffix: 56, username: "kaylascouts", full_name: "Kayla A.", bio: "Thrift flipper. I see value where others don't.", region: "Regina, SK" },
  { suffix: 57, username: "liamfinds", full_name: "Liam B.", bio: "Typewriter collector and restorer.", region: "Asheville, NC" },
  { suffix: 58, username: "monatracker", full_name: "Mona C.", bio: "Vintage advertising collector. Tin signs, neon.", region: "Omaha, NE" },
  { suffix: 59, username: "noahdigger", full_name: "Noah D.", bio: "Pocket knife collector. Case, Buck, Benchmade.", region: "Louisville, KY" },
  { suffix: 60, username: "opalhunts", full_name: "Opal E.", bio: "Fiber arts enthusiast. Spinning wheels and looms.", region: "Madison, WI" },
  { suffix: 61, username: "peterlocates", full_name: "Peter F.", bio: "Model train collector. HO and N scale.", region: "Baltimore, MD" },
  { suffix: 62, username: "quinnseeks", full_name: "Quinn G.", bio: "Outdoor gear hunter. Vintage camping equipment.", region: "Boulder, CO" },
  { suffix: 63, username: "rosascouts", full_name: "Rosa H.", bio: "Cross-stitch pattern collector. Vintage designs.", region: "Saskatoon, SK" },
  { suffix: 64, username: "samfinds", full_name: "Sam I.", bio: "Bicycle collector. Vintage Schwinn, Raleigh.", region: "Providence, RI" },
  { suffix: 65, username: "theresatracks", full_name: "Theresa J.", bio: "Cookbook collector. First editions, signed copies.", region: "New Orleans, LA" },
  { suffix: 66, username: "ulrichdigger", full_name: "Ulrich K.", bio: "Beer memorabilia collector. Breweriana hunter.", region: "Fort Worth, TX" },
  { suffix: 67, username: "valerieseeks", full_name: "Valerie L.", bio: "Vintage sewing machine collector and restorer.", region: "Hartford, CT" },
  { suffix: 68, username: "willhunts", full_name: "Will M.", bio: "Fishing rod collector. Bamboo fly rods.", region: "Anchorage, AK" },
  { suffix: 69, username: "ximenascouts", full_name: "Ximena N.", bio: "Latin music vinyl collector. Rare salsa records.", region: "Miami, FL" },
  { suffix: 70, username: "yorickfinds", full_name: "Yorick O.", bio: "Telescope collector. Vintage optics enthusiast.", region: "Flagstaff, AZ" },
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
            user_metadata: { full_name: persona.full_name }
          });

          if (authError) {
            // If user exists in auth but not in profiles, skip
            if (authError.message.includes('already been registered')) {
              return 'skipped';
            }
            throw new Error(`Auth error for ${email}: ${authError.message}`);
          }

          if (!authData.user) throw new Error(`No user returned for ${email}`);

          // Update profile with persona data
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              username: persona.username,
              full_name: persona.full_name,
              bio: persona.bio,
              region: persona.region,
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

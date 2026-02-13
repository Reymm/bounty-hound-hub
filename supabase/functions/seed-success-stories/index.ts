import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEED-STORIES] ${step}${detailsStr}`);
};

// Handwritten success stories. No AI garbage. Real people talking.
const SUCCESS_STORIES = [
  {
    title: "Need a 1987 Topps Barry Bonds rookie card",
    description: "My dad had one when I was a kid and it got lost when we moved in 2003. Doesn't need to be gem mint, just no major creases. Been checking card shops for years with no luck.",
    category: "Collectibles",
    subcategory: "Sports Cards",
    amount: 85,
    tags: ["baseball", "rookie card", "topps", "vintage"],
    poster_idx: 0, // mike_collects
    hunter_idx: 8, // collectorcraig (PSA graded expert)
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Craig found the card in like 4 days. Near mint condition too. Way better than what I expected.",
    review_hunter: "Mike was super clear about what he wanted. Easy transaction, paid right away.",
    days_ago: 22,
  },
  {
    title: "Looking for Jordan 4 Military Black size 11",
    description: "Tried every footlocker and online drop for months. Always sells out in my size. Not paying $400 on stockx for a $200 shoe. Someone help me out.",
    category: "Fashion",
    subcategory: "Sneakers",
    amount: 65,
    tags: ["jordan", "nike", "sneakers", "size 11"],
    poster_idx: 10, // dustin_hunts
    hunter_idx: 22, // marcusmoves
    rating_poster: 5,
    rating_hunter: 4,
    review_poster: "Got the shoes, legit pair, good condition. Marcus came through.",
    review_hunter: "Dustin was cool. Shipped fast once I found them.",
    days_ago: 18,
  },
  {
    title: "Vintage Polaroid SX-70 that actually works",
    description: "Had one growing up and the photos were incredible. Want one that fires and ejects properly. Cosmetic wear is fine. Tested and working is all that matters.",
    category: "Collectibles",
    subcategory: "Cameras",
    amount: 120,
    tags: ["polaroid", "vintage camera", "instant film", "sx-70"],
    poster_idx: 25, // sophieseeks
    hunter_idx: 12, // alexscouts
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Alex found a beautiful one at an estate sale. Works perfectly. Took some test shots before shipping too which was a nice touch.",
    review_hunter: "Sophie knew exactly what she wanted which made it easy. Great bounty poster.",
    days_ago: 30,
  },
  {
    title: "First edition Harry Potter and the Philosopher's Stone",
    description: "UK edition specifically. Bloomsbury publisher. Doesn't need to be a first print run (those are like 30k lol) but first edition hardcover would be amazing. Budget is flexible for the right copy.",
    category: "Collectibles",
    subcategory: "Books",
    amount: 200,
    tags: ["harry potter", "first edition", "books", "bloomsbury"],
    poster_idx: 19, // jen_discovers
    hunter_idx: 4, // sarah_vintage
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Sarah found a 2nd print Bloomsbury hardcover in great shape. Dust jacket and everything. Couldn't be happier.",
    review_hunter: "Jen was patient while I searched. The book community came through on this one. Love this platform.",
    days_ago: 45,
  },
  {
    title: "Lost touch with my college roommate from 2009",
    description: "His name is Dave Chen, we were at UBC together 2007 to 2011. Engineering program. Lost his number when my old phone died and he's not on any social media I can find. Just want to reconnect, we were tight.",
    category: "Reconnections",
    subcategory: "Lost Friends",
    amount: 75,
    tags: ["lost friend", "college", "reconnection"],
    poster_idx: 21, // katelocates
    hunter_idx: 15, // nadia_seeks
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Nadia tracked him down through the UBC alumni network. We've been texting nonstop since. This was worth every penny.",
    review_hunter: "These reconnection bounties are my favorite. The look on people's faces when they reconnect is priceless.",
    days_ago: 35,
  },
  {
    title: "Parts for 1969 Camaro SS restoration",
    description: "Specifically need the cowl induction hood scoop and the original style rally wheels (15x7). Repo parts are fine but OEM would be ideal. Located in Detroit so local pickup works.",
    category: "Automotive",
    subcategory: "Classic Cars",
    amount: 150,
    tags: ["camaro", "1969", "restoration", "car parts"],
    poster_idx: 14, // tomfindsit
    hunter_idx: 28, // chrislocator
    rating_poster: 4,
    rating_hunter: 5,
    review_poster: "Chris found the wheels at a swap meet. Hood scoop was repo but decent quality. Got me 80% of the way there.",
    review_hunter: "Tom knows his stuff. Very specific about what he needed which made sourcing easier.",
    days_ago: 15,
  },
  {
    title: "Sealed copy of Chrono Trigger SNES",
    description: "Yeah I know this is a unicorn but someone out there has one sitting in a closet. CIB at minimum, sealed would be the dream. Budget goes up for better condition obviously.",
    category: "Collectibles",
    subcategory: "Video Games",
    amount: 250,
    tags: ["snes", "chrono trigger", "retro gaming", "sealed"],
    poster_idx: 18, // carlostracker
    hunter_idx: 32, // kevinseeker
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Kevin found a CIB copy with the map and everything. Not sealed but honestly better than I expected. Manual looks unread.",
    review_hunter: "Took me a while but found it through a local game store that had been sitting on it. Carlos was pumped.",
    days_ago: 40,
  },
  {
    title: "Discontinued Jo Malone fragrance",
    description: "Looking for White Jasmine and Mint cologne. They discontinued it a few years back and my wife has been sad about it ever since. Even a partial bottle would make her day.",
    category: "Other",
    subcategory: "Fragrances",
    amount: 90,
    tags: ["perfume", "jo malone", "discontinued", "fragrance"],
    poster_idx: 20, // ryanhunter
    hunter_idx: 39, // tiffanyfinds
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Tiffany found a nearly full bottle. My wife literally cried. Best money I ever spent.",
    review_hunter: "Found it at an estate sale of all places. Love making people happy like this.",
    days_ago: 12,
  },
  {
    title: "Rare pressing of Miles Davis Kind of Blue",
    description: "Looking for the original Columbia 6 eye mono pressing. CS 8163. Vinyl can have some wear but no skips. Jacket should be intact. This is for my personal collection not resale.",
    category: "Collectibles",
    subcategory: "Vinyl Records",
    amount: 175,
    tags: ["vinyl", "miles davis", "jazz", "rare pressing"],
    poster_idx: 7, // vinylvince
    hunter_idx: 24, // danielscouter
    rating_poster: 4,
    rating_hunter: 5,
    review_poster: "Daniel found a VG+ copy. Small ring wear on the jacket but the vinyl plays beautifully. Fair price too.",
    review_hunter: "Vince is a real collector, he knew the exact pressing details. Found it at a record fair in Philly.",
    days_ago: 28,
  },
  {
    title: "Vintage Omega Seamaster from the 1960s",
    description: "Looking for a ref 166.010 or similar. Automatic movement. Don't need box or papers. Running condition preferred but I can get it serviced if the price is right. Silver dial ideally.",
    category: "Collectibles",
    subcategory: "Watches",
    amount: 200,
    tags: ["omega", "seamaster", "vintage watch", "1960s"],
    poster_idx: 30, // brettfinds
    hunter_idx: 9, // lisafinds
    rating_poster: 5,
    rating_hunter: 4,
    review_poster: "Lisa sourced a 166.010 with a gorgeous silver dial. Runs about 30 seconds fast per day but that's normal for the age. Really happy with this.",
    review_hunter: "Brett knew what he was after. Good communication throughout the search.",
    days_ago: 50,
  },
  {
    title: "Matching set of vintage Pyrex Butterprint bowls",
    description: "Need the turquoise on white set. All 4 sizes (401, 402, 403, 404). No chips or cracks. Minor wear on the pattern is ok. My grandma had these and I want the same set for my kitchen.",
    category: "Collectibles",
    subcategory: "Vintage",
    amount: 110,
    tags: ["pyrex", "butterprint", "vintage kitchen", "retro"],
    poster_idx: 45, // amberseeks
    hunter_idx: 6, // emma_finds
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Emma found the whole set at different thrift stores over 2 weeks. No chips, patterns look great. She even wrapped them individually for shipping. 10/10.",
    review_hunter: "Amber was so sweet about this. The grandma connection made me want to find the perfect set. Glad I could deliver.",
    days_ago: 20,
  },
  {
    title: "1st gen Pokemon cards from base set",
    description: "Looking for a Charizard, Blastoise, and Venusaur from the original base set. Shadowless preferred but unlimited is fine. Played condition is ok, just no water damage or bends.",
    category: "Collectibles",
    subcategory: "Trading Cards",
    amount: 180,
    tags: ["pokemon", "base set", "charizard", "trading cards"],
    poster_idx: 48, // dylanscouts
    hunter_idx: 12, // alexscouts
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Alex came through with all 3 cards. Unlimited base set but in surprisingly good shape. Charizard has a tiny whitening on the back but who cares. Stoked.",
    review_hunter: "Found them at a garage sale where some kid was selling his old collection. The nostalgia on this one was real.",
    days_ago: 8,
  },
  {
    title: "Help finding my birth mother",
    description: "Adopted in 1992 in Ontario. Have some details from my non identifying info. She was 22 at the time of my birth. Born at a hospital in Hamilton. I just want to reach out and say thank you. No pressure on her to respond.",
    category: "Reconnections",
    subcategory: "Family",
    amount: 150,
    tags: ["adoption", "birth parent", "family", "ontario"],
    poster_idx: 27, // megan_tracks
    hunter_idx: 21, // katelocates
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Kate helped me find her. We've exchanged letters. I can't even put into words what this means to me. Thank you BountyBay for making this possible.",
    review_hunter: "This was the most meaningful search I've ever done. Megan deserved this connection. Glad the platform exists for moments like these.",
    days_ago: 60,
  },
  {
    title: "Vintage Coach purse from the 90s",
    description: "The Willis bag in British Tan. Serial number should start with F or something. My mom carried this bag everywhere and it fell apart. Want to surprise her with the same one for her birthday.",
    category: "Fashion",
    subcategory: "Handbags",
    amount: 95,
    tags: ["coach", "vintage purse", "willis bag", "leather"],
    poster_idx: 35, // nicole_finds
    hunter_idx: 13, // rachelantics
    rating_poster: 5,
    rating_hunter: 5,
    review_poster: "Rachel found one in amazing condition. The leather has that perfect aged look. Mom's going to lose it on her birthday. Thank you!!",
    review_hunter: "Nicole gave me great details about what to look for. Found it at a consignment shop in Portland. Love these sentimental bounties.",
    days_ago: 14,
  },
  {
    title: "Vintage Fender Deluxe Reverb amp 1965",
    description: "Blackface era specifically. Doesn't need to be all original, just needs to sound right. Replaced caps and tubes are fine. Working tremolo and reverb is a must. Can pick up within 500 miles of Chicago.",
    category: "Collectibles",
    subcategory: "Musical Instruments",
    amount: 225,
    tags: ["fender", "guitar amp", "vintage", "blackface"],
    poster_idx: 7, // vinylvince
    hunter_idx: 14, // tomfindsit
    rating_poster: 4,
    rating_hunter: 5,
    review_poster: "Tom found a 65 with replaced filter caps but original transformers. Sounds incredible. Reverb is dreamy. Only ding is the tolex has some wear but thats expected for 60 years old.",
    review_hunter: "Found this one through a music teacher who was downsizing. Vince drove 3 hours to pick it up. Respect.",
    days_ago: 38,
  },
];

// Avatar URLs using pravatar for realistic-looking photos
// These are consistent per seed so the same username always gets the same photo
const getAvatarUrl = (username: string, idx: number) => {
  // Use a mix of male and female photos based on the persona data
  return `https://i.pravatar.cc/300?u=${username}`;
};

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
    const { action = 'create_stories' } = body;

    if (action === 'assign_avatars') {
      // Fetch all seeded users (those with bios, excluding admin accounts)
      const { data: seededUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .not('bio', 'is', null)
        .not('username', 'in', '("BountyBay","Frank")');

      if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
      
      let updated = 0;
      for (const user of (seededUsers || [])) {
        if (!user.username) continue;
        const avatarUrl = getAvatarUrl(user.username, updated);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);
        
        if (!updateError) updated++;
        else logStep("Avatar update error", { username: user.username, error: updateError });
      }

      logStep("Avatars assigned", { updated });
      return new Response(JSON.stringify({ success: true, updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'create_stories') {
      // Fetch seeded users to get their IDs
      const { data: seededUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .not('bio', 'is', null)
        .not('username', 'in', '("BountyBay","Frank")');

      if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
      if (!seededUsers || seededUsers.length < 30) {
        throw new Error(`Not enough seeded users found (${seededUsers?.length || 0}). Run seed-users first.`);
      }

      logStep("Found seeded users", { count: seededUsers.length });

      // Build a username to ID map
      const userMap: Record<string, string> = {};
      for (const u of seededUsers) {
        if (u.username) userMap[u.username] = u.id;
      }

      // We need to map persona indices to usernames
      const PERSONA_USERNAMES = [
        "mike_collects", "sarah_vintage", "jakethetracker", "emma_finds",
        "vinylvince", "collectorcraig", "lisafinds", "dustin_hunts",
        "maria_garcia", "alexscouts", "rachelantics", "tomfindsit",
        "nadia_seeks", "benthedigger", "ashley_hunts", "carlostracker",
        "jen_discovers", "ryanhunter", "katelocates", "marcusmoves",
        "olivia_finds", "danielscouter", "sophieseeks", "jasondigger",
        "megan_tracks", "chrislocator", "amyexplorer", "brettfinds",
        "heather_digs", "kevinseeker", "laurahunts", "mattscouts",
        "nicole_finds", "patrickdigger", "rebeccaseeks", "stevetracker",
        "tiffanyfinds", "vincelocates", "wendy_hunts", "xavierscouts",
        "yasminfinds", "zachtracker", "amberseeks", "blakedigger",
        "clairelocates", "dylanscouts", "erinfinds", "franktracker",
        "gracehunts", "henrydigger", "ireneseeks", "jameslocates",
        "kaylascouts", "liamfinds", "monatracker", "noahdigger",
        "opalhunts", "peterlocates", "quinnseeks", "rosascouts",
        "samfinds", "theresatracks", "ulrichdigger", "valerieseeks",
        "willhunts", "ximenascouts", "yorickfinds",
      ];

      let created = 0;
      let errors: string[] = [];

      for (const story of SUCCESS_STORIES) {
        try {
          const posterUsername = PERSONA_USERNAMES[story.poster_idx];
          const hunterUsername = PERSONA_USERNAMES[story.hunter_idx];
          const posterId = userMap[posterUsername];
          const hunterId = userMap[hunterUsername];

          if (!posterId || !hunterId) {
            errors.push(`Missing user: poster=${posterUsername}(${posterId}) hunter=${hunterUsername}(${hunterId})`);
            continue;
          }

          const now = new Date();
          const createdAt = new Date(now.getTime() - story.days_ago * 24 * 60 * 60 * 1000);
          const fulfilledAt = new Date(createdAt.getTime() + (3 + Math.random() * 10) * 24 * 60 * 60 * 1000);

          // Create the bounty
          const { data: bounty, error: bountyError } = await supabase
            .from('Bounties')
            .insert({
              title: story.title,
              description: story.description,
              category: story.category,
              subcategory: story.subcategory,
              amount: story.amount,
              tags: story.tags,
              poster_id: posterId,
              status: 'fulfilled',
              escrow_status: 'released',
              escrow_amount: story.amount,
              created_at: createdAt.toISOString(),
              updated_at: fulfilledAt.toISOString(),
              view_count: 20 + Math.floor(Math.random() * 200),
            })
            .select('id')
            .single();

          if (bountyError) {
            errors.push(`Bounty error (${story.title}): ${bountyError.message}`);
            continue;
          }

          // Create the submission
          const submittedAt = new Date(createdAt.getTime() + (1 + Math.random() * 3) * 24 * 60 * 60 * 1000);
          const acceptedAt = new Date(submittedAt.getTime() + (1 + Math.random() * 4) * 24 * 60 * 60 * 1000);

          const { error: subError } = await supabase
            .from('Submissions')
            .insert({
              bounty_id: bounty.id,
              hunter_id: hunterId,
              message: "Found what you're looking for. Check the details.",
              status: 'accepted',
              accepted_at: acceptedAt.toISOString(),
              created_at: submittedAt.toISOString(),
              updated_at: acceptedAt.toISOString(),
            });

          if (subError) {
            errors.push(`Submission error (${story.title}): ${subError.message}`);
            continue;
          }

          // Create ratings (poster rates hunter, hunter rates poster)
          const ratingTime = new Date(acceptedAt.getTime() + (1 + Math.random() * 3) * 24 * 60 * 60 * 1000);

          // Poster rates hunter
          await supabase.from('user_ratings').insert({
            bounty_id: bounty.id,
            rater_id: posterId,
            rated_user_id: hunterId,
            rating: story.rating_poster,
            rating_type: 'poster_to_hunter',
            review_text: story.review_poster,
            created_at: ratingTime.toISOString(),
          });

          // Hunter rates poster
          await supabase.from('user_ratings').insert({
            bounty_id: bounty.id,
            rater_id: hunterId,
            rated_user_id: posterId,
            rating: story.rating_hunter,
            rating_type: 'hunter_to_poster',
            review_text: story.review_hunter,
            created_at: ratingTime.toISOString(),
          });

          // Recalculate ratings for both users
          await supabase.rpc('recalculate_user_rating', { user_id_param: hunterId });
          await supabase.rpc('recalculate_user_rating', { user_id_param: posterId });

          created++;
          logStep("Created story", { title: story.title, poster: posterUsername, hunter: hunterUsername });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Story error (${story.title}): ${msg}`);
        }
      }

      logStep("Seeding complete", { created, errors: errors.length });

      return new Response(JSON.stringify({
        success: true,
        created,
        total: SUCCESS_STORIES.length,
        errors: errors.length > 0 ? errors : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

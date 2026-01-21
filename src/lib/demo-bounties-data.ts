// Demo bounties data for seeding the platform with realistic content
// These are used to showcase BountyBay's capabilities to early communities

export interface DemoBounty {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  amount: number;
  location: string;
  tags: string[];
  images: string[];
  verification_requirements: string[];
  poster_display_name: string;
  days_ago: number; // How many days ago this was "posted"
  view_count: number;
  deadline_days: number; // Days from now until deadline
}

// All images use external Unsplash URLs for reliability in database storage
const BLANKET_IMAGE = 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80'; // child's comfort blanket
const FAMILY_IMAGE = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80'; // family silhouette
const WATCH_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'; // vintage watch
const BOOK_IMAGE = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'; // old books
const TOY_IMAGE = 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80'; // vintage toys

// Car-specific images for each classic car bounty
const MUSTANG_IMAGE = 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=80'; // classic Mustang fastback
const BEL_AIR_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'; // 50s Chevy Bel Air
const CHARGER_IMAGE = 'https://images.unsplash.com/photo-1630047243831-9c79d8eca939?w=800&q=80'; // black muscle car Charger style
const CUDA_IMAGE = 'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=800&q=80'; // Plymouth Barracuda style
const PORSCHE_IMAGE = 'https://images.unsplash.com/photo-1611651338412-8403fa6e3599?w=800&q=80'; // classic 911
const DATSUN_IMAGE = 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80'; // vintage Datsun Z
const TECH_IMAGE = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'; // retro tech

// New category-specific images (replacing local imports)
const POKEMON_IMAGE = 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&q=80';
const COMICS_IMAGE = 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80';
const VINYL_IMAGE = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80';
const CAMERA_IMAGE = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';
const SNEAKERS_IMAGE = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80';
const HANDBAG_IMAGE = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80';

// Hero bounty - the emotional centerpiece
export const HERO_BOUNTY: DemoBounty = {
  title: "Please Help Me Find My Son's Blanket - He Passed Away and It's All I Have Left",
  description: "My son Oliver passed away 3 years ago at age 6. His favorite comfort blanket - a blue and white striped blanket with satin edges and a small embroidered elephant in the corner - went missing during the chaos of the hospital stay. I've searched eBay, Facebook Marketplace, Etsy, and every thrift store within 100 miles for 3 years. The brand was 'Little Miracles' from Target, sold around 2016-2017. It had a specific pattern I can describe in detail. I just want to hold what he held. Money is no object - I will pay anything to find this exact blanket or the closest match. Please help me.",
  category: "misc",
  subcategory: "household-items",
  amount: 500,
  location: "Portland, OR",
  tags: ["comfort-blanket", "memorial", "little-miracles", "target", "2016", "child-memory", "satin-edge", "elephant"],
  images: [BLANKET_IMAGE],
  verification_requirements: ["Photo of blanket with brand tag visible", "Close-up of elephant embroidery pattern"],
  poster_display_name: "GrievingMomSarah",
  days_ago: 1,
  view_count: 247,
  deadline_days: 90
};

// Reconnections bounties
export const RECONNECTION_BOUNTIES: DemoBounty[] = [
  {
    title: "Help Find My Birth Father - Denver Area, Born 1988",
    description: "I was adopted at birth in Denver in 1988. My birth mother passed away before I could meet her, but I know my biological father was a musician who played at local venues in the late 80s. His first name was Michael and he played guitar. My 23andMe shows strong Colorado roots. I have some photos from that era my adoptive parents saved. Any leads would mean the world to me.",
    category: "reconnections",
    subcategory: "family",
    amount: 200,
    location: "Denver, CO",
    tags: ["adoption-search", "denver", "dna-match", "1988", "birth-father", "musician"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["Verified connection to the person", "Contact information"],
    poster_display_name: "AdopteeSearching",
    days_ago: 3,
    view_count: 89,
    deadline_days: 60
  },
  {
    title: "Looking for Childhood Best Friend from Camp Lakewood 1998",
    description: "Jenny Martinez and I were inseparable at Camp Lakewood in Wisconsin during summers of 1996-1998. We lost touch when her family moved suddenly. She had curly brown hair, loved horses, and we made friendship bracelets together. I still have mine. Would love to reconnect and see how life turned out for her.",
    category: "reconnections",
    subcategory: "friends",
    amount: 75,
    location: "Milwaukee, WI",
    tags: ["camp-friends", "90s-kids", "summer-camp", "lost-contact", "wisconsin", "childhood-friend"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["Proof of camp attendance", "Shared memory verification"],
    poster_display_name: "NostalgicNancy",
    days_ago: 7,
    view_count: 42,
    deadline_days: 45
  },
  {
    title: "Birth Mother Search - Adopted from Chicago Hospital 1990",
    description: "I was adopted from Northwestern Memorial Hospital in Chicago in August 1990. I'm now 34 and would love to know my medical history and potentially connect with my biological mother. I have my original birth certificate with limited information. She was 19 at the time. This is about finding answers, not judgment.",
    category: "reconnections",
    subcategory: "family",
    amount: 175,
    location: "Chicago, IL",
    tags: ["birth-mother", "chicago", "closed-adoption", "medical-history", "1990", "northwestern"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["DNA match confirmation", "Hospital records reference"],
    poster_display_name: "HopefulDaughter22",
    days_ago: 5,
    view_count: 67,
    deadline_days: 90
  },
  {
    title: "Find My College Roommate - Last Seen NYC 2015",
    description: "Marcus Johnson was my roommate at NYU from 2011-2015. We were best friends but lost touch after graduation when I moved abroad. He was studying film and wanted to become a documentary filmmaker. Last I heard he was working in Brooklyn. Miss our late-night conversations about movies.",
    category: "reconnections",
    subcategory: "friends",
    amount: 50,
    location: "New York, NY",
    tags: ["college-friends", "nyc", "reconnect", "2015", "nyu", "filmmaker"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["Confirmed identity", "Current contact info"],
    poster_display_name: "MissMyRoomie",
    days_ago: 10,
    view_count: 31,
    deadline_days: 30
  },
  {
    title: "Grandmother's Family in County Cork, Ireland",
    description: "My grandmother Mary O'Sullivan emigrated from County Cork in 1952. She passed in 2019 and always regretted losing touch with her siblings who stayed in Ireland. Looking for any descendants of the O'Sullivan family from the Bantry area. I have old family photos and letters I'd love to share with relatives.",
    category: "reconnections",
    subcategory: "family",
    amount: 150,
    location: "Boston, MA",
    tags: ["irish-ancestry", "genealogy", "cork-ireland", "family-tree", "osullivan", "bantry"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["Family tree documentation", "Shared family photos"],
    poster_display_name: "IrishRootsSeeker",
    days_ago: 8,
    view_count: 53,
    deadline_days: 60
  },
  {
    title: "Reconnect with Army Buddy - 2nd Infantry 2008-2012",
    description: "Looking for Sergeant James 'Jimmy' Williams who served with me in the 2nd Infantry Division, deployed to Iraq 2009-2010. We were close during deployment but I moved around a lot after getting out. He was from Texas originally. Want to catch up and make sure he's doing okay.",
    category: "reconnections",
    subcategory: "colleagues",
    amount: 100,
    location: "San Antonio, TX",
    tags: ["military", "veteran", "army-buddy", "deployment", "2nd-infantry", "iraq"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["Military service verification", "Shared deployment memory"],
    poster_display_name: "VeteranVince",
    days_ago: 6,
    view_count: 78,
    deadline_days: 45
  },
  {
    title: "Finding Biological Siblings After 23andMe Discovery",
    description: "Recently discovered through 23andMe that I have at least 2 half-siblings I never knew about. My biological father apparently had other children. I'm not looking to disrupt anyone's life, just hoping to connect with family I never knew existed. DNA shows strong matches in the Georgia/Florida area.",
    category: "reconnections",
    subcategory: "family",
    amount: 200,
    location: "Atlanta, GA",
    tags: ["dna-surprise", "half-siblings", "genetic-testing", "family", "23andme", "georgia"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["DNA match confirmation", "Willingness to connect"],
    poster_display_name: "DNASurprise2023",
    days_ago: 4,
    view_count: 92,
    deadline_days: 90
  },
  {
    title: "Find Teacher Who Inspired Me - Mr. Henderson, Lincoln High School",
    description: "Mr. David Henderson taught English at Lincoln High School in Minneapolis from 1995-2005. He believed in me when no one else did and pushed me to go to college. I'm now a published author and want to thank him properly. He'd be in his 60s now. Hoping he's still out there.",
    category: "reconnections",
    subcategory: "colleagues",
    amount: 60,
    location: "Minneapolis, MN",
    tags: ["teacher", "mentor", "high-school", "thank-you", "lincoln-high", "english-teacher"],
    images: [FAMILY_IMAGE],
    verification_requirements: ["Confirmed identity", "Contact information"],
    poster_display_name: "GratefulGrad",
    days_ago: 12,
    view_count: 28,
    deadline_days: 60
  }
];

// Classic cars bounties
export const CLASSIC_CAR_BOUNTIES: DemoBounty[] = [
  {
    title: "1967 Ford Mustang Fastback GT - VIN: 7T01C xxxxx",
    description: "Looking for this exact car my grandfather owned. Sold in 1985 from our family farm in Oklahoma. Highland Green, 390 V8, factory 4-speed. Has a small dent on the passenger door he never fixed. Would pay top dollar just to see it again or know it survived. VIN started with 7T01C - I have the full number.",
    category: "vehicles",
    subcategory: "classic-cars",
    amount: 250,
    location: "Oklahoma City, OK",
    tags: ["mustang", "fastback", "1967", "numbers-matching", "highland-green", "390-v8"],
    images: [MUSTANG_IMAGE],
    verification_requirements: ["Photo of VIN plate", "Current photos of the car"],
    poster_display_name: "MustangMike67",
    days_ago: 5,
    view_count: 134,
    deadline_days: 90
  },
  {
    title: "Searching for Dad's 1957 Chevy Bel Air - Was Turquoise",
    description: "My father sold his turquoise and white 1957 Bel Air in 1978 to pay for my college. It was his pride and joy and he never stopped talking about it. He passed last year and I want to find it as a tribute. California plates back then, sold in the San Fernando Valley area.",
    category: "vehicles",
    subcategory: "classic-cars",
    amount: 200,
    location: "Los Angeles, CA",
    tags: ["bel-air", "1957", "tribute-build", "family-car", "turquoise", "california"],
    images: [BEL_AIR_IMAGE],
    verification_requirements: ["Documentation of ownership history", "Current photos"],
    poster_display_name: "ChevyChaser",
    days_ago: 9,
    view_count: 87,
    deadline_days: 60
  },
  {
    title: "1969 Dodge Charger R/T 440 - Matching Numbers",
    description: "Searching for a clean, numbers-matching 1969 Charger R/T with the 440 Magnum. Prefer B5 Blue or F8 Green. Must be a real R/T, not a clone. Looking for a driver-quality car, doesn't need to be show-ready. Will travel anywhere in the continental US to inspect.",
    category: "vehicles",
    subcategory: "classic-cars",
    amount: 225,
    location: "Phoenix, AZ",
    tags: ["charger", "mopar", "1969", "r/t-440", "numbers-matching", "b5-blue"],
    images: [CHARGER_IMAGE],
    verification_requirements: ["Fender tag photo", "VIN and engine number photos"],
    poster_display_name: "MoparOrNoCar",
    days_ago: 6,
    view_count: 156,
    deadline_days: 75
  },
  {
    title: "Find 1970 Plymouth 'Cuda - VIN: BH23N0G...",
    description: "Looking for a 1970 Plymouth Barracuda, preferably a 'Cuda with the 340 or bigger. E-body market is crazy but I'm patient. Would consider a project car if the body is solid. Bonus if it's a 4-speed car. Have been searching for 3 years. Partial VIN in title from a car I'm tracking.",
    category: "vehicles",
    subcategory: "classic-cars",
    amount: 250,
    location: "Nashville, TN",
    tags: ["cuda", "plymouth", "e-body", "1970", "340-six-pack", "barracuda"],
    images: [CUDA_IMAGE],
    verification_requirements: ["VIN verification", "Photos of body condition"],
    poster_display_name: "CudaCollector",
    days_ago: 11,
    view_count: 98,
    deadline_days: 90
  },
  {
    title: "Clean 1965 Porsche 911 in Pacific Northwest",
    description: "Searching for an early 911 (1965-1967) in the Pacific Northwest. Prefer matching numbers but will consider outlaw builds with period-correct modifications. Looking for a driver I can enjoy on mountain roads, not a garage queen. Budget is flexible for the right car.",
    category: "vehicles",
    subcategory: "classic-cars",
    amount: 175,
    location: "Seattle, WA",
    tags: ["porsche-911", "1965", "classic-porsche", "pnw", "air-cooled", "early-911"],
    images: [PORSCHE_IMAGE],
    verification_requirements: ["Certificate of authenticity or Kardex", "Maintenance records"],
    poster_display_name: "AirCooledAdam",
    days_ago: 8,
    view_count: 112,
    deadline_days: 60
  },
  {
    title: "1973 Datsun 240Z Series 1 - Any Condition",
    description: "Looking for a 1973 Datsun 240Z. Will consider any condition from running driver to rust-free shell. Prefer original colors but not required. These are getting hard to find unmolested. Have garage space ready for a project. Located in SoCal but can travel.",
    category: "vehicles",
    subcategory: "classic-cars",
    amount: 125,
    location: "San Diego, CA",
    tags: ["datsun-240z", "z-car", "1973", "project-car", "jdm-classic", "nissan"],
    images: [DATSUN_IMAGE],
    verification_requirements: ["VIN photo", "Photos showing rust/condition"],
    poster_display_name: "ZCarZack",
    days_ago: 14,
    view_count: 64,
    deadline_days: 45
  }
];

// Collectibles bounties
export const COLLECTIBLE_BOUNTIES: DemoBounty[] = [
  {
    title: "1st Edition Base Set Charizard - PSA 9 or Higher",
    description: "Looking for a PSA 9 or PSA 10 1st Edition Base Set Charizard. Shadowless preferred but will consider shadowed 1st edition. Must have current PSA certification - no raw cards. Serious buyer with funds ready. Been collecting since '99 and this is my grail card.",
    category: "collectibles",
    subcategory: "trading-cards",
    amount: 200,
    location: "Austin, TX",
    tags: ["pokemon", "charizard", "psa-graded", "wotc", "1st-edition", "base-set"],
    images: [POKEMON_IMAGE],
    verification_requirements: ["PSA certification number", "Photos of front and back in holder"],
    poster_display_name: "PokeCollector99",
    days_ago: 2,
    view_count: 178,
    deadline_days: 45
  },
  {
    title: "Original 1966 Batman #181 - 1st Poison Ivy Appearance",
    description: "Searching for Batman #181 from 1966, the first appearance of Poison Ivy. Looking for CGC 4.0 or higher. One of the hottest Silver Age keys right now. Pin-up page must be intact. Will also consider raw copies in nice condition for the right price.",
    category: "collectibles",
    subcategory: "comics",
    amount: 150,
    location: "Los Angeles, CA",
    tags: ["dc-comics", "batman", "silver-age", "key-issue", "poison-ivy", "cgc"],
    images: [COMICS_IMAGE],
    verification_requirements: ["CGC certification or clear photos of condition", "Pin-up page photo"],
    poster_display_name: "ComicVaultDC",
    days_ago: 4,
    view_count: 89,
    deadline_days: 60
  },
  {
    title: "Beatles White Album UK 1st Press - Low Number",
    description: "Searching for a UK first pressing of The Beatles White Album with a low serial number (under 10000). Must be in VG+ or better condition with original inserts and poster. The lower the number, the more I'll pay. Top loader preferred. Have been hunting for 5 years.",
    category: "collectibles",
    subcategory: "vinyl-records",
    amount: 125,
    location: "Nashville, TN",
    tags: ["beatles", "white-album", "uk-pressing", "vinyl", "first-press", "numbered"],
    images: [VINYL_IMAGE],
    verification_requirements: ["Photo of serial number", "Photos of all inserts and vinyl condition"],
    poster_display_name: "VinylVince",
    days_ago: 7,
    view_count: 56,
    deadline_days: 60
  },
  {
    title: "Leica M3 Double Stroke - Chrome Body Only",
    description: "Looking for a Leica M3 double stroke in chrome. Body only is fine, don't need a lens. Must be in excellent mechanical condition with working meter (if equipped). Minor brassing acceptable. Serial number in the 700xxx-900xxx range preferred. For actual use, not display.",
    category: "collectibles",
    subcategory: "vintage-cameras",
    amount: 100,
    location: "San Francisco, CA",
    tags: ["leica", "m3", "rangefinder", "german-optics", "double-stroke", "film-camera"],
    images: [CAMERA_IMAGE],
    verification_requirements: ["Serial number photo", "Shutter speed test photos"],
    poster_display_name: "FilmShooterPro",
    days_ago: 6,
    view_count: 72,
    deadline_days: 45
  },
  {
    title: "Nike Air Jordan 1 Chicago 1985 OG - Size 10",
    description: "Searching for original 1985 Air Jordan 1 Chicago colorway in size 10. Don't need DS - worn is fine if they're not beat. Looking for originals only, no retros. These are for my personal collection. Will pay premium for OG box. Can authenticate locally.",
    category: "collectibles",
    subcategory: "sneakers",
    amount: 175,
    location: "Chicago, IL",
    tags: ["jordan-1", "chicago", "1985-og", "size-10", "nike", "original"],
    images: [SNEAKERS_IMAGE],
    verification_requirements: ["Photos of size tag", "Sole and upper condition photos"],
    poster_display_name: "SneakerheadSteve",
    days_ago: 3,
    view_count: 143,
    deadline_days: 30
  },
  {
    title: "Hermès Birkin 25 in Barenia Leather",
    description: "Looking for an authentic Hermès Birkin 25 in Barenia leather. Any hardware color considered (gold or palladium). Must come with original box, dustbag, and receipt or authentication. Condition should be excellent or better. Can meet in person for authentication.",
    category: "collectibles",
    subcategory: "luxury-goods",
    amount: 250,
    location: "New York, NY",
    tags: ["hermes", "birkin", "barenia", "authentic", "luxury", "designer-bag"],
    images: [HANDBAG_IMAGE],
    verification_requirements: ["Receipt or authentication certificate", "Date stamp photos"],
    poster_display_name: "LuxuryLinda",
    days_ago: 5,
    view_count: 98,
    deadline_days: 60
  },
  {
    title: "Vintage Star Wars Boba Fett Rocket-Firing Prototype",
    description: "Holy grail search: Looking for ANY information on surviving Kenner Boba Fett rocket-firing prototypes or early production samples. Will pay this bounty just for a verified lead. Obviously will pay much more for an actual piece. Serious collector with references available.",
    category: "collectibles",
    subcategory: "toys-games",
    amount: 150,
    location: "Columbus, OH",
    tags: ["star-wars", "boba-fett", "kenner", "prototype", "vintage-toys", "rocket-firing"],
    images: [TOY_IMAGE],
    verification_requirements: ["Provenance documentation", "Expert authentication"],
    poster_display_name: "GalaxyFarAway",
    days_ago: 10,
    view_count: 67,
    deadline_days: 90
  },
  {
    title: "NES Console CIB with Original Styrofoam",
    description: "Searching for a complete-in-box original NES (not top loader) with the original styrofoam inserts. Box should be in good condition - some wear acceptable but no major damage. Must include all original paperwork and RF switch. For my retro gaming room display.",
    category: "collectibles",
    subcategory: "toys-games",
    amount: 75,
    location: "Portland, OR",
    tags: ["nintendo", "nes", "complete-in-box", "retro-gaming", "1985", "cib"],
    images: [TECH_IMAGE],
    verification_requirements: ["Photos of box condition all sides", "Contents verification"],
    poster_display_name: "RetroGamer88",
    days_ago: 9,
    view_count: 45,
    deadline_days: 45
  },
  {
    title: "1952 Topps Mickey Mantle #311 - PSA 3 or Better",
    description: "Looking for a 1952 Topps Mickey Mantle #311. PSA 3 or better preferred, but will consider lower grades if the eye appeal is good. No trimmed or altered cards. This is for my father's 80th birthday - he's been a Yankees fan his whole life. Budget is flexible.",
    category: "collectibles",
    subcategory: "trading-cards",
    amount: 225,
    location: "New York, NY",
    tags: ["baseball-cards", "mickey-mantle", "topps", "vintage-sports", "1952", "yankees"],
    images: [POKEMON_IMAGE],
    verification_requirements: ["PSA certification number", "High-res scans of front and back"],
    poster_display_name: "CardCollectorNY",
    days_ago: 4,
    view_count: 132,
    deadline_days: 30
  },
  {
    title: "Omega Speedmaster Pre-Moon - Caliber 321 Movement",
    description: "Searching for a pre-1969 Omega Speedmaster Professional with the caliber 321 movement. References 105.003, 105.012, or 145.012 preferred. Originality is key - looking for correct dial, hands, and bezel. Service history appreciated. For a serious collector.",
    category: "collectibles",
    subcategory: "watches",
    amount: 200,
    location: "Miami, FL",
    tags: ["omega", "speedmaster", "moon-watch", "caliber-321", "pre-moon", "vintage-watch"],
    images: [WATCH_IMAGE],
    verification_requirements: ["Movement photos showing caliber", "Lume shot and dial macro"],
    poster_display_name: "WatchWizard",
    days_ago: 6,
    view_count: 87,
    deadline_days: 60
  },
  {
    title: "Harry Potter Philosopher's Stone - UK 1st Edition Hardcover",
    description: "Searching for a true first edition, first printing of Harry Potter and the Philosopher's Stone. Must have the 'wand' typo on page 53 and the number line going down to '1'. Dust jacket preferred but will consider copies without. A 'Joanne Rowling' credit copy would be incredible.",
    category: "collectibles",
    subcategory: "rare-books",
    amount: 150,
    location: "Boston, MA",
    tags: ["harry-potter", "first-edition", "bloomsbury", "rare-books", "jk-rowling", "philosophers-stone"],
    images: [BOOK_IMAGE],
    verification_requirements: ["Copyright page photo", "Page 53 photo showing typo"],
    poster_display_name: "BookWormBeth",
    days_ago: 8,
    view_count: 76,
    deadline_days: 90
  },
  {
    title: "Rolex Submariner 5513 No-Date - 1960s",
    description: "Looking for a Rolex Submariner 5513 no-date from the 1960s. Meters-first dial preferred. Matching serial insert a plus but not required. Some patina expected and welcomed. Box and papers would be amazing but not expected for this era. Serious buyer.",
    category: "collectibles",
    subcategory: "watches",
    amount: 225,
    location: "Las Vegas, NV",
    tags: ["rolex", "submariner", "no-date", "vintage-dive", "5513", "meters-first"],
    images: [WATCH_IMAGE],
    verification_requirements: ["Serial number between lugs", "Movement photo"],
    poster_display_name: "DiveWatchDan",
    days_ago: 7,
    view_count: 94,
    deadline_days: 45
  },
  {
    title: "Apple I Computer or Original Apple II",
    description: "Searching for an Apple I computer (will pay significantly more for verified units) or an original Apple II from 1977. Any condition considered for the Apple I. For Apple II, prefer working unit with original case. This is for a tech history museum display.",
    category: "collectibles",
    subcategory: "vintage-electronics",
    amount: 175,
    location: "San Jose, CA",
    tags: ["apple-computer", "vintage-tech", "steve-jobs", "collector", "apple-1", "silicon-valley"],
    images: [TECH_IMAGE],
    verification_requirements: ["Serial number documentation", "Provenance if available"],
    poster_display_name: "TechHistoryBuff",
    days_ago: 11,
    view_count: 58,
    deadline_days: 90
  },
  {
    title: "Atari 2600 Heavy Sixer - Complete in Box",
    description: "Looking for a 'heavy sixer' Atari 2600 complete in box. These are the earliest production units with 6 switches and thicker plastic. Box condition important - looking for displayable quality. Original joysticks and Combat cartridge should be included.",
    category: "collectibles",
    subcategory: "toys-games",
    amount: 50,
    location: "Denver, CO",
    tags: ["atari", "heavy-sixer", "cib", "70s-gaming", "2600", "retro-console"],
    images: [TECH_IMAGE],
    verification_requirements: ["Photos of all 6 switches", "Box condition photos"],
    poster_display_name: "AtariArchives",
    days_ago: 13,
    view_count: 34,
    deadline_days: 60
  }
];

// Combine all bounties for easy access
export const ALL_DEMO_BOUNTIES: DemoBounty[] = [
  HERO_BOUNTY,
  ...RECONNECTION_BOUNTIES,
  ...CLASSIC_CAR_BOUNTIES,
  ...COLLECTIBLE_BOUNTIES
];

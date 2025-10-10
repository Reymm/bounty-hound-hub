-- Insert demo bounties for video demonstration
-- Note: You'll need to replace 'YOUR_USER_ID' with your actual user ID from the profiles table

-- First, let's create a temporary variable to store a user ID
-- You can replace this with your actual user ID
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Get the first available user ID (or you can specify your own)
  SELECT id INTO demo_user_id FROM public.profiles LIMIT 1;
  
  -- If no user exists, we'll create a placeholder message
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found in profiles table. Please create a user first.';
  ELSE
    -- Insert demo bounties
    INSERT INTO public."Bounties" (
      id,
      poster_id,
      title,
      description,
      category,
      subcategory,
      amount,
      status,
      location,
      deadline,
      tags,
      images,
      created_at
    ) VALUES 
    (
      gen_random_uuid(),
      demo_user_id,
      'Vintage Nike Air Jordan 1985 Original',
      'Looking for authentic Nike Air Jordan sneakers from 1985 in good condition. Preferably size 10-11. Must have original box or documentation. Willing to pay premium for mint condition pairs.',
      'Collectibles',
      'Sneakers',
      850.00,
      'open',
      'New York, NY',
      NOW() + INTERVAL '14 days',
      ARRAY['vintage', 'sneakers', 'nike', 'air-jordan', '1980s'],
      ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
      NOW() - INTERVAL '2 days'
    ),
    (
      gen_random_uuid(),
      demo_user_id,
      'First Edition Pink Floyd Vinyl Records',
      'Seeking original pressing vinyl records from Pink Floyd, specifically The Dark Side of the Moon (1973) and Wish You Were Here (1975). Must be in excellent playing condition with minimal scratches.',
      'Music',
      'Vinyl Records',
      450.00,
      'open',
      'Los Angeles, CA',
      NOW() + INTERVAL '21 days',
      ARRAY['vinyl', 'pink-floyd', 'classic-rock', '1970s', 'first-edition'],
      ARRAY['https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800'],
      NOW() - INTERVAL '5 days'
    ),
    (
      gen_random_uuid(),
      demo_user_id,
      'Leica M6 Film Camera with 50mm Lens',
      'Want to buy a Leica M6 35mm rangefinder camera in working condition. Preferably with a 50mm Summicron lens. Looking for clean body with no major scratches or dents.',
      'Electronics',
      'Cameras',
      1200.00,
      'open',
      'Chicago, IL',
      NOW() + INTERVAL '10 days',
      ARRAY['camera', 'leica', 'film-photography', 'vintage', 'rangefinder'],
      ARRAY['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800'],
      NOW() - INTERVAL '1 day'
    ),
    (
      gen_random_uuid(),
      demo_user_id,
      'Charizard Holographic Pokemon Card - First Edition',
      'Seeking first edition holographic Charizard card from the original Base Set (1999). Must be in near-mint or mint condition. PSA graded cards preferred but not required.',
      'Collectibles',
      'Trading Cards',
      2500.00,
      'open',
      'Austin, TX',
      NOW() + INTERVAL '7 days',
      ARRAY['pokemon', 'charizard', 'trading-cards', 'first-edition', 'holographic'],
      ARRAY['https://images.unsplash.com/photo-1606931822902-5a7f7c9de87b?w=800'],
      NOW() - INTERVAL '3 days'
    ),
    (
      gen_random_uuid(),
      demo_user_id,
      'Hermès Birkin Bag - Any Color',
      'Looking to purchase an authentic Hermès Birkin bag in any size or color. Must come with authenticity certificate and original packaging. Pre-owned acceptable if in excellent condition.',
      'Fashion',
      'Handbags',
      5500.00,
      'open',
      'Miami, FL',
      NOW() + INTERVAL '30 days',
      ARRAY['hermes', 'birkin', 'luxury', 'designer', 'handbag'],
      ARRAY['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800'],
      NOW() - INTERVAL '1 hour'
    ),
    (
      gen_random_uuid(),
      demo_user_id,
      'Amazing Spider-Man #129 - First Punisher Appearance',
      'Want to buy Amazing Spider-Man #129 (1974) featuring the first appearance of The Punisher. Looking for VF/NM condition or better. Ungraded copies welcome.',
      'Collectibles',
      'Comic Books',
      750.00,
      'open',
      'Seattle, WA',
      NOW() + INTERVAL '18 days',
      ARRAY['comics', 'marvel', 'spider-man', 'punisher', 'first-appearance'],
      ARRAY['https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800'],
      NOW() - INTERVAL '4 days'
    );
    
    RAISE NOTICE 'Successfully inserted 6 demo bounties for user: %', demo_user_id;
  END IF;
END $$;
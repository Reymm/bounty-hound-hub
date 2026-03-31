-- Reorder bounties: set the user's preferred top 6
-- 1. Seeking KIDS America Corp Rainbow Bunny
UPDATE "Bounties" SET display_order = 1 WHERE id = '9e338252-e9ab-4884-b243-628a22f7cf2c';
-- 2. Seeking Vintage Husky Plush
UPDATE "Bounties" SET display_order = 2 WHERE id = '8476ff9e-4707-4811-ae37-4495c3593db9';
-- 3. 1997 Looney Tunes Tweety Bird
UPDATE "Bounties" SET display_order = 3 WHERE id = '2a8ab2bb-a4ae-40f7-a194-f47a1dcb05ad';
-- 4. Early 1990s Playskool Dalmatian
UPDATE "Bounties" SET display_order = 4 WHERE id = '219d2527-b622-49bc-a9d6-ec07abb57561';
-- 5. Seeking ID or Replacement for Pink Love Bug
UPDATE "Bounties" SET display_order = 5 WHERE id = '240a50ac-b22a-4d2f-ab84-786a9c766db6';
-- 6. Looking for Exact Banana Fish Baby Blanket
UPDATE "Bounties" SET display_order = 6 WHERE id = '2346e227-a3d5-46d2-b26c-7c2b17c0b633';

-- Bump existing ones that were in positions 1-6 but aren't in the new top 6
UPDATE "Bounties" SET display_order = 7 WHERE id = 'c99fb64e-30d7-4d40-88d2-c5be984443f6'; -- Traveling Monkey
UPDATE "Bounties" SET display_order = 8 WHERE id = '8624b945-aab7-4da7-8841-3cdfa9bed4ad'; -- Lost Elephant Bruce
UPDATE "Bounties" SET display_order = 9 WHERE id = 'a30f2fd1-84eb-4eff-a50f-c56fa3e5f376'; -- Thanksgiving Blanket
UPDATE "Bounties" SET display_order = 10 WHERE id = '1315840b-8a9f-466e-ae37-1032d3e6c5e6'; -- Nitey Nite Puppy
UPDATE "Bounties" SET display_order = 11 WHERE id = 'e2c7821b-a49a-493b-b5f3-3e6ea4181e2e'; -- Baby Ganz
UPDATE "Bounties" SET display_order = 12 WHERE id = 'f15d883f-8f36-4772-a469-d391c2ab0a50'; -- Cream Bear
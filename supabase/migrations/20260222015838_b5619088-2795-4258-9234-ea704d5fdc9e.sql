
-- Add display_order column for custom homepage sorting
ALTER TABLE public."Bounties" ADD COLUMN display_order integer DEFAULT 999;

-- Set display order: top money first, monkey at #2, axe at bottom
-- 1st: Banana Fish ($55)
UPDATE public."Bounties" SET display_order = 1 WHERE id = '2346e227-a3d5-46d2-b26c-7c2b17c0b633';
-- 2nd: Monkey from Paris ($150)  
UPDATE public."Bounties" SET display_order = 2 WHERE id = 'c99fb64e-30d7-4d40-88d2-c5be984443f6';
-- 3rd: Thanksgiving Blanket ($50)
UPDATE public."Bounties" SET display_order = 3 WHERE id = 'a30f2fd1-84eb-4eff-a50f-c56fa3e5f376';
-- 4th: Tweety Bird ($50)
UPDATE public."Bounties" SET display_order = 4 WHERE id = '2a8ab2bb-a4ae-40f7-a194-f47a1dcb05ad';
-- 5th: Nitey Nite Puppy ($20)
UPDATE public."Bounties" SET display_order = 5 WHERE id = '1315840b-8a9f-466e-ae37-1032d3e6c5e6';
-- 6th: Baby Ganz ($20)
UPDATE public."Bounties" SET display_order = 6 WHERE id = 'e2c7821b-a49a-493b-b5f3-3e6ea4181e2e';
-- Last: Axe ($1000) - at the bottom
UPDATE public."Bounties" SET display_order = 100 WHERE id = 'cd63c50c-0782-4758-bb02-2cac71f4338b';

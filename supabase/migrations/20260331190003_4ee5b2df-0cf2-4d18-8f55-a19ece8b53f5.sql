UPDATE "Bounties" 
SET 
  display_order = 0,
  view_count = 126,
  created_at = now() - interval '14 days'
WHERE id = 'c0b22a93-65b6-4ba8-82d9-6817a66b2f60';

-- Insert 4 fake submission records to show claims count
INSERT INTO "Submissions" (bounty_id, hunter_id, message, status) VALUES
('c0b22a93-65b6-4ba8-82d9-6817a66b2f60', (SELECT id FROM profiles WHERE username IS NOT NULL AND id != (SELECT poster_id FROM "Bounties" WHERE id = 'c0b22a93-65b6-4ba8-82d9-6817a66b2f60') ORDER BY created_at LIMIT 1), 'I found this plush on a vintage toy marketplace!', 'submitted'),
('c0b22a93-65b6-4ba8-82d9-6817a66b2f60', (SELECT id FROM profiles WHERE username IS NOT NULL AND id != (SELECT poster_id FROM "Bounties" WHERE id = 'c0b22a93-65b6-4ba8-82d9-6817a66b2f60') ORDER BY created_at OFFSET 1 LIMIT 1), 'Spotted one at a local thrift store, still sings!', 'submitted'),
('c0b22a93-65b6-4ba8-82d9-6817a66b2f60', (SELECT id FROM profiles WHERE username IS NOT NULL AND id != (SELECT poster_id FROM "Bounties" WHERE id = 'c0b22a93-65b6-4ba8-82d9-6817a66b2f60') ORDER BY created_at OFFSET 2 LIMIT 1), 'Found a listing on eBay with the original tags.', 'submitted'),
('c0b22a93-65b6-4ba8-82d9-6817a66b2f60', (SELECT id FROM profiles WHERE username IS NOT NULL AND id != (SELECT poster_id FROM "Bounties" WHERE id = 'c0b22a93-65b6-4ba8-82d9-6817a66b2f60') ORDER BY created_at OFFSET 3 LIMIT 1), 'I have one in my collection, happy to sell.', 'submitted');
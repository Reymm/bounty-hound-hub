-- Update vinylvince username and bio to a caring mom persona
UPDATE profiles 
SET username = 'mama_bear32', 
    bio = 'Mom of two looking for comfort items for my kids. If you have what we need, let''s talk.',
    updated_at = now()
WHERE id = 'fa047fb2-d67a-4f21-8d76-d4ae2bf8fe26';

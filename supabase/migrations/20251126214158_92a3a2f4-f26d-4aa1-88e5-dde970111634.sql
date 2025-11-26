-- Assign support admin privileges to the user
UPDATE public.profiles
SET is_support_admin = true
WHERE id = 'b8eb6fdc-8df5-495d-af20-58eecaff6dc7';
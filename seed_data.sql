-- SEED DATA FOR LINK UP
-- Replace 'YOUR_USER_ID_HERE' with your actual User ID from Auth > Users

DO $$ 
DECLARE 
    my_user_id UUID := 'YOUR_USER_ID_HERE'; -- <--- CHANGE THIS
BEGIN

-- 1. SEED JOBS
INSERT INTO public.jobs (employer_id, title, description, category, location, salary, deposit, tags, status)
VALUES 
(my_user_id, 'Freelance Video Editor', 'Looking for someone to edit 3-5 minute event videos. Familiarity with Premiere Pro is a plus.', 'Creative', 'UTP, Block A', 150, 15, ARRAY['video', 'editing', 'media', 'creative'], 'Open'),
(my_user_id, 'Booth Helper (Weekend)', 'Assist with setup and managing the registration booth for Entrepreneurship Day.', 'Event', 'UTP, Main Hall', 80, 5, ARRAY['event', 'helper', 'booth', 'customer service'], 'Open'),
(my_user_id, 'Poster Design', 'Need a minimalist poster for a tech talk event. Deadline: 3 days.', 'Design', 'Remote', 60, 5, ARRAY['design', 'poster', 'graphics', 'creative'], 'Open'),
(my_user_id, 'Python Tutor', 'Help first-year students with basic Python syntax and logic.', 'Education', 'Online', 40, 0, ARRAY['python', 'coding', 'tutoring', 'tech'], 'Open'),
(my_user_id, 'Social Media Manager', 'Manage Instagram and LinkedIn accounts for our student-led startup hub.', 'Marketing', 'Remote', 200, 20, ARRAY['social media', 'marketing', 'content creation'], 'Open');

-- 2. SEED MARKETPLACE ITEMS
INSERT INTO public.marketplace_items (owner_id, title, description, price, type, category, location, tags, rating, reviews_count)
VALUES
(my_user_id, 'Pro Video Editing Service', 'Professional video editing for assignments or vlogs.', 50, 'Service', 'Creative', 'Online / UTP', ARRAY['creative', 'video', 'media'], 5.0, 20),
(my_user_id, 'Organic Nasi Lemak', 'Delicious home-cooked Nasi Lemak with spicy sambal.', 5, 'Product', 'Food', 'V4, Block B', ARRAY['food', 'homemade'], 4.9, 45),
(my_user_id, 'Python Tutoring (Basic)', 'I can help you understand the basics of programming.', 20, 'Service', 'Academic', 'Main Library', ARRAY['academic', 'tech', 'coding', 'python'], 4.9, 32),
(my_user_id, 'Used Calculus Textbook', 'Thomas Calculus (14th Edition). Condition: 9/10.', 30, 'Product', 'Academic', 'V2, Block A', ARRAY['textbooks', 'academic'], 4.8, 12),
(my_user_id, 'Custom Crochet Keychain', 'Handmade crochet keychains. Customizable colors.', 12, 'Product', 'Creative', 'All Villages', ARRAY['creative', 'others', 'art'], 4.7, 8),
(my_user_id, 'Laundry Service (Wash & Fold)', 'Fast and clean laundry service. RM 8 per 5kg load.', 8, 'Service', 'Services', 'V5, Ground Floor', ARRAY['laundry', 'service'], 4.6, 54);

END $$;

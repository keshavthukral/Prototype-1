-- BrainBuddy Seed Data
-- This file contains sample data for development and testing

-- Note: In production, users are created via Supabase Auth
-- This seed data assumes auth.users already has entries

-- =====================================================
-- SAMPLE PROFILES
-- =====================================================

-- Caregiver profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'caregiver@example.com', 'Rajesh Kumar', 'caregiver')
ON CONFLICT (id) DO NOTHING;

-- Patient profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', NULL, 'Amala Devi', 'patient'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', NULL, 'Birendra Nath', 'patient')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE PATIENTS
-- =====================================================

INSERT INTO public.patients (id, user_id, preferred_language, date_of_birth, notes)
VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'as', '1945-03-15', 'Enjoys morning walks and listening to old Assamese songs'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'en', '1948-07-22', 'Former teacher, enjoys reading and puzzles')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE CAREGIVER-PATIENT LINKS
-- =====================================================

INSERT INTO public.caregiver_patient_links (caregiver_id, patient_id, relationship, is_primary)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'son', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'nephew', FALSE)
ON CONFLICT (caregiver_id, patient_id) DO NOTHING;

-- =====================================================
-- SAMPLE REMINDERS
-- =====================================================

INSERT INTO public.reminders (id, patient_id, created_by, title, description, reminder_type, scheduled_time, frequency)
VALUES
  -- Amala's reminders
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Morning Medicine', 'Take blood pressure medication with water', 'medicine', '08:00:00', 'daily'),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stay Hydrated', 'Drink a glass of water', 'hydration', '10:00:00', 'daily'),
  ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Evening Walk', 'Take a gentle 15-minute walk', 'activity', '17:00:00', 'daily'),
  
  -- Birendra's reminders
  ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Morning Medicine', 'Take daily vitamins', 'medicine', '09:00:00', 'daily'),
  ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380ab0', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tea Time', 'Have a cup of green tea', 'hydration', '15:00:00', 'daily')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE MEMORIES
-- =====================================================

INSERT INTO public.memories (id, patient_id, created_by, name, relationship, description)
VALUES
  -- Amala's memories
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380ac1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Husband - Late Haricharan', 'Husband', 'Married in 1965. He was a school teacher who loved gardening. Remember his smile and the way he would sing old Assamese folk songs.'),
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380ac2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Son - Rajesh', 'Son', 'Born in 1970. Lives in Guwahati. Engineer by profession. Always brings your favorite sweets during Durga Puja.'),
  ('a3eebc99-9c0b-4ef8-bb6d-6bb9bd380ac3', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Granddaughter - Priya', 'Granddaughter', 'Born in 1998. Studying medicine in Delhi. She video calls every Sunday morning.'),
  
  -- Birendra's memories
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380ac4', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Wife - Kamala', 'Wife', 'Married in 1972. She was a wonderful cook and taught you how to make the best alu pitika.'),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd380ac5', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'College Days', 'Personal', 'Professor at Cotton College for 30 years. Taught Mathematics. Loved playing chess with colleagues.')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE GAME SESSIONS
-- =====================================================

INSERT INTO public.game_sessions (id, patient_id, game_type, difficulty_level, accuracy, response_time_ms, hints_used, score)
VALUES
  -- Amala's recent sessions
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380ad1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'memory', 1, 75.00, 12000, 1, 75),
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380ad2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'memory', 1, 80.00, 10500, 0, 80),
  ('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380ad3', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'pattern', 1, 85.00, 8000, 0, 85),
  ('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380ad4', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'memory', 2, 70.00, 14000, 2, 65),
  
  -- Birendra's recent sessions
  ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380ad5', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'memory', 1, 90.00, 9000, 0, 90),
  ('b6eebc99-9c0b-4ef8-bb6d-6bb9bd380ad6', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'pattern', 2, 88.00, 7500, 0, 88),
  ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380ad7', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'memory', 2, 82.00, 11000, 1, 78)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE REMINDER COMPLETIONS
-- =====================================================

INSERT INTO public.reminder_completions (reminder_id, patient_id, status)
VALUES
  -- Amala's completions
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'taken'),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'done'),
  
  -- Birendra's completions
  ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'taken')
ON CONFLICT DO NOTHING;

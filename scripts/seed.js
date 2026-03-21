// scripts/seed.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Error: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY is missing from .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  console.log("--- STARTING AUTOMATED SEED ---");

  try {
    // 1. Get the first user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    if (!users.users || users.users.length === 0) {
      console.error("Error: No users found in Supabase Auth. Please register an account on your website first!");
      return;
    }

    const user = users.users[0];
    const myUserId = user.id;
    console.log(`Targeting User: ${user.email} (${myUserId})`);

    // 2. SELF-HEALING: Ensure the user exists in the public.profiles table
    // This handles users created BEFORE the migration was pushed.
    console.log("Syncing user to public.profiles...");
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: myUserId,
        email: user.email,
        full_name: user.user_metadata?.fullName || 'Seed User',
        role: user.user_metadata?.role || 'employer',
        university: user.user_metadata?.university || 'UTP',
        business_name: user.user_metadata?.businessName || 'Campus Gigs',
        onboarding_done: !!user.user_metadata?.onboardingDone
      }, { onConflict: 'id' });

    if (profileErr) {
      console.error("Error syncing profile:", profileErr.message);
      throw profileErr;
    }

    // 3. Clear existing data to prevent duplicates
    console.log("Cleaning up old database records...");
    await supabase.from('jobs').delete().neq('id', 0);
    await supabase.from('marketplace_items').delete().neq('id', 0);

    // 4. Seed Jobs
    console.log("Seeding Jobs...");
    const { error: jobErr } = await supabase.from('jobs').insert([
      { employer_id: myUserId, title: 'Freelance Video Editor', category: 'Creative', location: 'UTP, Block A', salary: 150, deposit: 15, tags: ['video', 'editing', 'media'], status: 'Open' },
      { employer_id: myUserId, title: 'Booth Helper (Weekend)', category: 'Event', location: 'UTP, Main Hall', salary: 80, deposit: 5, tags: ['event', 'helper', 'booth'], status: 'Open' },
      { employer_id: myUserId, title: 'Poster Design', category: 'Design', location: 'Remote', salary: 60, deposit: 5, tags: ['design', 'poster', 'graphics'], status: 'Open' },
      { employer_id: myUserId, title: 'Python Tutor', category: 'Education', location: 'Online', salary: 40, deposit: 0, tags: ['python', 'coding', 'tutoring'], status: 'Open' },
      { employer_id: myUserId, title: 'Social Media Manager', category: 'Marketing', location: 'Remote', salary: 200, deposit: 20, tags: ['social media', 'marketing'], status: 'Open' }
    ]);

    if (jobErr) throw jobErr;

    // 5. Seed Marketplace
    console.log("Seeding Marketplace...");
    const { error: marketErr } = await supabase.from('marketplace_items').insert([
      { owner_id: myUserId, title: 'Pro Video Editing Service', price: 50, type: 'Service', category: 'Creative', location: 'Online / UTP', tags: ['creative', 'video'], rating: 5.0, reviews_count: 20 },
      { owner_id: myUserId, title: 'Organic Nasi Lemak', price: 5, type: 'Product', category: 'Food', location: 'V4, Block B', tags: ['food', 'homemade'], rating: 4.9, reviews_count: 45 },
      { owner_id: myUserId, title: 'Python Tutoring (Basic)', price: 20, type: 'Service', category: 'Academic', location: 'Main Library', tags: ['academic', 'coding'], rating: 4.9, reviews_count: 32 },
      { owner_id: myUserId, title: 'Used Calculus Textbook', price: 30, type: 'Product', category: 'Academic', location: 'V2, Block A', tags: ['textbooks', 'academic'], rating: 4.8, reviews_count: 12 }
    ]);

    if (marketErr) throw marketErr;

    console.log("--- SEED FINISHED SUCCESSFULLY ---");
    console.log("Your database is now fully populated and linked to your user account.");
  } catch (err) {
    console.error("Fatal Error during seeding:", err.message);
    process.exit(1);
  }
}

seed();

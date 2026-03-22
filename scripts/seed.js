// scripts/seed.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if it exists
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Error: SUPABASE_URL or SERVICE_KEY is missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  console.log('--- STARTING AUTOMATED SEED CHECK ---');

  try {
    // 1. Check if we already have jobs or marketplace items
    const { count: jobCount, error: jobCountErr } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    if (jobCountErr) throw jobCountErr;

    if (jobCount > 0) {
      console.log(
        `Database already contains ${jobCount} jobs. Skipping seed to prevent duplicates.`
      );
      return;
    }

    // 2. Get the first user to assign seeded data to
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    if (!users.users || users.users.length === 0) {
      console.log(
        'No users found in Supabase Auth. Skipping seed as there is no owner to assign data to.'
      );
      return;
    }

    const user = users.users[0];
    const myUserId = user.id;
    console.log(`Targeting User: ${user.email} (${myUserId})`);

    // 3. Ensure profile exists
    console.log('Syncing user to public.profiles...');
    await supabase.from('profiles').upsert(
      {
        id: myUserId,
        email: user.email,
        full_name: user.user_metadata?.fullName || 'Seed User',
        role: user.user_metadata?.role || 'employer',
      },
      { onConflict: 'id' }
    );

    // 4. Seed Jobs
    console.log('Seeding Jobs...');
    const { error: jobErr } = await supabase.from('jobs').insert([
      {
        employer_id: myUserId,
        title: 'Freelance Video Editor',
        category: 'Creative',
        location: 'UTP, Block A',
        salary: 150,
        status: 'Open',
      },
      {
        employer_id: myUserId,
        title: 'Booth Helper (Weekend)',
        category: 'Event',
        location: 'UTP, Main Hall',
        salary: 80,
        status: 'Open',
      },
    ]);

    if (jobErr) throw jobErr;

    // 5. Seed Marketplace
    console.log('Seeding Marketplace...');
    const { error: marketErr } = await supabase.from('marketplace_items').insert([
      {
        owner_id: myUserId,
        title: 'Pro Video Editing Service',
        price: 50,
        type: 'Service',
        category: 'Creative',
        location: 'Online / UTP',
      },
    ]);

    if (marketErr) throw marketErr;

    console.log('--- SEED FINISHED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during seeding:', err.message);
    // Don't exit with error to prevent blocking deploy if seeding fails but migrations succeeded
  }
}

seed();

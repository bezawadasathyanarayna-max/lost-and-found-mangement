const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Automatically search for .env in current directory or root project directory
const rootEnvPath = path.resolve(__dirname, '../../.env');
const parentEnvPath = path.resolve(__dirname, '../.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Fallbacks to avoid crash if .env is missing or variables are empty
const FALLBACK_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_fallback_key';

const rawUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
const rawAnonKey = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : '';
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';

const supabaseUrl = rawUrl || FALLBACK_URL;
const supabaseAnonKey = rawAnonKey || FALLBACK_KEY;
const supabaseServiceKey = rawServiceKey || supabaseAnonKey;

if (!rawUrl || !rawAnonKey) {
  console.log('ℹ️ Running in Local Session mode (SUPABASE_URL not configured yet).');
}

// Public client initialized with Anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Admin client initialized with Service Role Key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseUrl,
  supabaseAnonKey,
};

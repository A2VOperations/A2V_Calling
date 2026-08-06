import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqknmrnxpsxbzwvofwgb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa25tcm54cHN4Ynp3dm9md2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDM5MTQsImV4cCI6MjEwMTQ3OTkxNH0.5LjqUMSjrWHm0hTNwpFhw7gKrkvfpbfTv3Neitzov9Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

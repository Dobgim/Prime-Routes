/* supabase-init.js — shared Supabase client for Prime Logistics Cargo */
const SUPABASE_URL = 'https://urkuukjazppankjsiyjx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVya3V1a2phenBwYW5ranNpeWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTQwOTcsImV4cCI6MjA5MzQ3MDA5N30.hHo-urTvu3qo1Qod4DitNp6IFbPR_y-vpC5GlD2EyGs';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

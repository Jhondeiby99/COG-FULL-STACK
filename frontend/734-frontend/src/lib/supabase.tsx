import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqcdobxnmeemuompjlwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xY2RvYnhubWVlbXVvbXBqbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjU3NDQsImV4cCI6MjEwNTYwMTc0NH0.n6mHK8HZe-89RZx6KpwGfu5ZRTyYy5VYNatElrUbbls';

export const supabase = createClient(supabaseUrl, supabaseKey);
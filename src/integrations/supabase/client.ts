// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wqhakzywmqirucmetnuo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaGFrenl3bXFpcnVjbWV0bnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTcwMjYsImV4cCI6MjA2NDc3MzAyNn0.8N7dIhv07KEAxv1-HTME8ucsUc_gdoBW6FScbvhoo1U";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
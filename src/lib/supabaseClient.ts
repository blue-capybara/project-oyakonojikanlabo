import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://glwdbzwocxbezhzcegkt.supabase.co';
export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsd2RiendvY3hiZXpoemNlZ2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDcyMzEsImV4cCI6MjA2ODU4MzIzMX0.oqcfplfI84FWoPvXAM51q4wYjAZJtP0Ct4NuBJIdl30';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

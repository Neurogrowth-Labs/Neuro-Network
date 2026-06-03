/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhlitbcjnvaosvyovfub.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobGl0YmNqbnZhb3N2eW92ZnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODMzOTksImV4cCI6MjA5NjA1OTM5OX0.nu3y7thYPOkh9lPiYjHWs40iyKg5ZZPxQfWGl70eRNM';

export const supabase = createClient(supabaseUrl, supabaseKey);

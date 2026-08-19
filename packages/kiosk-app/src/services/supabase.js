import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://schwdhhqngrfjkhobwuo.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHdkaGhxbmdyZmpraG9id3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4MzYxMSwiZXhwIjoyMTAyNTU5NjExfQ.k2J8ek3uZDDEdocxZtIZ47uRXmBNhJSOuwxqp6X-Deo";

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

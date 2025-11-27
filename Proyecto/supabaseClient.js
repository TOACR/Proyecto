import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================
// CONFIGURA TU SUPABASE
// ==========================
let SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcmV0cHFkd2hrZG52cHVyenNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NjExNzMsImV4cCI6MjA3NjEzNzE3M30.hXQrxTJTuhRRjAgfj9f5l9uA4pYRHoLU1QT935-Lt4I";
let SUPABASE_URL = "https://acretpqdwhkdnvpurzso.supabase.co";

// Crear cliente una sola vez
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
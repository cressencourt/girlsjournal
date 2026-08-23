import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — the app will run with local sample data only."
  );
}

// If the keys are missing, use a harmless stand-in instead of letting
// @supabase/supabase-js throw and blank the whole page.
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from() {
        const fail = async () => ({
          data: null,
          error: new Error("Supabase is not configured (missing env keys)."),
        });
        return {
          select: () => ({ eq: () => ({ maybeSingle: fail }) }),
          insert: fail,
          update: () => ({ eq: fail }),
        };
      },
      channel() {
        return {
          on() {
            return this;
          },
          subscribe() {
            return this;
          },
        };
      },
      removeChannel() {},
    };

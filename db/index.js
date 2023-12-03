import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

/**
 * @param {string} username
 */
export async function userExists(username) {
  const { data } = await supabase
    .from("data")
    .select("username")
    .eq("username", username);
  return data.length > 0;
}

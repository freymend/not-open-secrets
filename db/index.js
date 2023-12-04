import { createClient } from "@supabase/supabase-js";

const TABLE = process.env.NODE_ENV === "test" ? "test_data" : "data";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

/**
 * @param {string} username
 */
export async function userExists(username) {
  const { data } = await supabase
    .from(TABLE)
    .select("username")
    .eq("username", username);
  return data.length > 0;
}

/**
 * @param {string} username
 */
export async function getPassword(username) {
  const { data } = await supabase
    .from(TABLE)
    .select("password")
    .eq("username", username)
    .limit(1);
  return data;
}

/**
 * @param {string} username
 * @param {string} hashedPassword
 */
export async function registerUser(username, hashedPassword) {
  await supabase.from(TABLE).insert({
    username: username,
    password: hashedPassword,
  });
}

/**
 * @param {string} username
 */
export async function getJournal(username) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("journal")
    .eq("username", username)
    .limit(1);

  return data[0].journal;
}

/**
 * @param {string} username
 * @param {any} journal
 */
export async function backup(username, journal) {
  const { error } = await supabase
    .from(TABLE)
    .update({ journal: journal })
    .eq("username", username);
  console.log(error);
}

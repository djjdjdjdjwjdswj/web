import { supabase } from "./supabase";

export async function getMyUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function getMyProfile() {
  const user = await getMyUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data || null;
}

export async function upsertMyProfile(patch) {
  const user = await getMyUser();
  if (!user) throw new Error("No user");
  const payload = { id: user.id, ...patch };
  const { data, error } = await supabase.from("profiles").upsert(payload).select("*").single();
  if (error) throw error;
  return data;
}

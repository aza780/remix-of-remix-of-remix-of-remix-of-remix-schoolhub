import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

// Public queries
export async function fetchPublishedPosts(category?: string, search?: string) {
  let query = supabase.from("posts").select("*").eq("status", "published").order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchPostBySlug(slug: string) {
  const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).single();
  if (error) throw error;
  return data;
}

// Admin queries
export async function fetchAllPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPost(post: PostInsert & { author_id?: string }) {
  const { data, error } = await supabase.from("posts").insert(post).select().single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: string, post: PostUpdate) {
  const { data, error } = await supabase.from("posts").update(post).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePostStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "published" ? "draft" : "published";
  return updatePost(id, { status: newStatus });
}

export async function uploadPostImage(file: File) {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

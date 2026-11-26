"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cierra la sesión (borra las cookies de Supabase) y lleva a la página inicial.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

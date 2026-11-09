"use server";

import { refresh } from "next/cache";
import { usernameError } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export type UsernameResult = { error?: string; username?: string };

const GENERIC_ERROR = "No pudimos actualizar tu nombre de usuario. Intenta de nuevo.";
const TAKEN_ERROR = "Ese nombre de usuario ya está en uso. Prueba con otro.";

// Mismas reglas que el registro, más la disponibilidad en la base de datos.
async function checkNewUsername(raw: string) {
  const username = raw.trim();
  const error = usernameError(username);
  if (error) return { error };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (!profile) return { error: GENERIC_ERROR };
  if (profile.username === username) return { error: "Ese ya es tu nombre de usuario." };

  // La disponibilidad no distingue mayúsculas: cambiar solo mayúsculas del propio nombre no choca con nadie.
  if (profile.username.toLowerCase() !== username.toLowerCase()) {
    const { data: available, error: rpcError } = await supabase.rpc("is_username_available", { p_username: username });
    if (rpcError) return { error: GENERIC_ERROR };
    if (!available) return { error: TAKEN_ERROR };
  }

  return { username, userId, supabase };
}

// Se llama al pulsar Guardar, antes de pedir confirmación.
export async function checkUsername(raw: string): Promise<UsernameResult> {
  const result = await checkNewUsername(raw);
  return "error" in result ? { error: result.error } : { username: result.username };
}

// Se llama al confirmar en el modal. Vuelve a validar: el nombre pudo ocuparse entre ambos pasos.
export async function updateUsername(raw: string): Promise<UsernameResult> {
  const result = await checkNewUsername(raw);
  if ("error" in result) return { error: result.error };
  const { username, userId, supabase } = result;

  const { data, error } = await supabase.from("profiles").update({ username }).eq("id", userId).select("username").maybeSingle();
  // 23505: el índice único lo tomó otra persona justo ahora.
  if (error?.code === "23505") return { error: TAKEN_ERROR };
  if (error || !data) return { error: GENERIC_ERROR };

  refresh();
  return { username: data.username };
}

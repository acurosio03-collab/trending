import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "./supabase/server";
import type { Role } from "./types";

export interface Session {
  userId: string;
  email: string | null;
  role: Role;
  isPremium: boolean;
  isAdmin: boolean;
}

/**
 * Otorisasi SISI SERVER. Status premium/admin dibaca dari database (fungsi SQL is_premium / is_admin),
 * bukan dari cookie/localStorage yang bisa dimanipulasi di browser.
 */
export async function getSession(): Promise<Session | null> {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser(); // memvalidasi token ke server Supabase
  const user = data.user;
  if (!user) return null;

  const admin = supabaseAdmin();
  const [{ data: isAdmin }, { data: isPremium }, { data: profile }] = await Promise.all([
    admin.rpc("is_admin", { _user: user.id }),
    admin.rpc("is_premium", { _user: user.id }),
    admin.from("profiles").select("is_suspended").eq("id", user.id).single(),
  ]);
  if (profile?.is_suspended) return null;

  const role: Role = isAdmin ? "admin" : isPremium ? "premium" : "user";
  return { userId: user.id, email: user.email ?? null, role, isPremium: !!isPremium, isAdmin: !!isAdmin };
}

export const unauthorized = () => NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
export const forbidden = (m = "Akses ditolak.") => NextResponse.json({ error: m }, { status: 403 });
export const premiumOnly = () =>
  NextResponse.json({ error: "Fitur ini khusus pengguna Premium.", upgrade: "/upgrade" }, { status: 402 });

export async function logAdmin(adminId: string, action: string, targetType?: string, targetId?: string, detail?: unknown) {
  await supabaseAdmin().from("admin_logs").insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, detail });
}

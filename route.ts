import { NextResponse } from "next/server";
import { limited } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = limited(req, "search", 120);
  if (rl) return rl;
  const q = (new URL(req.url).searchParams.get("q") || "").trim().replace(/[%,()]/g, "").slice(0, 40);
  if (q.length < 1) return NextResponse.json({ results: [] });
  const { data, error } = await supabaseAdmin()
    .from("stock_symbols")
    .select("symbol,name,sector")
    .eq("is_active", true)
    .or(`symbol.ilike.${q}%,name.ilike.%${q}%`)
    .limit(15);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data });
}

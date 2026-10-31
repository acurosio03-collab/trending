import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Me-refresh sesi Supabase dan melindungi halaman yang butuh login.
// Pemeriksaan role/premium yang sebenarnya tetap dilakukan di server (lib/auth.ts + RLS).
const PROTECTED = ["/watchlist", "/portfolio", "/profile", "/upgrade", "/admin", "/screener"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return res;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  if (!data.user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/market|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

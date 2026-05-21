import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_code", request.url));
  }

  // Leitet den User zurück ans Dashboard und hängt den Code an.
  // Dein Frontend-useEffect liest den Code aus und feuert den syncMutation-Hook ab.
  return NextResponse.redirect(
    new URL(`/dashboard?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`, request.url)
  );
}
import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { housePath, sessionOptions, type SessionData } from "@/lib/session-config";

// Edge-compatible session check — only imports session config, no DB
async function getSession(req: NextRequest) {
  const res = NextResponse.next();
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/client") ||
    pathname.startsWith("/coach") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/app"); // legacy client URLs; next.config redirects them
  if (!isProtected) return NextResponse.next();

  const session = await getSession(req);
  const userId = session.userId;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const home = housePath(session.role);

  if (pathname.startsWith("/staff") && session.role !== "staff") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname.startsWith("/coach") && session.role !== "coach") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  const isClientHouse =
    pathname.startsWith("/client") || pathname.startsWith("/app");
  if (isClientHouse && session.role !== "client") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client",
    "/client/:path*",
    "/coach",
    "/coach/:path*",
    "/staff",
    "/staff/:path*",
    "/app",
    "/app/:path*",
  ],
};

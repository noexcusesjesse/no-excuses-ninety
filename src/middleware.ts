import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session-config";

// Edge-compatible session check — only imports session config, no DB
async function getSession(req: NextRequest) {
  const res = NextResponse.next();
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /client, /coach, and /app routes
  const isProtected =
    pathname.startsWith("/client") ||
    pathname.startsWith("/coach") ||
    pathname.startsWith("/app");
  if (!isProtected) return NextResponse.next();

  const session = await getSession(req);
  const userId = session.userId;

  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access: /coach requires coach role
  if (pathname.startsWith("/coach") && session.role !== "coach") {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  // /client and /app require client role
  if ((pathname.startsWith("/client") || pathname.startsWith("/app")) && session.role !== "client") {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/coach/:path*", "/app/:path*"],
};

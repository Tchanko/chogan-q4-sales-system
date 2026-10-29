import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/session/admin-token";

/**
 * Première barrière pour /admin : sans session valide, redirection vers la
 * page de connexion. Chaque page et action d'administration revérifie la
 * session côté serveur (défense en profondeur).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/connexion") return NextResponse.next();

  const secret = process.env.APP_SECRET ?? "";
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (secret.length >= 32 && isValidAdminToken(token, secret)) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/connexion", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

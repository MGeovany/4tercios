import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OAUTH_ERROR_PARAMS = ["error", "error_code", "error_description"] as const;

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hasOauthErrorParams = OAUTH_ERROR_PARAMS.some((param) => url.searchParams.has(param));

  if (!hasOauthErrorParams) {
    return NextResponse.next();
  }

  const cleanedUrl = url.clone();
  for (const param of OAUTH_ERROR_PARAMS) {
    cleanedUrl.searchParams.delete(param);
  }

  return NextResponse.redirect(cleanedUrl);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|sitemap.xml|robots.txt).*)"],
};

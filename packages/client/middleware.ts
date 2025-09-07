import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest, response: NextResponse) {
  console.log(response);
  const refreshToken = request.cookies.get("refreshToken")?.value;

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};

// export async function middleware(request: NextRequest) {
//   const accessToken = request.cookies.get("accessToken")?.value;

//   // If no token, try to refresh via Express
//   if (!accessToken) {
//     const refreshRes = await fetch(`${process.env.EXPRESS_URL}/auth/refresh-token`, {
//       method: "POST",
//       headers: {
//         cookie: request.headers.get("cookie") ?? "",
//       },
//       credentials: "include",
//     });

//     if (refreshRes.ok) {
//       const data = await refreshRes.json();

//       // Attach new accessToken to request headers
//       const requestHeaders = new Headers(request.headers);
//       requestHeaders.set("x-access-token", data.accessToken);

//       const response = NextResponse.next({ request: { headers: requestHeaders } });
//       response.cookies.set("accessToken", data.accessToken, {
//         httpOnly: false, // since we only use it inside Next.js server
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 15 * 60, // match your access token expiry
//       });

//       return response;
//     }

//     // If refresh fails, redirect to login
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   // If token exists, just attach it to headers
//   const requestHeaders = new Headers(request.headers);
//   requestHeaders.set("x-access-token", accessToken);

//   return NextResponse.next({ request: { headers: requestHeaders } });
// }

// export const config = {
//   matcher: ["/dashboard/:path*", "/api/:path*"], // protect these routes
// };

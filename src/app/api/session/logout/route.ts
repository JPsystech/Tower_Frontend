import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      headers: NO_STORE_HEADERS,
    },
  );

  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

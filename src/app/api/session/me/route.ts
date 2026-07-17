import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getApiBaseUrl, parseError, SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    const response = NextResponse.json(
      { message: "No active session" },
      {
        status: 401,
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

  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const nextResponse = NextResponse.json(
      { message: await parseError(response) },
      {
        status: response.status,
        headers: NO_STORE_HEADERS,
      },
    );

    nextResponse.cookies.set(SESSION_COOKIE, "", {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return nextResponse;
  }

  const data = await response.json();
  return NextResponse.json(
    {
      ...data,
      access_token: token,
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}

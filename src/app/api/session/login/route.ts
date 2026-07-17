import { NextResponse } from "next/server";

import { getApiBaseUrl, parseError, SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await parseError(response);
      const fallbackMessage =
        response.status >= 500
          ? "Backend login failed. Ensure PostgreSQL is running and backend migrations are applied."
          : message;

      return NextResponse.json(
        { message: message === "Request failed" ? fallbackMessage : message },
        { status: response.status },
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, {
      headers: NO_STORE_HEADERS,
    });

    nextResponse.cookies.set(SESSION_COOKIE, data.access_token, {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        message:
          "Backend is unreachable. Start PostgreSQL, run Alembic migrations, seed the database, and retry login.",
      },
      {
        status: 503,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}

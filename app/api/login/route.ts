import { NextResponse } from "next/server";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth";

export async function POST(req: Request) {
  const expected = process.env.APP_PASSCODE;
  if (!expected) return NextResponse.json({ error: "APP_PASSCODE is not set" }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (!body.passcode || body.passcode !== expected) {
    return NextResponse.json({ error: "That passcode is not right." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await tokenFor(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

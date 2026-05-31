import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Download links are disabled. Use the one-time secure download package endpoint." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Use POST for secure downloads." }, { status: 405, headers: { Allow: "POST" } });
}

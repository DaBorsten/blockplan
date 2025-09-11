import { NextResponse } from "next/server";

// HINWEIS: Legacy-Endpoint. Nutzung bitte auf Convex Mutation `users.initUser` umstellen.
// Entfernung geplant. Gibt nur noch statische Antworten zurück.

export async function GET() {
  return NextResponse.json({ data: null, deprecated: true }, { status: 200 });
}

export async function POST() {
  return NextResponse.json(
    { error: "Verwende Convex Mutation users.initUser", deprecated: true },
    { status: 410 },
  );
}

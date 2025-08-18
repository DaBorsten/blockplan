import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// POST /api/class
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();

    await turso.execute(`INSERT INTO user (id) VALUES (?)`, [user_id]);

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error creating user" }, { status: 500 });
  }
}

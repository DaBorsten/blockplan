import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";

// POST /api/class/member
export async function POST(req: NextRequest) {
  try {
    const { user_id, class_id, role } = await req.json();

    if (!user_id || !class_id || !role) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, class_id, role" },
        { status: 400 },
      );
    }

    await turso.execute(
      `INSERT INTO user_class (class_id, user_id, role) VALUES (?, ?, ?)`,
      [class_id, user_id, role],
    );

    return NextResponse.json(
      { message: "Member added to class" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding member to class:", error);
    return NextResponse.json(
      { error: "Error adding member to class" },
      { status: 500 },
    );
  }
}

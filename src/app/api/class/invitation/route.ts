import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { randomBytes } from "crypto";
import { requireAuthUserId } from "@/lib/auth";

export const runtime = "nodejs";

type EnsureOwnerResult = { ok: true } | { ok: false; status: number; error: string };

async function ensureOwner(authUserId: string, class_id: string): Promise<EnsureOwnerResult> {
  const roleRes = await turso.execute(
    `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
    [authUserId, class_id],
  );
  const role = (roleRes.rows[0] as { role?: string } | undefined)?.role;
  if (!role) return { ok: false, status: 403, error: "not a class member" };
  if (role !== "owner")
    return { ok: false, status: 403, error: "only owner can manage invites" };
  return { ok: true } as const;
}

async function ensureOwnerOrAdmin(authUserId: string, class_id: string): Promise<EnsureOwnerResult> {
  const roleRes = await turso.execute(
    `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
    [authUserId, class_id],
  );
  const role = (roleRes.rows[0] as { role?: string } | undefined)?.role;
  if (!role) return { ok: false, status: 403, error: "not a class member" };
  if (role !== "owner" && role !== "admin")
    return { ok: false, status: 403, error: "only owner or admin can view invites" };
  return { ok: true } as const;
}

function generateCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 1, 0 for clarity
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

// GET /api/class/invitation?class_id=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
  const authUserId = requireAuthUserId(req);
    const class_id = searchParams.get("class_id");
  if (!class_id) return NextResponse.json({ error: "Missing class_id" }, { status: 400 });

  // Allow both owner and admin to view invitation list
  const auth = await ensureOwnerOrAdmin(authUserId, class_id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const res = await turso.execute(
      `SELECT id, user_id, class_id, expiration_date
       FROM invitation
       WHERE class_id = ?
       ORDER BY expiration_date DESC`,
      [class_id],
    );

    const now = Date.now();
    const data = res.rows.map((r) => {
  const row = (r as unknown) as { id: string; user_id: string; class_id: string; expiration_date: string };
      const exp = new Date(row.expiration_date).getTime();
      const active = isFinite(exp) && exp >= now;
      return { ...row, active };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error listing invitations:", error);
    return NextResponse.json(
      { error: "Error listing invitations" },
      { status: 500 },
    );
  }
}

// POST /api/class/invitation
// body: { class_id, expires?: boolean, expiration_date?: string }
export async function POST(req: NextRequest) {
  try {
  const userId = requireAuthUserId(req);
  const { class_id, expires, expiration_date } = await req.json();
  if (!class_id) return NextResponse.json({ error: "Missing class_id" }, { status: 400 });

  const auth = await ensureOwner(userId, class_id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Determine expiration
    let expISO: string;
    if (expires) {
      if (expiration_date) {
        // trust incoming ISO or datetime-local; try to normalize
        const dt = new Date(expiration_date);
        if (isNaN(dt.getTime()))
          return NextResponse.json(
            { error: "Invalid expiration_date" },
            { status: 400 },
          );
        expISO = dt.toISOString();
      } else {
        const in30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        expISO = in30d.toISOString();
      }
    } else {
      // Use far-future date to represent never-expiring in current schema
      expISO = "9999-12-31T23:59:59.000Z";
    }

    // generate unique 6-char code, retry on rare collisions
    let id = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode(6);
      const exists = await turso.execute(
        `SELECT 1 FROM invitation WHERE id = ? LIMIT 1`,
        [code],
      );
      if (exists.rows.length === 0) {
        id = code;
        break;
      }
    }
    if (!id) {
      return NextResponse.json(
        { error: "Failed to generate unique invite code" },
        { status: 500 },
      );
    }

    await turso.execute(
      `INSERT INTO invitation (id, user_id, class_id, expiration_date)
       VALUES (?, ?, ?, ?)`,
      [id, userId, class_id, expISO],
    );

    return NextResponse.json(
      { id, user_id: userId, class_id, expiration_date: expISO },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Error creating invitation" },
      { status: 500 },
    );
  }
}

// DELETE /api/class/invitation?id=
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
  const userId = requireAuthUserId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // load invitation with class_id and creator
    const res = await turso.execute(
      `SELECT id, user_id, class_id FROM invitation WHERE id = ? LIMIT 1`,
      [id],
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    const row = (res.rows[0] as unknown) as { id: string; user_id: string; class_id: string };

    // allow if user is creator
  if (row.user_id === userId) {
      await turso.execute(`DELETE FROM invitation WHERE id = ?`, [id]);
      return NextResponse.json({ deleted: true });
    }

    // or owner of the class
  const auth = await ensureOwner(userId, row.class_id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await turso.execute(`DELETE FROM invitation WHERE id = ?`, [id]);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Error deleting invitation" }, { status: 500 });
  }
}

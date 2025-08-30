import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/tursoClient";
import { requireAuthUserId } from "@/lib/auth";

// POST /api/class/member  body: { class_id, role }
// Adds the authenticated user with a given role (rare direct use; typical joins via invitation accept route).
export async function POST(req: NextRequest) {
  try {
    const authUserId = requireAuthUserId(req);
    const { class_id, role } = await req.json();
    if (!class_id || !role) {
      return NextResponse.json({ error: "Missing required fields: class_id, role" }, { status: 400 });
    }
    await turso.execute(`INSERT INTO user_class (class_id, user_id, role) VALUES (?, ?, ?)`, [class_id, authUserId, role]);
    return NextResponse.json({ message: "Member added to class" }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'Unauthenticated') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    console.error("Error adding member to class:", error);
    return NextResponse.json({ error: "Error adding member to class" }, { status: 500 });
  }
}

// GET /api/class/member?class_id=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const authUserId = requireAuthUserId(req);
    if (!class_id) {
      return NextResponse.json({ error: "Missing class_id" }, { status: 400 });
    }

    const membersRes = await turso.execute(
      `SELECT uc.user_id, uc.role, u.nickname
       FROM user_class uc
       LEFT JOIN user u ON u.id = uc.user_id
       WHERE uc.class_id = ?
       ORDER BY uc.role, COALESCE(u.nickname, uc.user_id)`,
      [class_id],
    );
    const members = membersRes.rows.map((r) => ({
      user_id: (r as unknown as { user_id: string }).user_id,
      role: (r as unknown as { role: string }).role,
      nickname: (r as unknown as { nickname?: string }).nickname ?? null,
    }));

  const roleRes = await turso.execute(`SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`, [authUserId, class_id]);
  const currentRole = (roleRes.rows[0] as { role?: string } | undefined)?.role ?? null;

    return NextResponse.json({ members, currentRole });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Error fetching members" }, { status: 500 });
  }
}

// DELETE /api/class/member?class_id=&target_user_id=
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const target_user_id = searchParams.get("target_user_id");
  const authUserId = requireAuthUserId(req);
    if (!class_id || !target_user_id) {
      return NextResponse.json({ error: "Missing class_id or target_user_id" }, { status: 400 });
    }

    // get requester role
    const reqRoleRes = await turso.execute(
      `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
  [authUserId, class_id],
    );
  const requesterRole = (reqRoleRes.rows[0] as { role?: string } | undefined)?.role;
    if (!requesterRole) {
      return NextResponse.json({ error: "Requester is not a member" }, { status: 403 });
    }

    // get target role
    const tgtRoleRes = await turso.execute(
      `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
      [target_user_id, class_id],
    );
    const targetRole = (tgtRoleRes.rows[0] as { role?: string } | undefined)?.role;
    if (!targetRole) {
      return NextResponse.json({ error: "Target is not a member" }, { status: 404 });
    }

    // self-leave
  if (authUserId === target_user_id) {
      if (requesterRole === "owner") {
        // Check for other members
        const othersRes = await turso.execute(
          `SELECT user_id FROM user_class WHERE class_id = ? AND user_id <> ? LIMIT 1`,
          [class_id, authUserId],
        );
        if (othersRes.rows.length === 0) {
          // Sole owner and last member -> delete entire class + related data
          type Statement = { sql: string; args?: (string | null | undefined)[] };
          const cascading: Statement[] = [
            { sql: `DELETE FROM user_class WHERE class_id = ?`, args: [class_id] },
            { sql: `DELETE FROM color WHERE class_id = ?`, args: [class_id] },
            { sql: `DELETE FROM timetable_week WHERE class_id = ?`, args: [class_id] },
            { sql: `DELETE FROM invitation WHERE class_id = ?`, args: [class_id] },
          ];
          for (const c of cascading) {
            const argsFiltered: (string | null)[] | undefined = c.args
              ? c.args.filter((v): v is string | null => v !== undefined)
              : undefined;
            try { await turso.execute(c.sql, argsFiltered); } catch (e) { console.warn("Cascade delete failure", c.sql, e); }
          }
          await turso.execute(`DELETE FROM class WHERE id = ?`, [class_id]);
          return NextResponse.json({ left: true, deletedClass: true });
        }
        // Transfer ownership to first remaining member (pref order admins>members)
        const promotionRes = await turso.execute(
          `SELECT user_id FROM user_class WHERE class_id = ? AND user_id <> ? ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'member' THEN 1 ELSE 2 END, user_id LIMIT 1`,
          [class_id, authUserId],
        );
        const nextOwner = (promotionRes.rows[0] as { user_id?: string } | undefined)?.user_id;
        if (!nextOwner) {
          console.error("Unexpected: No next owner found despite having other members");
          return NextResponse.json({ error: "Failed to transfer ownership" }, { status: 500 });
        }
        await turso.execute(`UPDATE user_class SET role = 'owner' WHERE user_id = ? AND class_id = ?`, [nextOwner, class_id]);
  await turso.execute(`DELETE FROM user_class WHERE user_id = ? AND class_id = ?`, [authUserId, class_id]);
        return NextResponse.json({ left: true, newOwnerId: nextOwner });
      }
  await turso.execute(`DELETE FROM user_class WHERE user_id = ? AND class_id = ?`, [authUserId, class_id]);
      return NextResponse.json({ left: true });
    }

    // administrative removal
    if (requesterRole === "owner") {
      if (targetRole === "owner") {
        return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
      }
      await turso.execute(`DELETE FROM user_class WHERE user_id = ? AND class_id = ?`, [target_user_id, class_id]);
      return NextResponse.json({ removed: true });
    }

    if (requesterRole === "admin") {
      if (targetRole !== "member") {
        return NextResponse.json({ error: "Admins can remove members only" }, { status: 403 });
      }
      await turso.execute(`DELETE FROM user_class WHERE user_id = ? AND class_id = ?`, [target_user_id, class_id]);
      return NextResponse.json({ removed: true });
    }

    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'Unauthenticated') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Error removing member" }, { status: 500 });
  }
}

// PATCH /api/class/member
// body: { class_id, target_user_id, role: "admin" | "member" }
export async function PATCH(req: NextRequest) {
  try {
  const userId = requireAuthUserId(req);
    const { class_id, target_user_id, role } = await req.json();
    if (!class_id || !target_user_id || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const reqRes = await turso.execute(
      `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
  [userId, class_id],
    );
    const requesterRole = (reqRes.rows[0] as { role?: string } | undefined)?.role;
    if (!requesterRole) {
      return NextResponse.json({ error: "Requester is not a member" }, { status: 403 });
    }

    const tgtRes = await turso.execute(
      `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
      [target_user_id, class_id],
    );
    const targetRole = (tgtRes.rows[0] as { role?: string } | undefined)?.role;
    if (!targetRole) {
      return NextResponse.json({ error: "Target is not a member" }, { status: 404 });
    }
    if (targetRole === "owner") {
      return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 });
    }

    // Promotion to admin: allowed for owner or admin, only if target is member
    if (role === "admin") {
      if (!(requesterRole === "owner" || requesterRole === "admin")) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      if (targetRole !== "member") {
        return NextResponse.json({ error: "Only members can be promoted" }, { status: 400 });
      }
    }

    // Demotion to member: only owner can demote admins
    if (role === "member") {
      if (requesterRole !== "owner") {
        return NextResponse.json({ error: "Only owner can demote admins" }, { status: 403 });
      }
      if (targetRole !== "admin") {
        return NextResponse.json({ error: "Only admins can be demoted" }, { status: 400 });
      }
    }

    await turso.execute(
      `UPDATE user_class SET role = ? WHERE user_id = ? AND class_id = ?`,
      [role, target_user_id, class_id],
    );

    return NextResponse.json({ updated: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'Unauthenticated') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Error updating member role" }, { status: 500 });
  }
}

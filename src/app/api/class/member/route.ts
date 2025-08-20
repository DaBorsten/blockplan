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

// GET /api/class/member?class_id=&current_user_id=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const current_user_id = searchParams.get("current_user_id") || undefined;
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

    let currentRole: string | null = null;
    if (current_user_id) {
      const roleRes = await turso.execute(
        `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
        [current_user_id, class_id],
      );
      currentRole = (roleRes.rows[0] as { role?: string } | undefined)?.role ?? null;
    }

    return NextResponse.json({ members, currentRole });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Error fetching members" }, { status: 500 });
  }
}

// DELETE /api/class/member?class_id=&target_user_id=&requester_id=
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const target_user_id = searchParams.get("target_user_id");
    const requester_id = searchParams.get("requester_id");
    if (!class_id || !target_user_id || !requester_id) {
      return NextResponse.json({ error: "Missing class_id, target_user_id, requester_id" }, { status: 400 });
    }

    // get requester role
    const reqRoleRes = await turso.execute(
      `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
      [requester_id, class_id],
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
    if (requester_id === target_user_id) {
      if (requesterRole === "owner") {
        return NextResponse.json({ error: "Owner cannot leave the class" }, { status: 400 });
      }
      await turso.execute(`DELETE FROM user_class WHERE user_id = ? AND class_id = ?`, [requester_id, class_id]);
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
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Error removing member" }, { status: 500 });
  }
}

// PATCH /api/class/member
// body: { class_id, target_user_id, requester_id, role: "admin" | "member" }
export async function PATCH(req: NextRequest) {
  try {
    const { class_id, target_user_id, requester_id, role } = await req.json();
    if (!class_id || !target_user_id || !requester_id || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const reqRes = await turso.execute(
      `SELECT role FROM user_class WHERE user_id = ? AND class_id = ? LIMIT 1`,
      [requester_id, class_id],
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
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Error updating member role" }, { status: 500 });
  }
}

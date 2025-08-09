import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
});

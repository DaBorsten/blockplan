import { createClient } from "@libsql/client";

export const turso = createClient({
  url: "libsql://127.0.0.1:8080",
});

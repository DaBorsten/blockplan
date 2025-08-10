import { ResultSet } from "@libsql/client";
export function mapRows(result: ResultSet) {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]])),
  );
}

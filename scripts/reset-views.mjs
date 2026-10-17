// Resets every profile view count to 0 by emptying page_views.
// View counts are derived from page_views rows, so truncating resets everyone.
//
// Usage:  npm run reset:views
// Uses DATABASE_URL from .env (dotenv-style parse, no dependency).
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const path of [".env", ".env.local"]) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    }
  } catch {
    // missing file — ignore
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Put it in .env then run: npm run reset:views");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const [{ count }] = await sql`SELECT count(*)::int AS count FROM page_views`;
await sql`TRUNCATE page_views`;
console.log(`Deleted ${count} page view rows — every profile is back to 0.`);

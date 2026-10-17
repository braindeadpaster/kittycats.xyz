import { SignJWT } from "jose";
import { neon } from "@neondatabase/serverless";
process.loadEnvFile();

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret-change-me");
const sql = neon(process.env.DATABASE_URL.replace("channel_binding=require", ""));
const username = process.argv[2] ?? "h";
const rows = await sql`SELECT id, username FROM users WHERE username = ${username} LIMIT 1`;
if (!rows.length) { console.error("no user"); process.exit(1); }
const { id } = rows[0];
const token = await new SignJWT({}).setSubject(String(id)).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
console.log(`session=${token}`);
console.log(`uid=${id} user=${rows[0].username}`);

import { jwtVerify } from "jose";
process.loadEnvFile();
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret-change-me");
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzkyMjUyNzgxfQ.cbmZ7gKkRfM8bosuycpz7jhb4-yPkU2x8SducZD4y88";
try {
  const { payload } = await jwtVerify(token, secret);
  console.log("OK", payload);
} catch (e) {
  console.log("FAIL", e.message);
}

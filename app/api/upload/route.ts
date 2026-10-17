import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const KIM_API_KEY = process.env.KIM_API_KEY;
const KIM_BASE_URL = "https://zzz.cried.online";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawType = String(formData.get("type") ?? "").trim().toLowerCase();
  const normalizedType = ["icon", "custom"].includes(rawType)
    ? "avatar"
    : rawType;

  if (!file || !["avatar", "background", "banner", "cursor"].includes(normalizedType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!KIM_API_KEY) {
    return NextResponse.json(
      { error: "Uploads are not configured (missing KIM_API_KEY)." },
      { status: 500 }
    );
  }

  const MAX_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is too large (${(file.size / 1048576).toFixed(1)} MB). Max is 25 MB.` },
      { status: 413 }
    );
  }

  // Non-ASCII filenames break outgoing headers — send a safe fallback.
  const safeName = (file.name || "upload").replace(/[^\x20-\x7E]/g, "_").slice(0, 120) || "upload";

  try {
    const response = await fetch(`${KIM_BASE_URL}/v1/upload`, {
      method: "POST",
      headers: {
        "x-kim-api-key": KIM_API_KEY,
        "x-kim-mode": "moe",
        "x-kim-visibility": "public",
        "x-filename": safeName,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let message = `Storage provider rejected the upload (${response.status}).`;
      try {
        const errorData = JSON.parse(text) as { error?: { message?: string } | string };
        const detail =
          typeof errorData?.error === "string"
            ? errorData.error
            : errorData?.error?.message;
        if (detail) message = `Storage provider: ${detail}`;
      } catch {
        if (text) message = `Storage provider (${response.status}): ${text.slice(0, 200)}`;
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      data?: { url?: string };
    } | null;
    if (!result?.success || !result?.data?.url) {
      return NextResponse.json({ error: "Unexpected response from storage provider" }, { status: 500 });
    }

    return NextResponse.json({ url: result.data.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Upload failed: ${error.message}` : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Extract file key from URL
    // KIM URLs are typically: https://zzz.cried.online/FILE_KEY
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1); // Remove leading slash

    if (!key) {
      return NextResponse.json({ error: "Could not extract file key from URL" }, { status: 400 });
    }

    const response = await fetch(`${KIM_BASE_URL}/v1/delete`, {
      method: "DELETE",
      headers: {
        "x-kim-api-key": KIM_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || "Deletion from storage provider failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

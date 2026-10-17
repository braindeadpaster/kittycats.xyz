"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal, { modalGhostBtn, modalPrimaryBtn } from "./modal";
import SliderRow from "./slider-row";

const CROP_SIZE = 512;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export default function UploadDialog({
  open,
  title,
  type,
  onClose,
  onUploaded,
}: {
  open: boolean;
  title?: string;
  type: "avatar" | "background" | "banner" | "cursor";
  onClose: () => void;
  onUploaded: (url: string) => void;
}) {
  const heading =
    title ?? (type === "avatar" ? "Edit Avatar" : type === "background" ? "Change Background" : "Change Custom Cursor");
  const accept = type === "background" ? "image/*,video/*" : "image/*,.cur,.ani";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isVideo = !!file && file.type.startsWith("video/");

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setZoom(1);
      setRotation(0);
      setUrl("");
      setError("");
      setUploading(false);
    }
  }, [open ]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = useCallback((f: File | undefined) => {
    if (!f) return;
    setError("");
    setZoom(1);
    setRotation(0);
    setFile(f);
    setPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const uploadBlob = useCallback(
    async (blob: Blob, name: string) => {
      const form = new FormData();
      form.append("file", blob, name);
      form.append("type", type);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!data?.url) throw new Error(data?.error ?? "Upload failed. Please try again.");
      onUploaded(data.url);
      onClose();
    },
    [type, onUploaded, onClose]
  );

  const confirm = useCallback(async () => {
    setError("");
    if (type === "avatar" && file && !isVideo && imgRef.current && preview) {
      setUploading(true);
      try {
        const img = imgRef.current;
        await img.decode().catch(() => {});
        const canvas = document.createElement("canvas");
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not crop.");
        const cover = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
        ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.drawImage(
          img,
          (-img.naturalWidth * cover) / 2,
          (-img.naturalHeight * cover) / 2,
          img.naturalWidth * cover,
          img.naturalHeight * cover
        );
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (!blob) throw new Error("Could not crop.");
        await uploadBlob(blob, "avatar.png");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not apply avatar.");
      } finally {
        setUploading(false);
      }
      return;
    }
    if (file) {
      setUploading(true);
      try {
        await uploadBlob(file, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
      return;
    }
    const trimmed = url.trim();
    if (!trimmed) return;
    onUploaded(trimmed);
    onClose();
  }, [file, isVideo, preview, rotation, zoom, url, uploadBlob, onUploaded, onClose]);

  const showCrop = type === "avatar" && file && !isVideo && preview;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={heading}
      maxWidth="max-w-sm"
    >
      {!file ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0]);
          }}
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-[#2a2a2a] bg-[#0d0d0d] p-6 text-center transition hover:border-[#3a3a3a]"
        >
          <span className="text-[28px] text-[#5a5a5a]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
          <p className="m-0 text-[14px] font-medium text-[#909090]">
            Click or drop a file to upload
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div>
          {showCrop ? (
            <div>
              <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-lg border-2 border-[#222] bg-[#0d0d0d]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Avatar crop preview"
                  draggable={false}
                  className="pointer-events-none absolute max-h-none max-w-none"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${zoom})`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/[0.07]" />
                  ))}
                </div>
              </div>
              <p className="m-0 mt-2 text-center text-[12px] text-[#8a8a8a]">
                Scroll to zoom and hold Shift + scroll to rotate.
              </p>
              <div className="mt-4 flex flex-col gap-5">
                <SliderRow
                  label="Zoom"
                  info="How far zoomed in the avatar crop is."
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(v) => setZoom(clamp(Math.round(v * 100) / 100, 1, 4))}
                  unit="x"
                  formatValue={(v) => `${v.toFixed(2)}x`}
                  infoPlace="bottom"
                />
                <SliderRow
                  label="Rotation"
                  info="Rotate the avatar crop."
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={setRotation}
                  unit=" deg"
                  formatValue={(v) => `${Math.round(v)} deg`}
                  infoPlace="bottom"
                />
              </div>
            </div>
          ) : isVideo ? (
            <video src={preview ?? undefined} controls className="max-h-[220px] w-full rounded-md border border-[#222] bg-black" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview ?? undefined} alt="Upload preview" className="max-h-[220px] w-full rounded-md border border-[#222] object-cover" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>
      )}

      <div className="mt-4 space-y-2">
        <label className="block text-[13px] font-medium leading-none text-[#c9c9c9]">
          Or paste a URL
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://cdn.example.com/uploads/example.png"
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded-md border-2 border-transparent bg-[#0c0c0c] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#555] hover:border-[#1e1e1e] focus:border-[#2a2a2a]"
        />
      </div>

      {error ? <p className="m-0 mt-2 text-[13px] text-[#f87171]">{error}</p> : null}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={confirm} disabled={uploading || (!file && !url.trim())} className={`${modalPrimaryBtn} flex-1`}>
          {uploading ? "Uploading…" : type === "avatar" && file ? "Apply Avatar" : "Confirm"}
        </button>
        <button type="button" onClick={onClose} className={`${modalGhostBtn} flex-1`}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

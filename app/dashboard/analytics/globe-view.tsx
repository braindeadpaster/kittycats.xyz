"use client";

import { useEffect, useRef } from "react";
import type { GlobePoint } from "./page";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function GlobeView({ points }: { points: GlobePoint[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const pointsRef = useRef<GlobePoint[]>(points);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const el = mountRef.current;
    if (!el) return;

    (async () => {
      const mod: any = await import("globe.gl");
      if (cancelled || !mountRef.current) return;
      const Globe = mod.default ?? mod.Globe ?? mod;

      const build = () => {
        const w = mountRef.current?.clientWidth ?? 600;
        return Globe(mountRef.current)
          .width(w)
          .height(Math.round(Math.min(520, Math.max(320, w * 0.72))))
          .backgroundColor("rgba(0,0,0,0)")
          .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
          .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
          .showAtmosphere(true)
          .atmosphereColor("#f472b6")
          .atmosphereAltitude(0.18)
          .pointsData(pointsRef.current)
          .pointLat((d: any) => (d as GlobePoint).lat)
          .pointLng((d: any) => (d as GlobePoint).lng)
          .pointColor(() => "#f472b6")
          .pointAltitude(0.02)
          .pointRadius((d: any) => {
            const c = (d as GlobePoint).count ?? 1;
            return 0.25 + Math.min(1, Math.log10(c + 1) / 2);
          })
          .pointLabel(
            (d: any) =>
              `<div style="font:600 12px Montserrat,sans-serif;color:#fff;background:#18181bcc;border:1px solid #f472b655;border-radius:8px;padding:4px 8px">${(d as GlobePoint).country} · ${(d as GlobePoint).count} views</div>`
          );
      };

      globeRef.current = build();
      try {
        const controls = globeRef.current.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.9;
        controls.enableZoom = true;
        controls.minDistance = 140;
        controls.maxDistance = 600;
      } catch {
        // ignore
      }

      observer = new ResizeObserver(() => {
        const g = globeRef.current;
        const node = mountRef.current;
        if (!g || !node) return;
        const w = node.clientWidth;
        if (w > 0) {
          g.width(w);
          g.height(Math.round(Math.min(520, Math.max(320, w * 0.72))));
        }
      });
      observer.observe(el);
    })().catch(() => {
      // CDN texture failure — globe stays empty, lists below still render.
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      try {
        globeRef.current?._destructor?.();
      } catch {
        // ignore
      }
      globeRef.current = null;
      el.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    pointsRef.current = points;
    try {
      globeRef.current?.pointsData(points);
    } catch {
      // ignore
    }
  }, [points]);

  return (
    <div className="w-full overflow-hidden rounded-md border border-[#1e1e1e] bg-[#0a0a0a]">
      <div ref={mountRef} className="mx-auto w-full max-w-[640px] cursor-grab active:cursor-grabbing" />
      {points.length === 0 ? (
        <p className="m-0 pb-4 text-center text-[13px] text-[#707070]">
          No geo data yet — markers appear here once visitors arrive.
        </p>
      ) : null}
    </div>
  );
}

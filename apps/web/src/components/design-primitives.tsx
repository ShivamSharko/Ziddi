"use client";

import { usePathname } from "next/navigation";

export function CrosshairMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 6V2h4M14 2h4v4M18 14v4h-4M6 18H2v-4" stroke="var(--signal)" strokeWidth="2" />
      <circle cx="10" cy="10" r="2.5" fill="var(--signal)" />
    </svg>
  );
}

export function ShapeDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <clipPath id="petal4" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0 C0.8,0.2 0.8,0.2 1,0.5 C0.8,0.8 0.8,0.8 0.5,1 C0.2,0.8 0.2,0.8 0,0.5 C0.2,0.2 0.2,0.2 0.5,0 Z" />
        </clipPath>
        <clipPath id="blob1" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0.02 C0.85,0.05 0.98,0.3 0.95,0.55 C0.92,0.85 0.7,0.98 0.45,0.96 C0.2,0.94 0.03,0.75 0.05,0.48 C0.07,0.2 0.2,0.0 0.5,0.02 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function TechStamp() {
  const pathname = usePathname();
  const screen =
    pathname === "/"
      ? "HOME / INTAKE"
      : pathname === "/cases"
        ? "CASE INDEX"
        : pathname.startsWith("/cases/")
          ? "CASE FILE"
          : pathname.toUpperCase();
  return (
    <>
      <div className="fixed bottom-3 left-4 z-30 font-mono-data text-[10px] leading-relaxed text-[var(--text-2)] opacity-70 pointer-events-none whitespace-pre-line">
        {"ZIDDI — 2026\nCASE FILE UI · REDESIGN PASS 02\nREF FMC26-A1042"}
      </div>
      <div className="fixed bottom-3 right-4 z-30 font-mono-data text-[10px] tracking-[0.14em] text-[var(--signal)] opacity-80 pointer-events-none">
        {screen}
      </div>
    </>
  );
}


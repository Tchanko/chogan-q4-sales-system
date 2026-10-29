import { ImageResponse } from "next/og";
import { offer } from "@/content/offer";

export const alt = `${offer.name} — formation contenu et prospection pour consultants Chogan, du ${offer.cohort.startLabel} au ${offer.cohort.endLabel}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#111111",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#00D9FF",
              color: "#111111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            Q4
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>CHOGAN Q4</div>
            <div style={{ fontSize: 24, letterSpacing: 6, color: "#A9B0B6" }}>SALES SYSTEM</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            30 jours pour construire ton système de contenu et de prospection
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 28, color: "#A9B0B6" }}>
            <span style={{ color: "#FFD400" }}>●</span>
            <span>{`Du ${offer.cohort.startLabel.replace(" 2026", "")} au ${offer.cohort.endLabel} · 4 sessions par semaine · 100 % pratique`}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

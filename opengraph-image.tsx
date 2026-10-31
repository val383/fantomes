import { ImageResponse } from "next/og";

export const alt =
  "Fantômes : débusque les abonnements que tu paies sans t'en servir";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14284B",
          color: "#F2F4F5",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
          Fantômes
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
          }}
        >
          Des petits prélèvements. Des centaines d&apos;euros par an.
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: "#FFD84D",
              color: "#14284B",
              fontSize: 36,
              fontWeight: 700,
              padding: "12px 24px",
            }}
          >
            Débusque les abonnements oubliés
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

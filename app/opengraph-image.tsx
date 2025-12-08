import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const alt = "Chat App - Real-time Messaging";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
              marginRight: 30,
            }}
          >
            💬
          </div>
        </div>
        <div style={{ fontSize: 72, fontWeight: "bold", marginBottom: 20 }}>
          Chat App
        </div>
        <div style={{ fontSize: 36, opacity: 0.9 }}>
          Real-time Messaging Platform
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

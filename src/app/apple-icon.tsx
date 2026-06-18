import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e11d48 0%, #ff4d6d 50%, #ffb3c6 100%)",
          borderRadius: 36,
          fontSize: 96,
        }}
      >
        🍓
      </div>
    ),
    { ...size }
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heart Maxxxxing — Cardiac Rehab Quest",
  description:
    "A gamified cardiac rehabilitation journey. Complete 36 sessions, grow your heart, and prove that recovery is an adventure worth taking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-sky-900 text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROOM GAMES",
  description: "Multiplayer room based games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

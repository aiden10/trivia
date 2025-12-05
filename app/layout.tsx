import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mTrivia",
  description: "A Multiplayer Trivia Game using questions from 'Who Wants to Be A Millionaire'",
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

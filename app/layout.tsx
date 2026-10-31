import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantômes",
  description: "Débusque les abonnements que tu paies sans t'en servir.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

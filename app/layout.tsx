import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

const titre = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-titre",
  display: "swap",
});

const texte = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-texte",
  display: "swap",
});

const adresse = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const titrePage =
  "Fantômes : débusque les abonnements que tu paies sans t'en servir";
const description =
  "Dépose ton relevé bancaire : on repère les abonnements oubliés, classés par coût annuel, et on te prépare la lettre pour les résilier.";

export const metadata: Metadata = {
  metadataBase: new URL(adresse),
  title: titrePage,
  description,
  openGraph: {
    title: titrePage,
    description,
    siteName: "Fantômes",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14284B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${titre.variable} ${texte.variable}`}>
      <body className="bg-[#F2F4F5] text-[#14284B] antialiased [font-family:var(--font-texte),system-ui,sans-serif]">
        {children}
      </body>
    </html>
  );
}

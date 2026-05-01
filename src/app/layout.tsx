import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://4tercios.thefndrs.com"),
  title: {
    default: "4Tercios",
    template: "%s | 4Tercios",
  },
  description:
    "4Tercios te ayuda a publicar galerias de eventos, compartir links y vender fotos por busqueda con selfie.",
  applicationName: "4Tercios",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_HN",
    url: "https://4tercios.thefndrs.com",
    siteName: "4Tercios",
    title: "4Tercios",
    description:
      "Publica tu galeria, comparte un link y deja que cada cliente encuentre sus fotos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "4Tercios",
    description:
      "Publica tu galeria, comparte un link y deja que cada cliente encuentre sus fotos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Literata, Lora, Manrope, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});
const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  weight: ["400", "500", "600", "700"],
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
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
    <html
      lang="es"
      className={`${inter.variable} ${poppins.variable} ${lora.variable} ${spaceGrotesk.variable} ${literata.variable} ${manrope.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

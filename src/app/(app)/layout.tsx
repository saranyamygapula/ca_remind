import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";
import Providers from "@/components/Providers";
import NextTopLoader from "nextjs-toploader";
import { Header } from "@/components/layout/Header";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "RemindCA | Compliance & Reminder Management",
  description:
    "Automated compliance task and reminder management platform for CA firms.",
  icons: {
    icon: [
      {
        rel: "icon",
        type: "image/svg+xml",
        url: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        url: "/favicon/favicon-96x96.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/favicon/android-icon-192x192.png",
      },
      { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "36x36",
        url: "/favicon/android-icon-36x36.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "48x48",
        url: "/favicon/android-icon-48x48.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "72x72",
        url: "/favicon/android-icon-72x72.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "144x144",
        url: "/favicon/android-icon-144x144.png",
      },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/favicon/apple-icon.png" },
      { sizes: "57x57", url: "/favicon/apple-icon-57x57.png" },
      { sizes: "60x60", url: "/favicon/apple-icon-60x60.png" },
      { sizes: "72x72", url: "/favicon/apple-icon-72x72.png" },
      { sizes: "76x76", url: "/favicon/apple-icon-76x76.png" },
      { sizes: "114x114", url: "/favicon/apple-icon-114x114.png" },
      { sizes: "120x120", url: "/favicon/apple-icon-120x120.png" },
      { sizes: "144x144", url: "/favicon/apple-icon-144x144.png" },
      { sizes: "152x152", url: "/favicon/apple-icon-152x152.png" },
      { sizes: "180x180", url: "/favicon/apple-icon-180x180.png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/favicon/apple-icon-precomposed.png",
      },
    ],
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body
        className={`${manrope.className} min-h-screen bg-[var(--bg)] text-[var(--text-primary)] antialiased transition-colors duration-300`}
      >
        <NextTopLoader
          color="#c9a227"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #c9a227,0 0 5px #c9a227"
          zIndex={1600}
          showAtBottom={false}
        />

        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}

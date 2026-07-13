import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renewserv | India's Trusted Solar Lifecycle Service Platform",
  description: "Enterprise-grade solar panel cleaning, system dismantling, and diagnostic services in Pune & PCMC, Maharashtra.",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "google-site-verification-placeholder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

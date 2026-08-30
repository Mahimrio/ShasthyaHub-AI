import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import type { Language } from "@/types";

export const metadata: Metadata = {
  title: "ShasthyaHub-AI",
  description:
    "Multi-agent AI healthcare web app for rural Bangladesh — স্বাস্থ্যসেবা, সবার জন্য",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "স্বাস্থ্যহাব",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0EA5E9",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Language is resolved server-side from the cookie so the first paint is
  // already in the user's language (no BN→EN hydration flash).
  const cookieStore = await cookies();
  const stored = cookieStore.get("shasthya_lang")?.value;
  const initialLang: Language = stored === "en" ? "en" : "bn";

  return (
    <html lang={initialLang} className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans select-none">
        <Providers initialLang={initialLang}>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

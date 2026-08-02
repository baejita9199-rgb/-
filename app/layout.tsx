import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#08202a",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "ตำปูม้าคาเฟ่ | Food, Coffee, River & Music";
  const description =
    "ร้านอาหาร คาเฟ่ อาหารทะเล อาหารอีสาน และดนตรีสด บรรยากาศสบายริมสายน้ำ เสาธงเก่า หมู่ 2";

  return {
    title,
    description,
    icons: {
      icon: "/logo.jpg",
      shortcut: "/logo.jpg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "th_TH",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1672,
          height: 941,
          alt: "ตำปูม้าคาเฟ่ — Food, Coffee, River & Music",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V6 | Dilara Ceylan İçerik ve Büyüme Sistemi",
  description: "Dernek içerik performansı, yapay zekâ destekli üretim ve büyüme yönetimi."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

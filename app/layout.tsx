import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luminote - AI Light Show Generator",
  description: "Turn music into light with AI-powered Christmas light sequences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-text antialiased">
        {children}
      </body>
    </html>
  );
}

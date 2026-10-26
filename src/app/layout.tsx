import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneKhusa Payment Test",
  description: "OneKhusa Push Payment Test with Webhook Verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

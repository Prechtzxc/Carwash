import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RinsePoint | Carwash Operations",
    template: "%s | RinsePoint",
  },
  description:
    "A clean foundation for customer check-in and carwash operations.",
  applicationName: "RinsePoint",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0d9f91",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

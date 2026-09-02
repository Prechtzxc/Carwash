import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RinsePoint | Carwash Operations",
    template: "%s | RinsePoint",
  },
  description:
    "A clean foundation for customer check-in and carwash operations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

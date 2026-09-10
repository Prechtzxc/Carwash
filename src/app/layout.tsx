import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
     default: "Cool Car Centrale | Carwash",
    template: "%s | Cool Car Centrale",
  },
  description:
    "Customer check-in and carwash management for Cool Car Centrale.",
  applicationName: "Cool Car Centrale",
  icons: {
    icon: "/img/logo.jpg",
    apple: "/img/logo.jpg",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4c400",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

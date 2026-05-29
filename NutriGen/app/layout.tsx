import { Providers } from "@/app/providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriGen",
  description: "AI-assisted diet planning and report workflow for dietitians."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

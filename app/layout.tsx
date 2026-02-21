import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "운명전쟁49",
  description: "운명전쟁49 - 사주팔자 웹 서비스"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import CommonLayout from "@/components/layout/common-layout";
import "./globals.css";
import UserOnboardingModal from "@/components/layout/OnboardingModal/UserOnboardingModal";

const mainFont = Open_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rediscord - Reimaginated Discord app",
  description:
    "A Rediscord is an open-source reimaginated discord in NextJS + TailwindCSS, built by igorpenaque.com",
};

export default function RootLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body className={mainFont.className + " dark"}>
        <CommonLayout />
        {children}
        <UserOnboardingModal />
      </body>
    </html>
  );
}

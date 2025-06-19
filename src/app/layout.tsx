import { AppFooter } from "@/src/components/app-footer";
import { AppNav } from "@/src/components/app-nav";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Smart Productivity Tracker for Teams | Voice-Based Daily Updates",
  description:
    "Optimize team productivity using voice updates, AI analysis, and real-time reports. Create departments, assign targets, and track progress effortlessly.",
};
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppNav />
          <main className="min-h-[80vh] flex flex-col flex-1">{children}</main>
          <AppFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

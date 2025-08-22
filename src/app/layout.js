import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleTranslate from "@/components/GoogleTranslate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Financial Health Dashboard",
  description: "Manage your finances smartly and achieve your goals",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

            {/* Google Translate Widget (visible everywhere) */}
        <div className="fixed top-9 right-9 z-50">
          <GoogleTranslate />
        </div>


        {children}
      </body>
    </html>
  );
}

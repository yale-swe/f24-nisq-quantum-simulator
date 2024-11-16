import localFont from "next/font/local";
import { Share_Tech_Mono } from 'next/font/google';
import "./globals.css";

// Local fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Google font
const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share-tech-mono', // Add this to use it as a CSS variable
});

export const metadata = {
  title: "Quantum Circuit Simulator",
  description: "Design and simulate quantum circuits in a noisy intermediate-scale quantum environment",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shareTechMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
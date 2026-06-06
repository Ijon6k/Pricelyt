import "./globals.css";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import ThemeToggle from "./components/ThemeToggle";
import Logo from "./components/Logo";
import AuthProvider from "./components/AuthProvider";
import HeaderAuth from "./components/HeaderAuth";
import PWARegister from "./components/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Pricelyt — Price Intelligence",
  description:
    "Track market prices, analyze trends, know when to buy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pricelyt",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-512.svg",
  },
};

export const viewport = {
  themeColor: "#1F4D3A",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <PWARegister />
        <AuthProvider>
          <header className="fixed top-0 inset-x-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
            <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 h-14 flex items-center justify-between">
              <Link href="/" className="no-underline">
                <Logo />
              </Link>
              <div className="flex items-center gap-3">
                <HeaderAuth />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="pt-14 flex flex-col flex-grow">
            <div className="flex-grow">{children}</div>

            <footer className="border-t border-[rgb(var(--border))] py-4 mt-20">
              <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]">
                <span>&copy; {new Date().getFullYear()} Pricelyt</span>
                <span>Market intelligence, simplified.</span>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

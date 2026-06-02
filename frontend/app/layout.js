import "./globals.css";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import ThemeToggle from "./components/ThemeToggle";
import Logo from "./components/Logo";
import AuthProvider from "./components/AuthProvider";
import HeaderAuth from "./components/HeaderAuth";

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
  title: "Pricelyt — Price intelligence",
  description:
    "Track any product's market price over time, with related news in one view.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <header className="fixed top-0 inset-x-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/90 backdrop-blur-sm">
            <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 h-16 flex items-center justify-between">
              <Link href="/" className="no-underline">
                <Logo />
              </Link>
              <div className="flex items-center gap-4">
                <HeaderAuth />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="pt-16 flex flex-col flex-grow">
            <div className="flex-grow">{children}</div>

            <footer className="border-t border-[rgb(var(--border))] py-6 mt-16">
              <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[rgb(var(--muted))]">
                <span>&copy; {new Date().getFullYear()} Pricelyt</span>
                <span className="flex items-center gap-2">
                  <span>Built with</span>
                  <a href="https://go.dev" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">Go</a>
                  <span className="ornament-dot" />
                  <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">Next.js</a>
                  <span className="ornament-dot" />
                  <a href="https://www.postgresql.org" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">PostgreSQL</a>
                </span>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

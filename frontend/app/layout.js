import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import Logo from "./components/Logo";
import AuthProvider from "./components/AuthProvider";
import HeaderAuth from "./components/HeaderAuth";

export const metadata = {
  title: "Pricelyt — Price intelligence",
  description:
    "Track any product's market price over time, with related news in one view.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <header className="fixed top-0 inset-x-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/90 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <a href="/" className="no-underline">
                <Logo />
              </a>
              <div className="flex items-center gap-4">
                <HeaderAuth />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="pt-16 flex flex-col flex-grow">
            <div className="flex-grow">{children}</div>

            <footer className="border-t border-[rgb(var(--border))] py-8 mt-16">
              <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[rgb(var(--muted))]">
                <span>&copy; {new Date().getFullYear()} Pricelyt</span>
                <span className="flex items-center gap-2">
                  <span>Built with</span>
                  <a href="https://go.dev" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">Go</a>
                  <span className="text-[rgb(var(--muted-lighter))]">·</span>
                  <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">Next.js</a>
                  <span className="text-[rgb(var(--muted-lighter))]">·</span>
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

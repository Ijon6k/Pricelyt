import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import Logo from "./components/Logo";
import AuthProvider from "./components/AuthProvider";
import HeaderAuth from "./components/HeaderAuth";

export const metadata = {
  title: "Pricelyt — Price & news intelligence",
  description:
    "Track any product's market price over time, with related news in one view.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <header className="fixed top-0 inset-x-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
              <a href="/" className="no-underline">
                <Logo />
              </a>
              <div className="flex items-center gap-3">
                <HeaderAuth />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="pt-14 flex flex-col flex-grow">
            <div className="flex-grow">{children}</div>

            <footer className="border-t border-[rgb(var(--border))] py-6 mt-12">
              <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[rgb(var(--muted))]">
                <span>&copy; {new Date().getFullYear()} Pricelyt. All rights reserved.</span>
                <span>
                  Built with{" "}
                  <a href="https://go.dev" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">Go</a>
                  {" "}·{" "}
                  <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--accent))] hover:underline">Next.js</a>
                  {" "}·{" "}
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

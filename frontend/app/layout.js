import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import Logo from "./components/Logo";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="fixed top-6 left-6 z-50">
          <Logo />
        </div>

        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}

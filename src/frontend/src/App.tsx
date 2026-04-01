import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  Info,
  LayoutDashboard,
  ListTodo,
  LogIn,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Definitions from "./pages/Definitions";
import Updates from "./pages/Updates";

type Page = "dashboard" | "updates" | "definitions" | "about";

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "updates", label: "Updates", icon: <ListTodo size={16} /> },
  { id: "definitions", label: "Definitions", icon: <BookOpen size={16} /> },
  { id: "about", label: "About", icon: <Info size={16} /> },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();

  const isAuthenticated = !!identity;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-xs">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <button
            type="button"
            onClick={() => setPage("dashboard")}
            className="flex items-center gap-2 font-extrabold text-xl text-app-charcoal hover:opacity-80 transition-opacity"
            data-ocid="header.link"
          >
            <TrendingUp size={24} className="text-app-green" />
            <span>Build Habits</span>
          </button>

          {/* Nav */}
          {isAuthenticated && (
            <nav className="flex items-center gap-1" data-ocid="nav.panel">
              {NAV_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  data-ocid={`nav.${item.id}.link`}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    page === item.id
                      ? "text-app-green border-b-2 border-app-green rounded-b-none pb-[6px]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Auth + CTA */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setPage("definitions")}
                  data-ocid="header.primary_button"
                  className="bg-app-charcoal text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <span className="text-base leading-none">+</span> New Habit
                </button>
                <button
                  type="button"
                  onClick={clear}
                  data-ocid="header.secondary_button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-all"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={login}
                disabled={isInitializing || isLoggingIn}
                data-ocid="header.primary_button"
                className="bg-app-green text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-60"
              >
                <LogIn size={14} />
                {isLoggingIn ? "Signing in..." : "Log In"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <TrendingUp size={40} className="text-app-green animate-pulse" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div
            className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center"
            data-ocid="login.panel"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-app-green/10 flex items-center justify-center">
                <TrendingUp size={32} className="text-app-green" />
              </div>
              <h2 className="text-2xl font-bold text-app-charcoal">
                Welcome to Build Habits
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Track your habits, measure your progress, and build a better
                you. Log in to get started.
              </p>
            </div>
            <button
              type="button"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
              className="bg-app-green text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 text-base disabled:opacity-60"
            >
              <LogIn size={18} />
              {isLoggingIn ? "Signing in..." : "Log In to Continue"}
            </button>
          </div>
        ) : (
          <>
            {page === "dashboard" && <Dashboard />}
            {page === "updates" && <Updates />}
            {page === "definitions" && <Definitions />}
            {page === "about" && <About />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-6 mt-8">
        <div className="max-w-[1200px] mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-app-green hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

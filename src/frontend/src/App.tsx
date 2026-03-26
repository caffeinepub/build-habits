import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  Info,
  LayoutDashboard,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
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

          {/* CTA */}
          <button
            type="button"
            onClick={() => setPage("definitions")}
            data-ocid="header.primary_button"
            className="bg-app-charcoal text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> New Habit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {page === "dashboard" && <Dashboard />}
        {page === "updates" && <Updates />}
        {page === "definitions" && <Definitions />}
        {page === "about" && <About />}
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

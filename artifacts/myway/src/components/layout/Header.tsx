import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, Menu, Bell, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/App";
import { useTheme } from "next-themes";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/students": "Students",
  "/students/new": "Add New Student",
  "/classes": "Classes",
  "/attendance": "Attendance",
  "/payments": "Fee Payments",
  "/results": "Exam Results",
  "/teachers": "Teachers",
  "/notices": "Notice Board",
  "/reports": "Reports",
  "/settings": "Settings",
  "/users": "User Management",
  "/profile": "My Profile",
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const getTitle = () => {
    if (location.startsWith("/students/") && location !== "/students/new") return "Student Profile";
    if (location.startsWith("/classes/")) return "Class Detail";
    return pageTitles[location] || "MYWAY";
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0 relative">
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <button
        data-testid="menu-toggle"
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="hidden sm:block">
        <h1 className="text-base font-bold text-foreground tracking-tight">{getTitle()}</h1>
        <p className="text-[11px] text-muted-foreground">{today}</p>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            data-testid="global-search"
            type="search"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-1.5 text-sm rounded-xl border border-input bg-muted/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all",
              "placeholder:text-muted-foreground/50"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          data-testid="notifications-btn"
          className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full ring-1 ring-background"></span>
        </button>

        {/* User avatar */}
        <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-muted/50 border border-border cursor-pointer hover:border-primary/40 transition-all">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 overflow-hidden">
            {user?.photo ? (
              <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-foreground leading-tight">{user?.fullName || "User"}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{user?.role || ""}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}

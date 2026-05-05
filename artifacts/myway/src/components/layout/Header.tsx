import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Menu, Bell, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const [search, setSearch] = useState("");

  const getTitle = () => {
    if (location.startsWith("/students/") && location !== "/students/new") return "Student Profile";
    if (location.startsWith("/classes/")) return "Class Detail";
    return pageTitles[location] || "MYWAY";
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button
        data-testid="menu-toggle"
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-base font-semibold text-foreground hidden sm:block">{getTitle()}</h1>

      <div className="flex-1 max-w-md mx-2 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-testid="global-search"
            type="search"
            placeholder="Search students, classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-input bg-background",
              "focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{today}</span>
        </div>
        <button
          data-testid="notifications-btn"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          AD
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Menu, Bell, Calendar, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/App";
import { setSessionUser } from "@/lib/storage";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

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

  const handleLogout = () => {
    setSessionUser(null);
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0 relative">
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

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-foreground leading-tight">{user?.fullName || "User"}</div>
              <div className="text-xs text-muted-foreground leading-tight">{user?.role || ""}</div>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="font-medium text-sm text-foreground">{user?.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user?.username}</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

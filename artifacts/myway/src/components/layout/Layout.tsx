import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, CalendarCheck, CreditCard, Menu as MenuIcon,
  BookOpen, FileText, Bell, GraduationCap, BarChart3, Library,
  Settings, User as UserIcon, LogOut, ChevronRight, HelpCircle,
} from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/App";
import { setSessionUser, useStorageSync } from "@/lib/storage";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 720);
  const { user, logout } = useAuth();
  useStorageSync(["myway_users", "myway_session_user", "myway_settings"]);

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Close mobile menus on route change so the user always sees fresh content
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location]);

  const mobileNavItems = [
    { path: "/", label: "Home", icon: LayoutDashboard },
    { path: "/students", label: "Students", icon: Users },
    { path: "/attendance", label: "Attendance", icon: CalendarCheck },
    { path: "/payments", label: "Payments", icon: CreditCard },
  ];

  // Full navigation list shown inside the "More" sheet and the desktop Sidebar.
  // Role rules: hide admin-only items from non-admin users.
  const isAdmin = user && ["Super Admin", "Owner", "Operations Staff"].includes(user.role);
  const isSuperAdmin = user && ["Super Admin", "Owner"].includes(user.role);
  const isTeacher = user?.role === "Teacher";

  const fullNavItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, group: "Main" },
    { path: "/students", label: "Students", icon: Users, group: "Main", hideForTeacher: true },
    { path: "/classes", label: "Classes", icon: BookOpen, group: "Main", hideForTeacher: true },
    { path: "/attendance", label: "Attendance", icon: CalendarCheck, group: "Main" },
    { path: "/payments", label: "Fee Payments", icon: CreditCard, group: "Main", hideForTeacher: true },
    { path: "/results", label: "Exam Results", icon: FileText, group: "Main" },
    { path: "/subjects", label: "Subjects", icon: Library, group: "Main", hideForTeacher: true },
    { path: "/teachers", label: "Teachers", icon: GraduationCap, group: "Main", hideForTeacher: true },
    { path: "/payroll", label: "Teacher Payroll", icon: FileText, group: "Main", hideForTeacher: true },
    { path: "/expenses", label: "Expenses", icon: FileText, group: "Main", hideForTeacher: true },
    { path: "/notices", label: "Notice Board", icon: Bell, group: "Main" },
    { path: "/reports", label: "Reports", icon: BarChart3, group: "Main", hideForTeacher: true },
    { path: "/users", label: "Users", icon: Users, group: "Account", show: !!isAdmin },
    { path: "/profile", label: "My Profile", icon: HelpCircle, group: "Account", show: true },
    { path: "/settings", label: "Settings", icon: Settings, group: "Account", show: !!isSuperAdmin },
  ];

  const visibleNavItems = fullNavItems.filter(item => {
    if (item.hideForTeacher && isTeacher) return false;
    if (item.show === false) return false;
    return true;
  });

  const handleLogout = () => {
    setSessionUser(null);
    logout();
    setMoreOpen(false);
    setMobileOpen(false);
    setLocation("/");
  };

  const BOTTOM_NAV_HEIGHT = 60;

  return (
    <div
      style={{ height: `${vh}px`, width: "100%", display: "flex", flexDirection: "row", overflow: "hidden", position: "relative" }}
      className="bg-background"
    >
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
          className="lg:hidden"
        />
      )}

      {/* Sidebar - desktop only */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>

      {/* Sidebar - mobile drawer (explicit height ensures the bottom section with Users / My Profile / Settings is never cut off) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: `${vh}px`,
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
        }}
        className="lg:hidden shadow-2xl"
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavItemClick={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: `${vh}px`, overflow: "hidden" }}>
        <Header onMenuToggle={() => setMobileOpen(v => !v)} />

        {/* Scrollable page content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: `${BOTTOM_NAV_HEIGHT + 8}px`,
            WebkitOverflowScrolling: "touch",
          }}
          className="p-3 sm:p-4 md:p-6 lg:pb-6"
        >
          {children}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${BOTTOM_NAV_HEIGHT}px`,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
          }}
          className="lg:hidden bg-card border-t border-border shadow-lg"
        >
          {mobileNavItems.map(({ path, label, icon: Icon }) => {
            const active = (path === "/" && (location === "/" || location === "/index.html")) || (path !== "/" && location.startsWith(path));
            return (
              <Link
                key={path}
                href={path}
                onClick={() => setMobileOpen(false)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 2px", textDecoration: "none", cursor: "pointer" }}
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon style={{ width: 20, height: 20, marginBottom: 2 }} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Quick Profile link in bottom bar so "My Profile" is always one tap away */}
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 2px", textDecoration: "none", cursor: "pointer" }}
            className={cn(
              "text-[11px] font-medium transition-colors",
              location.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <UserIcon style={{ width: 20, height: 20, marginBottom: 2 }} />
            <span>Profile</span>
          </Link>

          {/* "More" button opens a bottom Sheet that lists ALL navigation items, including Users and Settings */}
          <button
            onClick={() => setMoreOpen(true)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 2px", background: "none", border: "none", cursor: "pointer" }}
            className={cn(
              "text-[11px] font-medium transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MenuIcon style={{ width: 20, height: 20, marginBottom: 2 }} />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* "More" bottom Sheet — shows every navigation entry, including Users, My Profile, Settings */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-left">All Menu</SheetTitle>
            <SheetDescription className="text-left">
              Browse every section of the institute management system.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {(() => {
              const groups = Array.from(new Set(visibleNavItems.map(i => i.group)));
              return groups.map(group => (
                <div key={group} className="mb-3">
                  <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {group === "Account" ? "Account & System" : "Main Menu"}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {visibleNavItems.filter(i => i.group === group).map(({ path, label, icon: Icon }) => {
                      const active = path === "/" ? location === "/" || location === "/index.html" : location.startsWith(path);
                      return (
                        <Link
                          key={path}
                          href={path}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-medium transition-colors",
                            active
                              ? "bg-primary/15 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon style={{ width: 22, height: 22 }} />
                          <span className="text-center leading-tight">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="border-t border-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button
              onClick={() => setMoreOpen(false)}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Close
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

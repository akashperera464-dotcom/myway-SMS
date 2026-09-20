import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, CalendarCheck, CreditCard, Menu as MenuIcon } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const mobileNavItems = [
    { path: "/", label: "Home", icon: LayoutDashboard },
    { path: "/students", label: "Students", icon: Users },
    { path: "/attendance", label: "Attendance", icon: CalendarCheck },
    { path: "/payments", label: "Payments", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen h-[100dvh] min-h-[100dvh] overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>

      {/* Sidebar - mobile drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 shadow-2xl",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavItemClick={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header onMenuToggle={() => setMobileOpen(v => !v)} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar for PWA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border flex items-center justify-around px-2 py-2 safe-area-bottom shadow-lg">
          {mobileNavItems.map(({ path, label, icon: Icon }) => {
            const active = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-0.5", active && "scale-110 text-primary")} />
                <span>{label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMobileOpen(v => !v)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[11px] font-medium transition-colors",
              mobileOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MenuIcon className="w-5 h-5 mb-0.5" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

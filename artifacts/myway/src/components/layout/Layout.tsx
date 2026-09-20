import { useState, useEffect } from "react";
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
  const [vh, setVh] = useState(window.innerHeight);

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

  const mobileNavItems = [
    { path: "/", label: "Home", icon: LayoutDashboard },
    { path: "/students", label: "Students", icon: Users },
    { path: "/attendance", label: "Attendance", icon: CalendarCheck },
    { path: "/payments", label: "Payments", icon: CreditCard },
  ];

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

      {/* Sidebar - mobile drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
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

          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 2px", background: "none", border: "none", cursor: "pointer" }}
            className={cn(
              "text-[11px] font-medium transition-colors",
              mobileOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MenuIcon style={{ width: 20, height: 20, marginBottom: 2 }} />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

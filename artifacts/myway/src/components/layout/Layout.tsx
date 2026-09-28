import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu as MenuIcon } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/App";
import { setSessionUser, useStorageSync } from "@/lib/storage";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  useStorageSync(["myway_users", "myway_session_user", "myway_settings"]);

  useEffect(() => {
    document.documentElement.classList.add("app-active");
    document.body.classList.add("app-active");
    return () => {
      document.documentElement.classList.remove("app-active");
      document.body.classList.remove("app-active");
    };
  }, []);

  // Close mobile drawer on route change so the user always sees fresh content
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    setSessionUser(null);
    logout();
    setMobileOpen(false);
    setLocation("/");
  };

  return (
    <div
      style={{ width: "100%", display: "flex", flexDirection: "row", overflow: "hidden" }}
      className="app-viewport bg-background pwa-shell"
    >
      {/* Mobile overlay (taps the drawer shut) */}
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
          top: "var(--safe-top)",
          left: "var(--safe-left)",
          height: "calc(100% - var(--safe-top))",
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
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Header onMenuToggle={() => setMobileOpen(v => !v)} />

        {/* Scrollable page content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
          className="p-3 sm:p-4 md:p-6 lg:pb-6 pwa-scroll-safe"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, CalendarCheck,
  CreditCard, FileText, Bell, GraduationCap,
  BarChart3, Settings, ChevronLeft, ChevronRight, School
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Students", icon: Users },
  { path: "/classes", label: "Classes", icon: BookOpen },
  { path: "/attendance", label: "Attendance", icon: CalendarCheck },
  { path: "/payments", label: "Fee Payments", icon: CreditCard },
  { path: "/results", label: "Exam Results", icon: FileText },
  { path: "/teachers", label: "Teachers", icon: GraduationCap },
  { path: "/notices", label: "Notice Board", icon: Bell },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center border-b border-sidebar-border", collapsed ? "px-3 py-4 justify-center" : "px-4 py-4 gap-3")}>
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <School className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm tracking-wider text-sidebar-foreground">MYWAY</div>
            <div className="text-xs text-sidebar-foreground/60">Educational Institute</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              className={cn(
                "flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="border-t border-sidebar-border p-2">
        <button
          data-testid="sidebar-toggle"
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

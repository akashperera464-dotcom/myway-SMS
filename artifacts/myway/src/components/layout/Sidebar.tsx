import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, CalendarCheck,
  CreditCard, FileText, Bell, GraduationCap,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  LogOut, HelpCircle, Library
} from "lucide-react";
import { useAuth } from "@/App";
import { setSessionUser, getSettings, useStorageSync } from "@/lib/storage";

const mainNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Students", icon: Users, hideForTeacher: true },
  { path: "/classes", label: "Classes", icon: BookOpen, hideForTeacher: true },
  { path: "/attendance", label: "Attendance", icon: CalendarCheck },
  { path: "/payments", label: "Fee Payments", icon: CreditCard, hideForTeacher: true },
  { path: "/results", label: "Exam Results", icon: FileText },
  { path: "/subjects", label: "Subjects", icon: Library, hideForTeacher: true },
  { path: "/teachers", label: "Teachers", icon: GraduationCap, hideForTeacher: true },
  { path: "/payroll", label: "Teacher Payroll", icon: FileText, hideForTeacher: true },
  { path: "/expenses", label: "Expenses", icon: FileText, hideForTeacher: true },
  { path: "/notices", label: "Notice Board", icon: Bell },
  { path: "/reports", label: "Reports", icon: BarChart3, hideForTeacher: true },
];

const bottomNavItems = [
  { path: "/users", label: "Users", icon: Users, role: ['Super Admin', 'Owner', 'Operations Staff'] },
  { path: "/profile", label: "My Profile", icon: HelpCircle },
  { path: "/settings", label: "Settings", icon: Settings, role: ['Super Admin', 'Owner'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavItemClick?: () => void;
}

export default function Sidebar({ collapsed, onToggle, onNavItemClick }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const settings = getSettings();
  // Re-render when users list or session user changes so role-based nav items stay accurate
  useStorageSync(["myway_users", "myway_session_user", "myway_settings"]);

  const handleLogout = () => {
    if (onNavItemClick) onNavItemClick();
    setSessionUser(null);
    logout();
  };

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 flex-shrink-0 relative",
        collapsed ? "w-[68px]" : "w-[220px]"
      )}
    >
      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[hsl(176_100%_44%_/_0.05)] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border relative z-10",
        collapsed ? "px-3 py-5 justify-center" : "px-5 py-5 gap-3"
      )}>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 glow-teal overflow-hidden">
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-foreground font-black text-sm tracking-tight">
              {(settings?.name || "MYWAY").substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        {!collapsed && (
          <div>
            <div className="font-extrabold text-sm tracking-widest text-white uppercase truncate max-w-[140px]">{settings?.name || "MYWAY"}</div>
            <div className="text-[10px] text-sidebar-foreground/50 tracking-wide">Educational Institute</div>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-0.5 px-2">
        {!collapsed && (
          <div className="px-3 pb-2 pt-1">
            <span className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">Main Menu</span>
          </div>
        )}
        {mainNavItems.map(({ path, label, icon: Icon, hideForTeacher }) => {
          if (hideForTeacher && user?.role === 'Teacher') return null;
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={() => onNavItemClick?.()}
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer group relative",
                collapsed && "justify-center",
                active
                  ? "bg-primary/15 text-primary font-semibold nav-active-glow"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn(
                "flex-shrink-0 transition-all duration-200",
                active ? "w-[18px] h-[18px] text-primary" : "w-[17px] h-[17px]",
                !active && "group-hover:scale-110"
              )} />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section — kept visible at all times via flex-shrink-0 so Users / My Profile / Settings are never clipped on small screens */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-0.5 flex-shrink-0 bg-sidebar">
        {bottomNavItems.map(({ path, label, icon: Icon, role }) => {
          if (role && user && !role.includes(user.role)) return null;
          
          const active = location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={() => onNavItemClick?.()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer",
                collapsed && "justify-center",
                active
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-[17px] h-[17px] flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-red-400/70 hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Toggle */}
        <button
          data-testid="sidebar-toggle"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-center py-2 mt-1 rounded-xl text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

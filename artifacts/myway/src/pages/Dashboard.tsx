import { Link } from "wouter";
import {
  Users, BookOpen, CreditCard, CalendarCheck,
  ArrowRight, Bell, GraduationCap, TrendingUp,
  TrendingDown, AlertCircle, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { getStudents, getClasses, getPayments, getAttendance, getNotices, getTeachers } from "@/lib/storage";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/utils";
import { useAuth } from "@/App";

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, variant, trend
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  variant: "teal" | "gold" | "pink" | "purple";
  trend?: { value: string; up: boolean };
}) {
  const variantClasses = {
    teal:   { card: "stat-card-teal",   icon: "bg-primary/20 text-primary",    glow: "glow-teal" },
    gold:   { card: "stat-card-gold",   icon: "bg-secondary/20 text-secondary", glow: "glow-gold" },
    pink:   { card: "stat-card-pink",   icon: "bg-accent/20 text-accent",       glow: "glow-pink" },
    purple: { card: "stat-card-purple", icon: "bg-purple-500/20 text-purple-400", glow: "" },
  };
  const v = variantClasses[variant];

  return (
    <div className={`${v.card} rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}>
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/3 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${v.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? "text-green-400" : "text-red-400"}`}>
            {trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-extrabold text-foreground tracking-tight">{value}</div>
        <div className="text-sm font-medium text-foreground/80 mt-0.5">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Calendar Mini Component ──────────────────────────────────────────────────
function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthName = today.toLocaleString("en", { month: "long" });

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">{monthName} {year}</h3>
        <Link href="/attendance" className="text-xs text-primary hover:underline flex items-center gap-1">
          View <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`text-center text-[11px] py-1.5 rounded-lg cursor-default transition-colors ${
              day === today.getDate()
                ? "bg-primary text-primary-foreground font-bold glow-teal"
                : day
                ? "text-foreground/70 hover:bg-muted hover:text-foreground"
                : ""
            }`}
          >
            {day || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="font-semibold text-foreground">
            {typeof p.value === "number" && p.value > 999
              ? formatCurrency(p.value)
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const students = getStudents();
  const classes = getClasses();
  const payments = getPayments();
  const attendance = getAttendance();
  const notices = getNotices();
  const teachers = getTeachers();

  const currentMonth = getCurrentMonth();
  const activeStudents = students.filter(s => s.status === "Active");
  const activeClasses = classes.filter(c => c.status === "Active");

  const thisMonthPayments = payments.filter(p => p.month === currentMonth && p.status === "Paid");
  const pendingPayments = payments.filter(p => p.month === currentMonth && p.status === "Pending");
  const totalCollected = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  const recent = attendance.slice(-10);
  const totalPresent = recent.reduce((sum, a) => sum + a.records.filter(r => r.status === "Present").length, 0);
  const totalRecords = recent.reduce((sum, a) => sum + a.records.length, 0);
  const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  // Fee chart - last 6 months
  const feeChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const collected = payments
      .filter(p => p.month === month && p.status === "Paid")
      .reduce((s, p) => s + p.amount, 0);
    const pending = payments
      .filter(p => p.month === month && p.status === "Pending")
      .reduce((s, p) => s + p.amount, 0);
    return { month: d.toLocaleString("en", { month: "short" }), collected, pending };
  });

  // Grade distribution for pie chart
  const gradeCount: Record<string, number> = {};
  students.forEach(s => {
    const g = s.grade.split(" ").slice(0, 2).join(" ");
    gradeCount[g] = (gradeCount[g] || 0) + 1;
  });
  const pieData = Object.entries(gradeCount)
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["hsl(176,100%,44%)", "hsl(43,100%,54%)", "hsl(328,90%,60%)", "hsl(260,80%,65%)"];

  // Recent payments
  const recentPayments = payments
    .filter(p => p.status === "Paid")
    .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
    .slice(0, 5);

  const firstName = user?.fullName?.split(" ")[0] || "Admin";

  return (
    <div className="space-y-5">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-[hsl(222,47%,12%)] to-[hsl(222,47%,9%)] border border-border">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-16 w-40 h-40 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h2 className="text-xl font-extrabold text-foreground">Hello, {firstName}!</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Here's what's happening at MYWAY today. You have{" "}
            <span className="text-primary font-semibold">{pendingPayments.length} pending payments</span>{" "}
            and <span className="text-secondary font-semibold">{notices.length} active notices</span>.
          </p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/students/new"
              className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity glow-teal"
            >
              + Add Student
            </Link>
            <Link
              href="/payments"
              className="px-4 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors border border-border"
            >
              View Payments
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Students"
          value={activeStudents.length}
          sub={`${students.length} total enrolled`}
          icon={Users}
          variant="teal"
          trend={{ value: "+4%", up: true }}
        />
        <StatCard
          title="Active Classes"
          value={activeClasses.length}
          sub={`${teachers.length} teachers`}
          icon={BookOpen}
          variant="gold"
          trend={{ value: "+1", up: true }}
        />
        <StatCard
          title="Fees Collected"
          value={formatCurrency(totalCollected)}
          sub={`${pendingPayments.length} pending`}
          icon={CreditCard}
          variant="pink"
          trend={{ value: `${pendingPayments.length}`, up: false }}
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          sub="Last 10 sessions"
          icon={CalendarCheck}
          variant="purple"
          trend={{ value: "+2%", up: true }}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground text-sm">Fee Collection Overview</h3>
              <p className="text-xs text-muted-foreground">Collected vs Pending – last 6 months</p>
            </div>
            <Link href="/reports" className="text-xs text-primary hover:underline flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-full min-w-0 h-[200px]">
            <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={200}>
              <BarChart data={feeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 30% 14%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(215 20% 52%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 52%)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(215 30% 14% / 0.5)" }} />
                <Bar dataKey="collected" fill="hsl(176,100%,44%)" radius={[6, 6, 0, 0]} name="Collected" />
                <Bar dataKey="pending" fill="hsl(43,100%,54%)" radius={[6, 6, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Collected
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" /> Pending
            </div>
          </div>
        </div>

        {/* Pie chart - grade distribution */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 min-w-0">
          <div className="mb-3">
            <h3 className="font-bold text-foreground text-sm">Students by Grade</h3>
            <p className="text-xs text-muted-foreground">Distribution overview</p>
          </div>
          {pieData.length > 0 ? (
            <div className="w-full min-w-0 h-[180px]">
              <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          )}
          <div className="space-y-1.5 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions / Payments */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground text-sm">Recent Payments</h3>
              <p className="text-xs text-muted-foreground">Latest fee transactions</p>
            </div>
            <Link href="/payments" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No payments recorded yet.</p>
            ) : recentPayments.map((p, idx) => {
              const student = students.find(s => s.id === p.studentId);
              const cls = classes.find(c => c.id === p.classId);
              const initials = student?.fullName
                ? student.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                : "??";
              const avatarColors = ["bg-primary/20 text-primary", "bg-secondary/20 text-secondary", "bg-accent/20 text-accent", "bg-purple-500/20 text-purple-400", "bg-green-500/20 text-green-400"];
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{student?.fullName || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{cls?.name} · {p.receiptNo}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-primary">{formatCurrency(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.paidDate)}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold border border-green-500/20">Paid</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column – Calendar + Notices */}
        <div className="space-y-4">
          <MiniCalendar />

          {/* Notices / Alerts */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground text-sm">Latest Notices</h3>
              <Link href="/notices" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {notices.slice(0, 3).map((n, i) => (
                <div key={n.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-3 h-3 text-accent" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground leading-snug">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{formatDate(n.createdAt)}</div>
                  </div>
                </div>
              ))}
              {notices.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No notices yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-foreground text-sm mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/students/new"
            className="px-4 py-2 bg-primary/15 text-primary text-xs font-semibold rounded-xl hover:bg-primary/25 transition-colors border border-primary/20"
            data-testid="quick-add-student"
          >
            + Add Student
          </Link>
          <Link
            href="/attendance"
            className="px-4 py-2 bg-secondary/15 text-secondary text-xs font-semibold rounded-xl hover:bg-secondary/25 transition-colors border border-secondary/20"
            data-testid="quick-mark-attendance"
          >
            Mark Attendance
          </Link>
          <Link
            href="/payments"
            className="px-4 py-2 bg-accent/15 text-accent text-xs font-semibold rounded-xl hover:bg-accent/25 transition-colors border border-accent/20"
            data-testid="quick-record-payment"
          >
            Record Payment
          </Link>
          <Link
            href="/notices"
            className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors border border-border"
            data-testid="quick-post-notice"
          >
            Post Notice
          </Link>
          <Link
            href="/reports"
            className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors border border-border"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

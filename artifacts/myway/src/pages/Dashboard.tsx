import { Link } from "wouter";
import { Users, BookOpen, CreditCard, CalendarCheck, Bell, ArrowRight, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getStudents, getClasses, getPayments, getAttendance, getNotices, getTeachers } from "@/lib/storage";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/utils";

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm font-medium text-foreground mt-0.5">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const students = getStudents();
  const classes = getClasses();
  const payments = getPayments();
  const attendance = getAttendance();
  const notices = getNotices();
  const teachers = getTeachers();

  const currentMonth = getCurrentMonth();
  const activeStudents = students.filter(s => s.status === 'Active');
  const activeClasses = classes.filter(c => c.status === 'Active');

  const thisMonthPayments = payments.filter(p => p.month === currentMonth && p.status === 'Paid');
  const pendingPayments = payments.filter(p => p.month === currentMonth && p.status === 'Pending');
  const totalCollected = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const recent = attendance.slice(-10);
  const totalPresent = recent.reduce((sum, a) => sum + a.records.filter(r => r.status === 'Present').length, 0);
  const totalRecords = recent.reduce((sum, a) => sum + a.records.length, 0);
  const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  const feeChartData = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (4 - i));
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const collected = payments.filter(p => p.month === month && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
    return { month: d.toLocaleString('en', { month: 'short' }), collected };
  });

  const gradeCount: Record<string, number> = {};
  students.forEach(s => {
    const g = s.grade.split(' ').slice(0, 2).join(' ');
    gradeCount[g] = (gradeCount[g] || 0) + 1;
  });
  const gradeData = Object.entries(gradeCount).map(([grade, count]) => ({ grade, count }));

  const recentPayments = payments.filter(p => p.status === 'Paid').sort((a, b) => b.paidDate.localeCompare(a.paidDate)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Welcome back!</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening at MYWAY today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Students" value={activeStudents.length} sub={`${students.length} total`} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard title="Active Classes" value={activeClasses.length} sub={`${teachers.length} teachers`} icon={BookOpen} color="bg-secondary/10 text-secondary" />
        <StatCard title="Collected This Month" value={formatCurrency(totalCollected)} sub={`${pendingPayments.length} pending`} icon={CreditCard} color="bg-green-100 text-green-700" />
        <StatCard title="Attendance Rate" value={`${attendanceRate}%`} sub="last 10 records" icon={CalendarCheck} color="bg-orange-100 text-orange-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Fee Collection</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={feeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Collected']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Students by Grade</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="grade" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Payments</h3>
            <Link href="/payments" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments yet.</p>
            ) : recentPayments.map(p => {
              const student = students.find(s => s.id === p.studentId);
              const cls = classes.find(c => c.id === p.classId);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{student?.fullName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{cls?.name} · {p.receiptNo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.paidDate)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {totalPending > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Pending Fees</span>
              </div>
              <div className="text-lg font-bold text-orange-700">{formatCurrency(totalPending)}</div>
              <div className="text-xs text-orange-600">{pendingPayments.length} students this month</div>
              <Link href="/payments" className="mt-2 text-xs text-orange-700 hover:underline flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Latest Notices</h3>
              <Link href="/notices" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {notices.slice(0, 3).map(n => (
                <div key={n.id} className="flex items-start gap-2 py-1.5">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-foreground leading-snug">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/students/new" className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity" data-testid="quick-add-student">Add Student</Link>
          <Link href="/attendance" className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity" data-testid="quick-mark-attendance">Mark Attendance</Link>
          <Link href="/payments" className="px-4 py-2 bg-card border border-border text-foreground text-sm rounded-lg hover:bg-muted transition-colors" data-testid="quick-record-payment">Record Payment</Link>
          <Link href="/notices" className="px-4 py-2 bg-card border border-border text-foreground text-sm rounded-lg hover:bg-muted transition-colors" data-testid="quick-post-notice">Post Notice</Link>
        </div>
      </div>
    </div>
  );
}

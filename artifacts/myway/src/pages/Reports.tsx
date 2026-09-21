import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { getStudents, getClasses, getPayments, getAttendance, getTeachers, getTeacherPayments, getExpenses } from "@/lib/storage";
import { formatCurrency, formatMonth, getGrade } from "@/lib/utils";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";

const COLORS = ['#1a3a6b','#1a8075','#f97316','#22c55e','#a855f7'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'fees' | 'attendance' | 'students' | 'pnl'>('fees');

  const students = getStudents();
  const classes = getClasses();
  const payments = getPayments();
  const attendance = getAttendance();
  const teachers = getTeachers();
  const teacherPayments = getTeacherPayments();
  const expensesList = getExpenses();

  // Fee Report - last 6 months
  const feeMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const collected = payments.filter(p => p.month === month && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter(p => p.month === month && p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
    return { month: d.toLocaleString('en', { month: 'short', year: '2-digit' }), collected, pending };
  });

  // Fee by class
  const feeByClass = classes.map(c => {
    const paid = payments.filter(p => p.classId === c.id && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
    return { name: c.subject, value: paid };
  }).filter(d => d.value > 0);

  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  // Attendance Report
  const attendanceByClass = classes.map(c => {
    const records = attendance.filter(a => a.classId === c.id);
    let present = 0, total = 0;
    records.forEach(a => { a.records.forEach(r => { total++; if (r.status === 'Present') present++; }); });
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { name: c.subject, rate, sessions: records.length, present, total };
  });

  const studentAttendance = students.map(student => {
    let present = 0, late = 0, absent = 0, total = 0;
    attendance.forEach(a => {
      const record = a.records.find(r => r.studentId === student.id);
      if (!record) return;
      total++;
      if (record.status === 'Present') present++;
      if (record.status === 'Late') late++;
      if (record.status === 'Absent') absent++;
    });
    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { student, present, late, absent, total, rate };
  }).filter(row => row.total > 0).sort((a, b) => a.rate - b.rate || a.student.fullName.localeCompare(b.student.fullName));

  const exportAttendanceCsv = () => {
    const rows = [
      ['Student ID', 'Student Name', 'Total Sessions', 'Present', 'Late', 'Absent', 'Attendance Rate'],
      ...studentAttendance.map(row => [row.student.studentId, row.student.fullName, row.total, row.present, row.late, row.absent, row.rate + '%']),
    ];
    const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance-summary-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Students Report
  const gradeCount: Record<string, number> = {};
  const mediumCount: Record<string, number> = {};
  const statusCount: Record<string, number> = { Active: 0, Inactive: 0, Graduated: 0, Suspended: 0 };
  students.forEach(s => {
    const g = s.grade.split(' ').slice(0, 2).join(' ');
    gradeCount[g] = (gradeCount[g] || 0) + 1;
    mediumCount[s.medium] = (mediumCount[s.medium] || 0) + 1;
    statusCount[s.status] = (statusCount[s.status] || 0) + 1;
  });

  const gradeData = Object.entries(gradeCount).map(([grade, count]) => ({ grade, count }));
  const mediumData = Object.entries(mediumCount).map(([medium, value]) => ({ name: medium, value }));
  const statusData = Object.entries(statusCount).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));

  // Profit & Loss Report Data
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthIncome = payments.filter(p => p.status === 'Paid' && p.paidDate.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0);
  const currentMonthSalaries = teacherPayments.filter(p => p.paidDate.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0);
  const currentMonthExpenses = expensesList.filter(e => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);
  const netProfit = currentMonthIncome - currentMonthSalaries - currentMonthExpenses;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5 print:space-y-4">
      {/* Print header (hidden on screen) */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">MYWAY Educational Institute</h1>
        <p className="text-sm text-gray-500">Report generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Reports</h2>
            <p className="text-sm text-muted-foreground">Analytics and summaries</p>
          </div>
        </div>
        <button onClick={handlePrint} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors" data-testid="print-report-btn">
          Print Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{students.length}</div>
          <div className="text-xs text-muted-foreground">Total Students</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{classes.length}</div>
          <div className="text-xs text-muted-foreground">Total Classes</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-lg font-bold text-green-600">{formatCurrency(totalCollected)}</div>
          <div className="text-xs text-muted-foreground">Total Collected</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-lg font-bold text-red-600">{formatCurrency(totalPending)}</div>
          <div className="text-xs text-muted-foreground">Total Pending</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 print:hidden">
        {[['fees', 'Fee Collection'], ['attendance', 'Attendance'], ['students', 'Students'], ['pnl', 'Profit & Loss']].map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k as 'fees'|'attendance'|'students'|'pnl')}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${activeTab === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}
            data-testid={`tab-${k}`}>{l}</button>
        ))}
      </div>

      {/* Fee Collection Report */}
      {(activeTab === 'fees') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Monthly Fee Collection</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={feeMonths} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ fontSize: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="collected" name="Collected" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="pending" name="Pending" fill="#fca5a5" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Collection by Class</h3>
              {feeByClass.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={feeByClass} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {feeByClass.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ fontSize: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border font-semibold text-foreground">Monthly Summary</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/40"><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Month</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Collected</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Pending</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Rate</th></tr></thead>
              <tbody>
                {feeMonths.map(m => {
                  const total = m.collected + m.pending;
                  const rate = total > 0 ? Math.round((m.collected / total) * 100) : 0;
                  return (
                    <tr key={m.month} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-medium">{m.month}</td>
                      <td className="px-4 py-2.5 text-green-600 font-medium">{formatCurrency(m.collected)}</td>
                      <td className="px-4 py-2.5 text-red-600">{formatCurrency(m.pending)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} /></div>
                          <span>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-foreground">Attendance Rate by Class</h3>
              <button onClick={exportAttendanceCsv} className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceByClass} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance Rate']} contentStyle={{ fontSize: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="rate" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border font-semibold text-foreground">Class Attendance Summary</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/40"><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Class</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Sessions</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Present</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Rate</th></tr></thead>
              <tbody>
                {attendanceByClass.map(c => (
                  <tr key={c.name} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5">{c.sessions}</td>
                    <td className="px-4 py-2.5">{c.present}/{c.total}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${c.rate >= 75 ? 'bg-green-500' : c.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.rate}%` }} /></div>
                        <span>{c.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {attendanceByClass.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No attendance data.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border font-semibold text-foreground">Students Below 75% Attendance</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/40"><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Student</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Sessions</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Present/Late</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Absent</th><th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Rate</th></tr></thead>
                <tbody>
                  {studentAttendance.filter(row => row.rate < 75).map(row => (
                    <tr key={row.student.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5"><div className="font-medium">{row.student.fullName}</div><div className="text-xs text-muted-foreground">{row.student.studentId}</div></td>
                      <td className="px-4 py-2.5">{row.total}</td>
                      <td className="px-4 py-2.5">{row.present + row.late}</td>
                      <td className="px-4 py-2.5 text-rose-600">{row.absent}</td>
                      <td className="px-4 py-2.5 font-semibold">{row.rate}%</td>
                    </tr>
                  ))}
                  {studentAttendance.filter(row => row.rate < 75).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No at-risk attendance records.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Students Report */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">By Status</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">By Medium</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={mediumData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {mediumData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  ['Active Students', students.filter(s => s.status === 'Active').length],
                  ['Teachers', teachers.length],
                  ['Active Classes', classes.filter(c => c.status === 'Active').length],
                  ['Sinhala Medium', students.filter(s => s.medium === 'Sinhala').length],
                  ['Tamil Medium', students.filter(s => s.medium === 'Tamil').length],
                  ['English Medium', students.filter(s => s.medium === 'English').length],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Students by Grade</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Profit & Loss Report */}
      {activeTab === 'pnl' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Profit & Loss ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Total Income (Student Fees)</span>
                <span className="font-bold text-green-500">{formatCurrency(currentMonthIncome)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Teacher Salaries Paid</span>
                <span className="font-bold text-red-400">- {formatCurrency(currentMonthSalaries)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Other Expenses (Rent, Utilities, etc.)</span>
                <span className="font-bold text-red-400">- {formatCurrency(currentMonthExpenses)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 pb-2">
                <span className="font-bold text-lg text-foreground">Net Profit / Loss</span>
                <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Expense Breakdown</h3>
            <div className="space-y-3">
              {expensesList.filter(e => e.date.startsWith(currentMonth)).map(e => (
                <div key={e.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-foreground">{e.category}</span>
                    <span className="text-muted-foreground ml-2">({e.description})</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              {expensesList.filter(e => e.date.startsWith(currentMonth)).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No expenses recorded for this month.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

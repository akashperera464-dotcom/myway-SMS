import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Search, QrCode, AlertTriangle, Plus, TrendingUp,
  Wallet, Clock, Receipt as ReceiptIcon, ChevronRight, X,
} from "lucide-react";
import {
  getStudents, getClasses, getPayments, savePayment, addPayment, getNextReceiptNo,
  getOutstandingFees, useStorageSync,
} from "@/lib/storage";
import { formatCurrency, formatDate, formatMonth, getCurrentMonth } from "@/lib/utils";
import type { Payment, Student } from "@/lib/types";
import StudentSearchPicker from "@/components/StudentSearchPicker";
import StudentPaymentDashboard from "@/components/StudentPaymentDashboard";
import QrAttendanceScanner, { type AttStatus } from "@/components/QrAttendanceScanner";

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  Pending: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  Partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Waived: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

// StudentPickerView — full-screen student search
function StudentPickerView({ students, onSelect, onCancel }: {
  students: Student[];
  onSelect: (s: Student) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Find Student</h2>
          <p className="text-xs text-muted-foreground">Search by name, ID, phone, or school</p>
        </div>
      </div>
      <StudentSearchPicker students={students} onSelect={onSelect} autoFocus />
      <div className="text-center text-xs text-muted-foreground py-4">
        Tip: scan a student's ID card instead — tap "Scan QR" on the home screen.
      </div>
    </div>
  );
}

// QR scan view — reuses QrAttendanceScanner but routes to the student payment dashboard
function QrScanView({ students, onScanStudent, onCancel }: {
  students: Student[];
  onScanStudent: (s: Student) => void;
  onCancel: () => void;
}) {
  // Use a dummy "activeClass" that contains all student IDs so the scanner
  // accepts any enrolled student. The actual class isn't relevant for payments.
  const dummyClass = useMemo(() => ({
    id: "__payment_scan__",
    name: "Payment Scan",
    subject: "Payment",
    grade: "",
    medium: "English" as const,
    teacherId: "",
    schedule: [],
    monthlyFee: 0,
    maxStudents: 0,
    enrolledStudents: students.map(s => s.id),
    status: "Active" as const,
  }), [students]);

  const handleMarkAttendance = (studentId: string, _status: AttStatus) => {
    const student = students.find(s => s.id === studentId || s.studentId === studentId);
    if (student) onScanStudent(student);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Scan Student ID</h2>
          <p className="text-xs text-muted-foreground">Point the camera at the student's ID card QR code</p>
        </div>
      </div>
      <QrAttendanceScanner
        activeClass={dummyClass}
        allStudents={students}
        onMarkAttendance={handleMarkAttendance}
        attendanceRecords={{}}
      />
    </div>
  );
}

// PendingFeesView — list of all students with outstanding fees for the current month
function PendingFeesView({ students, onPickStudent, onBack }: {
  students: Student[];
  onPickStudent: (s: Student) => void;
  onBack: () => void;
}) {
  useStorageSync(["myway_payments", "myway_classes", "myway_students"]);
  const month = getCurrentMonth();
  const pending = useMemo(() => {
    return students
      .map(s => ({ student: s, fees: getOutstandingFees(s.id, month) }))
      .filter(({ fees }) => fees.some(f => f.status === "None" || f.status === "Pending" || f.status === "Partial"))
      .map(({ student, fees }) => ({
        student,
        payable: fees.filter(f => f.status === "None" || f.status === "Pending" || f.status === "Partial"),
        total: fees.filter(f => f.status === "None" || f.status === "Pending" || f.status === "Partial").reduce((sum, f) => sum + f.expectedAmount, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [students, month]);

  const grandTotal = pending.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Pending Fees — {formatMonth(month)}</h2>
          <p className="text-xs text-muted-foreground">{pending.length} student{pending.length !== 1 ? 's' : ''} with outstanding fees · {formatCurrency(grandTotal)} total</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 mx-auto mb-3 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">All students have paid for {formatMonth(month)}! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(({ student, payable, total }) => (
            <button
              key={student.id}
              onClick={() => onPickStudent(student)}
              className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                {student.photo ? (
                  <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
                ) : (
                  (student.fullName || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{student.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {student.studentId} · {payable.length} class{payable.length !== 1 ? 'es' : ''} pending
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(total)}</div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Legacy single-payment form (for "Record Other Payment")
function RecordPaymentForm({ students, classes, defaultStudent, onSubmit, onCancel }: {
  students: Student[];
  classes: ReturnType<typeof getClasses>;
  defaultStudent?: Student | null;
  onSubmit: (form: {
    studentId: string; classId: string; amount: number;
    method: Payment["method"]; paidDate: string;
    status: Payment["status"]; notes: string;
  }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    studentId: defaultStudent?.id || "",
    classId: "",
    amount: "",
    method: "Cash" as Payment["method"],
    paidDate: new Date().toISOString().slice(0, 10),
    status: "Paid" as Payment["status"],
    notes: "",
  });
  const [studentQuery, setStudentQuery] = useState("");
  const [showStudentPicker, setShowStudentPicker] = useState(!defaultStudent);

  const selectedStudent = students.find(s => s.id === form.studentId);
  const selectedStudentClasses = selectedStudent ? classes.filter(c => selectedStudent.classIds.includes(c.id)) : [];

  const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.classId) return;
    onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  };

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 50);
    return students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      (s.guardianPhone || "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [studentQuery, students]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-lg">Record Payment</h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Student — searchable */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Student *</label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 p-2 border border-input rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{selectedStudent.fullName}</div>
                  <div className="text-xs text-muted-foreground">{selectedStudent.studentId}</div>
                </div>
                {!defaultStudent && (
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, studentId: "", classId: "" })); setShowStudentPicker(true); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="search"
                  placeholder="Type student name, ID, or phone..."
                  value={studentQuery}
                  onChange={e => setStudentQuery(e.target.value)}
                  className={inputCls}
                  onFocus={() => setShowStudentPicker(true)}
                />
                {showStudentPicker && (
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto bg-background">
                    {filteredStudents.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">No match</div>
                    ) : filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, studentId: s.id, classId: "" })); setShowStudentPicker(false); setStudentQuery(""); }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.studentId} · {s.grade}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Class — filtered to selected student's enrolled classes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Class *</label>
            <select
              required
              value={form.classId}
              onChange={e => {
                const cls = classes.find(c => c.id === e.target.value);
                setForm(f => ({ ...f, classId: e.target.value, amount: cls ? String(cls.monthlyFee) : f.amount }));
              }}
              className={inputCls}
            >
              <option value="">Select Class</option>
              {(selectedStudentClasses.length > 0 ? selectedStudentClasses : classes).map(c => {
                const teacher = c.teacherId ? students.find(s => s.id === c.teacherId) : null;
                return <option key={c.id} value={c.id}>{c.name}</option>;
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (LKR)</label>
              <input required type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Method</label>
              <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as Payment["method"] }))} className={inputCls}>
                {["Cash", "Bank Transfer", "Online"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Paid Date</label>
              <input type="date" value={form.paidDate} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Payment["status"] }))} className={inputCls}>
                {["Paid", "Pending", "Partial", "Waived"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="optional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90">Save Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Payments page — cashier home
type View = "home" | "search" | "qr" | "pending" | "student" | "form";

export default function Payments() {
  useStorageSync(["myway_payments", "myway_students", "myway_classes", "myway_settings"]);

  const [view, setView] = useState<View>("home");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, forceUpdate] = useState(0);

  const allStudents = getStudents();
  const classes = getClasses();
  const payments = getPayments();
  const today = new Date().toISOString().slice(0, 10);
  const month = getCurrentMonth();

  // Cashier dashboard stats
  const todayCollected = payments
    .filter(p => p.status === "Paid" && p.paidDate === today)
    .reduce((s, p) => s + p.amount, 0);
  const todayCount = payments.filter(p => p.status === "Paid" && p.paidDate === today).length;
  const monthCollected = payments
    .filter(p => p.status === "Paid" && p.month === month)
    .reduce((s, p) => s + p.amount, 0);
  const monthCount = payments.filter(p => p.status === "Paid" && p.month === month).length;

  // Pending fees count for current month (across all students)
  const pendingCount = useMemo(() => {
    return allStudents.filter(s => {
      const fees = getOutstandingFees(s.id, month);
      return fees.some(f => f.status === "None" || f.status === "Pending" || f.status === "Partial");
    }).length;
  }, [allStudents, month, payments]);

  const pendingTotal = useMemo(() => {
    return allStudents.reduce((sum, s) => {
      const fees = getOutstandingFees(s.id, month);
      return sum + fees
        .filter(f => f.status === "None" || f.status === "Pending" || f.status === "Partial")
        .reduce((s2, f) => s2 + f.expectedAmount, 0);
    }, 0);
  }, [allStudents, month, payments]);

  // Recent payments (last 8)
  const recentPayments = useMemo(() => {
    return [...payments]
      .filter(p => p.status === "Paid")
      .sort((a, b) => (b.paidDate || "").localeCompare(a.paidDate || ""))
      .slice(0, 8);
  }, [payments]);

  const handleSearchSelect = (s: Student) => {
    setSelectedStudent(s);
    setView("student");
  };

  const handleQrScan = (s: Student) => {
    setSelectedStudent(s);
    setView("student");
  };

  const handleAddPayment = (form: {
    studentId: string; classId: string; amount: number;
    method: Payment["method"]; paidDate: string;
    status: Payment["status"]; notes: string;
  }) => {
    addPayment({
      ...form,
      month: month,
      receiptNo: getNextReceiptNo(),
    });
    setShowForm(false);
    forceUpdate(n => n + 1);
    // After recording, jump to that student's dashboard
    const s = allStudents.find(x => x.id === form.studentId);
    if (s) {
      setSelectedStudent(s);
      setView("student");
    }
  };

  const handlePrint = (p: Payment) => {
    const student = allStudents.find(s => s.id === p.studentId);
    const cls = classes.find(c => c.id === p.classId);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${p.receiptNo}</title>
      <style>body{font-family:sans-serif;max-width:400px;margin:40px auto;padding:20px}h1{color:#1a3a6b;font-size:20px}hr{border:1px solid #eee}table{width:100%}td{padding:6px 0}td:last-child{text-align:right}.total{font-size:18px;font-weight:bold;color:#1a3a6b}.footer{text-align:center;font-size:12px;color:#888;margin-top:20px}</style>
      </head><body>
      <h1>MYWAY Educational Institute</h1>
      <p style="color:#888;font-size:13px">123, Peradeniya Road, Kandy | 0812234567</p>
      <hr>
      <h2 style="font-size:15px">Payment Receipt</h2>
      <table>
        <tr><td>Receipt No:</td><td><strong>${p.receiptNo}</strong></td></tr>
        <tr><td>Date:</td><td>${formatDate(p.paidDate)}</td></tr>
        <tr><td>Student:</td><td>${student?.fullName || '-'}</td></tr>
        <tr><td>Student ID:</td><td>${student?.studentId || '-'}</td></tr>
        <tr><td>Class:</td><td>${cls?.name || '-'}</td></tr>
        <tr><td>Month:</td><td>${formatMonth(p.month)}</td></tr>
        <tr><td>Method:</td><td>${p.method}</td></tr>
      </table>
      <hr>
      <table><tr><td class="total">Amount Paid:</td><td class="total">${formatCurrency(p.amount)}</td></tr></table>
      <hr>
      <div class="footer">Thank you for your payment!<br>MYWAY Educational Institute</div>
      <script>window.print()</script>
      </body></html>
    `);
    win.document.close();
  };

  // ─── Student dashboard view ──────────────────────────────────────────────
  if (view === "student" && selectedStudent) {
    return (
      <div className="space-y-5">
        <StudentPaymentDashboard
          student={selectedStudent}
          onBack={() => { setView("home"); setSelectedStudent(null); }}
          onRecordOther={(s) => { setShowForm(true); setView("home"); }}
        />
        {showForm && (
          <RecordPaymentForm
            students={allStudents}
            classes={classes}
            defaultStudent={selectedStudent}
            onSubmit={handleAddPayment}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  // ─── Search view ──────────────────────────────────────────────────────────
  if (view === "search") {
    return (
      <StudentPickerView
        students={allStudents}
        onSelect={handleSearchSelect}
        onCancel={() => setView("home")}
      />
    );
  }

  // ─── QR scan view ─────────────────────────────────────────────────────────
  if (view === "qr") {
    return (
      <QrScanView
        students={allStudents}
        onScanStudent={handleQrScan}
        onCancel={() => setView("home")}
      />
    );
  }

  // ─── Pending fees view ───────────────────────────────────────────────────
  if (view === "pending") {
    return (
      <PendingFeesView
        students={allStudents}
        onPickStudent={(s) => { setSelectedStudent(s); setView("student"); }}
        onBack={() => setView("home")}
      />
    );
  }

  // ─── Home (cashier dashboard) ────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Fee Payments</h2>
            <p className="text-xs text-muted-foreground">Cashier dashboard · {formatMonth(month)}</p>
          </div>
        </div>
      </div>

      {/* Always-visible search bar — the cashier's primary tool */}
      <button
        onClick={() => setView("search")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-left hover:border-primary/40 transition-colors"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">Search student by name, ID, phone, or school...</span>
        <kbd className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-border">tap</kbd>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Today
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(todayCollected)}</div>
          <div className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">{todayCount} payment{todayCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
            <Wallet className="w-3.5 h-3.5" /> This Month
          </div>
          <div className="text-xl font-bold text-primary">{formatCurrency(monthCollected)}</div>
          <div className="text-[11px] text-primary/70">{monthCount} paid</div>
        </div>
        <button
          onClick={() => setView("pending")}
          className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-left hover:bg-rose-500/15 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Pending
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(pendingTotal)}</div>
          <div className="text-[11px] text-rose-600/70 dark:text-rose-400/70">{pendingCount} student{pendingCount !== 1 ? 's' : ''}</div>
        </button>
        <div className="bg-card border border-border rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> Recent
          </div>
          <div className="text-xl font-bold text-foreground">{recentPayments.length}</div>
          <div className="text-[11px] text-muted-foreground">last payments</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setView("qr")}
          className="flex flex-col items-center gap-1.5 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">Scan QR</span>
        </button>
        <button
          onClick={() => setView("pending")}
          className="flex flex-col items-center gap-1.5 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-xs font-medium text-foreground">Pending Fees</span>
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center gap-1.5 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-foreground">Record</span>
        </button>
      </div>

      {/* Recent payments */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Recent Payments
          </h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last {recentPayments.length}</span>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No payments recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {recentPayments.map(p => {
              const student = allStudents.find(s => s.id === p.studentId);
              const cls = classes.find(c => c.id === p.classId);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {student?.photo ? (
                      <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
                    ) : (
                      (student?.fullName || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{student?.fullName || '-'}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {cls?.name || '-'} · {formatDate(p.paidDate)} · {p.method}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</div>
                  <button
                    onClick={() => handlePrint(p)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    title="Print receipt"
                  >
                    <ReceiptIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legacy single-payment form */}
      {showForm && (
        <RecordPaymentForm
          students={allStudents}
          classes={classes}
          onSubmit={handleAddPayment}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

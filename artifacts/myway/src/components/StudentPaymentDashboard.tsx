import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, User, Phone, MessageCircle, CheckCircle2, Clock,
  AlertCircle, Wallet, Receipt, Plus, ChevronRight,
} from "lucide-react";
import type { Student, TuitionClass, Payment } from "@/lib/types";
import {
  getOutstandingFees, getPaymentsForStudent, savePayment, addPayment,
  getNextReceiptNo, getClass, getTeacher, useStorageSync,
} from "@/lib/storage";
import { formatCurrency, formatDate, formatMonth, getCurrentMonth } from "@/lib/utils";

interface StudentPaymentDashboardProps {
  student: Student;
  onBack: () => void;
  onRecordOther: (student: Student) => void;
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  Paid:    { label: "Paid",    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  Pending: { label: "Pending", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",       icon: Clock },
  Partial: { label: "Partial", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",    icon: AlertCircle },
  Waived:  { label: "Waived",  cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",     icon: Receipt },
  None:    { label: "Not recorded", cls: "bg-slate-500/10 text-slate-500 border-slate-500/20",                    icon: Plus },
};

function buildWhatsAppLink(phone: string, message: string): string {
  // Strip non-digits, prepend country code 94 for Sri Lanka
  let cleaned = (phone || "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "94" + cleaned.slice(1);
  if (!cleaned.startsWith("94") && !cleaned.startsWith("+")) cleaned = "94" + cleaned;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

function buildReceiptMessage(opts: {
  instituteName: string;
  studentName: string;
  studentId: string;
  payments: Array<{ className: string; month: string; amount: number; method: string; receiptNo: string; paidDate: string }>;
  total: number;
}): string {
  const lines = [
    `*${opts.instituteName}*`,
    `──────────────`,
    `Student: ${opts.studentName}`,
    `ID: ${opts.studentId}`,
    `Date: ${formatDate(opts.payments[0].paidDate)}`,
    ``,
    `Payments recorded:`,
    ...opts.payments.map(p => `• ${p.className} (${formatMonth(p.month)}) — ${formatCurrency(p.amount)} — ${p.method}`),
    `──────────────`,
    `Total: ${formatCurrency(opts.total)}`,
    ``,
    `Receipt(s): ${opts.payments.map(p => p.receiptNo).join(", ")}`,
    `Thank you! 🙏`,
  ];
  return lines.join("\n");
}

export default function StudentPaymentDashboard({ student, onBack, onRecordOther }: StudentPaymentDashboardProps) {
  // Re-render when payments or settings change
  useStorageSync(["myway_payments", "myway_settings", "myway_classes", "myway_teachers"]);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [, forceUpdate] = useState(0);
  const [lastRecorded, setLastRecorded] = useState<Payment[] | null>(null);

  // 6 most recent months for the month picker
  const months = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }, []);

  const outstanding = getOutstandingFees(student.id, selectedMonth);
  const payableOutstanding = outstanding.filter(o => o.status === "None" || o.status === "Pending" || o.status === "Partial");
  const totalOutstanding = payableOutstanding.reduce((sum, o) => sum + o.expectedAmount, 0);

  // History: all payments for this student, sorted by paidDate desc
  const history = useMemo(() => {
    return getPaymentsForStudent(student.id)
      .filter(p => p.status === "Paid" || p.status === "Partial")
      .sort((a, b) => (b.paidDate || "").localeCompare(a.paidDate || ""));
  }, [student.id]);

  // Mark one class as paid for the selected month
  const handleMarkOnePaid = (classId: string, method: Payment["method"] = "Cash") => {
    const cls = getClass(classId);
    if (!cls) return;
    const existing = outstanding.find(o => o.classId === classId)?.existingPayment;
    const today = new Date().toISOString().slice(0, 10);
    if (existing) {
      // Update existing Pending/Partial/None record to Paid
      savePayment({
        ...existing,
        amount: cls.monthlyFee,
        status: "Paid",
        paidDate: today,
        method,
      });
      setLastRecorded([{ ...existing, amount: cls.monthlyFee, status: "Paid", paidDate: today, method }]);
    } else {
      // Create a new Paid payment
      const newP: Payment = {
        id: "",
        studentId: student.id,
        classId,
        month: selectedMonth,
        amount: cls.monthlyFee,
        paidDate: today,
        method,
        receiptNo: getNextReceiptNo(),
        status: "Paid",
      };
      const saved = addPayment(newP);
      setLastRecorded([saved]);
    }
    forceUpdate(n => n + 1);
  };

  // Mark all outstanding classes as paid in one go
  const handlePayAll = (method: Payment["method"] = "Cash") => {
    if (payableOutstanding.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const recorded: Payment[] = [];
    payableOutstanding.forEach(o => {
      const cls = getClass(o.classId);
      if (!cls) return;
      if (o.existingPayment) {
        savePayment({
          ...o.existingPayment,
          amount: cls.monthlyFee,
          status: "Paid",
          paidDate: today,
          method,
        });
        recorded.push({ ...o.existingPayment, amount: cls.monthlyFee, status: "Paid", paidDate: today, method });
      } else {
        const newP: Payment = {
          id: "",
          studentId: student.id,
          classId: o.classId,
          month: selectedMonth,
          amount: cls.monthlyFee,
          paidDate: today,
          method,
          receiptNo: getNextReceiptNo(),
          status: "Paid",
        };
        const saved = addPayment(newP);
        recorded.push(saved);
      }
    });
    setLastRecorded(recorded);
    forceUpdate(n => n + 1);
  };

  const handlePrintReceipt = (p: Payment) => {
    const cls = getClass(p.classId);
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
        <tr><td>Student:</td><td>${student.fullName}</td></tr>
        <tr><td>Student ID:</td><td>${student.studentId}</td></tr>
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

  const handleSendWhatsAppReceipt = (payments: Payment[]) => {
    if (!payments.length) return;
    const message = buildReceiptMessage({
      instituteName: "MYWAY Educational Institute",
      studentName: student.fullName,
      studentId: student.studentId,
      payments: payments.map(p => ({
        className: getClass(p.classId)?.name || "—",
        month: p.month,
        amount: p.amount,
        method: p.method,
        receiptNo: p.receiptNo,
        paidDate: p.paidDate,
      })),
      total: payments.reduce((s, p) => s + p.amount, 0),
    });
    const phone = student.guardianPhone || student.whatsapp || "";
    if (!phone) {
      alert("No guardian phone number on file for this student.");
      return;
    }
    window.open(buildWhatsAppLink(phone, message), "_blank");
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{student.fullName}</h2>
          <p className="text-xs text-muted-foreground">
            {student.studentId}{student.registerNo ? ` · Reg: ${student.registerNo}` : ""} · {student.grade}
          </p>
        </div>
      </div>

      {/* Student info card */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden">
            {student.photo ? (
              <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              (student.fullName || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-muted-foreground">School: <span className="text-foreground font-medium">{student.school}</span></div>
              <div className="text-muted-foreground">Grade: <span className="text-foreground font-medium">{student.grade}</span></div>
              <div className="text-muted-foreground">Guardian: <span className="text-foreground font-medium">{student.guardianName} ({student.guardianRelationship})</span></div>
              <div className="text-muted-foreground">Phone: <span className="text-foreground font-medium">{student.guardianPhone}</span></div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <a
            href={`tel:${student.guardianPhone}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
          <a
            href={buildWhatsAppLink(student.guardianPhone || student.whatsapp || "", `Hello ${student.guardianName}, this is MYWAY Institute regarding ${student.fullName}'s fees.`)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0">Month:</span>
        {months.map(m => (
          <button
            key={m}
            onClick={() => { setSelectedMonth(m); setLastRecorded(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedMonth === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {formatMonth(m)}
          </button>
        ))}
      </div>

      {/* Outstanding fees */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Fees for {formatMonth(selectedMonth)}
          </h3>
          {totalOutstanding > 0 && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalOutstanding)}</div>
            </div>
          )}
        </div>

        {outstanding.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            This student is not enrolled in any active classes.
          </div>
        ) : (
          <div className="space-y-2">
            {outstanding.map(o => {
              const conf = STATUS_BADGE[o.status];
              const Icon = conf.icon;
              const isPayable = o.status === "None" || o.status === "Pending" || o.status === "Partial";
              return (
                <div
                  key={o.classId}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${isPayable ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-muted/20"}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{o.className}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {o.teacherName} · {formatCurrency(o.expectedAmount)}
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${conf.cls}`}>
                    <Icon className="w-3 h-3" /> {conf.label}
                  </div>
                  {isPayable && (
                    <button
                      onClick={() => handleMarkOnePaid(o.classId)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  )}
                  {o.status === "Paid" && o.existingPayment && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePrintReceipt(o.existingPayment!)}
                        className="px-2 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        Receipt
                      </button>
                      <button
                        onClick={() => handleSendWhatsAppReceipt([o.existingPayment!])}
                        className="px-2 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pay All button */}
        {payableOutstanding.length > 0 && (
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => handlePayAll("Cash")}
              className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Pay All Outstanding — {formatCurrency(totalOutstanding)}
              <span className="text-xs opacity-80">({payableOutstanding.length} class{payableOutstanding.length !== 1 ? 'es' : ''})</span>
            </button>
          </div>
        )}
      </div>

      {/* Last recorded action — send WhatsApp receipt */}
      {lastRecorded && lastRecorded.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Recorded {lastRecorded.length} payment{lastRecorded.length !== 1 ? 's' : ''} — {formatCurrency(lastRecorded.reduce((s, p) => s + p.amount, 0))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSendWhatsAppReceipt(lastRecorded)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp Receipt
            </button>
            <button
              onClick={() => handlePrintReceipt(lastRecorded[0])}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={() => setLastRecorded(null)}
              className="px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Record Other Payment */}
      <button
        onClick={() => onRecordOther(student)}
        className="w-full px-4 py-2.5 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Record Other Payment (custom amount / class)
      </button>

      {/* Payment History */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-1">
          <Receipt className="w-4 h-4 text-primary" /> Payment History
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No payment history yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {history.slice(0, 20).map(p => {
              const cls = getClass(p.classId);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{cls?.name || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatMonth(p.month)} · {formatDate(p.paidDate)} · {p.method} · {p.receiptNo}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</div>
                  <button
                    onClick={() => handlePrintReceipt(p)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Receipt
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

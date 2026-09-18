import { useState } from "react";
import { getStudents, getClasses, getPayments, addPayment, savePayment, getNextReceiptNo } from "@/lib/storage";
import { formatCurrency, formatDate, formatMonth, getCurrentMonth } from "@/lib/utils";
import type { Payment } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-red-100 text-red-700',
  Partial: 'bg-yellow-100 text-yellow-700',
  Waived: 'bg-gray-100 text-gray-600',
};

export default function Payments() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [, forceUpdate] = useState(0);

  const [form, setForm] = useState({
    studentId: '', classId: '', amount: '', method: 'Cash' as Payment['method'],
    paidDate: new Date().toISOString().slice(0,10), status: 'Paid' as Payment['status'], notes: '',
  });

  const allStudents = getStudents();
  const classes = getClasses();
  const payments = getPayments();

  const monthPayments = payments.filter(p => p.month === selectedMonth);

  const filtered = monthPayments.filter(p => {
    const student = allStudents.find(s => s.id === p.studentId);
    const q = search.toLowerCase();
    const nameMatch = !q || student?.fullName.toLowerCase().includes(q) || student?.studentId.toLowerCase().includes(q);
    const classMatch = !filterClass || p.classId === filterClass;
    const statusMatch = !filterStatus || p.status === filterStatus;
    return nameMatch && classMatch && statusMatch;
  });

  const totalCollected = monthPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = monthPayments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  const handleMarkPaid = (p: Payment) => {
    savePayment({
      ...p,
      status: 'Paid',
      paidDate: new Date().toISOString().slice(0, 10),
    });
    forceUpdate(n => n + 1);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.classId) return;
    addPayment({
      studentId: form.studentId,
      classId: form.classId,
      month: selectedMonth,
      amount: Number(form.amount),
      paidDate: form.status === 'Paid' ? form.paidDate : '',
      method: form.method,
      receiptNo: getNextReceiptNo(),
      status: form.status,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ studentId: '', classId: '', amount: '', method: 'Cash', paidDate: new Date().toISOString().slice(0,10), status: 'Paid', notes: '' });
    forceUpdate(n => n + 1);
  };

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedStudent = allStudents.find(s => s.id === form.studentId);
  const selectedStudentClasses = selectedStudent ? classes.filter(c => selectedStudent.classIds.includes(c.id)) : [];

  const handlePrint = (p: Payment) => {
    const student = allStudents.find(s => s.id === p.studentId);
    const cls = classes.find(c => c.id === p.classId);
    const win = window.open('', '_blank');
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

  const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Fee Payments</h2>
            <p className="text-sm text-muted-foreground">Track and manage student fee payments</p>
          </div>
        </div>
        <button data-testid="add-payment-btn" onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90">
          + Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-xl font-bold text-green-700">{formatCurrency(totalCollected)}</div>
          <div className="text-xs text-green-600">Collected</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xl font-bold text-red-700">{formatCurrency(totalPending)}</div>
          <div className="text-xs text-red-600">Pending</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xl font-bold text-foreground">{monthPayments.filter(p => p.status === 'Paid').length}</div>
          <div className="text-xs text-muted-foreground">Paid this month</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xl font-bold text-foreground">{monthPayments.filter(p => p.status === 'Pending').length}</div>
          <div className="text-xs text-muted-foreground">Pending payments</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3">
        <select data-testid="filter-month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <input
          data-testid="search-payment"
          type="search"
          placeholder="Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
        />
        <select data-testid="filter-class-payment" value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select data-testid="filter-status-payment" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Status</option>
          {['Paid','Pending','Partial','Waived'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Paid Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Receipt</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No payment records found.</td></tr>
              ) : filtered.map(p => {
                const student = allStudents.find(s => s.id === p.studentId);
                const cls = classes.find(c => c.id === p.classId);
                return (
                  <tr key={p.id} data-testid={`row-payment-${p.id}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{student?.fullName || '-'}</div>
                      <div className="text-xs text-muted-foreground">{student?.studentId}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{cls?.name}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.paidDate ? formatDate(p.paidDate) : '-'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{p.receiptNo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {p.status === 'Pending' && (
                          <button onClick={() => handleMarkPaid(p)} className="text-xs text-green-600 hover:underline font-medium" data-testid={`mark-paid-${p.id}`}>Mark Paid</button>
                        )}
                        {p.status === 'Paid' && (
                          <button onClick={() => handlePrint(p)} className="text-xs text-primary hover:underline" data-testid={`print-receipt-${p.id}`}>Receipt</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-foreground text-lg mb-4">Record Payment</h3>
            <form onSubmit={handleAddPayment} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Student *</label>
                <select required data-testid="payment-student" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value, classId: '' }))} className={inputCls}>
                  <option value="">Select Student</option>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Class *</label>
                <select required data-testid="payment-class" value={form.classId} onChange={e => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setForm(f => ({ ...f, classId: e.target.value, amount: cls ? String(cls.monthlyFee) : f.amount }));
                }} className={inputCls}>
                  <option value="">Select Class</option>
                  {(selectedStudentClasses.length > 0 ? selectedStudentClasses : classes).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (LKR)</label>
                  <input required type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Method</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as Payment['method'] }))} className={inputCls}>
                    {['Cash','Bank Transfer','Online'].map(m => <option key={m}>{m}</option>)}
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
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Payment['status'] }))} className={inputCls}>
                    {['Paid','Pending','Partial','Waived'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="optional" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90" data-testid="submit-payment">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

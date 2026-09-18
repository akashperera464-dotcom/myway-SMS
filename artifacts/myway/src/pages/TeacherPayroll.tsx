import { useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft, UserSquare2 } from "lucide-react";
import { Link } from "wouter";
import { getTeacherPayments, addTeacherPayment, saveTeacherPayment, deleteTeacherPayment, getTeachers } from "@/lib/storage";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/utils";
import type { TeacherPayment } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary";

const emptyForm = (): Omit<TeacherPayment, 'id'> => ({
  teacherId: '',
  month: getCurrentMonth(),
  amount: 0,
  paidDate: new Date().toISOString().slice(0, 10),
  method: 'Bank Transfer',
  referenceNo: '',
  notes: '',
});

export default function TeacherPayroll() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TeacherPayment, 'id'>>(emptyForm());
  const [, forceUpdate] = useState(0);

  const payments = getTeacherPayments().sort((a, b) => b.paidDate.localeCompare(a.paidDate));
  const teachers = getTeachers();

  const set = (k: keyof TeacherPayment, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, amount: Number(form.amount) };
    if (editId) {
      saveTeacherPayment({ ...data, id: editId });
    } else {
      addTeacherPayment(data);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    forceUpdate(n => n + 1);
  };

  const handleEdit = (tp: TeacherPayment) => {
    setEditId(tp.id);
    setForm({
      teacherId: tp.teacherId,
      month: tp.month,
      amount: tp.amount,
      paidDate: tp.paidDate,
      method: tp.method,
      referenceNo: tp.referenceNo || '',
      notes: tp.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteTeacherPayment(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.fullName || 'Unknown Teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Teacher Payroll</h2>
            <p className="text-sm text-muted-foreground">Manage salary payments to teachers</p>
          </div>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Teacher</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Month</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Method</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ref No</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No payroll records yet.</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-foreground">{formatDate(p.paidDate)}</td>
                <td className="px-4 py-3 font-medium text-foreground">{getTeacherName(p.teacherId)}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.month}</td>
                <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground uppercase">{p.method}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{p.referenceNo || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-foreground text-lg mb-4">{editId ? 'Edit Payroll Record' : 'Record Teacher Payment'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Teacher *</label>
                <select required value={form.teacherId} onChange={e => {
                  const t = teachers.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, teacherId: e.target.value, amount: t?.salary || f.amount }));
                }} className={inputCls}>
                  <option value="" disabled>Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Salary Month *</label>
                  <input type="month" required value={form.month} onChange={e => set('month', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Paid Date *</label>
                  <input type="date" required value={form.paidDate} onChange={e => set('paidDate', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount (LKR) *</label>
                <input type="number" required min="0" value={form.amount || ''} onChange={e => set('amount', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Method</label>
                  <select value={form.method} onChange={e => set('method', e.target.value)} className={inputCls}>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Ref/Cheque No</label>
                  <input value={form.referenceNo} onChange={e => set('referenceNo', e.target.value)} placeholder="e.g. TR-1234" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes</label>
                <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional details..." className={inputCls} />
              </div>
              <div className="flex gap-3 pt-3 mt-2 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Delete Record</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this payment record?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

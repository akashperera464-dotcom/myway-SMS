import { useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Receipt } from "lucide-react";
import { Link } from "wouter";
import { getExpenses, addExpense, saveExpense, deleteExpense } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary";

const emptyForm = (): Omit<Expense, 'id'> => ({
  category: 'Other',
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  description: '',
  recordedBy: 'Admin',
});

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Expense, 'id'>>(emptyForm());
  const [, forceUpdate] = useState(0);

  const expenses = getExpenses().sort((a, b) => b.date.localeCompare(a.date));

  const set = (k: keyof Expense, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, amount: Number(form.amount) };
    if (editId) {
      saveExpense({ ...data, id: editId });
    } else {
      addExpense(data);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    forceUpdate(n => n + 1);
  };

  const handleEdit = (exp: Expense) => {
    setEditId(exp.id);
    setForm({
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      description: exp.description,
      recordedBy: exp.recordedBy,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Expenses</h2>
            <p className="text-sm text-muted-foreground">Manage institute operational expenses</p>
          </div>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Recorded By</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No expenses recorded yet.</td></tr>
            ) : expenses.map(e => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-foreground">{formatDate(e.date)}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/15 text-secondary">{e.category}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{e.description || '-'}</td>
                <td className="px-4 py-3 font-semibold text-destructive">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.recordedBy}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(e)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(e.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-4">{editId ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
                <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option>Electricity</option>
                  <option>Water</option>
                  <option>Rent</option>
                  <option>Maintenance</option>
                  <option>Internet</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount (LKR)</label>
                <input type="number" required min="0" value={form.amount || ''} onChange={e => set('amount', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
                <input required value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g., May Electricity Bill" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-3 mt-2 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Delete Expense</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this expense record?</p>
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

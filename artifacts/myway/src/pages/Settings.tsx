import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/utils";
import type { InstituteSettings } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function Settings() {
  const [form, setForm] = useState<InstituteSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const set = (k: keyof InstituteSettings, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('myway_'));
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage institute information and system settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Institute Info */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Institute Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Institute Name *</label>
              <input data-testid="settings-name" required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Address</label>
              <input data-testid="settings-address" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
              <input data-testid="settings-phone" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
              <input data-testid="settings-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Registration No.</label>
              <input data-testid="settings-regNo" value={form.registrationNo || ''} onChange={e => set('registrationNo', e.target.value)} className={inputCls} placeholder="TC/2020/KDY/0001" />
            </div>
          </div>
        </section>

        {/* Academic Settings */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Academic Settings</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Current Academic Month</label>
            <select data-testid="settings-month" value={form.currentMonth} onChange={e => set('currentMonth', e.target.value)} className={inputCls}>
              {months.map(m => {
                const d = new Date(m + '-01');
                const label = d.toLocaleString('en', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
            <p className="text-xs text-muted-foreground mt-1">This month is used for fee tracking and reports.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Currency</label>
            <input value="LKR (Sri Lankan Rupee)" disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button data-testid="save-settings-btn" type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> Save Settings
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
        </div>
      </form>

      {/* Danger Zone */}
      <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
        <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">Reset all data to default sample data. This cannot be undone.</p>
        <button data-testid="reset-data-btn" onClick={() => setShowReset(true)} className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset All Data
        </button>
      </section>

      {/* Reset confirmation */}
      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Reset All Data?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete all students, classes, payments, attendance records and reset to sample data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={handleReset} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90" data-testid="confirm-reset">Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

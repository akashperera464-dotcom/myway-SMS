import { useState } from "react";
import { Save, RotateCcw, Shield, UserPlus, Trash2 } from "lucide-react";
import { getSettings, saveSettings, getUsers, addUser, deleteUser, saveUser } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/utils";
import type { InstituteSettings, AppUser } from "@/lib/types";
import { useAuth } from "@/App";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

const ROLES: AppUser['role'][] = ['Super Admin', 'Owner', 'Operations Staff', 'Teacher', 'Student'];

export default function Settings() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const [form, setForm] = useState<InstituteSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [users, setUsers] = useState<AppUser[]>(getUsers());
  const [newUser, setNewUser] = useState({ username: '', fullName: '', role: 'Teacher' as AppUser['role'], password: '', status: 'Active' as AppUser['status'] });
  const [addMsg, setAddMsg] = useState('');

  const reloadUsers = () => setUsers(getUsers());

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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.fullName) return;
    addUser(newUser);
    setNewUser({ username: '', fullName: '', role: 'Teacher', password: '', status: 'Active' });
    setAddMsg('User added successfully');
    setTimeout(() => setAddMsg(''), 3000);
    reloadUsers();
  };

  const handleRoleChange = (u: AppUser, role: AppUser['role']) => {
    saveUser({ ...u, role });
    reloadUsers();
  };

  const handleToggleStatus = (u: AppUser) => {
    saveUser({ ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' });
    reloadUsers();
  };

  const handleDelete = (u: AppUser) => {
    if (u.username === 'akash@myway.lk') return;
    deleteUser(u.id);
    reloadUsers();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage institute information and user access</p>
      </div>

      {/* ── User Management (Super Admin only) ── */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">User Management</h3>
            <p className="text-xs text-muted-foreground">
              {isSuperAdmin ? 'Add, edit or remove users and their roles.' : 'Only Super Admins can manage users.'}
            </p>
          </div>
        </div>

        {/* Current session */}
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {currentUser?.fullName?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{currentUser?.fullName}</div>
            <div className="text-xs text-muted-foreground">{currentUser?.username}</div>
          </div>
          <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
            {currentUser?.role}
          </span>
        </div>

        {/* Add user form (super admin only) */}
        {isSuperAdmin && (
          <form onSubmit={handleAddUser} className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Add New User</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                value={newUser.fullName}
                onChange={e => setNewUser(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Full name"
                className={inputCls}
                required
              />
              <input
                value={newUser.username}
                onChange={e => setNewUser(f => ({ ...f, username: e.target.value }))}
                placeholder="Username / email"
                className={inputCls}
                required
              />
              <input
                value={newUser.password}
                onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))}
                placeholder="Password"
                className={inputCls}
                required
              />
              <select
                value={newUser.role}
                onChange={e => setNewUser(f => ({ ...f, role: e.target.value as AppUser['role'] }))}
                className={inputCls}
              >
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity">
                <UserPlus className="w-4 h-4" /> Add User
              </button>
              {addMsg && <span className="text-sm text-green-600">{addMsg}</span>}
            </div>
          </form>
        )}

        {/* User list */}
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                  {u.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{u.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isSuperAdmin ? (
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u, e.target.value as AppUser['role'])}
                    className="px-2 py-1 text-xs border border-input rounded-md bg-background"
                  >
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">{u.role}</span>
                )}

                {isSuperAdmin && (
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`px-2 py-1 text-xs rounded-md border ${u.status === 'Active' ? 'border-green-500/30 text-green-700 bg-green-50' : 'border-border text-muted-foreground'}`}
                  >
                    {u.status}
                  </button>
                )}

                {isSuperAdmin && u.username !== 'akash@myway.lk' && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="px-2 py-1 text-xs text-destructive rounded-md hover:bg-destructive/10 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Institute Info ── */}
      <form onSubmit={handleSave} className="space-y-5">
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

        <div className="flex items-center gap-3">
          <button data-testid="save-settings-btn" type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> Save Settings
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
        </div>
      </form>

      {/* ── Danger Zone ── */}
      {isSuperAdmin && (
        <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
          <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">Reset all data to default sample data. This cannot be undone.</p>
          <button data-testid="reset-data-btn" onClick={() => setShowReset(true)} className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset All Data
          </button>
        </section>
      )}

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

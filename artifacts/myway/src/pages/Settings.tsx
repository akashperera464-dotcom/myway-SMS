import { useState } from "react";
import { Save, RotateCcw, Shield, LogOut, UserPlus, Trash2 } from "lucide-react";
import { getSettings, saveSettings, getUsers, addUser, deleteUser, saveUser, getSessionUser, setSessionUser } from "@/lib/storage";
import { getCurrentMonth } from "@/lib/utils";
import type { InstituteSettings, AppUser } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function Settings() {
  const [form, setForm] = useState<InstituteSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [usersVersion, setUsersVersion] = useState(0);
  const [loginMsg, setLoginMsg] = useState('');
  const [newUser, setNewUser] = useState({ username: '', fullName: '', role: 'Teacher' as AppUser['role'], password: '', status: 'Active' as AppUser['status'] });
  const [sessionUser, setSessionUserState] = useState<AppUser | null>(getSessionUser());

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

  const users = getUsers();

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser(newUser);
    setNewUser({ username: '', fullName: '', role: 'Teacher', password: '', status: 'Active' });
    setUsersVersion(v => v + 1);
  };

  const handleLoginAs = (user: AppUser) => {
    setSessionUser(user);
    setSessionUserState(user);
    setLoginMsg(`Logged in as ${user.fullName}`);
  };

  const handleLogout = () => {
    setSessionUser(null);
    setSessionUserState(null);
    setLoginMsg('Logged out');
  };

  const handleRoleChange = (user: AppUser, role: AppUser['role']) => {
    saveUser({ ...user, role });
    setUsersVersion(v => v + 1);
  };

  const handleToggleUserStatus = (user: AppUser) => {
    saveUser({ ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' });
    setUsersVersion(v => v + 1);
  };

  const activeUser = sessionUser || users[0];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage institute, login, and user access</p>
      </div>

      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Current Login</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{activeUser?.role || 'No user'}</span>
          <span className="text-muted-foreground">{activeUser?.username || 'Not signed in'}</span>
          {activeUser && <span className="text-muted-foreground">{activeUser.fullName}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleLoginAs(users.find(u => u.username === 'akash@myway.lk') || users[0])} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Login as Super Admin</button>
          <button onClick={handleLogout} className="px-3 py-2 border border-border rounded-lg text-sm">Logout</button>
        </div>
        {loginMsg && <p className="text-xs text-green-600">{loginMsg}</p>}
      </section>

      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">User Management</h3>
            <p className="text-xs text-muted-foreground">Super admin can manage access roles</p>
          </div>
          <div className="text-xs text-muted-foreground">{users.length} users</div>
        </div>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input value={newUser.fullName} onChange={e => setNewUser(f => ({ ...f, fullName: e.target.value }))} placeholder="Full name" className={inputCls} />
          <input value={newUser.username} onChange={e => setNewUser(f => ({ ...f, username: e.target.value }))} placeholder="Username/email" className={inputCls} />
          <select value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value as AppUser['role'] }))} className={inputCls}>
            {['Super Admin','Owner','Operations Staff','Teacher','Student'].map(r => <option key={r}>{r}</option>)}
          </select>
          <input value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} placeholder="Password" className={inputCls} />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm inline-flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> Add User</button>
        </form>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium text-foreground">{u.fullName}</div>
                <div className="text-xs text-muted-foreground">{u.username}</div>
              </div>
              <div className="flex items-center gap-2">
                <select value={u.role} onChange={e => handleRoleChange(u, e.target.value as AppUser['role'])} className="px-2 py-1 text-xs border border-input rounded-md bg-background">
                  {['Super Admin','Owner','Operations Staff','Teacher','Student'].map(r => <option key={r}>{r}</option>)}
                </select>
                <button onClick={() => handleToggleUserStatus(u)} className="px-2 py-1 text-xs border border-border rounded-md">{u.status}</button>
                <button onClick={() => handleLoginAs(u)} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">Login</button>
                <button onClick={() => deleteUser(u.id) || setUsersVersion(v => v + 1)} className="px-2 py-1 text-xs text-destructive rounded-md inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

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
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button data-testid="save-settings-btn" type="button" onClick={handleSave as any} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" /> Save Settings
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
      </div>

      <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
        <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">Reset all data to default sample data. This cannot be undone.</p>
        <button data-testid="reset-data-btn" onClick={() => setShowReset(true)} className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset All Data
        </button>
      </section>

      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Reset All Data?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will permanently delete all students, classes, payments, attendance records and reset to sample data.</p>
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

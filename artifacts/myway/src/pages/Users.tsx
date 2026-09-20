import { useState } from "react";
import { Plus, Edit, Trash2, Shield, User, ShieldCheck, Mail, Lock, X, Save, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getUsers, addUser, saveUser, deleteUser } from "@/lib/storage";
import type { AppUser } from "@/lib/types";
import { useAuth } from "@/App";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary";

const emptyForm = () => ({
  username: '',
  fullName: '',
  role: 'Teacher' as AppUser['role'],
  status: 'Active' as AppUser['status'],
  password: '',
});

export default function Users() {
  const { user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [, forceUpdate] = useState(0);

  const users = getUsers();

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleEdit = (u: AppUser) => {
    // RBAC: Only Super Admin can edit Super Admin
    if (u.role === 'Super Admin' && currentUser?.role !== 'Super Admin') {
      alert("You do not have permission to edit a Super Admin account.");
      return;
    }

    setEditId(u.id);
    setForm({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      password: u.password,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      saveUser({ ...form, id: editId } as AppUser);
    } else {
      addUser(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    forceUpdate(n => n + 1);
  };

  const handleDelete = (u: AppUser) => {
    if (u.role === 'Super Admin') {
      alert("Super Admin accounts cannot be deleted.");
      return;
    }
    if (u.id === currentUser?.id) {
      alert("You cannot delete your own account here.");
      return;
    }
    setDeleteId(u.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteUser(deleteId);
      setDeleteId(null);
      forceUpdate(n => n + 1);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Admin': return <ShieldCheck className="w-4 h-4 text-primary" />;
      case 'Owner': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'Operations Staff': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // If user is Student or Teacher, they shouldn't see this page at all
  if (currentUser?.role === 'Student' || currentUser?.role === 'Teacher') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-destructive/20 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to view User Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">User Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage system access, roles, and staff accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Status Indicator Glow */}
            <div className={`absolute top-0 left-0 w-1 h-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />

            <div className="flex items-start gap-4 mb-4 pl-2">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center text-lg font-bold flex-shrink-0 relative overflow-hidden">
                {u.photo ? (
                  <img src={u.photo} alt={u.fullName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  (u.fullName || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground leading-tight flex items-center gap-2">
                  {u.fullName || u.username || 'Unknown'} 
                  {u.id === currentUser?.id && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">You</span>}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {getRoleIcon(u.role)}
                  <span className="text-xs font-medium text-muted-foreground">{u.role || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-5 pl-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{u.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>••••••••</span>
              </div>
            </div>

            <div className="flex gap-2 pl-2">
              <button
                onClick={() => handleEdit(u)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-input bg-background rounded-xl text-xs font-medium hover:bg-muted transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleDelete(u)}
                className="flex items-center justify-center p-2 border border-input bg-background rounded-xl text-xs hover:bg-destructive/10 text-destructive transition-colors"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-xl tracking-tight">{editId ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Full Name *</label>
                <input required value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. John Doe" className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Email (Username) *</label>
                <input required type="email" value={form.username} onChange={e => set('username', e.target.value)} placeholder="user@myway.lk" className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Password *</label>
                <input required={!editId} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={editId ? "Leave blank to keep current" : "••••••••"} className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Role</label>
                <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls} disabled={editId !== null && form.role === 'Super Admin' && currentUser?.role !== 'Super Admin'}>
                  {currentUser?.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
                  <option value="Owner">Owner</option>
                  <option value="Operations Staff">Operations Staff</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Student">Student</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                  <Save className="w-4 h-4" /> {editId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Delete User</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to remove this user account?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Save, User, Mail, Shield, Camera, ArrowLeft } from "lucide-react";
import { saveUser, setSessionUser } from "@/lib/storage";
import type { AppUser } from "@/lib/types";
import { useAuth } from "@/App";
import { Link } from "wouter";

const inputCls = "w-full px-3 py-2.5 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    password: user?.password || '',
    photo: user?.photo || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) return null;

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Create updated user object
    const updatedUser: AppUser = {
      ...user,
      fullName: form.fullName,
      password: form.password,
      photo: form.photo,
    };

    // Save to storage and update session
    saveUser(updatedUser);
    setSessionUser(updatedUser);
    login(updatedUser); // Update context

    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
    setSaving(false);
  };



  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">My Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account settings.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-secondary/20 border-4 border-background shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {form.photo ? (
                  <img src={form.photo} alt={form.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-secondary" />
                )}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-lg text-foreground">{form.fullName}</h3>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-muted-foreground mt-1">
                <Shield className="w-4 h-4 text-primary" /> {user.role}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Full Name</label>
              <input required value={form.fullName} onChange={e => set('fullName', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Email (Username)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input disabled value={user.username} className={`${inputCls} pl-9 bg-muted/50 cursor-not-allowed text-muted-foreground`} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" required value={form.password} onChange={e => set('password', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input disabled value={user.role} className={`${inputCls} pl-9 bg-muted/50 cursor-not-allowed text-muted-foreground`} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Profile Photo URL</label>
              <input value={form.photo || ''} onChange={e => set('photo', e.target.value)} className={inputCls} placeholder="https://example.com/photo.jpg" />
              <p className="text-[10px] text-muted-foreground mt-1">Paste an image URL from Google Drive, Cloudinary, etc.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {message ? (
              <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                {message}
              </span>
            ) : <span />}
            
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

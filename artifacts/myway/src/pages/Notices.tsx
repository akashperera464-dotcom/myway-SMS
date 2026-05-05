import { useState } from "react";
import { Bell, Plus, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { getNotices, addNotice, deleteNotice, getClasses } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { Notice } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

const PRIORITY_STYLES: Record<string, { bg: string; badge: string; icon: React.ElementType }> = {
  Normal: { bg: 'bg-card border-border', badge: 'bg-blue-50 text-blue-700', icon: Info },
  Important: { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  Urgent: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function Notices() {
  const [showForm, setShowForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const [form, setForm] = useState({
    title: '', content: '',
    targetAudience: 'All',
    priority: 'Normal' as Notice['priority'],
    expiresAt: '',
  });

  const notices = getNotices();
  const classes = getClasses();

  const filtered = notices
    .filter(n => !filterPriority || n.priority === filterPriority)
    .sort((a, b) => {
      const pOrder = { Urgent: 0, Important: 1, Normal: 2 };
      return pOrder[a.priority] - pOrder[b.priority] || b.createdAt.localeCompare(a.createdAt);
    });

  const getAudienceLabel = (audience: string) => {
    if (['All', 'Students', 'Teachers', 'Parents'].includes(audience)) return audience;
    const cls = classes.find(c => c.id === audience);
    return cls ? cls.name : audience;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNotice({
      ...form,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: 'Admin',
    });
    setShowForm(false);
    setForm({ title: '', content: '', targetAudience: 'All', priority: 'Normal', expiresAt: '' });
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string) => {
    deleteNotice(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Notice Board</h2>
          <p className="text-sm text-muted-foreground">{notices.length} notices</p>
        </div>
        <button data-testid="add-notice-btn" onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setFilterPriority('')} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${!filterPriority ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}>All</button>
        {['Urgent', 'Important', 'Normal'].map(p => (
          <button key={p} onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${filterPriority === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}
            data-testid={`filter-priority-${p.toLowerCase()}`}>{p}</button>
        ))}
      </div>

      {/* Notices */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No notices yet. Post one to notify students and teachers.</p>
          </div>
        ) : filtered.map(n => {
          const style = PRIORITY_STYLES[n.priority];
          const Icon = style.icon;
          return (
            <div key={n.id} data-testid={`notice-${n.id}`} className={`border rounded-xl p-5 ${style.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-70" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground">{n.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>{n.priority}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{getAudienceLabel(n.targetAudience)}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{n.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Posted: {formatDate(n.createdAt)}</span>
                      {n.expiresAt && <span>Expires: {formatDate(n.expiresAt)}</span>}
                      <span>By: {n.createdBy}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDeleteId(n.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0" data-testid={`delete-notice-${n.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Notice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="font-bold text-foreground text-lg mb-4">Post New Notice</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Title *</label>
                <input required data-testid="notice-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Notice title" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Content *</label>
                <textarea required data-testid="notice-content" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={inputCls} rows={4} placeholder="Write the notice content here..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">For</label>
                  <select data-testid="notice-audience" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} className={inputCls}>
                    <option value="All">All</option>
                    <option value="Students">Students</option>
                    <option value="Teachers">Teachers</option>
                    <option value="Parents">Parents</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
                  <select data-testid="notice-priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Notice['priority'] }))} className={inputCls}>
                    <option>Normal</option>
                    <option>Important</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Expires On (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90" data-testid="submit-notice">Post Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-foreground mb-2">Delete Notice</h3>
            <p className="text-sm text-muted-foreground mb-4">Remove this notice from the board?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

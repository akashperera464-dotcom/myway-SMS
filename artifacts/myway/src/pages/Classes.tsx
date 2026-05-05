import { useState } from "react";
import { Link } from "wouter";
import { Plus, BookOpen, Users, Clock } from "lucide-react";
import { getClasses, getTeachers, addClass, deleteClass } from "@/lib/storage";
import { formatCurrency, SUBJECTS, GRADES, DAYS_OF_WEEK } from "@/lib/utils";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function Classes() {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const [form, setForm] = useState({
    name: '', subject: '', grade: '', medium: 'Sinhala' as 'Sinhala'|'Tamil'|'English',
    teacherId: '', room: '', monthlyFee: 0, maxStudents: 30,
    schedule: [{ day: 'Saturday', startTime: '08:00', endTime: '10:00' }],
    status: 'Active' as 'Active'|'Inactive', enrolledStudents: [] as string[],
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const setSchedule = (i: number, k: string, v: string) => {
    const s = [...form.schedule];
    s[i] = { ...s[i], [k]: v };
    setForm(f => ({ ...f, schedule: s }));
  };

  const classes = getClasses();
  const teachers = getTeachers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClass({ ...form, monthlyFee: Number(form.monthlyFee), maxStudents: Number(form.maxStudents), enrolledStudents: [] });
    setShowForm(false);
    setForm({ name: '', subject: '', grade: '', medium: 'Sinhala', teacherId: '', room: '', monthlyFee: 0, maxStudents: 30, schedule: [{ day: 'Saturday', startTime: '08:00', endTime: '10:00' }], status: 'Active', enrolledStudents: [] });
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string) => {
    deleteClass(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Classes</h2>
          <p className="text-sm text-muted-foreground">{classes.length} classes total</p>
        </div>
        <button data-testid="add-class-btn" onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(c => {
          const teacher = teachers.find(t => t.id === c.teacherId);
          return (
            <div key={c.id} data-testid={`card-class-${c.id}`} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{c.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{c.grade} · {c.medium} Medium</p>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                {teacher && <p><span className="font-medium text-foreground">Teacher:</span> {teacher.fullName}</p>}
                <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {c.enrolledStudents.length} / {c.maxStudents} students</p>
                {c.schedule.map((s, i) => (
                  <p key={i} className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{s.day} · {s.startTime} – {s.endTime}</p>
                ))}
                {c.room && <p><span className="font-medium text-foreground">Room:</span> {c.room}</p>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">{formatCurrency(c.monthlyFee)}<span className="text-xs font-normal text-muted-foreground">/month</span></span>
                <div className="flex gap-2">
                  <Link href={`/classes/${c.id}`} className="text-xs text-primary hover:underline" data-testid={`view-class-${c.id}`}>Details</Link>
                  <button onClick={() => setDeleteId(c.id)} className="text-xs text-destructive hover:underline" data-testid={`delete-class-${c.id}`}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-foreground text-lg mb-4">Add New Class</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Class Name *</label><input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Grade 11 - Mathematics" /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Subject *</label><select required value={form.subject} onChange={e => set('subject', e.target.value)} className={inputCls}><option value="">Select</option>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Grade *</label><select required value={form.grade} onChange={e => set('grade', e.target.value)} className={inputCls}><option value="">Select</option>{GRADES.map(g => <option key={g}>{g}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Medium</label><select value={form.medium} onChange={e => set('medium', e.target.value as 'Sinhala'|'Tamil'|'English')} className={inputCls}><option>Sinhala</option><option>Tamil</option><option>English</option></select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Teacher</label><select value={form.teacherId} onChange={e => set('teacherId', e.target.value)} className={inputCls}><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Room</label><input value={form.room} onChange={e => set('room', e.target.value)} className={inputCls} placeholder="e.g. Room A" /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Monthly Fee (LKR)</label><input type="number" value={form.monthlyFee || ''} onChange={e => set('monthlyFee', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Max Students</label><input type="number" value={form.maxStudents} onChange={e => set('maxStudents', e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">Schedule</label>
                {form.schedule.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mt-1">
                    <select value={s.day} onChange={e => setSchedule(i, 'day', e.target.value)} className={inputCls}>{DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}</select>
                    <input type="time" value={s.startTime} onChange={e => setSchedule(i, 'startTime', e.target.value)} className={inputCls} />
                    <input type="time" value={s.endTime} onChange={e => setSchedule(i, 'endTime', e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90" data-testid="submit-class">Add Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Delete Class</h3>
            <p className="text-sm text-muted-foreground mb-5">This will remove the class and all associated data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90" data-testid="confirm-delete-class">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

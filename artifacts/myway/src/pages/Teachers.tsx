import { useState } from "react";
import { Phone, MessageCircle, Mail, Plus, Edit, Trash2, X, Save, ArrowLeft, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { getTeachers, addTeacher, saveTeacher, deleteTeacher, getClasses } from "@/lib/storage";
import { formatDate, SUBJECTS } from "@/lib/utils";
import type { Teacher } from "@/lib/types";
import { useAuth } from "@/App";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

const emptyForm = () => ({
  fullName: '', nic: '', phone: '', whatsapp: '', email: '',
  subjects: [] as string[], qualification: '', address: '',
  joinDate: new Date().toISOString().slice(0,10), salary: '', status: 'Active' as 'Active'|'Inactive',
});

export default function Teachers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Super Admin' || user?.role === 'Owner' || user?.role === 'Operations Staff';
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [, forceUpdate] = useState(0);

  const [showCompare, setShowCompare] = useState(false);
  const [compareSubj, setCompareSubj] = useState('');
  const [compareT1, setCompareT1] = useState('');
  const [compareT2, setCompareT2] = useState('');

  const teachers = getTeachers();
  const classes = getClasses();

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const toggleSubject = (s: string) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter(x => x !== s) : [...f.subjects, s],
    }));
  };

  const handleEdit = (t: Teacher) => {
    setEditId(t.id);
    setForm({ ...t, salary: t.salary?.toString() || '', email: t.email || '' });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, salary: form.salary ? Number(form.salary) : undefined };
    if (editId) {
      saveTeacher({ ...data, id: editId });
    } else {
      addTeacher(data);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string) => {
    deleteTeacher(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  const getTeacherStats = (teacherId: string, subject: string) => {
    const tClasses = classes.filter(c => c.teacherId === teacherId && c.subject === subject);
    const classCount = tClasses.length;
    const studentCount = tClasses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
    const revenue = tClasses.reduce((sum, c) => sum + ((c.monthlyFee || 0) * (c.enrolledStudents?.length || 0)), 0);
    return { classCount, studentCount, revenue };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Teachers</h2>
            <p className="text-sm text-muted-foreground">{teachers.length} teachers</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCompare(true)} className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground text-sm rounded-lg hover:bg-muted transition-colors">
              <BarChart2 className="w-4 h-4" /> Compare
            </button>
            <button data-testid="add-teacher-btn" onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map(t => {
          const teacherClasses = classes.filter(c => c.teacherId === t.id);
          return (
            <div key={t.id} data-testid={`card-teacher-${t.id}`} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {t.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{t.fullName}</div>
                  <div className="text-xs text-muted-foreground">{t.qualification}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium mt-1 inline-block ${t.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex flex-wrap gap-1">
                  {t.subjects.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <a href={`tel:${t.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone className="w-3.5 h-3.5" />{t.phone}</a>
                <a href={`https://wa.me/94${t.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-green-600 hover:text-green-700"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>
                {t.email && <a href={`mailto:${t.email}`} className="flex items-center gap-1.5 hover:text-foreground"><Mail className="w-3.5 h-3.5" />{t.email}</a>}
              </div>

              <div className="text-xs text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{teacherClasses.length}</span> class{teacherClasses.length !== 1 ? 'es' : ''}
                {teacherClasses.slice(0,2).map(c => <div key={c.id} className="truncate">{c.name}</div>)}
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted transition-colors" data-testid={`edit-teacher-${t.id}`}><Edit className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => setDeleteId(t.id)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted text-destructive transition-colors" data-testid={`delete-teacher-${t.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-foreground text-lg mb-4">{editId ? 'Edit Teacher' : 'Add Teacher'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Full Name *</label><input required value={form.fullName} onChange={e => set('fullName', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">NIC</label><input value={form.nic} onChange={e => set('nic', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Phone *</label><input required value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">WhatsApp</label><input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Qualification</label><input value={form.qualification} onChange={e => set('qualification', e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Join Date</label><input type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Salary (LKR)</label><input type="number" value={form.salary} onChange={e => set('salary', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Status</label><select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}><option>Active</option><option>Inactive</option></select></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Subjects</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSubject(s)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${form.subjects.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-muted'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90" data-testid="submit-teacher">{editId ? 'Save Changes' : 'Add Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-foreground mb-2">Delete Teacher</h3>
            <p className="text-sm text-muted-foreground mb-4">Remove this teacher from the system?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-lg">Compare Teachers</h3>
              <button onClick={() => setShowCompare(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Subject</label>
                <select value={compareSubj} onChange={e => { setCompareSubj(e.target.value); setCompareT1(''); setCompareT2(''); }} className={inputCls}>
                  <option value="">Select Subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Teacher A</label>
                <select disabled={!compareSubj} value={compareT1} onChange={e => setCompareT1(e.target.value)} className={inputCls}>
                  <option value="">Select Teacher A</option>
                  {teachers.filter(t => t.subjects.includes(compareSubj)).map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Teacher B</label>
                <select disabled={!compareSubj} value={compareT2} onChange={e => setCompareT2(e.target.value)} className={inputCls}>
                  <option value="">Select Teacher B</option>
                  {teachers.filter(t => t.subjects.includes(compareSubj) && t.id !== compareT1).map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
            </div>

            {compareT1 && compareT2 && (
              <div className="space-y-6">
                {(() => {
                  const t1 = teachers.find(t => t.id === compareT1);
                  const t2 = teachers.find(t => t.id === compareT2);
                  const stats1 = getTeacherStats(compareT1, compareSubj);
                  const stats2 = getTeacherStats(compareT2, compareSubj);
                  
                  const data = [
                    { name: 'Classes', [t1?.fullName || 'T1']: stats1.classCount, [t2?.fullName || 'T2']: stats2.classCount },
                    { name: 'Students', [t1?.fullName || 'T1']: stats1.studentCount, [t2?.fullName || 'T2']: stats2.studentCount },
                  ];

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 border border-border rounded-xl bg-primary/5">
                          <div className="font-bold text-primary mb-2">{t1?.fullName}</div>
                          <div className="text-3xl font-bold text-foreground">{stats1.studentCount} <span className="text-sm font-normal text-muted-foreground">Students</span></div>
                          <div className="text-sm text-muted-foreground mt-1">{stats1.classCount} Classes</div>
                          <div className="text-xs text-muted-foreground mt-2 font-medium">Est. Revenue: LKR {stats1.revenue.toLocaleString()}</div>
                        </div>
                        <div className="p-4 border border-border rounded-xl bg-secondary/5">
                          <div className="font-bold text-secondary mb-2">{t2?.fullName}</div>
                          <div className="text-3xl font-bold text-foreground">{stats2.studentCount} <span className="text-sm font-normal text-muted-foreground">Students</span></div>
                          <div className="text-sm text-muted-foreground mt-1">{stats2.classCount} Classes</div>
                          <div className="text-xs text-muted-foreground mt-2 font-medium">Est. Revenue: LKR {stats2.revenue.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Legend />
                            <Bar dataKey={t1?.fullName || 'T1'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey={t2?.fullName || 'T2'} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

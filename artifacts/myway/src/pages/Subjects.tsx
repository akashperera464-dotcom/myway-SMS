import { useState } from "react";
import { Plus, Edit, Trash2, Search, BookOpen, Clock, Users, GraduationCap, X, Save, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getSubjects, addSubject, saveSubject, deleteSubject, getTeachers, getClasses } from "@/lib/storage";
import { GRADES } from "@/lib/utils";
import type { Subject } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary";
const selectCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary";

const emptyForm = () => ({
  code: '',
  name: '',
  category: 'Core' as 'Core' | 'Optional' | 'Elective' | 'Extra-Curricular',
  description: '',
  gradeLevel: '',
  medium: 'Sinhala' as 'Sinhala' | 'Tamil' | 'English' | 'All',
  teacherId: '',
  creditHours: 0,
  syllabus: '',
  status: 'Active' as 'Active' | 'Inactive',
});

export default function Subjects() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [, forceUpdate] = useState(0);
  const [search, setSearch] = useState("");

  const subjects = getSubjects();
  const teachers = getTeachers();
  const classes = getClasses();

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.gradeLevel.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleEdit = (s: Subject) => {
    setEditId(s.id);
    setForm({
      code: s.code,
      name: s.name,
      category: s.category,
      description: s.description || '',
      gradeLevel: s.gradeLevel,
      medium: s.medium,
      teacherId: s.teacherId || '',
      creditHours: s.creditHours || 0,
      syllabus: s.syllabus || '',
      status: s.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      classIds: editId ? subjects.find(s => s.id === editId)?.classIds || [] : [],
      createdAt: editId ? subjects.find(s => s.id === editId)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    if (editId) {
      saveSubject({ ...data, id: editId } as Subject);
    } else {
      addSubject(data);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string) => {
    deleteSubject(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  const getTeacherName = (id?: string) => {
    if (!id) return "Unassigned";
    return teachers.find(t => t.id === id)?.fullName || "Unknown Teacher";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Subjects Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage curriculum, subject codes, and related details.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Subject</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredSubjects.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Status Indicator Glow */}
            <div className={`absolute top-0 left-0 w-1 h-full ${s.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />

            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {s.code}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${s.category === 'Core' ? 'bg-blue-100 text-blue-700' : s.category === 'Optional' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                    {s.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 pl-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">{s.gradeLevel}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">{getTeacherName(s.teacherId)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">{s.medium} Medium</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{s.creditHours || 0} Credits</span>
              </div>
            </div>

            <div className="flex gap-2 pl-2">
              <button
                onClick={() => handleEdit(s)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-input bg-background rounded-xl text-xs font-medium hover:bg-muted transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => setDeleteId(s.id)}
                className="flex items-center justify-center p-2 border border-input bg-background rounded-xl text-xs hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredSubjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No subjects found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-xl tracking-tight">{editId ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Subject Code *</label>
                  <input required value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. MATH-11" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Subject Name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mathematics" className={inputCls} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Brief description of the subject..." />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Grade Level *</label>
                  <select required value={form.gradeLevel} onChange={e => set('gradeLevel', e.target.value)} className={selectCls}>
                    <option value="" disabled>Select Grade</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="General">General / All Grades</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className={selectCls}>
                    <option value="Core">Core Subject</option>
                    <option value="Optional">Optional</option>
                    <option value="Elective">Elective</option>
                    <option value="Extra-Curricular">Extra-Curricular</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Medium</label>
                  <select value={form.medium} onChange={e => set('medium', e.target.value)} className={selectCls}>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                    <option value="English">English</option>
                    <option value="All">All Mediums</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Assigned Teacher</label>
                  <select value={form.teacherId} onChange={e => set('teacherId', e.target.value)} className={selectCls}>
                    <option value="">-- Unassigned --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Credit Hours (Optional)</label>
                  <input type="number" min="0" value={form.creditHours} onChange={e => set('creditHours', parseInt(e.target.value) || 0)} className={inputCls} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={selectCls}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">Syllabus Reference</label>
                  <input value={form.syllabus} onChange={e => set('syllabus', e.target.value)} placeholder="e.g. National Curriculum 2025" className={inputCls} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                  <Save className="w-4 h-4" /> {editId ? 'Save Changes' : 'Create Subject'}
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
            <h3 className="font-bold text-foreground text-lg mb-2">Delete Subject</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to remove this subject? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

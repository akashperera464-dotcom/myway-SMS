import { useState } from "react";
import { getResults, getStudents, getClasses, addResult, deleteResult } from "@/lib/storage";
import { formatDate, getGrade, getGradeColor } from "@/lib/utils";
import type { ExamResult } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function Results() {
  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const [form, setForm] = useState({
    classId: '', examName: '', examDate: new Date().toISOString().slice(0,10),
    totalMarks: 100, entries: [] as { studentId: string; obtained: number }[],
  });

  const results = getResults();
  const students = getStudents();
  const classes = getClasses();

  const examNames = [...new Set(results.map(r => r.examName))];

  const filtered = results.filter(r => {
    const classMatch = !filterClass || r.classId === filterClass;
    const examMatch = !filterExam || r.examName === filterExam;
    return classMatch && examMatch;
  }).sort((a,b) => b.examDate.localeCompare(a.examDate));

  const groupedByExam: Record<string, ExamResult[]> = {};
  filtered.forEach(r => {
    const key = `${r.classId}|${r.examName}|${r.examDate}`;
    if (!groupedByExam[key]) groupedByExam[key] = [];
    groupedByExam[key].push(r);
  });

  const handleClassChange = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    const enrolledStudents = cls ? students.filter(s => cls.enrolledStudents.includes(s.id)) : [];
    setForm(f => ({
      ...f,
      classId,
      entries: enrolledStudents.map(s => ({ studentId: s.id, obtained: 0 })),
    }));
  };

  const setMark = (studentId: string, obtained: number) => {
    setForm(f => ({
      ...f,
      entries: f.entries.map(e => e.studentId === studentId ? { ...e, obtained } : e),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sorted = [...form.entries].sort((a, b) => b.obtained - a.obtained);
    form.entries.forEach(entry => {
      const rank = sorted.findIndex(s => s.studentId === entry.studentId) + 1;
      addResult({
        studentId: entry.studentId,
        classId: form.classId,
        examName: form.examName,
        examDate: form.examDate,
        totalMarks: Number(form.totalMarks),
        obtainedMarks: Number(entry.obtained),
        grade: getGrade(Number(entry.obtained), Number(form.totalMarks)),
        rank,
      });
    });
    setShowForm(false);
    setForm({ classId: '', examName: '', examDate: new Date().toISOString().slice(0,10), totalMarks: 100, entries: [] });
    forceUpdate(n => n + 1);
  };

  const handleDelete = (id: string) => {
    deleteResult(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  const formClass = form.classId ? classes.find(c => c.id === form.classId) : null;
  const formStudents = formClass ? students.filter(s => formClass.enrolledStudents.includes(s.id)) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Exam Results</h2>
          <p className="text-sm text-muted-foreground">Add and view student exam results</p>
        </div>
        <button data-testid="add-results-btn" onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90">
          + Add Results
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select data-testid="filter-class-results" value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select data-testid="filter-exam" value={filterExam} onChange={e => setFilterExam(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Exams</option>
          {examNames.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      {/* Results grouped by exam */}
      {Object.keys(groupedByExam).length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No exam results found. Add results to get started.</p>
        </div>
      ) : Object.entries(groupedByExam).map(([key, examResults]) => {
        const [classId, examName, examDate] = key.split('|');
        const cls = classes.find(c => c.id === classId);
        const sorted = [...examResults].sort((a,b) => b.obtainedMarks - a.obtainedMarks);
        const avg = sorted.reduce((s, r) => s + r.obtainedMarks, 0) / sorted.length;
        const gradeCount: Record<string, number> = {};
        sorted.forEach(r => { const g = r.grade || getGrade(r.obtainedMarks, r.totalMarks); gradeCount[g] = (gradeCount[g] || 0) + 1; });

        return (
          <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{examName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{cls?.name} · {formatDate(examDate)} · {examResults.length} students</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">Avg: {avg.toFixed(1)}</div>
                  <div className="flex gap-1.5 mt-1 flex-wrap justify-end">
                    {Object.entries(gradeCount).map(([g, c]) => (
                      <span key={g} className={`px-1.5 py-0.5 rounded text-xs font-bold ${getGradeColor(g)}`}>{g}:{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Rank</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Student</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Score</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">%</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Grade</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const student = students.find(s => s.id === r.studentId);
                  const g = r.grade || getGrade(r.obtainedMarks, r.totalMarks);
                  const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-muted-foreground'}`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{student?.fullName || '-'}</div>
                        <div className="text-xs text-muted-foreground">{student?.studentId}</div>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{r.obtainedMarks}/{r.totalMarks}</td>
                      <td className="px-4 py-2.5">{pct}%</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getGradeColor(g)}`}>{g}</span></td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setDeleteId(r.id)} className="text-xs text-destructive hover:underline" data-testid={`delete-result-${r.id}`}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Add Results Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-foreground text-lg mb-4">Add Exam Results</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Class *</label>
                  <select required value={form.classId} onChange={e => handleClassChange(e.target.value)} className={inputCls}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Exam Name *</label>
                  <input required value={form.examName} onChange={e => setForm(f => ({ ...f, examName: e.target.value }))} className={inputCls} placeholder="e.g. Monthly Test - May" list="exam-names" />
                  <datalist id="exam-names">
                    {['Monthly Test','Term Exam','Mock Exam','Half-Yearly','Final Exam'].map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Exam Date</label>
                  <input type="date" value={form.examDate} onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Total Marks</label>
                  <input type="number" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>

              {formStudents.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Enter Marks for Each Student</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formStudents.map(s => {
                      const entry = form.entries.find(e => e.studentId === s.id);
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-2 border border-input rounded-lg">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{s.fullName}</div>
                            <div className="text-xs text-muted-foreground">{s.studentId}</div>
                          </div>
                          <input
                            data-testid={`result-mark-${s.id}`}
                            type="number"
                            min="0"
                            max={form.totalMarks}
                            value={entry?.obtained || 0}
                            onChange={e => setMark(s.id, Number(e.target.value))}
                            className="w-20 px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-center"
                          />
                          <span className="text-xs text-muted-foreground w-8">/{form.totalMarks}</span>
                          {entry && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold w-8 text-center ${getGradeColor(getGrade(entry.obtained, form.totalMarks))}`}>
                              {getGrade(entry.obtained, form.totalMarks)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={form.entries.length === 0} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50" data-testid="submit-results">Save Results</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-foreground mb-2">Delete Result</h3>
            <p className="text-sm text-muted-foreground mb-4">Delete this exam result record?</p>
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

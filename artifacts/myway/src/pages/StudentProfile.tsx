import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Phone, MessageCircle, Mail, Edit, Save, X } from "lucide-react";
import { getStudent, saveStudent, getClasses, getTeachers, getPaymentsForStudent, getResultsForStudent, getAttendance } from "@/lib/storage";
import { formatCurrency, formatDate, getGrade, getGradeColor, GRADES, SL_DISTRICTS, SL_PROVINCES } from "@/lib/utils";
import type { Student } from "@/lib/types";

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const STATUS_COLORS: Record<string, string> = { Active: "bg-green-100 text-green-700", Inactive: "bg-gray-100 text-gray-600", Graduated: "bg-blue-100 text-blue-700", Suspended: "bg-red-100 text-red-700" };
const PAY_COLORS: Record<string, string> = { Paid: "bg-green-100 text-green-700", Pending: "bg-red-100 text-red-700", Partial: "bg-yellow-100 text-yellow-700", Waived: "bg-gray-100 text-gray-600" };

export default function StudentProfile({ params }: { params: { id: string } }) {
  const [editing, setEditing] = useState(false);
  const [, forceUpdate] = useState(0);

  const student = getStudent(params.id);
  const [form, setForm] = useState<Student | null>(student || null);

  if (!student || !form) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Student not found.</p>
      <Link href="/students" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Students</Link>
    </div>
  );

  const classes = getClasses();
  const teachers = getTeachers();
  const payments = getPaymentsForStudent(params.id);
  const results = getResultsForStudent(params.id);
  const attendance = getAttendance();
  const studentClasses = classes.filter(c => student.classIds.includes(c.id));

  let present = 0, total = 0;
  attendance.forEach(a => {
    if (!student.classIds.includes(a.classId)) return;
    const rec = a.records.find(r => r.studentId === params.id);
    if (rec) { total++; if (rec.status === 'Present') present++; }
  });
  const attRate = total > 0 ? Math.round((present / total) * 100) : 0;

  const set = (k: keyof Student, v: unknown) => setForm(f => f ? { ...f, [k]: v } : f);

  const handleSave = () => {
    if (form) { saveStudent(form); setEditing(false); forceUpdate(n => n + 1); }
  };

  const toggleClass = (id: string) => {
    if (!form) return;
    const ids = form.classIds.includes(id) ? form.classIds.filter(c => c !== id) : [...form.classIds, id];
    setForm(f => f ? { ...f, classIds: ids } : f);
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/students" className="p-2 rounded-lg hover:bg-muted transition-colors inline-flex"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Student Profile</h2>
            <p className="text-sm text-muted-foreground">{student.studentId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setForm(student); setEditing(false); }} className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"><X className="w-4 h-4" /> Cancel</button>
              <button data-testid="save-student-btn" onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"><Save className="w-4 h-4" /> Save</button>
            </>
          ) : (
            <button data-testid="edit-student-btn" onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"><Edit className="w-4 h-4" /> Edit</button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {student.fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start flex-wrap gap-2">
            <h3 className="text-lg font-bold text-foreground">{student.fullName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[student.status]}`}>{student.status}</span>
          </div>
          <p className="text-sm text-muted-foreground">{student.nameInitials} · {student.studentId}</p>
          <p className="text-sm text-muted-foreground">Reg No: {student.registerNo || '-'}</p>
          <p className="text-sm text-muted-foreground">{student.grade} · {student.medium} Medium · {student.school}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <a href={`tel:${student.guardianPhone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Phone className="w-3.5 h-3.5" />{student.guardianPhone}</a>
            <a href={`https://wa.me/94${student.whatsapp.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>
            {student.email && <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Mail className="w-3.5 h-3.5" />{student.email}</a>}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-lg font-bold text-foreground">{formatCurrency(student.monthlyFee)}</div>
          <div className="text-xs text-muted-foreground">monthly fee</div>
          <div className="text-sm font-semibold text-primary mt-1">{attRate}%</div>
          <div className="text-xs text-muted-foreground">attendance</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-4">Personal Details</h4>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Register No</label><input value={form.registerNo || ''} onChange={e => set('registerNo', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label><input value={form.fullName} onChange={e => set('fullName', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Initials</label><input value={form.nameInitials} onChange={e => set('nameInitials', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label><select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}><option>Male</option><option>Female</option></select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">NIC</label><input value={form.nic || ''} onChange={e => set('nic', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Email</label><input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">School</label><input value={form.school} onChange={e => set('school', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Grade</label><select value={form.grade} onChange={e => set('grade', e.target.value)} className={inputCls}>{GRADES.map(g => <option key={g}>{g}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Medium</label><select value={form.medium} onChange={e => set('medium', e.target.value as 'Sinhala'|'Tamil'|'English')} className={inputCls}><option>Sinhala</option><option>Tamil</option><option>English</option></select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Status</label><select value={form.status} onChange={e => set('status', e.target.value as Student['status'])} className={inputCls}><option>Active</option><option>Inactive</option><option>Graduated</option><option>Suspended</option></select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Monthly Fee</label><input type="number" value={form.monthlyFee} onChange={e => set('monthlyFee', Number(e.target.value))} className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">District</label><select value={form.district} onChange={e => set('district', e.target.value)} className={inputCls}>{SL_DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Province</label><select value={form.province} onChange={e => set('province', e.target.value)} className={inputCls}>{SL_PROVINCES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Guardian Name</label><input value={form.guardianName} onChange={e => set('guardianName', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Relationship</label><input value={form.guardianRelationship} onChange={e => set('guardianRelationship', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">Guardian Phone</label><input value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} className={inputCls} /></div>
                <div><label className="text-xs font-medium text-muted-foreground block mb-1">WhatsApp</label><input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Classes Enrolled</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {classes.filter(c => c.status === 'Active').map(c => {
                      const teacher = teachers.find(t => t.id === c.teacherId);
                      return (
                        <label key={c.id} className="flex items-center gap-2 p-2 border border-input rounded-lg cursor-pointer hover:bg-muted/50 text-xs">
                          <input type="checkbox" checked={form.classIds.includes(c.id)} onChange={() => toggleClass(c.id)} className="rounded" />
                          <span>{c.name} · {teacher?.fullName || 'No teacher'}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className={inputCls} rows={2} /></div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {([
                  ['Register No', student.registerNo || '-'], ['Full Name', student.fullName], ['Initials', student.nameInitials], ['Date of Birth', formatDate(student.dateOfBirth)],
                  ['Gender', student.gender], ['NIC', student.nic || '-'], ['Email', student.email || '-'],
                  ['School', student.school], ['Grade', student.grade], ['Medium', student.medium + ' Medium'],
                  ['Stream', student.stream || '-'], ['Address', student.address], ['District', student.district],
                  ['Province', student.province], ['Guardian', student.guardianName], ['Relationship', student.guardianRelationship],
                  ['Guardian Phone', student.guardianPhone], ['WhatsApp', student.whatsapp], ['Join Date', formatDate(student.joinDate)],
                  ['Monthly Fee', formatCurrency(student.monthlyFee)], ['Notes', student.notes || '-'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-foreground mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-4">Payment History</h4>
            {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payment records.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b border-border"><th className="text-left pb-2">Month</th><th className="text-left pb-2">Class</th><th className="text-left pb-2">Amount</th><th className="text-left pb-2">Date</th><th className="text-left pb-2">Status</th></tr></thead>
                <tbody>
                  {payments.sort((a,b) => b.month.localeCompare(a.month)).map(p => {
                    const cls = classes.find(c => c.id === p.classId);
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3">{p.month}</td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{cls?.name}</td>
                        <td className="py-2 pr-3 font-medium">{formatCurrency(p.amount)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{p.paidDate ? formatDate(p.paidDate) : '-'}</td>
                        <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAY_COLORS[p.status]}`}>{p.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-4">Exam Results</h4>
            {results.length === 0 ? <p className="text-sm text-muted-foreground">No exam records.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b border-border"><th className="text-left pb-2">Exam</th><th className="text-left pb-2">Class</th><th className="text-left pb-2">Score</th><th className="text-left pb-2">Grade</th><th className="text-left pb-2">Rank</th></tr></thead>
                <tbody>
                  {results.sort((a,b) => b.examDate.localeCompare(a.examDate)).map(r => {
                    const cls = classes.find(c => c.id === r.classId);
                    const g = r.grade || getGrade(r.obtainedMarks, r.totalMarks);
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3"><div>{r.examName}</div><div className="text-xs text-muted-foreground">{formatDate(r.examDate)}</div></td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{cls?.name}</td>
                        <td className="py-2 pr-3">{r.obtainedMarks}/{r.totalMarks}</td>
                        <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getGradeColor(g)}`}>{g}</span></td>
                        <td className="py-2">{r.rank ? `#${r.rank}` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Enrolled Classes</h4>
            {studentClasses.length === 0 ? <p className="text-sm text-muted-foreground">Not enrolled.</p> : studentClasses.map(c => {
              const teacher = teachers.find(t => t.id === c.teacherId);
              return (
                <div key={c.id} className="py-2.5 border-b border-border last:border-0">
                  <Link href={`/classes/${c.id}`} className="text-sm font-medium text-primary hover:underline">{c.name}</Link>
                  <p className="text-xs text-muted-foreground">Teacher: {teacher?.fullName || '-'}</p>
                  <p className="text-xs text-muted-foreground">{c.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(c.monthlyFee)}/month</p>
                </div>
              );
            })}
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Attendance Summary</h4>
            <div className="text-3xl font-bold text-primary">{attRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{present} present / {total} sessions</p>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${attRate}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

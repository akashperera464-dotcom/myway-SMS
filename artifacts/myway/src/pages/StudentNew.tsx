import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, QrCode, CheckCircle2, Printer, UserCircle2 } from "lucide-react";
import { addStudent, getClasses, getTeachers, getSubjects } from "@/lib/storage";
import { GRADES, STREAMS, SL_DISTRICTS, SL_PROVINCES } from "@/lib/utils";
import type { Student } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { generateStudentQrPayload } from "@/lib/qrUtils";
import StudentIdCardModal from "@/components/StudentIdCardModal";

const MEDIUMS = ['Sinhala', 'Tamil', 'English'] as const;
const STATUSES = ['Active', 'Inactive', 'Graduated', 'Suspended'] as const;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring";

export default function StudentNew() {
  const [, setLocation] = useLocation();
  const classes = getClasses();
  const teachers = getTeachers();
  const subjects = getSubjects();
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);

  const [form, setForm] = useState({
    registerNo: '', fullName: '', nameInitials: '', dateOfBirth: '', gender: 'Male' as 'Male' | 'Female',
    nic: '', school: '', grade: '', medium: 'Sinhala' as 'Sinhala' | 'Tamil' | 'English',
    stream: '', address: '', district: 'Kandy', province: 'Central',
    guardianName: '', guardianRelationship: 'Father', guardianPhone: '',
    whatsapp: '', studentPhone: '', email: '',
    classIds: [] as string[], joinDate: new Date().toISOString().slice(0,10),
    status: 'Active' as Student['status'], monthlyFee: 0, notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleClass = (id: string) => {
    setForm(f => ({
      ...f,
      classIds: f.classIds.includes(id) ? f.classIds.filter(c => c !== id) : [...f.classIds, id],
    }));
  };

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectName) ? prev.filter(s => s !== subjectName) : [...prev, subjectName]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.registerNo.trim()) e.registerNo = 'Register number is required';
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.school.trim()) e.school = 'School is required';
    if (!form.grade) e.grade = 'Grade is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const student = addStudent({ ...form, monthlyFee: Number(form.monthlyFee) });
      setCreatedStudent(student);
    } finally {
      setSaving(false);
    }
  };

  const qrPayloadPreview = generateStudentQrPayload("PREVIEW-STUDENT-ID");

  // ── Post-creation success screen ──────────────────────────────────────────
  if (createdStudent) {
    const createdQr = generateStudentQrPayload(createdStudent.id);
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Student Registered!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{createdStudent.fullName}</span> has been successfully added to MYWAY.
          </p>
        </div>

        {/* QR Preview */}
        <div className="bg-card border border-border rounded-xl p-6 inline-block mx-auto shadow-sm">
          <div className="bg-white p-3 rounded-lg border border-border inline-block shadow-xs mb-3">
            <QRCodeSVG value={createdQr} size={120} level="H" />
          </div>
          <p className="text-xs font-mono text-muted-foreground">{createdQr}</p>
          <p className="text-xs text-muted-foreground mt-1">Student ID: <span className="font-semibold text-foreground">{createdStudent.studentId}</span></p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setShowIdCard(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> View &amp; Print ID Card
          </button>
          <button
            onClick={() => setLocation(`/students/${createdStudent.id}`)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <UserCircle2 className="w-4 h-4" /> Go to Profile
          </button>
          <Link
            href="/students/new"
            onClick={() => setCreatedStudent(null)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            + Add Another Student
          </Link>
        </div>

        <StudentIdCardModal
          student={createdStudent}
          isOpen={showIdCard}
          onClose={() => setShowIdCard(false)}
        />
      </div>
    );
  }


  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/students" className="p-2 rounded-lg hover:bg-muted transition-colors inline-flex"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Add New Student</h2>
          <p className="text-sm text-muted-foreground">Register a new student at MYWAY</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Personal Information</h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-primary" /> Auto-Generated QR Code
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Register Number" required>
                <input data-testid="input-registerNo" value={form.registerNo} onChange={e => set('registerNo', e.target.value)} className={inputCls} placeholder="e.g. REG-001" />
                {errors.registerNo && <p className="text-xs text-destructive mt-1">{errors.registerNo}</p>}
              </Field>
              <Field label="Full Name" required>
                <input data-testid="input-fullName" value={form.fullName} onChange={e => set('fullName', e.target.value)} className={inputCls} placeholder="e.g. Kasun Malinda Perera" />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </Field>
              <Field label="Name with Initials">
                <input value={form.nameInitials} onChange={e => set('nameInitials', e.target.value)} className={inputCls} placeholder="e.g. K.M. Perera" />
              </Field>
              <Field label="Date of Birth">
                <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={inputCls} />
              </Field>
            </div>

            {/* QR Code Live Preview Card */}
            <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-2">
              <div className="bg-white p-2 rounded-lg border border-border shadow-xs">
                <QRCodeSVG value={qrPayloadPreview} size={76} level="M" />
              </div>
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block">QR Code Preview</span>
                <span className="text-[11px] font-mono font-medium text-foreground truncate block max-w-[140px]">{form.registerNo || "Pending Reg No"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Gender" required>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="NIC Number">
              <input value={form.nic} onChange={e => set('nic', e.target.value)} className={inputCls} placeholder="e.g. 200012345678" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="e.g. kasun@example.com" />
            </Field>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="School" required>
              <input value={form.school} onChange={e => set('school', e.target.value)} className={inputCls} placeholder="e.g. Dharmaraja College, Kandy" />
              {errors.school && <p className="text-xs text-destructive mt-1">{errors.school}</p>}
            </Field>
            <Field label="Grade" required>
              <select value={form.grade} onChange={e => set('grade', e.target.value)} className={inputCls}>
                <option value="">Select Grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.grade && <p className="text-xs text-destructive mt-1">{errors.grade}</p>}
            </Field>
            <Field label="Medium" required>
              <select value={form.medium} onChange={e => set('medium', e.target.value as 'Sinhala' | 'Tamil' | 'English')} className={inputCls}>
                {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            {(form.grade.includes('12') || form.grade.includes('13') || form.grade.includes('A/L')) && (
              <Field label="Stream">
                <select value={form.stream} onChange={e => set('stream', e.target.value)} className={inputCls}>
                  <option value="">Select Stream</option>
                  {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}
          </div>
          
          <Field label="Filter Classes by Subject">
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {subjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.name)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${selectedSubjects.includes(s.name) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input hover:bg-muted'}`}
                >
                  {s.name}
                </button>
              ))}
              {subjects.length === 0 && <span className="text-xs text-muted-foreground">No subjects found.</span>}
            </div>
          </Field>

          <Field label="Enroll in Classes">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {classes.filter(c => c.status === 'Active' && (selectedSubjects.length === 0 || selectedSubjects.includes(c.subject))).map(c => {
                const teacher = teachers.find(t => t.id === c.teacherId);
                return (
                  <label key={c.id} className="flex items-center gap-2 p-2.5 border border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="checkbox" checked={form.classIds.includes(c.id)} onChange={() => toggleClass(c.id)} className="rounded" />
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{teacher?.fullName || 'No teacher'}</div>
                      <div className="text-xs text-muted-foreground">Rs. {c.monthlyFee.toLocaleString()} / month</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Field>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Contact & Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Address">
                <input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} placeholder="Full home address" />
              </Field>
            </div>
            <Field label="District">
              <select value={form.district} onChange={e => set('district', e.target.value)} className={inputCls}>
                {SL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Province">
              <select value={form.province} onChange={e => set('province', e.target.value)} className={inputCls}>
                {SL_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Guardian / Parent Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Guardian Name">
              <input value={form.guardianName} onChange={e => set('guardianName', e.target.value)} className={inputCls} placeholder="Parent/Guardian full name" />
            </Field>
            <Field label="Relationship">
              <select value={form.guardianRelationship} onChange={e => set('guardianRelationship', e.target.value)} className={inputCls}>
                <option value="">Select Relationship</option>
                {['Father','Mother','Brother','Sister','Uncle','Aunt','Grandparent','Guardian'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Guardian Phone">
              <input value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} className={inputCls} placeholder="07X XXXXXXX" />
            </Field>
            <Field label="WhatsApp Number">
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inputCls} placeholder="07X XXXXXXX" />
            </Field>
            <Field label="Student Phone">
              <input value={form.studentPhone} onChange={e => set('studentPhone', e.target.value)} className={inputCls} placeholder="07X XXXXXXX" />
            </Field>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Enrollment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Join Date">
              <input type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Monthly Fee (LKR)">
              <input type="number" value={form.monthlyFee || ''} onChange={e => set('monthlyFee', e.target.value)} className={inputCls} placeholder="0" min="0" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as Student['status'])} className={inputCls}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} rows={2} placeholder="Any additional notes..." />
          </Field>
        </section>

        <div className="flex gap-3">
          <Link href="/students" className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors inline-flex items-center">Cancel</Link>
          <button data-testid="submit-student" type="submit" disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Saving...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}

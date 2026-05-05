import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { getClass, getStudents, getTeachers, saveClass, getAttendanceForClass } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClassDetail({ params }: { params: { id: string } }) {
  const [, forceUpdate] = useState(0);
  const cls = getClass(params.id);

  if (!cls) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Class not found.</p>
      <Link href="/classes" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Classes</Link>
    </div>
  );

  const allStudents = getStudents();
  const teachers = getTeachers();
  const teacher = teachers.find(t => t.id === cls.teacherId);
  const enrolledStudents = allStudents.filter(s => cls.enrolledStudents.includes(s.id));
  const attendance = getAttendanceForClass(params.id);

  const toggleStudent = (studentId: string) => {
    const enrolled = cls.enrolledStudents.includes(studentId)
      ? cls.enrolledStudents.filter(id => id !== studentId)
      : [...cls.enrolledStudents, studentId];
    saveClass({ ...cls, enrolledStudents: enrolled });
    forceUpdate(n => n + 1);
  };

  const attMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach(a => {
    a.records.forEach(r => {
      if (!attMap[r.studentId]) attMap[r.studentId] = { present: 0, total: 0 };
      attMap[r.studentId].total++;
      if (r.status === 'Present') attMap[r.studentId].present++;
    });
  });

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/classes" className="p-2 rounded-lg hover:bg-muted transition-colors inline-flex"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">{cls.name}</h2>
          <p className="text-sm text-muted-foreground">{cls.grade} · {cls.medium} Medium</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center"><div className="text-2xl font-bold text-foreground">{cls.enrolledStudents.length}</div><div className="text-xs text-muted-foreground">Enrolled</div></div>
        <div className="bg-card border border-border rounded-xl p-4 text-center"><div className="text-2xl font-bold text-foreground">{cls.maxStudents}</div><div className="text-xs text-muted-foreground">Max Capacity</div></div>
        <div className="bg-card border border-border rounded-xl p-4 text-center"><div className="text-xl font-bold text-primary">{formatCurrency(cls.monthlyFee)}</div><div className="text-xs text-muted-foreground">Monthly Fee</div></div>
        <div className="bg-card border border-border rounded-xl p-4 text-center"><div className="text-2xl font-bold text-foreground">{attendance.length}</div><div className="text-xs text-muted-foreground">Sessions</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="font-semibold text-foreground mb-4">Class Information</h4>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-muted-foreground">Subject</dt><dd className="font-medium">{cls.subject}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Teacher</dt><dd className="font-medium">{teacher?.fullName || 'Not assigned'}</dd></div>
            {cls.room && <div><dt className="text-xs text-muted-foreground">Room</dt><dd className="font-medium">{cls.room}</dd></div>}
            <div><dt className="text-xs text-muted-foreground mb-1">Schedule</dt>
              {cls.schedule.map((s, i) => <dd key={i} className="font-medium flex items-center gap-1.5 text-xs"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{s.day}: {s.startTime} – {s.endTime}</dd>)}
            </div>
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{cls.status}</span></dd></div>
          </dl>
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
            <Link href="/attendance" className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:opacity-90">Mark Attendance</Link>
            <Link href="/payments" className="px-3 py-1.5 border border-border text-foreground text-xs rounded-lg hover:bg-muted">View Payments</Link>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h4 className="font-semibold text-foreground mb-4">Enrolled Students ({enrolledStudents.length})</h4>
          {enrolledStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No students enrolled yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="text-left pb-2">Student</th><th className="text-left pb-2 hidden sm:table-cell">School</th><th className="text-left pb-2">Attendance</th><th className="text-left pb-2">Action</th></tr></thead>
              <tbody>
                {enrolledStudents.map(s => {
                  const att = attMap[s.id];
                  const rate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3">
                        <Link href={`/students/${s.id}`} className="font-medium text-primary hover:underline">{s.fullName}</Link>
                        <div className="text-xs text-muted-foreground">{s.studentId}</div>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs hidden sm:table-cell">{s.school}</td>
                      <td className="py-2 pr-3">
                        {rate !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs">{rate}%</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">No data</span>}
                      </td>
                      <td className="py-2">
                        <button onClick={() => toggleStudent(s.id)} className="text-xs text-destructive hover:underline">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Add Students</h5>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {allStudents.filter(s => !cls.enrolledStudents.includes(s.id) && s.status === 'Active').slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1">
                  <span className="text-sm">{s.fullName} <span className="text-xs text-muted-foreground">({s.grade})</span></span>
                  <button onClick={() => toggleStudent(s.id)} className="text-xs text-primary hover:underline">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h4 className="font-semibold text-foreground mb-4">Attendance History</h4>
        {attendance.length === 0 ? <p className="text-sm text-muted-foreground">No attendance records.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="text-left pb-2">Date</th><th className="text-left pb-2">Present</th><th className="text-left pb-2">Absent</th><th className="text-left pb-2">Late</th><th className="text-left pb-2">Rate</th></tr></thead>
              <tbody>
                {attendance.sort((a,b) => b.date.localeCompare(a.date)).map(a => {
                  const p = a.records.filter(r => r.status === 'Present').length;
                  const ab = a.records.filter(r => r.status === 'Absent').length;
                  const l = a.records.filter(r => r.status === 'Late').length;
                  const rate = a.records.length > 0 ? Math.round((p / a.records.length) * 100) : 0;
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4">{formatDate(a.date)}</td>
                      <td className="py-2 pr-4 text-green-600 font-medium">{p}</td>
                      <td className="py-2 pr-4 text-red-600 font-medium">{ab}</td>
                      <td className="py-2 pr-4 text-yellow-600 font-medium">{l}</td>
                      <td className="py-2">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { getClasses, getStudents, getAttendanceForDate, saveAttendance } from "@/lib/storage";
import { formatDate, generateId } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Excused'] as const;
type AttStatus = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<AttStatus, string> = {
  Present: 'bg-green-100 text-green-700 border-green-200',
  Absent: 'bg-red-100 text-red-700 border-red-200',
  Late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Excused: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState<Record<string, AttStatus>>({});
  const [saved, setSaved] = useState(false);
  const [, forceUpdate] = useState(0);

  const classes = getClasses().filter(c => c.status === 'Active');
  const allStudents = getStudents();

  const cls = classes.find(c => c.id === selectedClass);
  const enrolledStudents = cls ? allStudents.filter(s => cls.enrolledStudents.includes(s.id) && s.status === 'Active') : [];

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSaved(false);
    loadAttendance(classId, selectedDate);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSaved(false);
    if (selectedClass) loadAttendance(selectedClass, date);
  };

  const loadAttendance = (classId: string, date: string) => {
    const existing = getAttendanceForDate(classId, date);
    if (existing) {
      const map: Record<string, AttStatus> = {};
      existing.records.forEach(r => { map[r.studentId] = r.status as AttStatus; });
      setRecords(map);
    } else {
      const cls = classes.find(c => c.id === classId);
      const students = cls ? allStudents.filter(s => cls.enrolledStudents.includes(s.id) && s.status === 'Active') : [];
      const map: Record<string, AttStatus> = {};
      students.forEach(s => { map[s.id] = 'Present'; });
      setRecords(map);
    }
  };

  const setStatus = (studentId: string, status: AttStatus) => {
    setRecords(r => ({ ...r, [studentId]: status }));
    setSaved(false);
  };

  const markAll = (status: AttStatus) => {
    const map: Record<string, AttStatus> = {};
    enrolledStudents.forEach(s => { map[s.id] = status; });
    setRecords(map);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedClass || !selectedDate) return;
    const existing = getAttendanceForDate(selectedClass, selectedDate);
    const record: AttendanceRecord = {
      id: existing?.id || generateId(),
      classId: selectedClass,
      date: selectedDate,
      records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
      markedBy: 'Admin',
    };
    saveAttendance(record);
    setSaved(true);
    forceUpdate(n => n + 1);
  };

  const presentCount = Object.values(records).filter(s => s === 'Present').length;
  const absentCount = Object.values(records).filter(s => s === 'Absent').length;
  const lateCount = Object.values(records).filter(s => s === 'Late').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Attendance</h2>
          <p className="text-sm text-muted-foreground">Mark and view class attendance</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-foreground mb-1.5">Select Class</label>
          <select
            data-testid="select-class"
            value={selectedClass}
            onChange={e => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Choose a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
          <input
            data-testid="select-date"
            type="date"
            value={selectedDate}
            onChange={e => handleDateChange(e.target.value)}
            max={today}
            className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {cls && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{presentCount}</div>
              <div className="text-xs text-green-600 font-medium">Present</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{absentCount}</div>
              <div className="text-xs text-red-600 font-medium">Absent</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{lateCount}</div>
              <div className="text-xs text-yellow-600 font-medium">Late</div>
            </div>
          </div>

          {/* Mark All */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{cls.name}</h3>
                <p className="text-xs text-muted-foreground">{formatDate(selectedDate)} · {enrolledStudents.length} students</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Mark All:</span>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    data-testid={`mark-all-${s.toLowerCase()}`}
                    onClick={() => markAll(s)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors hover:opacity-80 ${STATUS_COLORS[s]}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {enrolledStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No students enrolled in this class.</p>
              ) : enrolledStudents.map(s => (
                <div key={s.id} data-testid={`att-row-${s.id}`} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {s.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.fullName}</div>
                      <div className="text-xs text-muted-foreground">{s.studentId} · {s.school}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        data-testid={`att-${s.id}-${status.toLowerCase()}`}
                        onClick={() => setStatus(s.id, status)}
                        className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${records[s.id] === status ? STATUS_COLORS[status] + ' ring-2 ring-offset-1 ring-current' : 'bg-background text-muted-foreground border-input hover:bg-muted'}`}
                      >{status}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {saved && <span className="text-sm text-green-600 font-medium">Attendance saved successfully!</span>}
              <div className="ml-auto">
                <button
                  data-testid="save-attendance-btn"
                  onClick={handleSave}
                  disabled={enrolledStudents.length === 0}
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedClass && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-muted-foreground text-sm">Select a class and date to mark attendance.</p>
        </div>
      )}
    </div>
  );
}

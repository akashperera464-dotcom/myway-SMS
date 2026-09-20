import { useState, useEffect } from "react";
import { getClasses, getStudents, getAttendanceForDate, saveAttendance, useStorageSync } from "@/lib/storage";
import { formatDate, generateId } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/types";
import { ArrowLeft, QrCode, ListFilter, CheckCircle2, Save } from "lucide-react";
import { Link } from "wouter";
import QrAttendanceScanner, { type AttStatus } from "@/components/QrAttendanceScanner";

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Excused'] as const;

const STATUS_COLORS: Record<AttStatus, string> = {
  Present: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  Absent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  Late: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
  Excused: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
};

export default function Attendance() {
  useStorageSync(['myway_attendance', 'myway_classes', 'myway_students']);

  const today = new Date().toISOString().slice(0, 10);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState<Record<string, AttStatus>>({});
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<'manual' | 'qr'>('manual');
  const [, forceUpdate] = useState(0);

  const classes = getClasses().filter(c => c.status === 'Active');
  const allStudents = getStudents();

  const cls = classes.find(c => c.id === selectedClass);
  const enrolledStudents = cls ? allStudents.filter(s => cls.enrolledStudents.includes(s.id) && s.status === 'Active') : [];

  const loadAttendance = (classId: string, date: string) => {
    const existing = getAttendanceForDate(classId, date);
    if (existing) {
      const map: Record<string, AttStatus> = {};
      existing.records.forEach(r => { map[r.studentId] = r.status as AttStatus; });
      setRecords(map);
    } else {
      const targetCls = classes.find(c => c.id === classId);
      const students = targetCls ? allStudents.filter(s => targetCls.enrolledStudents.includes(s.id) && s.status === 'Active') : [];
      const map: Record<string, AttStatus> = {};
      students.forEach(s => { map[s.id] = 'Present'; });
      setRecords(map);
    }
  };

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

  // Immediate save on QR scan or status toggle
  const handleMarkAndSave = (studentId: string, status: AttStatus) => {
    setRecords(prev => {
      const updated = { ...prev, [studentId]: status };
      if (selectedClass && selectedDate) {
        const existing = getAttendanceForDate(selectedClass, selectedDate);
        const record: AttendanceRecord = {
          id: existing?.id || generateId(),
          classId: selectedClass,
          date: selectedDate,
          records: Object.entries(updated).map(([sId, st]) => ({ studentId: sId, status: st })),
          markedBy: 'Admin (QR Scanner)',
        };
        saveAttendance(record);
      }
      return updated;
    });
    setSaved(true);
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
  const excusedCount = Object.values(records).filter(s => s === 'Excused').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Attendance</h2>
            <p className="text-sm text-muted-foreground">Mark by QR Code or manual roster with live cloud sync</p>
          </div>
        </div>

        {cls && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-xs"
            >
              <Save className="w-4 h-4" /> Save All to Cloud
            </button>
          </div>
        )}
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

        {cls && (
          <div className="ml-auto flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border">
            <button
              onClick={() => setMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'manual'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Manual Roster
            </button>
            <button
              onClick={() => setMode('qr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'qr'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> 📷 QR Scanner Mode
            </button>
          </div>
        )}
      </div>

      {cls && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Present</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateCount}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Late</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-center">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{absentCount}</div>
              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Absent</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{excusedCount}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Excused</div>
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Attendance saved and synchronized with database!
              </span>
              <span className="text-[11px] opacity-80">{enrolledStudents.length} Students in Roster</span>
            </div>
          )}

          {mode === 'qr' ? (
            <QrAttendanceScanner
              activeClass={cls}
              allStudents={allStudents}
              onMarkAttendance={(studentId, status) => handleMarkAndSave(studentId, status)}
              attendanceRecords={records}
            />
          ) : (
            /* Mark All & Manual Roster */
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
          )}
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

import { useEffect, useMemo, useState } from "react";
import { getClasses, getPaymentsForStudent, getSettings, getStudents, getAttendanceForDate, saveAttendance, upsertAttendanceRecord, useStorageSync } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/types";
import { ArrowLeft, QrCode, ListFilter, CheckCircle2, Save, Undo2, MessageCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/App";
import QrAttendanceScanner, { type AttStatus } from "@/components/QrAttendanceScanner";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Excused"] as const;

type AttendanceMap = Partial<Record<string, AttStatus>>;

const STATUS_COLORS: Record<AttStatus, string> = {
  Present: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
  Absent: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  Late: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
  Excused: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
};

const sessionOptions = [
  { id: "default", label: "Regular" },
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
  { id: "makeup", label: "Makeup" },
];

function safeName(name?: string) {
  return (name || "Unknown Student").trim() || "Unknown Student";
}

function toWhatsAppNumber(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return digits;
}

export default function Attendance() {
  useStorageSync(["myway_attendance", "myway_classes", "myway_students", "myway_payments"]);

  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [sessionId, setSessionId] = useState("default");
  const [records, setRecords] = useState<AttendanceMap>({});
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<"manual" | "qr">("manual");
  const [history, setHistory] = useState<AttendanceMap[]>([]);
  const [, forceUpdate] = useState(0);

  const classes = getClasses().filter(c => c.status === "Active");
  const allStudents = getStudents();
  const settings = getSettings();
  const markedBy = user?.fullName || user?.username || "Admin";

  const cls = classes.find(c => c.id === selectedClass);
  const enrolledStudents = useMemo(
    () => (cls ? allStudents.filter(s => cls.enrolledStudents.includes(s.id) && s.status === "Active") : []),
    [cls, allStudents],
  );
  const selectedSessionLabel = sessionOptions.find(s => s.id === sessionId)?.label || "Regular";

  const loadAttendance = (classId: string, date: string, targetSession = sessionId) => {
    const existing = getAttendanceForDate(classId, date, targetSession);
    const map: AttendanceMap = {};
    existing?.records.forEach(r => { map[r.studentId] = r.status as AttStatus; });
    setRecords(map);
    setHistory([]);
  };

  useEffect(() => {
    if (selectedClass) loadAttendance(selectedClass, selectedDate, sessionId);
  }, [selectedClass, selectedDate, sessionId]);

  const hasUnsavedChanges = !saved && Object.keys(records).length > 0;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || mode === "qr") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, mode]);

  const pushHistory = () => setHistory(prev => [records, ...prev].slice(0, 10));

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSaved(false);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSaved(false);
  };

  const handleMarkAndSave = (studentId: string, status: AttStatus, method: "QR" | "USB" | "Upload" | "Manual" = "QR") => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
    if (selectedClass && selectedDate) {
      upsertAttendanceRecord(
        selectedClass,
        selectedDate,
        sessionId,
        { studentId, status, markedAt: new Date().toISOString(), markedBy, method },
        markedBy,
        selectedSessionLabel,
      );
    }
    setSaved(true);
  };

  const setStatus = (studentId: string, status: AttStatus) => {
    pushHistory();
    setRecords(r => ({ ...r, [studentId]: status }));
    setSaved(false);
  };

  const markAll = (status: AttStatus) => {
    if (enrolledStudents.length > 0 && !window.confirm(`Mark all ${enrolledStudents.length} students as ${status}?`)) return;
    pushHistory();
    const map: AttendanceMap = {};
    enrolledStudents.forEach(s => { map[s.id] = status; });
    setRecords(map);
    setSaved(false);
  };

  const undoLast = () => {
    const [previous, ...rest] = history;
    if (!previous) return;
    setRecords(previous);
    setHistory(rest);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedClass || !selectedDate) return;
    const unmarked = enrolledStudents.filter(s => !records[s.id]);
    if (unmarked.length > 0 && !window.confirm(`${unmarked.length} students are still unmarked. Save anyway?`)) return;

    const existing = getAttendanceForDate(selectedClass, selectedDate, sessionId);
    const record: AttendanceRecord = {
      id: existing?.id || `${selectedClass}_${selectedDate}_${sessionId}`,
      classId: selectedClass,
      date: selectedDate,
      sessionId,
      sessionName: selectedSessionLabel,
      records: enrolledStudents
        .filter(student => records[student.id])
        .map(student => ({
          studentId: student.id,
          status: records[student.id] as AttStatus,
          markedAt: new Date().toISOString(),
          markedBy,
          method: "Manual",
        })),
      markedBy,
      updatedAt: new Date().toISOString(),
    };
    saveAttendance(record);
    setSaved(true);
    setHistory([]);
    forceUpdate(n => n + 1);
  };

  const feePending = (studentId: string) => {
    const payment = getPaymentsForStudent(studentId).find(p => p.classId === selectedClass && p.month === settings.currentMonth);
    return !payment || payment.status !== "Paid";
  };

  const absentMessage = (studentName: string) => encodeURIComponent(
    `${studentName} was marked Absent for ${cls?.name || "class"} on ${formatDate(selectedDate)} (${selectedSessionLabel}). Please contact MYWAY if this is incorrect.`,
  );

  const presentCount = Object.values(records).filter(s => s === "Present").length;
  const absentCount = Object.values(records).filter(s => s === "Absent").length;
  const lateCount = Object.values(records).filter(s => s === "Late").length;
  const excusedCount = Object.values(records).filter(s => s === "Excused").length;
  const unmarkedCount = enrolledStudents.filter(s => !records[s.id]).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">Attendance</h2>
            <p className="text-sm text-muted-foreground">QR and manual roster with session tracking</p>
          </div>
        </div>

        {cls && (
          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-xs"
          >
            <Save className="w-4 h-4" /> Save All
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">Select Class</label>
          <select data-testid="select-class" value={selectedClass} onChange={e => handleClassChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Choose a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
          <input data-testid="select-date" type="date" value={selectedDate} onChange={e => handleDateChange(e.target.value)} max={today} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Session</label>
          <select value={sessionId} onChange={e => { setSessionId(e.target.value); setSaved(false); }} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            {sessionOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {cls && (
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border overflow-x-auto">
              <button onClick={() => setMode("manual")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${mode === "manual" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                <ListFilter className="w-3.5 h-3.5" /> Manual Roster
              </button>
              <button onClick={() => setMode("qr")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${mode === "qr" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>
                <QrCode className="w-3.5 h-3.5" /> QR Scanner
              </button>
            </div>
            {history.length > 0 && mode === "manual" && (
              <button onClick={undoLast} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted">
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
            )}
          </div>
        )}
      </div>

      {cls && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center"><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</div><div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Present</div></div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-center"><div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateCount}</div><div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Late</div></div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-center"><div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{absentCount}</div><div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Absent</div></div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-center"><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{excusedCount}</div><div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Excused</div></div>
            <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3.5 text-center col-span-2 sm:col-span-1"><div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{unmarkedCount}</div><div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Unmarked</div></div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Attendance saved and queued for cloud sync if offline.</span>
              <span className="text-[11px] opacity-80 whitespace-nowrap">{enrolledStudents.length} students</span>
            </div>
          )}

          {mode === "qr" ? (
            <QrAttendanceScanner activeClass={cls} allStudents={allStudents} onMarkAttendance={handleMarkAndSave} attendanceRecords={records as Record<string, AttStatus>} />
          ) : (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(selectedDate)} - {selectedSessionLabel} - {enrolledStudents.length} students</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Mark All:</span>
                  {STATUS_OPTIONS.map(s => <button key={s} data-testid={`mark-all-${s.toLowerCase()}`} onClick={() => markAll(s)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors hover:opacity-80 ${STATUS_COLORS[s]}`}>{s}</button>)}
                </div>
              </div>

              <div className="space-y-2">
                {enrolledStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No students enrolled in this class.</p>
                ) : enrolledStudents.map(s => {
                  const name = safeName(s.fullName);
                  const pending = feePending(s.id);
                  const whatsapp = toWhatsAppNumber(s.whatsapp || s.guardianPhone);
                  return (
                    <div key={s.id} data-testid={`att-row-${s.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">{name.charAt(0)}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{name}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.studentId} - {s.school}</div>
                          {pending && <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="w-3 h-3" /> Fee due for {settings.currentMonth}</div>}
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:justify-end gap-1.5">
                        {STATUS_OPTIONS.map(status => <button key={status} data-testid={`att-${s.id}-${status.toLowerCase()}`} onClick={() => setStatus(s.id, status)} className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${records[s.id] === status ? STATUS_COLORS[status] + " ring-2 ring-offset-1 ring-current" : "bg-background text-muted-foreground border-input hover:bg-muted"}`}>{status}</button>)}
                        {records[s.id] === "Absent" && whatsapp && <a href={`https://wa.me/${whatsapp}?text=${absentMessage(name)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"><MessageCircle className="w-3.5 h-3.5" /> Parent</a>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {hasUnsavedChanges && mode === "manual" && <span className="text-xs text-amber-600 font-medium">Unsaved manual changes</span>}
                <button data-testid="save-attendance-btn" onClick={handleSave} disabled={enrolledStudents.length === 0} className="w-full sm:w-auto sm:ml-auto px-6 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">Save Attendance</button>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedClass && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center"><ListFilter className="w-6 h-6 text-muted-foreground" /></div>
          <p className="text-muted-foreground text-sm">Select a class and date to mark attendance.</p>
        </div>
      )}
    </div>
  );
}

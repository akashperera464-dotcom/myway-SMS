import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Upload, Keyboard, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Volume2, ShieldAlert, SwitchCamera, Check, Clock, UserX, AlertCircle } from "lucide-react";
import type { Student, TuitionClass } from "@/lib/types";
import { parseStudentQrPayload, playSuccessBeep, playWarningBeep } from "@/lib/qrUtils";
import { getPaymentsForStudent, getSettings } from "@/lib/storage";

export type AttStatus = "Present" | "Late" | "Absent" | "Excused";

interface QrAttendanceScannerProps {
  activeClass: TuitionClass;
  allStudents: Student[];
  onMarkAttendance: (studentId: string, status: AttStatus) => void;
  attendanceRecords: Record<string, AttStatus>;
}

interface ScanLogItem {
  id: string;
  time: string;
  student: Student;
  enrolled: boolean;
  feePending: boolean;
  status: AttStatus | "Not Enrolled";
}

const STATUS_CONFIG: Record<AttStatus, { label: string; activeCls: string; inactiveCls: string; icon: typeof Check }> = {
  Present: {
    label: "Present",
    activeCls: "bg-emerald-600 text-white shadow-xs font-bold border-emerald-600",
    inactiveCls: "bg-background text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
    icon: CheckCircle2,
  },
  Late: {
    label: "Late",
    activeCls: "bg-amber-600 text-white shadow-xs font-bold border-amber-600",
    inactiveCls: "bg-background text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40",
    icon: Clock,
  },
  Excused: {
    label: "Excused",
    activeCls: "bg-blue-600 text-white shadow-xs font-bold border-blue-600",
    inactiveCls: "bg-background text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40",
    icon: AlertCircle,
  },
  Absent: {
    label: "Absent",
    activeCls: "bg-rose-600 text-white shadow-xs font-bold border-rose-600",
    inactiveCls: "bg-background text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40",
    icon: UserX,
  },
};

export default function QrAttendanceScanner({
  activeClass,
  allStudents,
  onMarkAttendance,
  attendanceRecords,
}: QrAttendanceScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [inputMode, setInputMode] = useState<"camera" | "manual" | "upload">("camera");
  const [scanStatus, setScanStatus] = useState<AttStatus>("Present");
  const [manualCode, setManualCode] = useState("");
  const [lastScanned, setLastScanned] = useState<ScanLogItem | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLogItem[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "qr-reader-container";
  const keyboardBufferRef = useRef<string>("");
  const keyboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  const settings = getSettings();
  const currentMonth = settings.currentMonth;

  // Process a decoded QR payload string
  const handleDecodedCode = (decodedText: string, customStatus?: AttStatus) => {
    const rawId = parseStudentQrPayload(decodedText);
    if (!rawId) return;

    // Find student match by studentId, registerNo, or id
    const cleanSearch = rawId.toLowerCase();
    const student = allStudents.find(
      s =>
        s.studentId.toLowerCase() === cleanSearch ||
        s.id.toLowerCase() === cleanSearch ||
        (s.registerNo && s.registerNo.toLowerCase() === cleanSearch)
    );

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    if (!student) {
      if (audioEnabled) playWarningBeep();
      setLastScanned(null);
      alert(`Student not found for QR code: "${decodedText}". Please verify student ID.`);
      return;
    }

    const isEnrolled = activeClass.enrolledStudents.includes(student.id);

    // Check fee payment for current month
    const payments = getPaymentsForStudent(student.id);
    const monthPayment = payments.find(p => p.classId === activeClass.id && p.month === currentMonth);
    const feePending = !monthPayment || monthPayment.status !== "Paid";

    const targetStatus = customStatus || scanStatus;

    if (isEnrolled) {
      onMarkAttendance(student.id, targetStatus);
      setLastSavedMessage(`Marked ${student.fullName.split(" ")[0]} as ${targetStatus} & Saved to Cloud`);
      setTimeout(() => setLastSavedMessage(null), 4000);

      if (audioEnabled) {
        if (feePending) playWarningBeep();
        else playSuccessBeep();
      }
    } else {
      if (audioEnabled) playWarningBeep();
    }

    const item: ScanLogItem = {
      id: Math.random().toString(),
      time: nowTime,
      student,
      enrolled: isEnrolled,
      feePending,
      status: isEnrolled ? targetStatus : "Not Enrolled",
    };

    setLastScanned(item);
    setScanLogs(prev => [item, ...prev.filter(l => l.student.id !== student.id).slice(0, 19)]);
  };

  // Change status of already scanned student
  const handleUpdateScannedStatus = (studentId: string, newStatus: AttStatus) => {
    onMarkAttendance(studentId, newStatus);
    setLastScanned(prev => (prev && prev.student.id === studentId ? { ...prev, status: newStatus } : prev));
    setScanLogs(prev => prev.map(l => (l.student.id === studentId ? { ...l, status: newStatus } : l)));
    setLastSavedMessage(`Updated to ${newStatus} & Saved to Cloud`);
    setTimeout(() => setLastSavedMessage(null), 3000);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      await scannerRef.current.start(
        { facingMode },
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn("Camera primary start error:", err);
      // Fallback: try default camera without facingMode restriction
      try {
        if (scannerRef.current) {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const selectedCam = cameras[cameras.length - 1]; // usually back camera
            await scannerRef.current.start(
              selectedCam.id,
              { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
              (decodedText) => handleDecodedCode(decodedText),
              () => {}
            );
            setCameraActive(true);
            return;
          }
        }
      } catch (fallbackErr) {
        console.error("Camera fallback start error:", fallbackErr);
      }

      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(`Camera error: ${errMsg}. Please ensure camera permission is granted or switch to USB / Image Upload.`);
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        console.error("Stop camera error:", e);
      }
      setCameraActive(false);
    }
  };

  // Toggle Camera Front / Back
  const toggleCameraFacing = async () => {
    await stopCamera();
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  // Clean up camera on mode switch or unmount
  useEffect(() => {
    if (inputMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [inputMode, facingMode]);

  // Handle USB Barcode/QR Scanner Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing inside an input field
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
        return;
      }

      if (e.key === "Enter") {
        if (keyboardBufferRef.current.trim().length > 0) {
          handleDecodedCode(keyboardBufferRef.current.trim());
          keyboardBufferRef.current = "";
        }
      } else if (e.key.length === 1) {
        keyboardBufferRef.current += e.key;

        if (keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current);
        keyboardTimerRef.current = setTimeout(() => {
          keyboardBufferRef.current = "";
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeClass, allStudents, audioEnabled, scanStatus]);

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempElementId = "qr-file-temp-" + Date.now();
      const div = document.createElement("div");
      div.id = tempElementId;
      div.style.display = "none";
      document.body.appendChild(div);

      const html5QrCode = new Html5Qrcode(tempElementId);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedCode(decodedText);
      await html5QrCode.clear();
      document.body.removeChild(div);
      e.target.value = "";
    } catch {
      alert("Could not detect a valid QR Code in the uploaded image. Please ensure the QR code is clearly visible.");
      e.target.value = "";
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDecodedCode(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Active Status Selector & Controller ── */}
      <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mark As:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["Present", "Late", "Excused", "Absent"] as AttStatus[]).map((status) => {
                const conf = STATUS_CONFIG[status];
                const Icon = conf.icon;
                const isSelected = scanStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setScanStatus(status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected ? conf.activeCls : conf.inactiveCls
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                audioEnabled
                  ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" /> Sound: {audioEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Input Mode Selector & Scanner Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setInputMode("camera")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputMode === "camera"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background text-foreground border border-input hover:bg-muted"
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Live Camera
            </button>
            <button
              onClick={() => setInputMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputMode === "manual"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background text-foreground border border-input hover:bg-muted"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" /> Barcode / Key In
            </button>
            <button
              onClick={() => setInputMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputMode === "upload"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background text-foreground border border-input hover:bg-muted"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload QR Image
            </button>
          </div>

          {inputMode === "camera" && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCameraFacing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Switch Front/Back Camera"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-primary" />
                <span>{facingMode === "environment" ? "Back Cam" : "Front Cam"}</span>
              </button>
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{cameraActive ? "Pause" : "Restart"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {lastSavedMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{lastSavedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Scanner Viewport */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">
                Scanning for: <span className="text-primary font-bold">{activeClass.name}</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Mode: {scanStatus}
              </span>
            </div>

            {/* Live Camera Viewport */}
            {inputMode === "camera" && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 min-h-[260px] flex items-center justify-center">
                  <div id={readerElementId} className="w-full max-w-sm rounded-lg overflow-hidden" />

                  {cameraError && (
                    <div className="p-5 text-center text-xs text-rose-400 max-w-xs space-y-2">
                      <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
                      <p>{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold mt-2"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Scan any student QR card. Scanned attendance is automatically saved to the database.
                </p>
              </div>
            )}

            {/* USB Barcode / Key In */}
            {inputMode === "manual" && (
              <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
                <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Keyboard className="w-4 h-4 text-primary" /> USB Barcode Scanner Ready
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scan cards with your handheld barcode gun, or type student ID (e.g. MW25001 or REG-001) below.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="Scan QR or type MW25001..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Mark {scanStatus}
                  </button>
                </div>
              </form>
            )}

            {/* Image File Upload */}
            {inputMode === "upload" && (
              <div className="py-8 border-2 border-dashed border-border rounded-xl text-center space-y-3">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <label htmlFor="qr-file-input" className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                    Choose QR Code Image
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WEBP student pass photo</p>
                </div>
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Scan Results & Quick Adjustments */}
        <div className="lg:col-span-6 space-y-4">
          {/* Latest Scanned Student */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Latest Scan Result
              </h4>
              {lastScanned && lastScanned.enrolled && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Auto-Saved
                </span>
              )}
            </div>

            {lastScanned ? (
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                    !lastScanned.enrolled
                      ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900"
                      : lastScanned.feePending
                      ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900"
                      : "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {lastScanned.student.fullName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground truncate">{lastScanned.student.fullName}</h4>
                      <span className="text-[11px] font-mono text-muted-foreground">{lastScanned.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lastScanned.student.studentId} · {lastScanned.student.school} ({lastScanned.student.grade})
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {lastScanned.enrolled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Marked {lastScanned.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5" /> Not Enrolled in {activeClass.name}
                        </span>
                      )}

                      {lastScanned.enrolled && lastScanned.feePending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Fee Due ({currentMonth})
                        </span>
                      )}
                    </div>

                    {/* Quick Status Adjustment Buttons */}
                    {lastScanned.enrolled && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Change Status:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(["Present", "Late", "Excused", "Absent"] as AttStatus[]).map((status) => {
                            const isCurrent = (attendanceRecords[lastScanned.student.id] || lastScanned.status) === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleUpdateScannedStatus(lastScanned.student.id, status)}
                                className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition-all ${
                                  isCurrent
                                    ? STATUS_CONFIG[status].activeCls
                                    : "bg-background text-muted-foreground border-input hover:bg-muted"
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground">Scan a student's card to record attendance.</p>
              </div>
            )}
          </div>

          {/* Session Scan History */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Session History ({scanLogs.length})
              </h4>
              <span className="text-[11px] text-muted-foreground">Click chips to change status</span>
            </div>

            {scanLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">History will appear here as students scan cards.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {scanLogs.map(log => {
                  const currentStatus = (attendanceRecords[log.student.id] || log.status) as AttStatus | "Not Enrolled";
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 border border-border rounded-lg text-xs hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-foreground truncate">{log.student.fullName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({log.student.studentId})</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {log.feePending && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Fee Due
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">{log.time}</span>

                        {log.enrolled ? (
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateScannedStatus(log.student.id, e.target.value as AttStatus)}
                            className="px-2 py-0.5 rounded text-[11px] font-bold border border-input bg-background cursor-pointer"
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Excused">Excused</option>
                            <option value="Absent">Absent</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                            Not Enrolled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Upload, Keyboard, CheckCircle, AlertTriangle, XCircle, RefreshCw, Volume2, ShieldAlert } from "lucide-react";
import type { Student, TuitionClass } from "@/lib/types";
import { parseStudentQrPayload, playSuccessBeep, playWarningBeep } from "@/lib/qrUtils";
import { getPaymentsForStudent, getSettings } from "@/lib/storage";

interface QrAttendanceScannerProps {
  activeClass: TuitionClass;
  allStudents: Student[];
  onMarkAttendance: (studentId: string, status: "Present" | "Late" | "Absent" | "Excused") => void;
  attendanceRecords: Record<string, string>;
}

interface ScanLogItem {
  id: string;
  time: string;
  student: Student;
  enrolled: boolean;
  feePending: boolean;
  status: string;
}

export default function QrAttendanceScanner({
  activeClass,
  allStudents,
  onMarkAttendance,
  attendanceRecords,
}: QrAttendanceScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"camera" | "manual" | "upload">("camera");
  const [manualCode, setManualCode] = useState("");
  const [lastScanned, setLastScanned] = useState<ScanLogItem | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLogItem[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "qr-reader-container";
  const keyboardBufferRef = useRef<string>("");
  const keyboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  const settings = getSettings();
  const currentMonth = settings.currentMonth;


  // Process a decoded QR payload string
  const handleDecodedCode = (decodedText: string) => {
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
      alert(`Student not found for QR code: "${decodedText}"`);
      return;
    }

    const isEnrolled = activeClass.enrolledStudents.includes(student.id);

    // Check fee payment for current month
    const payments = getPaymentsForStudent(student.id);
    const monthPayment = payments.find(p => p.classId === activeClass.id && p.month === currentMonth);
    const feePending = !monthPayment || monthPayment.status !== "Paid";

    if (isEnrolled) {
      onMarkAttendance(student.id, "Present");
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
      status: isEnrolled ? "Present" : "Not Enrolled",
    };

    setLastScanned(item);
    setScanLogs(prev => [item, ...prev.slice(0, 19)]);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
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
      console.error("Camera start error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(`Camera error: ${errMsg}. Please ensure camera permissions are allowed or switch to USB / File mode.`);
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
  }, [inputMode]);

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
  }, [activeClass, allStudents, audioEnabled]);

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-file-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedCode(decodedText);
      html5QrCode.clear();
    } catch {
      alert("Could not detect a valid QR Code in the uploaded image.");
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
    <div className="space-y-6">
      {/* Hidden temporary div for file scan */}
      <div id="qr-file-temp" className="hidden" />

      {/* Top Controller & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 border border-border p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputMode("camera")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              inputMode === "camera"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-background text-foreground border border-input hover:bg-muted"
            }`}
          >
            <Camera className="w-4 h-4" /> Live Camera
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              inputMode === "manual"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-background text-foreground border border-input hover:bg-muted"
            }`}
          >
            <Keyboard className="w-4 h-4" /> USB Scanner / KeyIn
          </button>
          <button
            onClick={() => setInputMode("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              inputMode === "upload"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-background text-foreground border border-input hover:bg-muted"
            }`}
          >
            <Upload className="w-4 h-4" /> Image Upload
          </button>
        </div>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            audioEnabled
              ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
              : "bg-background text-muted-foreground border-border"
          }`}
        >
          <Volume2 className="w-4 h-4" /> Audio Chime: {audioEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Interface Block */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                Scanning for <span className="text-primary font-bold">{activeClass.name}</span>
              </h3>
              {inputMode === "camera" && (
                <button
                  onClick={cameraActive ? stopCamera : startCamera}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {cameraActive ? "Pause Camera" : "Restart Camera"}
                </button>
              )}
            </div>

            {/* Camera Scanner Container */}
            {inputMode === "camera" && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 min-h-[260px] flex items-center justify-center">
                  <div id={readerElementId} className="w-full max-w-sm rounded-lg overflow-hidden" />

                  {cameraError && (
                    <div className="p-4 text-center text-xs text-red-400 max-w-xs space-y-2">
                      <AlertTriangle className="w-6 h-6 mx-auto text-red-400" />
                      <p>{cameraError}</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Point the student's ID Card QR Code at the camera. Attendance will mark automatically.
                </p>
              </div>
            )}

            {/* USB Scanner / Manual Key In */}
            {inputMode === "manual" && (
              <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
                <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Keyboard className="w-4 h-4 text-primary" /> USB Handheld Scanner Ready
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can scan student QR cards directly with a handheld barcode scanner now, or manually type the ID below.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="Scan barcode or type MYWAY:STD:1001..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Mark Present
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
                    Upload QR Image File
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

        {/* Live Scan Result Card & Activity Log */}
        <div className="lg:col-span-6 space-y-4">
          {/* Latest Scan Result Display */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              Latest Scan Result
            </h4>

            {lastScanned ? (
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                    !lastScanned.enrolled
                      ? "bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-900"
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
                      {/* Attendance Status Badge */}
                      {lastScanned.enrolled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" /> Marked Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border border-red-300">
                          <XCircle className="w-3.5 h-3.5" /> Not Enrolled in {activeClass.name}
                        </span>
                      )}

                      {/* Fee Pending Alert Badge */}
                      {lastScanned.enrolled && lastScanned.feePending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Fee Pending ({currentMonth})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground">No student scanned yet in this session.</p>
              </div>
            )}
          </div>

          {/* Session Scan Log */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              Session Scan History ({scanLogs.length})
            </h4>

            {scanLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">History will appear here as students scan cards.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {scanLogs.map(log => (
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.enrolled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

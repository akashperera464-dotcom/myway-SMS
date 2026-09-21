import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer, Download, Phone, ShieldCheck, Check } from "lucide-react";
import type { Student } from "@/lib/types";
import { generateStudentQrPayload } from "@/lib/qrUtils";
import { formatDate } from "@/lib/utils";

interface StudentIdCardModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentIdCardModal({ student, isOpen, onClose }: StudentIdCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const qrPayload = generateStudentQrPayload(student.id);
  const validTill = `${new Date().getFullYear()}-12-31`;

  const handlePrint = () => {
    window.print();
  };

  // 100% Reliable QR Pass / Code PNG generator with High-DPI Canvas
  const handleDownloadQrCard = (qrOnly: boolean = false) => {
    setDownloading(true);
    try {
      const svgEl = cardRef.current?.querySelector("svg");
      if (!svgEl) {
        setDownloading(false);
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL;
      const blobURL = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setDownloading(false);
          return;
        }

        if (qrOnly) {
          // Sharp, high-DPI 500x500 standalone QR
          canvas.width = 500;
          canvas.height = 500;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, 500, 500);

          // Draw QR centered with 40px quiet zone
          ctx.drawImage(img, 40, 40, 420, 420);

          // Label below QR
          ctx.fillStyle = "#0F172A";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(student.studentId, 250, 480);
        } else {
          // Full Student QR Pass Card (600x420)
          canvas.width = 600;
          canvas.height = 420;

          // Background card
          const gradient = ctx.createLinearGradient(0, 0, 600, 420);
          gradient.addColorStop(0, "#0F172A");
          gradient.addColorStop(0.5, "#1E293B");
          gradient.addColorStop(1, "#0D9488");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 600, 420);

          // Top Header Banner
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          ctx.fillRect(0, 0, 600, 75);

          // Institute Name
          ctx.fillStyle = "#2DD4BF";
          ctx.font = "900 24px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("MYWAY", 30, 42);

          ctx.fillStyle = "#E2E8F0";
          ctx.font = "500 12px sans-serif";
          ctx.fillText("Educational Institute · Student Pass", 30, 62);

          // Pass Badge on top right
          ctx.fillStyle = "rgba(45, 212, 191, 0.25)";
          ctx.beginPath();
          ctx.roundRect(470, 25, 100, 30, 6);
          ctx.fill();
          ctx.fillStyle = "#5EEAD4";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("STUDENT PASS", 520, 44);

          // Student Details (Left Column)
          ctx.textAlign = "left";
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(student.fullName.length > 24 ? student.fullName.slice(0, 24) + "..." : student.fullName, 30, 130);

          ctx.fillStyle = "#2DD4BF";
          ctx.font = "bold 16px monospace";
          ctx.fillText(`ID: ${student.studentId}`, 30, 160);

          ctx.fillStyle = "#CBD5E1";
          ctx.font = "14px sans-serif";
          ctx.fillText(`Reg No: ${student.registerNo || "N/A"}`, 30, 195);
          ctx.fillText(`Grade: ${student.grade}`, 30, 225);
          ctx.fillText(`School: ${student.school.length > 28 ? student.school.slice(0, 28) + "..." : student.school}`, 30, 255);
          ctx.fillText(`Guardian: ${student.guardianPhone} (${student.guardianRelationship || "Parent"})`, 30, 285);

          // QR Code Card Container (Right Column)
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(380, 110, 190, 190, 16);
          ctx.fill();

          // Draw the QR Code image inside the white container
          ctx.drawImage(img, 395, 125, 160, 160);

          // Footer
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fillRect(0, 360, 600, 60);

          ctx.fillStyle = "#94A3B8";
          ctx.font = "11px sans-serif";
          ctx.fillText(`Joined: ${formatDate(student.joinDate)} | Valid till: ${validTill}`, 30, 395);
          ctx.textAlign = "right";
          ctx.fillText("Official MYWAY Verification QR Code", 570, 395);
        }

        const pngFile = canvas.toDataURL("image/png", 1.0);
        const downloadLink = document.createElement("a");
        downloadLink.download = qrOnly
          ? `QR_Code_${student.studentId || "student"}.png`
          : `MYWAY_Pass_${student.studentId || "student"}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        URL.revokeObjectURL(blobURL);

        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      };

      img.onerror = () => {
        console.error("Failed to render QR to image");
        URL.revokeObjectURL(blobURL);
      };

      img.src = blobURL;
    } catch (err) {
      console.error("QR image generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-id-card, #printable-id-card * {
            visibility: visible;
          }
          #printable-id-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            width: 3.375in !important;
            height: 2.125in !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Student ID Pass &amp; QR
            </h3>
            <p className="text-xs text-muted-foreground">Digital pass for automated attendance &amp; verification</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable ID Card Container */}
        <div className="flex justify-center my-2">
          <div
            id="printable-id-card"
            ref={cardRef}
            className="w-[360px] min-h-[240px] rounded-xl border-2 border-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-4 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            {/* Background Decorative Graphic */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

            {/* Top Bar / Brand */}
            <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
              <div>
                <div className="text-xs font-black tracking-widest text-teal-400 uppercase">MYWAY</div>
                <div className="text-[10px] text-slate-300 font-medium">Educational Institute · Kandy</div>
              </div>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                STUDENT PASS
              </span>
            </div>

            {/* Card Body: Photo, Info, QR */}
            <div className="flex items-center gap-3 my-2">
              {/* Photo Avatar */}
              <div className="w-12 h-12 rounded-lg bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-200 text-xl font-bold flex-shrink-0 shadow-inner">
                {student.fullName.charAt(0)}
              </div>

              {/* Student Details */}
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-xs font-bold text-white truncate leading-tight">{student.fullName}</h4>
                <p className="text-[11px] font-mono text-teal-300 font-semibold">{student.studentId}</p>
                <div className="text-[10px] text-slate-300 space-y-0.5 mt-1">
                  <div>
                    Reg: <span className="text-white font-medium">{student.registerNo || "-"}</span> · Grade:{" "}
                    <span className="text-white font-medium">{student.grade}</span>
                  </div>
                  <div className="truncate">School: {student.school}</div>
                </div>
              </div>

              {/* QR Code SVG */}
              <div className="p-1.5 bg-white rounded-lg shadow-md flex-shrink-0 flex items-center justify-center">
                <QRCodeSVG
                  value={qrPayload}
                  size={104}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                />
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[9px] text-slate-400">
              <div className="flex items-center gap-1 text-slate-300">
                <Phone className="w-2.5 h-2.5 text-teal-400" />
                Emergency: {student.guardianPhone} ({student.guardianRelationship || "Guardian"})
              </div>
              <div>Valid till: {validTill}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            onClick={() => handleDownloadQrCard(true)}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Only
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadQrCard(false)}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              {downloaded ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Download className="w-3.5 h-3.5" />}
              {downloaded ? "Saved!" : "Download Full Pass (PNG)"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" /> Print ID Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

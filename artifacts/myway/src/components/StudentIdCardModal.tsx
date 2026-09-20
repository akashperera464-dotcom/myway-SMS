import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer, Download, Phone, ShieldCheck } from "lucide-react";
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
  const qrRef = useRef<SVGSVGElement>(null);

  if (!isOpen) return null;

  const qrPayload = generateStudentQrPayload(student.studentId || student.registerNo || student.id);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    const svgEl = cardRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${student.studentId || "student"}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
              Student ID Pass
            </h3>
            <p className="text-xs text-muted-foreground">Digital & Printable Official Student Pass</p>
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
            className="w-[360px] min-h-[220px] rounded-xl border-2 border-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-4 shadow-xl flex flex-col justify-between relative overflow-hidden"
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
              <div className="w-14 h-14 rounded-lg bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-200 text-xl font-bold flex-shrink-0 shadow-inner">
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
                  ref={qrRef}
                  value={qrPayload}
                  size={64}
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
              <div>Joined: {formatDate(student.joinDate)}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" /> Download QR
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> Print ID Card
          </button>
        </div>
      </div>
    </div>
  );
}

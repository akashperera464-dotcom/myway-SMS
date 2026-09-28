import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer, Download, Phone, ShieldCheck, Check } from "lucide-react";
import type { Student } from "@/lib/types";
import { generateStudentQrPayload } from "@/lib/qrUtils";
import { formatDate } from "@/lib/utils";
import { getSettings } from "@/lib/storage";

interface StudentIdCardModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

const getDefaultValidTill = (student: Student) => {
  if (student.idCardValidTill) return student.idCardValidTill;
  const joinDate = student.joinDate ? new Date(student.joinDate) : new Date();
  const year = Number.isNaN(joinDate.getTime()) ? new Date().getFullYear() : joinDate.getFullYear();
  return `${year}-12-31`;
};

const short = (value: string | undefined, max: number, fallback = "-") => {
  const text = (value || fallback).trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
};

export default function StudentIdCardModal({ student, isOpen, onClose }: StudentIdCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const settings = getSettings();
  const instituteName = settings.name || "MYWAY";
  const displayName = student.fullName || student.nameInitials || "Student";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";
  const qrPayload = generateStudentQrPayload(student.id);
  const validTill = getDefaultValidTill(student);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQrCard = (qrOnly = false) => {
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
          URL.revokeObjectURL(blobURL);
          setDownloading(false);
          return;
        }

        if (qrOnly) {
          canvas.width = 640;
          canvas.height = 720;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 70, 70, 500, 500);
          ctx.fillStyle = "#0F172A";
          ctx.font = "bold 28px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(student.studentId || student.id, 320, 630);
          ctx.font = "18px sans-serif";
          ctx.fillText(displayName, 320, 666);
        } else {
          canvas.width = 1013;
          canvas.height = 638;

          const gradient = ctx.createLinearGradient(0, 0, 1013, 638);
          gradient.addColorStop(0, "#07111F");
          gradient.addColorStop(0.56, "#122235");
          gradient.addColorStop(1, "#0F766E");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1013, 638);

          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fillRect(0, 0, 1013, 122);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "900 42px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(instituteName, 54, 58);
          ctx.fillStyle = "#A7F3D0";
          ctx.font = "500 18px sans-serif";
          ctx.fillText("Educational Institute Management", 56, 91);

          ctx.fillStyle = "#14B8A6";
          ctx.fillRect(54, 162, 160, 160);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "900 78px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(initial, 134, 266);

          ctx.textAlign = "left";
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "900 32px sans-serif";
          ctx.fillText(short(displayName, 30), 246, 188);
          ctx.fillStyle = "#5EEAD4";
          ctx.font = "bold 24px monospace";
          ctx.fillText(student.studentId || student.id, 246, 229);
          ctx.fillStyle = "#CBD5E1";
          ctx.font = "22px sans-serif";
          ctx.fillText(`Reg No: ${student.registerNo || "-"}`, 246, 274);
          ctx.fillText(`Grade: ${student.grade || "-"}`, 246, 313);
          ctx.fillText(`School: ${short(student.school, 28)}`, 246, 352);

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(724, 158, 220, 220);
          ctx.drawImage(img, 746, 180, 176, 176);
          ctx.fillStyle = "#0F172A";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SCAN FOR ATTENDANCE", 834, 408);

          ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
          ctx.fillRect(0, 514, 1013, 124);
          ctx.textAlign = "left";
          ctx.fillStyle = "#E2E8F0";
          ctx.font = "20px sans-serif";
          ctx.fillText(`Guardian: ${student.guardianPhone || "-"}`, 54, 562);
          ctx.fillText(`Joined: ${student.joinDate ? formatDate(student.joinDate) : "-"}`, 54, 598);
          ctx.textAlign = "right";
          ctx.fillText(`Valid till: ${validTill}`, 958, 562);
          ctx.fillText("Official Student ID Card", 958, 598);
        }

        const downloadLink = document.createElement("a");
        downloadLink.download = qrOnly
          ? `MYWAY_QR_${student.studentId || student.id}.png`
          : `MYWAY_ID_Card_${student.studentId || student.id}.png`;
        downloadLink.href = canvas.toDataURL("image/png", 1.0);
        downloadLink.click();
        URL.revokeObjectURL(blobURL);
        setDownloading(false);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      };

      img.onerror = () => {
        console.error("Failed to render QR to image");
        URL.revokeObjectURL(blobURL);
        setDownloading(false);
      };

      img.src = blobURL;
    } catch (err) {
      console.error("QR image generation error:", err);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-id-card, #printable-id-card * { visibility: visible; }
          #printable-id-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            width: 3.375in !important;
            height: 2.125in !important;
            border-radius: 0.12in !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-card/95 shadow-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Student ID Card
            </h3>
            <p className="text-xs text-muted-foreground">Printable card with attendance QR</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close ID card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center overflow-x-auto pb-1">
          <div
            id="printable-id-card"
            ref={cardRef}
            className="relative aspect-[1.586] w-[390px] max-w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-950 text-white shadow-xl"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#07111f_0%,#122235_58%,#0f766e_100%)]" />
            <div className="absolute inset-x-0 top-0 h-[27%] bg-white/10 border-b border-white/15" />
            <div className="absolute left-0 top-[27%] h-1 w-full bg-primary" />

            <div className="relative z-10 flex h-full flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-black leading-none tracking-wide">{instituteName}</div>
                  <div className="mt-1 text-[10px] font-medium text-teal-100/85">Educational Institute Management</div>
                </div>
                <div className="rounded-full border border-teal-300/40 bg-teal-400/15 px-2 py-1 text-[9px] font-bold text-teal-100">
                  STUDENT ID
                </div>
              </div>

              <div className="grid grid-cols-[56px_1fr_118px] items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-teal-200/40 bg-teal-400/20 text-2xl font-black text-teal-50">
                  {student.photo ? <img src={student.photo} alt={displayName} className="h-full w-full rounded-xl object-cover" /> : initial}
                </div>

                <div className="min-w-0 text-left">
                  <div className="truncate text-sm font-black leading-tight">{displayName}</div>
                  <div className="mt-1 font-mono text-[12px] font-bold text-teal-200">{student.studentId || student.id}</div>
                  <div className="mt-1 space-y-0.5 text-[10px] text-slate-200/90">
                    <div>Reg: <span className="font-semibold text-white">{student.registerNo || "-"}</span></div>
                    <div>Grade: <span className="font-semibold text-white">{student.grade || "-"}</span></div>
                    <div className="truncate">School: {student.school || "-"}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-2 shadow-lg">
                  <QRCodeSVG
                    value={qrPayload}
                    size={102}
                    level="H"
                    includeMargin
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                  />
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 border-t border-white/15 pt-2 text-[9px] text-slate-200/90">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5 text-teal-200" />
                    <span className="truncate">{student.guardianPhone || "Guardian phone not set"}</span>
                  </div>
                  <div className="mt-0.5">Joined: {student.joinDate ? formatDate(student.joinDate) : "-"}</div>
                </div>
                <div className="text-right">
                  <div>Valid till</div>
                  <div className="font-semibold text-white">{validTill}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
          <button
            onClick={() => handleDownloadQrCard(true)}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> Download QR
          </button>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleDownloadQrCard(false)}
              disabled={downloading}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {downloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {downloaded ? "Saved" : "Download PNG"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" /> Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * QR Code Utility Functions for MYWAY Student Management System
 */

const QR_PREFIX = "MYWAY:STD:";
const QR_VERSION = "2";

/**
 * Format a student ID into a standardized MYWAY QR Payload
 */
export function generateStudentQrPayload(studentIdOrRegNo: string): string {
  if (!studentIdOrRegNo) return "";
  if (studentIdOrRegNo.startsWith(QR_PREFIX)) return studentIdOrRegNo;
  return `${QR_PREFIX}${QR_VERSION}:${studentIdOrRegNo.trim()}`;
}

/**
 * Extract student ID / Reg No from scanned QR string
 */
export function parseStudentQrPayload(scannedCode: string): string | null {
  if (!scannedCode) return null;
  const clean = scannedCode.trim();

  // Handle standard prefix format MYWAY:STD:<id>
  if (clean.startsWith(QR_PREFIX)) {
    const payload = clean.substring(QR_PREFIX.length).trim();
    const parts = payload.split(":");
    if (parts.length >= 2 && parts[0] === QR_VERSION) {
      return parts.slice(1).join(":").trim();
    }
    return payload;
  }

  // Fallback: handle direct JSON payload if any
  if (clean.startsWith("{") && clean.endsWith("}")) {
    try {
      const parsed = JSON.parse(clean);
      if (parsed.studentId) return String(parsed.studentId);
      if (parsed.id) return String(parsed.id);
      if (parsed.registerNo) return String(parsed.registerNo);
    } catch {
      // not JSON
    }
  }

  // Fallback: raw ID string directly
  return clean;
}

/**
 * Audio feedback synthesized using Web Audio API
 */
export function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First note (E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1318.51, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second higher note (B6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1975.53, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

export function playWarningBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.setValueAtTime(200, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}



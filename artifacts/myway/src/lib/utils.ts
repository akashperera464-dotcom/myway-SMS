import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-LK')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMonth(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function generateStudentId(index: number): string {
  const year = new Date().getFullYear().toString().slice(2);
  return `MW${year}${String(index).padStart(3, '0')}`;
}

export function generateReceiptNo(index: number): string {
  const year = new Date().getFullYear();
  return `MYWAY-${year}-${String(index).padStart(4, '0')}`;
}

export function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getGrade(obtained: number, total: number): string {
  const pct = (obtained / total) * 100;
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= 35) return 'S';
  return 'F';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600 bg-green-50';
    case 'B': return 'text-blue-600 bg-blue-50';
    case 'C': return 'text-yellow-600 bg-yellow-50';
    case 'S': return 'text-orange-600 bg-orange-50';
    case 'F': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle',
  'Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle',
  'Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala',
  'Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura',
  'Trincomalee','Vavuniya'
];

export const SL_PROVINCES = [
  'Central','Eastern','North Central','North Western','Northern',
  'Sabaragamuwa','Southern','Uva','Western'
];

export const SUBJECTS = [
  'Mathematics','Science','Physics','Chemistry','Biology',
  'Combined Mathematics','ICT','English','Sinhala','Tamil',
  'History','Geography','Commerce','Accounting','Business Studies',
  'Economics','Art','Music','Technology','Buddhism','Drama'
];

export const GRADES = [
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10',
  'Grade 11 (O/L)','Grade 12 (A/L Year 1)','Grade 13 (A/L Year 2)'
];

export const STREAMS = ['Science','Arts','Commerce','Technology','Bio Science'];

export const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

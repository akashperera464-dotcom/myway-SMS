import { useState, useEffect } from 'react';
import type { Student, TuitionClass, Teacher, AttendanceRecord, Payment, ExamResult, Notice, InstituteSettings, AppUser, Subject, TeacherPayment, Expense } from './types';
import { generateId, getCurrentMonth } from './utils';
import { db, ensureFirebaseAuth } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export const KEYS = {
  students: 'myway_students',
  classes: 'myway_classes',
  teachers: 'myway_teachers',
  attendance: 'myway_attendance',
  payments: 'myway_payments',
  results: 'myway_results',
  notices: 'myway_notices',
  settings: 'myway_settings',
  users: 'myway_users',
  sessionUser: 'myway_session_user',
  initialized: 'myway_initialized',
  subjects: 'myway_subjects',
  teacherPayments: 'myway_teacher_payments',
  expenses: 'myway_expenses',
};

function getList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error("LocalStorage save error:", e);
  }
}

function getOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOne<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("LocalStorage saveOne error:", e);
  }
}

// Clean helper to remove undefined keys so Firestore accepts the document
function cleanDoc<T>(obj: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}

export function notifyDataUpdated(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('myway_data_synced', { detail: { key } }));
  }
}

// React Hook to allow components to re-render automatically when data updates from Firestore or local writes
export function useStorageSync(keysToWatch?: string[]) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (!keysToWatch || !customEvent.detail?.key || keysToWatch.includes(customEvent.detail.key)) {
        setTick(t => t + 1);
      }
    };
    window.addEventListener('myway_data_synced', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('myway_data_synced', handler);
      window.removeEventListener('storage', handler);
    };
  }, [keysToWatch ? keysToWatch.join(',') : '']);
}

function ensureUsers() {
  const existing = getList<AppUser>(KEYS.users);
  if (existing.length === 0) {
    const users: AppUser[] = [
      { id: 'u1', username: 'akashperera@myway.lk', fullName: 'Akash Perera', role: 'Super Admin', status: 'Active', password: 'akash123*#' },
      { id: 'u2', username: 'owner@myway.lk', fullName: 'Owner', role: 'Owner', status: 'Active', password: 'owner123' },
      { id: 'u3', username: 'ops@myway.lk', fullName: 'Operations Staff', role: 'Operations Staff', status: 'Active', password: 'ops123' },
      { id: 'u4', username: 'teacher@myway.lk', fullName: 'Teacher Demo', role: 'Teacher', status: 'Active', password: 'teacher123' },
      { id: 'u5', username: 'student@myway.lk', fullName: 'Student Demo', role: 'Student', status: 'Active', password: 'student123' },
    ];
    saveList(KEYS.users, users);
  }
}

function seedData() {
  if (localStorage.getItem(KEYS.initialized)) {
    ensureUsers();
    return;
  }

  const teachers: Teacher[] = [
    { id: 't1', fullName: 'Mr. Sunil Jayawardena', nic: '198012345678', phone: '0712345678', whatsapp: '0712345678', email: 'sunil@myway.lk', subjects: ['Mathematics', 'Combined Mathematics'], qualification: 'B.Sc. Mathematics (University of Peradeniya)', address: '45/2, Peradeniya Road, Kandy', joinDate: '2020-01-15', salary: 80000, status: 'Active' },
    { id: 't2', fullName: 'Ms. Kumari Perera', nic: '197856781234', phone: '0778901234', whatsapp: '0778901234', email: 'kumari@myway.lk', subjects: ['Science', 'Biology', 'Chemistry'], qualification: 'B.Sc. Biology (University of Kelaniya)', address: '12, Hanthana Road, Kandy', joinDate: '2019-08-01', salary: 75000, status: 'Active' },
    { id: 't3', fullName: 'Mr. Chaminda Silva', nic: '198534561234', phone: '0763456789', whatsapp: '0763456789', subjects: ['English'], qualification: 'B.A. English (University of Colombo)', address: '78, Katugastota Road, Kandy', joinDate: '2021-03-10', salary: 65000, status: 'Active' },
  ];

  const classes: TuitionClass[] = [
    { id: 'c1', name: 'Grade 11 - Mathematics', subject: 'Mathematics', grade: 'Grade 11 (O/L)', medium: 'Sinhala', teacherId: 't1', schedule: [{ day: 'Saturday', startTime: '08:00', endTime: '10:00' }], room: 'Room A', monthlyFee: 3500, maxStudents: 30, enrolledStudents: ['s1', 's2', 's3', 's4'], status: 'Active' },
    { id: 'c2', name: 'Grade 10 - Science', subject: 'Science', grade: 'Grade 10', medium: 'Sinhala', teacherId: 't2', schedule: [{ day: 'Sunday', startTime: '09:00', endTime: '11:00' }], room: 'Room B', monthlyFee: 3000, maxStudents: 25, enrolledStudents: ['s2', 's3', 's5', 's6'], status: 'Active' },
    { id: 'c3', name: 'Grade 13 - Combined Maths', subject: 'Combined Mathematics', grade: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', teacherId: 't1', schedule: [{ day: 'Saturday', startTime: '14:00', endTime: '17:00' }], room: 'Room C', monthlyFee: 5000, maxStudents: 20, enrolledStudents: ['s7', 's8'], status: 'Active' },
    { id: 'c4', name: 'Grade 9 - English', subject: 'English', grade: 'Grade 9', medium: 'English', teacherId: 't3', schedule: [{ day: 'Wednesday', startTime: '16:00', endTime: '18:00' }], room: 'Room D', monthlyFee: 2500, maxStudents: 20, enrolledStudents: ['s1', 's4', 's5'], status: 'Active' },
  ];

  const students: Student[] = [
    { id: 's1', studentId: 'MW25001', registerNo: 'REG-001', fullName: 'Kasun Malinda Perera', nameInitials: 'K.M. Perera', dateOfBirth: '2008-04-15', gender: 'Male', school: 'Dharmaraja College, Kandy', grade: 'Grade 11 (O/L)', medium: 'Sinhala', address: '23, Mahaweli Garden, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Nimal Perera', guardianRelationship: 'Father', guardianPhone: '0712223344', whatsapp: '0712223344', classIds: ['c1', 'c4'], joinDate: '2023-01-10', status: 'Active', monthlyFee: 6000 },
    { id: 's2', studentId: 'MW25002', registerNo: 'REG-002', fullName: 'Nilukshi Sandamali Silva', nameInitials: 'N.S. Silva', dateOfBirth: '2008-07-22', gender: 'Female', school: 'Mahamaya Girls College, Kandy', grade: 'Grade 11 (O/L)', medium: 'Sinhala', address: '5, Rajapihilla Road, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Ranjith Silva', guardianRelationship: 'Father', guardianPhone: '0773344556', whatsapp: '0773344556', classIds: ['c1', 'c2'], joinDate: '2023-01-15', status: 'Active', monthlyFee: 6500 },
    { id: 's3', studentId: 'MW25003', registerNo: 'REG-003', fullName: 'Asel Ransith Fernando', nameInitials: 'A.R. Fernando', dateOfBirth: '2009-03-08', gender: 'Male', school: 'Trinity College, Kandy', grade: 'Grade 10', medium: 'Sinhala', address: '67, Colombo Street, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Sunethra Fernando', guardianRelationship: 'Mother', guardianPhone: '0764455667', whatsapp: '0764455667', classIds: ['c1', 'c2'], joinDate: '2023-02-01', status: 'Active', monthlyFee: 6500 },
    { id: 's4', studentId: 'MW25004', registerNo: 'REG-004', fullName: 'Himasha Dilrukshi Jayawardena', nameInitials: 'H.D. Jayawardena', dateOfBirth: '2008-11-30', gender: 'Female', school: 'Mahamaya Girls College, Kandy', grade: 'Grade 11 (O/L)', medium: 'Sinhala', address: '12, Peradeniya Road, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Pradeep Jayawardena', guardianRelationship: 'Father', guardianPhone: '0752233445', whatsapp: '0752233445', classIds: ['c1', 'c4'], joinDate: '2023-01-20', status: 'Active', monthlyFee: 6000 },
    { id: 's5', studentId: 'MW25005', registerNo: 'REG-005', fullName: 'Pathum Bandara Wijesinghe', nameInitials: 'P.B. Wijesinghe', dateOfBirth: '2009-08-14', gender: 'Male', school: 'Dharmaraja College, Kandy', grade: 'Grade 10', medium: 'Sinhala', address: '34, Getambe, Peradeniya', district: 'Kandy', province: 'Central', guardianName: 'Sumudu Wijesinghe', guardianRelationship: 'Mother', guardianPhone: '0718899001', whatsapp: '0718899001', classIds: ['c2', 'c4'], joinDate: '2023-03-05', status: 'Active', monthlyFee: 5500 },
    { id: 's6', studentId: 'MW25006', registerNo: 'REG-006', fullName: 'Isuri Pramodi Rajapaksa', nameInitials: 'I.P. Rajapaksa', dateOfBirth: '2009-01-25', gender: 'Female', school: 'Kandy Girls High School', grade: 'Grade 10', medium: 'Sinhala', address: '89, Katugastota, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Lasantha Rajapaksa', guardianRelationship: 'Father', guardianPhone: '0762211334', whatsapp: '0762211334', classIds: ['c2'], joinDate: '2023-02-20', status: 'Active', monthlyFee: 3000 },
    { id: 's7', studentId: 'MW25007', registerNo: 'REG-007', fullName: 'Sachini Dilrukshi Dissanayake', nameInitials: 'S.D. Dissanayake', dateOfBirth: '2006-05-18', gender: 'Female', school: 'Mahamaya Girls College, Kandy', grade: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', stream: 'Science', address: '23, Anniewatte, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Rohan Dissanayake', guardianRelationship: 'Father', guardianPhone: '0779988776', whatsapp: '0779988776', classIds: ['c3'], joinDate: '2022-01-10', status: 'Active', monthlyFee: 5000 },
    { id: 's8', studentId: 'MW25008', registerNo: 'REG-008', fullName: 'Tharaka Manjith Bandara', nameInitials: 'T.M. Bandara', dateOfBirth: '2006-09-03', gender: 'Male', school: 'Dharmaraja College, Kandy', grade: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', stream: 'Science', address: '45, Bahirawakanda, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Lalith Bandara', guardianRelationship: 'Father', guardianPhone: '0711234567', whatsapp: '0711234567', classIds: ['c3'], joinDate: '2022-01-15', status: 'Active', monthlyFee: 5000 },
  ];

  const today = new Date();
  const m = (offset: number) => {
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const payments: Payment[] = [
    { id: 'p1', studentId: 's1', classId: 'c1', month: m(0), amount: 3500, paidDate: today.toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0001', status: 'Paid' },
    { id: 'p2', studentId: 's2', classId: 'c1', month: m(0), amount: 3500, paidDate: today.toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0002', status: 'Paid' },
    { id: 'p3', studentId: 's3', classId: 'c1', month: m(0), amount: 3500, paidDate: today.toISOString().slice(0, 10), method: 'Bank Transfer', receiptNo: 'MYWAY-2025-0003', status: 'Paid' },
    { id: 'p4', studentId: 's1', classId: 'c4', month: m(0), amount: 2500, paidDate: today.toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0004', status: 'Paid' },
    { id: 'p5', studentId: 's2', classId: 'c2', month: m(0), amount: 3000, paidDate: '', method: 'Cash', receiptNo: 'MYWAY-2025-0005', status: 'Pending' },
    { id: 'p6', studentId: 's5', classId: 'c2', month: m(0), amount: 3000, paidDate: '', method: 'Cash', receiptNo: 'MYWAY-2025-0006', status: 'Pending' },
    { id: 'p7', studentId: 's7', classId: 'c3', month: m(0), amount: 5000, paidDate: today.toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0007', status: 'Paid' },
    { id: 'p8', studentId: 's8', classId: 'c3', month: m(0), amount: 5000, paidDate: '', method: 'Cash', receiptNo: 'MYWAY-2025-0008', status: 'Pending' },
    { id: 'p9', studentId: 's1', classId: 'c1', month: m(1), amount: 3500, paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 5).toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0009', status: 'Paid' },
    { id: 'p10', studentId: 's2', classId: 'c1', month: m(1), amount: 3500, paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 8).toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0010', status: 'Paid' },
    { id: 'p11', studentId: 's7', classId: 'c3', month: m(1), amount: 5000, paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 3).toISOString().slice(0, 10), method: 'Online', receiptNo: 'MYWAY-2025-0011', status: 'Paid' },
    { id: 'p12', studentId: 's8', classId: 'c3', month: m(1), amount: 5000, paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 10).toISOString().slice(0, 10), method: 'Cash', receiptNo: 'MYWAY-2025-0012', status: 'Paid' },
  ];

  const dateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  const attendance: AttendanceRecord[] = [
    { id: 'a1', classId: 'c1', date: dateStr(7), records: [{ studentId: 's1', status: 'Present' }, { studentId: 's2', status: 'Present' }, { studentId: 's3', status: 'Absent' }, { studentId: 's4', status: 'Present' }], markedBy: 'Mr. Sunil Jayawardena' },
    { id: 'a2', classId: 'c1', date: dateStr(14), records: [{ studentId: 's1', status: 'Present' }, { studentId: 's2', status: 'Late' }, { studentId: 's3', status: 'Present' }, { studentId: 's4', status: 'Present' }], markedBy: 'Mr. Sunil Jayawardena' },
    { id: 'a3', classId: 'c2', date: dateStr(6), records: [{ studentId: 's2', status: 'Present' }, { studentId: 's3', status: 'Present' }, { studentId: 's5', status: 'Present' }, { studentId: 's6', status: 'Absent' }], markedBy: 'Ms. Kumari Perera' },
    { id: 'a4', classId: 'c3', date: dateStr(7), records: [{ studentId: 's7', status: 'Present' }, { studentId: 's8', status: 'Present' }], markedBy: 'Mr. Sunil Jayawardena' },
  ];

  const results: ExamResult[] = [
    { id: 'r1', studentId: 's1', classId: 'c1', examName: 'Monthly Test - April', examDate: dateStr(20), totalMarks: 100, obtainedMarks: 82, grade: 'A', rank: 1 },
    { id: 'r2', studentId: 's2', classId: 'c1', examName: 'Monthly Test - April', examDate: dateStr(20), totalMarks: 100, obtainedMarks: 76, grade: 'A', rank: 2 },
    { id: 'r3', studentId: 's3', classId: 'c1', examName: 'Monthly Test - April', examDate: dateStr(20), totalMarks: 100, obtainedMarks: 68, grade: 'B', rank: 3 },
    { id: 'r4', studentId: 's7', classId: 'c3', examName: 'Term Exam - Paper 1', examDate: dateStr(15), totalMarks: 100, obtainedMarks: 91, grade: 'A', rank: 1 },
    { id: 'r5', studentId: 's8', classId: 'c3', examName: 'Term Exam - Paper 1', examDate: dateStr(15), totalMarks: 100, obtainedMarks: 78, grade: 'A', rank: 2 },
  ];

  const notices: Notice[] = [
    { id: 'n1', title: 'Special Class on Saturday', content: 'There will be a special revision class for Grade 11 students this Saturday from 8am to 12pm. Please bring all textbooks and past papers.', targetAudience: 'c1', createdAt: dateStr(2), priority: 'Important', createdBy: 'Admin' },
    { id: 'n2', title: 'May Fee Payment Reminder', content: 'Kindly settle your May 2025 class fees before the 15th. Students with outstanding fees from previous months should clear all dues.', targetAudience: 'All', createdAt: dateStr(1), priority: 'Normal', createdBy: 'Admin' },
    { id: 'n3', title: 'Institute Closed on Vesak Day', content: 'MYWAY Educational Institute will be closed on Vesak Full Moon Poya Day. Classes will resume as usual the following day.', targetAudience: 'All', createdAt: dateStr(5), expiresAt: dateStr(-10), priority: 'Urgent', createdBy: 'Admin' },
  ];

  const settings: InstituteSettings = {
    name: 'MYWAY Educational Institute',
    address: '123, Peradeniya Road, Kandy 20000, Sri Lanka',
    phone: '0812234567',
    email: 'info@myway.lk',
    registrationNo: 'TC/2020/KDY/0123',
    currency: 'LKR',
    currentMonth: getCurrentMonth(),
  };

  const users: AppUser[] = [
    { id: 'u1', username: 'akashperera@myway.lk', fullName: 'Akash Perera', role: 'Super Admin', status: 'Active', password: 'akash123*#' },
    { id: 'u2', username: 'owner@myway.lk', fullName: 'Owner', role: 'Owner', status: 'Active', password: 'owner123' },
    { id: 'u3', username: 'ops@myway.lk', fullName: 'Operations Staff', role: 'Operations Staff', status: 'Active', password: 'ops123' },
    { id: 'u4', username: 'teacher@myway.lk', fullName: 'Teacher Demo', role: 'Teacher', status: 'Active', password: 'teacher123' },
    { id: 'u5', username: 'student@myway.lk', fullName: 'Student Demo', role: 'Student', status: 'Active', password: 'student123' },
  ];

  const subjects: Subject[] = [
    { id: 'sub1', code: 'MATH-11', name: 'Mathematics', category: 'Core', description: 'Algebra, geometry, and calculus for O/L students.', gradeLevel: 'Grade 11 (O/L)', medium: 'Sinhala', teacherId: 't1', classIds: ['c1'], creditHours: 4, syllabus: 'Sri Lanka O/L Mathematics Syllabus 2025', status: 'Active', createdAt: '2024-01-01' },
    { id: 'sub2', code: 'SCI-10', name: 'Science', category: 'Core', description: 'Integrated science covering physics, chemistry, and biology basics.', gradeLevel: 'Grade 10', medium: 'Sinhala', teacherId: 't2', classIds: ['c2'], creditHours: 4, syllabus: 'Sri Lanka Grade 10 Science Syllabus', status: 'Active', createdAt: '2024-01-01' },
    { id: 'sub3', code: 'CMATH-13', name: 'Combined Mathematics', category: 'Core', description: 'Advanced mathematics for A/L Science stream students.', gradeLevel: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', teacherId: 't1', classIds: ['c3'], creditHours: 6, syllabus: 'Sri Lanka A/L Combined Maths Syllabus', status: 'Active', createdAt: '2024-01-01' },
    { id: 'sub4', code: 'ENG-09', name: 'English', category: 'Core', description: 'Spoken and written English communication for secondary students.', gradeLevel: 'Grade 9', medium: 'English', teacherId: 't3', classIds: ['c4'], creditHours: 3, syllabus: 'Sri Lanka English Language Syllabus', status: 'Active', createdAt: '2024-01-01' },
    { id: 'sub5', code: 'CHEM-AL', name: 'Chemistry', category: 'Optional', description: 'A/L Chemistry covering organic and inorganic chemistry.', gradeLevel: 'Grade 12 (A/L Year 1)', medium: 'Sinhala', teacherId: 't2', classIds: [], creditHours: 5, status: 'Active', createdAt: '2024-01-01' },
    { id: 'sub6', code: 'ICT-10', name: 'ICT', category: 'Elective', description: 'Information and communication technology fundamentals.', gradeLevel: 'Grade 10', medium: 'English', classIds: [], creditHours: 2, status: 'Inactive', createdAt: '2024-01-01' },
  ];

  const teacherPayments: TeacherPayment[] = [
    { id: 'tp1', teacherId: 't1', month: m(1), amount: 80000, paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 28).toISOString().slice(0, 10), method: 'Bank Transfer', referenceNo: 'TR-1234' },
  ];

  const expenses: Expense[] = [
    { id: 'e1', category: 'Electricity', amount: 15000, date: dateStr(15), description: 'Monthly electricity bill', recordedBy: 'Admin' },
    { id: 'e2', category: 'Rent', amount: 50000, date: dateStr(25), description: 'Building rent', recordedBy: 'Admin' },
  ];

  saveList(KEYS.teachers, teachers);
  saveList(KEYS.classes, classes);
  saveList(KEYS.students, students);
  saveList(KEYS.payments, payments);
  saveList(KEYS.attendance, attendance);
  saveList(KEYS.results, results);
  saveList(KEYS.notices, notices);
  saveOne(KEYS.settings, settings);
  saveList(KEYS.users, users);
  saveList(KEYS.subjects, subjects);
  saveList(KEYS.teacherPayments, teacherPayments);
  saveList(KEYS.expenses, expenses);
  localStorage.setItem(KEYS.initialized, '1');
}

seedData();

// ─── Firestore Real-Time Sync Setup ──────────────────────────────────────────
let syncInitialized = false;

export function initFirestoreSync() {
  if (syncInitialized || typeof window === 'undefined') return;
  syncInitialized = true;

  ensureFirebaseAuth().then(() => {
    const collectionsToSync: { key: string; colName: string }[] = [
      { key: KEYS.students, colName: 'students' },
      { key: KEYS.classes, colName: 'classes' },
      { key: KEYS.teachers, colName: 'teachers' },
      { key: KEYS.attendance, colName: 'attendance' },
      { key: KEYS.payments, colName: 'payments' },
      { key: KEYS.results, colName: 'results' },
      { key: KEYS.notices, colName: 'notices' },
      { key: KEYS.users, colName: 'users' },
      { key: KEYS.subjects, colName: 'subjects' },
      { key: KEYS.teacherPayments, colName: 'teacherPayments' },
      { key: KEYS.expenses, colName: 'expenses' },
    ];

    collectionsToSync.forEach(({ key, colName }) => {
      try {
        const colRef = collection(db, colName);
        onSnapshot(colRef, (snapshot) => {
          if (!snapshot.empty) {
            // Normalize user records coming from Firestore so corrupted field names
            // (e.g. "name" instead of "fullName") never reach the UI layer.
            const items = snapshot.docs.map(d => {
              const data = { ...d.data(), id: d.id };
              if (key === KEYS.users) return normalizeUser(data);
              return data;
            });
            saveList(key, items);
            notifyDataUpdated(key);
          } else {
            // First time: if collection is empty in Firestore, populate it from local seed data
            const localItems = getList<Record<string, unknown>>(key);
            if (localItems.length > 0) {
              localItems.forEach(item => {
                if (item.id) {
                  setDoc(doc(db, colName, String(item.id)), cleanDoc(item)).catch(console.error);
                }
              });
            }
          }
        }, (err) => {
          console.warn(`Firestore onSnapshot error for ${colName}:`, err);
        });
      } catch (err) {
        console.warn(`Failed to attach listener for ${colName}:`, err);
      }
    });

    // Sync settings document
    try {
      const settingsDocRef = doc(db, 'settings', 'institute');
      onSnapshot(settingsDocRef, (snap) => {
        if (snap.exists()) {
          const remoteSettings = snap.data() as InstituteSettings;
          saveOne(KEYS.settings, remoteSettings);
          notifyDataUpdated(KEYS.settings);
        } else {
          const localSettings = getOne<InstituteSettings>(KEYS.settings);
          if (localSettings) {
            setDoc(settingsDocRef, cleanDoc(localSettings)).catch(console.error);
          }
        }
      }, (err) => {
        console.warn("Firestore onSnapshot error for settings:", err);
      });
    } catch (err) {
      console.warn("Failed to attach listener for settings:", err);
    }
  }).catch(err => {
    console.warn("Firebase Auth error during Firestore sync init:", err);
  });
}

// Auto-run sync in browser
if (typeof window !== 'undefined') {
  initFirestoreSync();
}

// ─── Students ────────────────────────────────────────────────────────────────
export const getStudents = (): Student[] => getList<Student>(KEYS.students);
export const getStudent = (id: string): Student | undefined => getList<Student>(KEYS.students).find(s => s.id === id);

export const saveStudent = (s: Student): void => {
  const list = getList<Student>(KEYS.students).filter(x => x.id !== s.id);
  saveList(KEYS.students, [...list, s]);
  notifyDataUpdated(KEYS.students);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'students', s.id), cleanDoc(s)).catch(console.error);
  });
};

export const deleteStudent = (id: string): void => {
  saveList(KEYS.students, getList<Student>(KEYS.students).filter(s => s.id !== id));
  notifyDataUpdated(KEYS.students);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'students', id)).catch(console.error);
  });
};

export const addStudent = (s: Omit<Student, 'id' | 'studentId'>): Student => {
  const students = getList<Student>(KEYS.students);
  const newStudent: Student = {
    ...s,
    id: generateId(),
    studentId: `MW${new Date().getFullYear().toString().slice(2)}${String(students.length + 1).padStart(3, '0')}`,
  };
  saveList(KEYS.students, [...students, newStudent]);
  notifyDataUpdated(KEYS.students);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'students', newStudent.id), cleanDoc(newStudent)).catch(console.error);
  });
  return newStudent;
};

// ─── Classes ─────────────────────────────────────────────────────────────────
export const getClasses = (): TuitionClass[] => getList<TuitionClass>(KEYS.classes);
export const getClass = (id: string): TuitionClass | undefined => getList<TuitionClass>(KEYS.classes).find(c => c.id === id);

export const saveClass = (c: TuitionClass): void => {
  const list = getList<TuitionClass>(KEYS.classes).filter(x => x.id !== c.id);
  saveList(KEYS.classes, [...list, c]);
  notifyDataUpdated(KEYS.classes);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'classes', c.id), cleanDoc(c)).catch(console.error);
  });
};

export const deleteClass = (id: string): void => {
  saveList(KEYS.classes, getList<TuitionClass>(KEYS.classes).filter(c => c.id !== id));
  notifyDataUpdated(KEYS.classes);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'classes', id)).catch(console.error);
  });
};

export const addClass = (c: Omit<TuitionClass, 'id'>): TuitionClass => {
  const newClass: TuitionClass = { ...c, id: generateId() };
  saveList(KEYS.classes, [...getList<TuitionClass>(KEYS.classes), newClass]);
  notifyDataUpdated(KEYS.classes);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'classes', newClass.id), cleanDoc(newClass)).catch(console.error);
  });
  return newClass;
};

// ─── Teachers ────────────────────────────────────────────────────────────────
export const getTeachers = (): Teacher[] => getList<Teacher>(KEYS.teachers);
export const getTeacher = (id: string): Teacher | undefined => getList<Teacher>(KEYS.teachers).find(t => t.id === id);

export const saveTeacher = (t: Teacher): void => {
  const list = getList<Teacher>(KEYS.teachers).filter(x => x.id !== t.id);
  saveList(KEYS.teachers, [...list, t]);
  notifyDataUpdated(KEYS.teachers);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'teachers', t.id), cleanDoc(t)).catch(console.error);
  });
};

export const deleteTeacher = (id: string): void => {
  saveList(KEYS.teachers, getList<Teacher>(KEYS.teachers).filter(t => t.id !== id));
  notifyDataUpdated(KEYS.teachers);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'teachers', id)).catch(console.error);
  });
};

export const addTeacher = (t: Omit<Teacher, 'id'>): Teacher => {
  const newTeacher: Teacher = { ...t, id: generateId() };
  saveList(KEYS.teachers, [...getList<Teacher>(KEYS.teachers), newTeacher]);
  notifyDataUpdated(KEYS.teachers);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'teachers', newTeacher.id), cleanDoc(newTeacher)).catch(console.error);
  });
  return newTeacher;
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const getAttendance = (): AttendanceRecord[] => getList<AttendanceRecord>(KEYS.attendance);
export const getAttendanceForClass = (classId: string): AttendanceRecord[] => getList<AttendanceRecord>(KEYS.attendance).filter(a => a.classId === classId);
export const getAttendanceForDate = (classId: string, date: string): AttendanceRecord | undefined => getList<AttendanceRecord>(KEYS.attendance).find(a => a.classId === classId && a.date === date);

export const saveAttendance = (a: AttendanceRecord): void => {
  const list = getList<AttendanceRecord>(KEYS.attendance).filter(x => x.id !== a.id);
  saveList(KEYS.attendance, [...list, a]);
  notifyDataUpdated(KEYS.attendance);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'attendance', a.id), cleanDoc(a)).catch(console.error);
  });
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const getPayments = (): Payment[] => getList<Payment>(KEYS.payments);
export const getPaymentsForStudent = (studentId: string): Payment[] => getList<Payment>(KEYS.payments).filter(p => p.studentId === studentId);
export const getPaymentsForClass = (classId: string): Payment[] => getList<Payment>(KEYS.payments).filter(p => p.classId === classId);
export const getPaymentsForMonth = (month: string): Payment[] => getList<Payment>(KEYS.payments).filter(p => p.month === month);

export const savePayment = (p: Payment): void => {
  const list = getList<Payment>(KEYS.payments).filter(x => x.id !== p.id);
  saveList(KEYS.payments, [...list, p]);
  notifyDataUpdated(KEYS.payments);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'payments', p.id), cleanDoc(p)).catch(console.error);
  });
};

export const addPayment = (p: Omit<Payment, 'id'>): Payment => {
  const newPayment: Payment = { ...p, id: generateId() };
  saveList(KEYS.payments, [...getList<Payment>(KEYS.payments), newPayment]);
  notifyDataUpdated(KEYS.payments);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'payments', newPayment.id), cleanDoc(newPayment)).catch(console.error);
  });
  return newPayment;
};

export const deletePayment = (id: string): void => {
  saveList(KEYS.payments, getList<Payment>(KEYS.payments).filter(p => p.id !== id));
  notifyDataUpdated(KEYS.payments);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'payments', id)).catch(console.error);
  });
};

// ─── Exam Results ────────────────────────────────────────────────────────────
export const getResults = (): ExamResult[] => getList<ExamResult>(KEYS.results);
export const getResultsForStudent = (studentId: string): ExamResult[] => getList<ExamResult>(KEYS.results).filter(r => r.studentId === studentId);
export const getResultsForClass = (classId: string): ExamResult[] => getList<ExamResult>(KEYS.results).filter(r => r.classId === classId);

export const saveResult = (r: ExamResult): void => {
  const list = getList<ExamResult>(KEYS.results).filter(x => x.id !== r.id);
  saveList(KEYS.results, [...list, r]);
  notifyDataUpdated(KEYS.results);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'results', r.id), cleanDoc(r)).catch(console.error);
  });
};

export const addResult = (r: Omit<ExamResult, 'id'>): ExamResult => {
  const newResult: ExamResult = { ...r, id: generateId() };
  saveList(KEYS.results, [...getList<ExamResult>(KEYS.results), newResult]);
  notifyDataUpdated(KEYS.results);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'results', newResult.id), cleanDoc(newResult)).catch(console.error);
  });
  return newResult;
};

export const deleteResult = (id: string): void => {
  saveList(KEYS.results, getList<ExamResult>(KEYS.results).filter(r => r.id !== id));
  notifyDataUpdated(KEYS.results);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'results', id)).catch(console.error);
  });
};

// ─── Notices ─────────────────────────────────────────────────────────────────
export const getNotices = (): Notice[] => getList<Notice>(KEYS.notices);

export const saveNotice = (n: Notice): void => {
  const list = getList<Notice>(KEYS.notices).filter(x => x.id !== n.id);
  saveList(KEYS.notices, [...list, n]);
  notifyDataUpdated(KEYS.notices);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'notices', n.id), cleanDoc(n)).catch(console.error);
  });
};

export const addNotice = (n: Omit<Notice, 'id'>): Notice => {
  const newNotice: Notice = { ...n, id: generateId() };
  saveList(KEYS.notices, [...getList<Notice>(KEYS.notices), newNotice]);
  notifyDataUpdated(KEYS.notices);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'notices', newNotice.id), cleanDoc(newNotice)).catch(console.error);
  });
  return newNotice;
};

export const deleteNotice = (id: string): void => {
  saveList(KEYS.notices, getList<Notice>(KEYS.notices).filter(n => n.id !== id));
  notifyDataUpdated(KEYS.notices);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'notices', id)).catch(console.error);
  });
};

// ─── Settings ────────────────────────────────────────────────────────────────
export const getSettings = (): InstituteSettings => {
  return getOne<InstituteSettings>(KEYS.settings) ?? {
    name: 'MYWAY Educational Institute',
    address: '',
    phone: '',
    email: '',
    currency: 'LKR',
    currentMonth: getCurrentMonth(),
  };
};

export const saveSettings = (s: InstituteSettings): void => {
  saveOne(KEYS.settings, s);
  notifyDataUpdated(KEYS.settings);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'settings', 'institute'), cleanDoc(s)).catch(console.error);
  });
};

export const getNextReceiptNo = (): string => {
  const payments = getList<Payment>(KEYS.payments);
  const year = new Date().getFullYear();
  const max = payments.reduce((acc, p) => {
    const match = p.receiptNo?.match(/(\d+)$/);
    return match ? Math.max(acc, parseInt(match[1])) : acc;
  }, 0);
  return `MYWAY-${year}-${String(max + 1).padStart(4, '0')}`;
};

// ─── Users ───────────────────────────────────────────────────────────────────
// Firestore documents may have inconsistent field names (e.g. "name" instead of "fullName",
// "email" instead of "username", or trailing whitespace in keys). This helper normalizes any
// user-shaped object into a strict AppUser so downstream code can safely read fields like
// `u.fullName.charAt(0)` without crashing.
function normalizeUser(raw: any): AppUser {
  const id: string = String(raw?.id ?? generateId());
  const username: string =
    String(raw?.username ?? raw?.email ?? raw?.['username '] ?? '').trim();
  const fullName: string =
    String(raw?.fullName ?? raw?.name ?? raw?.['fullName '] ?? raw?.username ?? raw?.email ?? 'Unknown').trim();
  const role = raw?.role as AppUser['role'] | undefined;
  const status = raw?.status as AppUser['status'] | undefined;
  const password: string = String(raw?.password ?? raw?.['password '] ?? '');
  const photo: string | undefined = raw?.photo ?? raw?.avatar ?? undefined;
  return {
    id,
    username: username || fullName,
    fullName: fullName || username || 'Unknown',
    role: role && ['Super Admin', 'Owner', 'Operations Staff', 'Teacher', 'Student'].includes(role)
      ? role
      : 'Teacher',
    status: status === 'Active' || status === 'Inactive' ? status : 'Active',
    password,
    ...(photo ? { photo } : {}),
  };
}

export const getUsers = (): AppUser[] => getList<AppUser>(KEYS.users).map(normalizeUser);
export const getUser = (username: string, password: string): AppUser | undefined =>
  getList<AppUser>(KEYS.users)
    .map(normalizeUser)
    .find(u => u.username === username && u.password === password && u.status === 'Active');

export const addUser = (u: Omit<AppUser, 'id'>): AppUser => {
  const newUser: AppUser = { ...u, id: generateId() };
  saveList(KEYS.users, [...getList<AppUser>(KEYS.users), newUser]);
  notifyDataUpdated(KEYS.users);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'users', newUser.id), cleanDoc(newUser)).catch(console.error);
  });
  return newUser;
};

export const saveUser = (u: AppUser): void => {
  const list = getList<AppUser>(KEYS.users).filter(x => x.id !== u.id);
  saveList(KEYS.users, [...list, u]);
  notifyDataUpdated(KEYS.users);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'users', u.id), cleanDoc(u)).catch(console.error);
  });
};

export const deleteUser = (id: string): void => {
  saveList(KEYS.users, getList<AppUser>(KEYS.users).filter(u => u.id !== id));
  notifyDataUpdated(KEYS.users);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'users', id)).catch(console.error);
  });
};

export const getSessionUser = (): AppUser | null => getOne<AppUser>(KEYS.sessionUser);
export const setSessionUser = (u: AppUser | null): void => {
  if (u) saveOne(KEYS.sessionUser, u);
  else localStorage.removeItem(KEYS.sessionUser);
};

// ─── Subjects ────────────────────────────────────────────────────────────────
export const getSubjects = (): Subject[] => getList<Subject>(KEYS.subjects);
export const getSubject = (id: string): Subject | undefined => getList<Subject>(KEYS.subjects).find(s => s.id === id);

export const saveSubject = (s: Subject): void => {
  const list = getList<Subject>(KEYS.subjects).filter(x => x.id !== s.id);
  saveList(KEYS.subjects, [...list, s]);
  notifyDataUpdated(KEYS.subjects);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'subjects', s.id), cleanDoc(s)).catch(console.error);
  });
};

export const addSubject = (s: Omit<Subject, 'id'>): Subject => {
  const newSubject: Subject = { ...s, id: generateId() };
  saveList(KEYS.subjects, [...getList<Subject>(KEYS.subjects), newSubject]);
  notifyDataUpdated(KEYS.subjects);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'subjects', newSubject.id), cleanDoc(newSubject)).catch(console.error);
  });
  return newSubject;
};

export const deleteSubject = (id: string): void => {
  saveList(KEYS.subjects, getList<Subject>(KEYS.subjects).filter(s => s.id !== id));
  notifyDataUpdated(KEYS.subjects);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'subjects', id)).catch(console.error);
  });
};

// ─── Teacher Payments ────────────────────────────────────────────────────────
export const getTeacherPayments = (): TeacherPayment[] => getList<TeacherPayment>(KEYS.teacherPayments);

export const saveTeacherPayment = (tp: TeacherPayment): void => {
  const list = getList<TeacherPayment>(KEYS.teacherPayments).filter(x => x.id !== tp.id);
  saveList(KEYS.teacherPayments, [...list, tp]);
  notifyDataUpdated(KEYS.teacherPayments);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'teacherPayments', tp.id), cleanDoc(tp)).catch(console.error);
  });
};

export const addTeacherPayment = (tp: Omit<TeacherPayment, 'id'>): TeacherPayment => {
  const newTp: TeacherPayment = { ...tp, id: generateId() };
  saveList(KEYS.teacherPayments, [...getList<TeacherPayment>(KEYS.teacherPayments), newTp]);
  notifyDataUpdated(KEYS.teacherPayments);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'teacherPayments', newTp.id), cleanDoc(newTp)).catch(console.error);
  });
  return newTp;
};

export const deleteTeacherPayment = (id: string): void => {
  saveList(KEYS.teacherPayments, getList<TeacherPayment>(KEYS.teacherPayments).filter(tp => tp.id !== id));
  notifyDataUpdated(KEYS.teacherPayments);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'teacherPayments', id)).catch(console.error);
  });
};

// ─── Expenses ────────────────────────────────────────────────────────────────
export const getExpenses = (): Expense[] => getList<Expense>(KEYS.expenses);

export const saveExpense = (e: Expense): void => {
  const list = getList<Expense>(KEYS.expenses).filter(x => x.id !== e.id);
  saveList(KEYS.expenses, [...list, e]);
  notifyDataUpdated(KEYS.expenses);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'expenses', e.id), cleanDoc(e)).catch(console.error);
  });
};

export const addExpense = (e: Omit<Expense, 'id'>): Expense => {
  const newE: Expense = { ...e, id: generateId() };
  saveList(KEYS.expenses, [...getList<Expense>(KEYS.expenses), newE]);
  notifyDataUpdated(KEYS.expenses);
  ensureFirebaseAuth().then(() => {
    setDoc(doc(db, 'expenses', newE.id), cleanDoc(newE)).catch(console.error);
  });
  return newE;
};

export const deleteExpense = (id: string): void => {
  saveList(KEYS.expenses, getList<Expense>(KEYS.expenses).filter(e => e.id !== id));
  notifyDataUpdated(KEYS.expenses);
  ensureFirebaseAuth().then(() => {
    deleteDoc(doc(db, 'expenses', id)).catch(console.error);
  });
};

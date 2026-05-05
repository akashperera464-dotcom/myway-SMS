import type { Student, TuitionClass, Teacher, AttendanceRecord, Payment, ExamResult, Notice, InstituteSettings, AppUser } from './types';
import { generateId, getCurrentMonth } from './utils';

const KEYS = {
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
};

function getList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveList<T>(key: string, list: T[]): void {
  localStorage.setItem(key, JSON.stringify(list));
}

function getOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveOne<T>(key: string, val: T): void {
  localStorage.setItem(key, JSON.stringify(val));
}

function ensureUsers() {
  const existing = getList<AppUser>(KEYS.users);
  if (existing.length === 0) {
    const users: AppUser[] = [
      { id: 'u1', username: 'akash@myway.lk', fullName: 'Akash', role: 'Super Admin', status: 'Active', password: 'akash123' },
      { id: 'u2', username: 'owner@myway.lk', fullName: 'Owner', role: 'Owner', status: 'Active', password: 'owner123' },
      { id: 'u3', username: 'ops@myway.lk', fullName: 'Operations Staff', role: 'Operations Staff', status: 'Active', password: 'ops123' },
      { id: 'u4', username: 'teacher@myway.lk', fullName: 'Teacher Demo', role: 'Teacher', status: 'Active', password: 'teacher123' },
      { id: 'u5', username: 'student@myway.lk', fullName: 'Student Demo', role: 'Student', status: 'Active', password: 'student123' },
    ];
    saveList(KEYS.users, users);
  }
}

function seedData() {
  if (localStorage.getItem(KEYS.initialized)) { ensureUsers(); return; }

  const teachers: Teacher[] = [
    { id: 't1', fullName: 'Mr. Sunil Jayawardena', nic: '198012345678', phone: '0712345678', whatsapp: '0712345678', email: 'sunil@myway.lk', subjects: ['Mathematics', 'Combined Mathematics'], qualification: 'B.Sc. Mathematics (University of Peradeniya)', address: '45/2, Peradeniya Road, Kandy', joinDate: '2020-01-15', salary: 80000, status: 'Active' },
    { id: 't2', fullName: 'Ms. Kumari Perera', nic: '197856781234', phone: '0778901234', whatsapp: '0778901234', email: 'kumari@myway.lk', subjects: ['Science', 'Biology', 'Chemistry'], qualification: 'B.Sc. Biology (University of Kelaniya)', address: '12, Hanthana Road, Kandy', joinDate: '2019-08-01', salary: 75000, status: 'Active' },
    { id: 't3', fullName: 'Mr. Chaminda Silva', nic: '198534561234', phone: '0763456789', whatsapp: '0763456789', subjects: ['English'], qualification: 'B.A. English (University of Colombo)', address: '78, Katugastota Road, Kandy', joinDate: '2021-03-10', salary: 65000, status: 'Active' },
  ];

  const classes: TuitionClass[] = [
    { id: 'c1', name: 'Grade 11 - Mathematics', subject: 'Mathematics', grade: 'Grade 11 (O/L)', medium: 'Sinhala', teacherId: 't1', schedule: [{ day: 'Saturday', startTime: '08:00', endTime: '10:00' }], room: 'Room A', monthlyFee: 3500, maxStudents: 30, enrolledStudents: ['s1','s2','s3','s4'], status: 'Active' },
    { id: 'c2', name: 'Grade 10 - Science', subject: 'Science', grade: 'Grade 10', medium: 'Sinhala', teacherId: 't2', schedule: [{ day: 'Sunday', startTime: '09:00', endTime: '11:00' }], room: 'Room B', monthlyFee: 3000, maxStudents: 25, enrolledStudents: ['s2','s3','s5','s6'], status: 'Active' },
    { id: 'c3', name: 'Grade 13 - Combined Maths', subject: 'Combined Mathematics', grade: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', teacherId: 't1', schedule: [{ day: 'Saturday', startTime: '14:00', endTime: '17:00' }], room: 'Room C', monthlyFee: 5000, maxStudents: 20, enrolledStudents: ['s7','s8'], status: 'Active' },
    { id: 'c4', name: 'Grade 9 - English', subject: 'English', grade: 'Grade 9', medium: 'English', teacherId: 't3', schedule: [{ day: 'Wednesday', startTime: '16:00', endTime: '18:00' }], room: 'Room D', monthlyFee: 2500, maxStudents: 20, enrolledStudents: ['s1','s4','s5'], status: 'Active' },
  ];

  const students: Student[] = [
    { id: 's1', studentId: 'MW25001', fullName: 'Kasun Malinda Perera', nameInitials: 'K.M. Perera', dateOfBirth: '2008-04-15', gender: 'Male', school: 'Dharmaraja College, Kandy', grade: 'Grade 11 (O/L)', medium: 'Sinhala', address: '23, Mahaweli Garden, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Nimal Perera', guardianRelationship: 'Father', guardianPhone: '0712223344', whatsapp: '0712223344', classIds: ['c1','c4'], joinDate: '2023-01-10', status: 'Active', monthlyFee: 6000 },
    { id: 's2', studentId: 'MW25002', fullName: 'Nilukshi Sandamali Silva', nameInitials: 'N.S. Silva', dateOfBirth: '2008-07-22', gender: 'Female', school: 'Mahamaya Girls College, Kandy', grade: 'Grade 11 (O/L)', medium: 'Sinhala', address: '5, Rajapihilla Road, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Ranjith Silva', guardianRelationship: 'Father', guardianPhone: '0773344556', whatsapp: '0773344556', classIds: ['c1','c2'], joinDate: '2023-01-15', status: 'Active', monthlyFee: 6500 },
    { id: 's3', studentId: 'MW25003', fullName: 'Asel Ransith Fernando', nameInitials: 'A.R. Fernando', dateOfBirth: '2009-03-08', gender: 'Male', school: 'Trinity College, Kandy', grade: 'Grade 10', medium: 'Sinhala', address: '67, Colombo Street, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Sunethra Fernando', guardianRelationship: 'Mother', guardianPhone: '0764455667', whatsapp: '0764455667', classIds: ['c1','c2'], joinDate: '2023-02-01', status: 'Active', monthlyFee: 6500 },
    { id: 's4', studentId: 'MW25004', fullName: 'Himasha Dilrukshi Jayawardena', nameInitials: 'H.D. Jayawardena', dateOfBirth: '2008-11-30', gender: 'Female', school: 'Mahamaya Girls College, Kandy', grade: 'Grade 11 (O/L)', medium: 'Sinhala', address: '12, Peradeniya Road, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Pradeep Jayawardena', guardianRelationship: 'Father', guardianPhone: '0752233445', whatsapp: '0752233445', classIds: ['c1','c4'], joinDate: '2023-01-20', status: 'Active', monthlyFee: 6000 },
    { id: 's5', studentId: 'MW25005', fullName: 'Pathum Bandara Wijesinghe', nameInitials: 'P.B. Wijesinghe', dateOfBirth: '2009-08-14', gender: 'Male', school: 'Dharmaraja College, Kandy', grade: 'Grade 10', medium: 'Sinhala', address: '34, Getambe, Peradeniya', district: 'Kandy', province: 'Central', guardianName: 'Sumudu Wijesinghe', guardianRelationship: 'Mother', guardianPhone: '0718899001', whatsapp: '0718899001', classIds: ['c2','c4'], joinDate: '2023-03-05', status: 'Active', monthlyFee: 5500 },
    { id: 's6', studentId: 'MW25006', fullName: 'Isuri Pramodi Rajapaksa', nameInitials: 'I.P. Rajapaksa', dateOfBirth: '2009-01-25', gender: 'Female', school: 'Kandy Girls High School', grade: 'Grade 10', medium: 'Sinhala', address: '89, Katugastota, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Lasantha Rajapaksa', guardianRelationship: 'Father', guardianPhone: '0762211334', whatsapp: '0762211334', classIds: ['c2'], joinDate: '2023-02-20', status: 'Active', monthlyFee: 3000 },
    { id: 's7', studentId: 'MW25007', fullName: 'Sachini Dilrukshi Dissanayake', nameInitials: 'S.D. Dissanayake', dateOfBirth: '2006-05-18', gender: 'Female', school: 'Mahamaya Girls College, Kandy', grade: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', stream: 'Science', address: '23, Anniewatte, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Rohan Dissanayake', guardianRelationship: 'Father', guardianPhone: '0779988776', whatsapp: '0779988776', classIds: ['c3'], joinDate: '2022-01-10', status: 'Active', monthlyFee: 5000 },
    { id: 's8', studentId: 'MW25008', fullName: 'Tharaka Manjith Bandara', nameInitials: 'T.M. Bandara', dateOfBirth: '2006-09-03', gender: 'Male', school: 'Dharmaraja College, Kandy', grade: 'Grade 13 (A/L Year 2)', medium: 'Sinhala', stream: 'Science', address: '45, Bahirawakanda, Kandy', district: 'Kandy', province: 'Central', guardianName: 'Lalith Bandara', guardianRelationship: 'Father', guardianPhone: '0711234567', whatsapp: '0711234567', classIds: ['c3'], joinDate: '2022-01-15', status: 'Active', monthlyFee: 5000 },
  ];

  const today = new Date();
  const m = (offset: number) => {
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const payments: Payment[] = [
    { id: 'p1', studentId: 's1', classId: 'c1', month: m(0), amount: 3500, paidDate: today.toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0001', status: 'Paid' },
    { id: 'p2', studentId: 's2', classId: 'c1', month: m(0), amount: 3500, paidDate: today.toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0002', status: 'Paid' },
    { id: 'p3', studentId: 's3', classId: 'c1', month: m(0), amount: 3500, paidDate: today.toISOString().slice(0,10), method: 'Bank Transfer', receiptNo: 'MYWAY-2025-0003', status: 'Paid' },
    { id: 'p4', studentId: 's1', classId: 'c4', month: m(0), amount: 2500, paidDate: today.toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0004', status: 'Paid' },
    { id: 'p5', studentId: 's2', classId: 'c2', month: m(0), amount: 3000, paidDate: '', method: 'Cash', receiptNo: 'MYWAY-2025-0005', status: 'Pending' },
    { id: 'p6', studentId: 's5', classId: 'c2', month: m(0), amount: 3000, paidDate: '', method: 'Cash', receiptNo: 'MYWAY-2025-0006', status: 'Pending' },
    { id: 'p7', studentId: 's7', classId: 'c3', month: m(0), amount: 5000, paidDate: today.toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0007', status: 'Paid' },
    { id: 'p8', studentId: 's8', classId: 'c3', month: m(0), amount: 5000, paidDate: '', method: 'Cash', receiptNo: 'MYWAY-2025-0008', status: 'Pending' },
    { id: 'p9', studentId: 's1', classId: 'c1', month: m(1), amount: 3500, paidDate: new Date(today.getFullYear(), today.getMonth()-1, 5).toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0009', status: 'Paid' },
    { id: 'p10', studentId: 's2', classId: 'c1', month: m(1), amount: 3500, paidDate: new Date(today.getFullYear(), today.getMonth()-1, 8).toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0010', status: 'Paid' },
    { id: 'p11', studentId: 's7', classId: 'c3', month: m(1), amount: 5000, paidDate: new Date(today.getFullYear(), today.getMonth()-1, 3).toISOString().slice(0,10), method: 'Online', receiptNo: 'MYWAY-2025-0011', status: 'Paid' },
    { id: 'p12', studentId: 's8', classId: 'c3', month: m(1), amount: 5000, paidDate: new Date(today.getFullYear(), today.getMonth()-1, 10).toISOString().slice(0,10), method: 'Cash', receiptNo: 'MYWAY-2025-0012', status: 'Paid' },
  ];

  const dateStr = (daysAgo: number) => {
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0,10);
  };

  const attendance: AttendanceRecord[] = [
    { id: 'a1', classId: 'c1', date: dateStr(7), records: [{ studentId:'s1', status:'Present' },{ studentId:'s2', status:'Present' },{ studentId:'s3', status:'Absent' },{ studentId:'s4', status:'Present' }], markedBy: 'Mr. Sunil Jayawardena' },
    { id: 'a2', classId: 'c1', date: dateStr(14), records: [{ studentId:'s1', status:'Present' },{ studentId:'s2', status:'Late' },{ studentId:'s3', status:'Present' },{ studentId:'s4', status:'Present' }], markedBy: 'Mr. Sunil Jayawardena' },
    { id: 'a3', classId: 'c2', date: dateStr(6), records: [{ studentId:'s2', status:'Present' },{ studentId:'s3', status:'Present' },{ studentId:'s5', status:'Present' },{ studentId:'s6', status:'Absent' }], markedBy: 'Ms. Kumari Perera' },
    { id: 'a4', classId: 'c3', date: dateStr(7), records: [{ studentId:'s7', status:'Present' },{ studentId:'s8', status:'Present' }], markedBy: 'Mr. Sunil Jayawardena' },
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
    { id: 'u1', username: 'akash@myway.lk', fullName: 'Akash', role: 'Super Admin', status: 'Active', password: 'akash123' },
    { id: 'u2', username: 'owner@myway.lk', fullName: 'Owner', role: 'Owner', status: 'Active', password: 'owner123' },
    { id: 'u3', username: 'ops@myway.lk', fullName: 'Operations Staff', role: 'Operations Staff', status: 'Active', password: 'ops123' },
    { id: 'u4', username: 'teacher@myway.lk', fullName: 'Teacher Demo', role: 'Teacher', status: 'Active', password: 'teacher123' },
    { id: 'u5', username: 'student@myway.lk', fullName: 'Student Demo', role: 'Student', status: 'Active', password: 'student123' },
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
  localStorage.setItem(KEYS.initialized, '1');
}

seedData();

export const getStudents = (): Student[] => getList<Student>(KEYS.students);
export const getStudent = (id: string): Student | undefined => getList<Student>(KEYS.students).find(s => s.id === id);
export const saveStudent = (s: Student): void => {
  const list = getList<Student>(KEYS.students).filter(x => x.id !== s.id);
  saveList(KEYS.students, [...list, s]);
};
export const deleteStudent = (id: string): void => saveList(KEYS.students, getList<Student>(KEYS.students).filter(s => s.id !== id));
export const addStudent = (s: Omit<Student, 'id' | 'studentId'>): Student => {
  const students = getList<Student>(KEYS.students);
  const newStudent: Student = { ...s, id: generateId(), studentId: `MW${new Date().getFullYear().toString().slice(2)}${String(students.length + 1).padStart(3, '0')}` };
  saveList(KEYS.students, [...students, newStudent]);
  return newStudent;
};

export const getClasses = (): TuitionClass[] => getList<TuitionClass>(KEYS.classes);
export const getClass = (id: string): TuitionClass | undefined => getList<TuitionClass>(KEYS.classes).find(c => c.id === id);
export const saveClass = (c: TuitionClass): void => {
  const list = getList<TuitionClass>(KEYS.classes).filter(x => x.id !== c.id);
  saveList(KEYS.classes, [...list, c]);
};
export const deleteClass = (id: string): void => saveList(KEYS.classes, getList<TuitionClass>(KEYS.classes).filter(c => c.id !== id));
export const addClass = (c: Omit<TuitionClass, 'id'>): TuitionClass => {
  const newClass: TuitionClass = { ...c, id: generateId() };
  saveList(KEYS.classes, [...getList<TuitionClass>(KEYS.classes), newClass]);
  return newClass;
};

export const getTeachers = (): Teacher[] => getList<Teacher>(KEYS.teachers);
export const getTeacher = (id: string): Teacher | undefined => getList<Teacher>(KEYS.teachers).find(t => t.id === id);
export const saveTeacher = (t: Teacher): void => {
  const list = getList<Teacher>(KEYS.teachers).filter(x => x.id !== t.id);
  saveList(KEYS.teachers, [...list, t]);
};
export const deleteTeacher = (id: string): void => saveList(KEYS.teachers, getList<Teacher>(KEYS.teachers).filter(t => t.id !== id));
export const addTeacher = (t: Omit<Teacher, 'id'>): Teacher => {
  const newTeacher: Teacher = { ...t, id: generateId() };
  saveList(KEYS.teachers, [...getList<Teacher>(KEYS.teachers), newTeacher]);
  return newTeacher;
};

export const getAttendance = (): AttendanceRecord[] => getList<AttendanceRecord>(KEYS.attendance);
export const getAttendanceForClass = (classId: string): AttendanceRecord[] => getList<AttendanceRecord>(KEYS.attendance).filter(a => a.classId === classId);
export const getAttendanceForDate = (classId: string, date: string): AttendanceRecord | undefined => getList<AttendanceRecord>(KEYS.attendance).find(a => a.classId === classId && a.date === date);
export const saveAttendance = (a: AttendanceRecord): void => {
  const list = getList<AttendanceRecord>(KEYS.attendance).filter(x => x.id !== a.id);
  saveList(KEYS.attendance, [...list, a]);
};

export const getPayments = (): Payment[] => getList<Payment>(KEYS.payments);
export const getPaymentsForStudent = (studentId: string): Payment[] => getList<Payment>(KEYS.payments).filter(p => p.studentId === studentId);
export const getPaymentsForClass = (classId: string): Payment[] => getList<Payment>(KEYS.payments).filter(p => p.classId === classId);
export const getPaymentsForMonth = (month: string): Payment[] => getList<Payment>(KEYS.payments).filter(p => p.month === month);
export const savePayment = (p: Payment): void => {
  const list = getList<Payment>(KEYS.payments).filter(x => x.id !== p.id);
  saveList(KEYS.payments, [...list, p]);
};
export const addPayment = (p: Omit<Payment, 'id'>): Payment => {
  const newPayment: Payment = { ...p, id: generateId() };
  saveList(KEYS.payments, [...getList<Payment>(KEYS.payments), newPayment]);
  return newPayment;
};
export const deletePayment = (id: string): void => saveList(KEYS.payments, getList<Payment>(KEYS.payments).filter(p => p.id !== id));

export const getResults = (): ExamResult[] => getList<ExamResult>(KEYS.results);
export const getResultsForStudent = (studentId: string): ExamResult[] => getList<ExamResult>(KEYS.results).filter(r => r.studentId === studentId);
export const getResultsForClass = (classId: string): ExamResult[] => getList<ExamResult>(KEYS.results).filter(r => r.classId === classId);
export const saveResult = (r: ExamResult): void => {
  const list = getList<ExamResult>(KEYS.results).filter(x => x.id !== r.id);
  saveList(KEYS.results, [...list, r]);
};
export const addResult = (r: Omit<ExamResult, 'id'>): ExamResult => {
  const newResult: ExamResult = { ...r, id: generateId() };
  saveList(KEYS.results, [...getList<ExamResult>(KEYS.results), newResult]);
  return newResult;
};
export const deleteResult = (id: string): void => saveList(KEYS.results, getList<ExamResult>(KEYS.results).filter(r => r.id !== id));

export const getNotices = (): Notice[] => getList<Notice>(KEYS.notices);
export const saveNotice = (n: Notice): void => {
  const list = getList<Notice>(KEYS.notices).filter(x => x.id !== n.id);
  saveList(KEYS.notices, [...list, n]);
};
export const addNotice = (n: Omit<Notice, 'id'>): Notice => {
  const newNotice: Notice = { ...n, id: generateId() };
  saveList(KEYS.notices, [...getList<Notice>(KEYS.notices), newNotice]);
  return newNotice;
};
export const deleteNotice = (id: string): void => saveList(KEYS.notices, getList<Notice>(KEYS.notices).filter(n => n.id !== id));

export const getSettings = (): InstituteSettings => {
  return getOne<InstituteSettings>(KEYS.settings) ?? {
    name: 'MYWAY Educational Institute', address: '', phone: '', email: '',
    currency: 'LKR', currentMonth: getCurrentMonth(),
  };
};
export const saveSettings = (s: InstituteSettings): void => saveOne(KEYS.settings, s);

export const getNextReceiptNo = (): string => {
  const payments = getList<Payment>(KEYS.payments);
  const year = new Date().getFullYear();
  const max = payments.reduce((acc, p) => {
    const match = p.receiptNo?.match(/(\d+)$/);
    return match ? Math.max(acc, parseInt(match[1])) : acc;
  }, 0);
  return `MYWAY-${year}-${String(max + 1).padStart(4, '0')}`;
};

export const getUsers = (): AppUser[] => getList<AppUser>(KEYS.users);
export const getUser = (username: string, password: string): AppUser | undefined => getList<AppUser>(KEYS.users).find(u => u.username === username && u.password === password && u.status === 'Active');
export const addUser = (u: Omit<AppUser, 'id'>): AppUser => {
  const newUser: AppUser = { ...u, id: generateId() };
  saveList(KEYS.users, [...getList<AppUser>(KEYS.users), newUser]);
  return newUser;
};
export const saveUser = (u: AppUser): void => {
  const list = getList<AppUser>(KEYS.users).filter(x => x.id !== u.id);
  saveList(KEYS.users, [...list, u]);
};
export const deleteUser = (id: string): void => saveList(KEYS.users, getList<AppUser>(KEYS.users).filter(u => u.id !== id));
export const getSessionUser = (): AppUser | null => getOne<AppUser>(KEYS.sessionUser);
export const setSessionUser = (u: AppUser | null): void => {
  if (u) saveOne(KEYS.sessionUser, u);
  else localStorage.removeItem(KEYS.sessionUser);
};

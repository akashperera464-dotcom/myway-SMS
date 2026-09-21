export interface TeacherPayment {
  id: string;
  teacherId: string;
  month: string;
  amount: number;
  paidDate: string;
  method: 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: 'Electricity' | 'Water' | 'Rent' | 'Maintenance' | 'Internet' | 'Other';
  amount: number;
  date: string;
  description: string;
  recordedBy: string;
}

export interface Student {
  id: string;
  studentId: string;
  registerNo?: string;
  fullName: string;
  nameInitials: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  nic?: string;
  school: string;
  grade: string;
  medium: 'Sinhala' | 'Tamil' | 'English';
  stream?: string;
  address: string;
  district: string;
  province: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  whatsapp: string;
  studentPhone?: string;
  email?: string;
  classIds: string[];
  joinDate: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended';
  monthlyFee: number;
  photo?: string;
  notes?: string;
}

export interface TuitionClass {
  id: string;
  name: string;
  subject: string;
  grade: string;
  medium: 'Sinhala' | 'Tamil' | 'English';
  teacherId: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  room?: string;
  monthlyFee: number;
  maxStudents: number;
  enrolledStudents: string[];
  status: 'Active' | 'Inactive';
}

export interface Teacher {
  id: string;
  fullName: string;
  nic: string;
  phone: string;
  whatsapp: string;
  email?: string;
  subjects: string[];
  qualification: string;
  address: string;
  joinDate: string;
  salary?: number;
  status: 'Active' | 'Inactive';
  photo?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  sessionId?: string;
  sessionName?: string;
  updatedAt?: string;
  records: {
    studentId: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    markedAt?: string;
    markedBy?: string;
    method?: 'Manual' | 'QR' | 'USB' | 'Upload' | 'Import';
  }[];
  markedBy?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  classId: string;
  month: string;
  amount: number;
  paidDate: string;
  method: 'Cash' | 'Bank Transfer' | 'Online';
  receiptNo: string;
  status: 'Paid' | 'Pending' | 'Partial' | 'Waived';
  notes?: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  classId: string;
  examName: string;
  examDate: string;
  totalMarks: number;
  obtainedMarks: number;
  grade?: string;
  rank?: number;
  remarks?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Students' | 'Teachers' | 'Parents' | string;
  createdAt: string;
  expiresAt?: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  createdBy: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Core' | 'Optional' | 'Elective' | 'Extra-Curricular';
  description?: string;
  gradeLevel: string;
  medium: 'Sinhala' | 'Tamil' | 'English' | 'All';
  teacherId?: string;
  classIds: string[];
  creditHours?: number;
  syllabus?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface InstituteSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  loginBgUrl?: string;
  registrationNo?: string;
  currency: 'LKR';
  currentMonth: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: 'Super Admin' | 'Owner' | 'Operations Staff' | 'Teacher' | 'Student';
  status: 'Active' | 'Inactive';
  password: string;
  photo?: string;
}


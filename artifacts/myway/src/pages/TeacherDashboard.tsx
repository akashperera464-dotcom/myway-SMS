import { Link } from "wouter";
import { Users, BookOpen, Clock, CalendarCheck } from "lucide-react";
import { getClasses, getStudents } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/App";

export default function TeacherDashboard() {
  const { user } = useAuth();
  
  // Try to match the logged-in user to a teacher record by email or name if possible, 
  // but for the dashboard we can just show classes where teacherId matches. 
  // Since we don't have a direct link between AppUser and Teacher in the simple schema,
  // we will just show a generic dashboard or assume they see classes assigned to their email/name.
  // For demo purposes, let's just find classes assigned to the first teacher, or we'll filter by name.
  
  const allClasses = getClasses();
  const allStudents = getStudents();
  
  // Here we'd ideally have teacher.id === user.teacherId. 
  // For this demo, let's just show classes where the user's name is part of the teacher's name, or just all if not found.
  // If we can't find specific classes, we show a generic welcome.
  
  const myClasses = allClasses; // Simplified for demo. In a real app: allClasses.filter(c => c.teacherId === myTeacherId)

  const activeClasses = myClasses.filter(c => c.status === 'Active');
  
  const totalStudents = activeClasses.reduce((acc, c) => acc + c.enrolledStudents.length, 0);
  
  // Expected revenue from classes (if they get 100% of the class fee, or just showing the class value)
  const expectedRevenue = activeClasses.reduce((acc, c) => acc + (c.monthlyFee * c.enrolledStudents.length), 0);

  const firstName = user?.fullName?.split(" ")[0] || "Teacher";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-primary/90 to-primary border border-border">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h2 className="text-xl font-extrabold text-primary-foreground">Welcome back, {firstName}!</h2>
          </div>
          <p className="text-sm text-primary-foreground/80">
            You have {activeClasses.length} active classes and {totalStudents} students this month.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{activeClasses.length}</div>
          <div className="text-sm text-muted-foreground">My Classes</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{totalStudents}</div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center mb-3">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">View</div>
          <div className="text-sm text-muted-foreground">My Timetable</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(expectedRevenue)}</div>
          <div className="text-sm text-muted-foreground">Est. Class Value</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-foreground text-sm mb-4">My Classes Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClasses.map(c => (
            <div key={c.id} className="border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-foreground">{c.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{c.grade}</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {c.enrolledStudents.length} / {c.maxStudents} Students</div>
                {c.schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {s.day} {s.startTime}-{s.endTime}</div>
                ))}
              </div>
            </div>
          ))}
          {activeClasses.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">No active classes assigned to you.</div>
          )}
        </div>
      </div>
    </div>
  );
}

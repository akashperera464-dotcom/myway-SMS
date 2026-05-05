import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search } from "lucide-react";
import { getStudents, getClasses, deleteStudent } from "@/lib/storage";
import { formatCurrency, GRADES } from "@/lib/utils";
import type { Student } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Graduated: "bg-blue-100 text-blue-700",
  Suspended: "bg-red-100 text-red-700",
};

export default function Students() {
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "id" | "joined">("name");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const allStudents = getStudents();
  const classes = getClasses();

  const filtered = allStudents
    .filter(s => {
      const q = search.toLowerCase();
      const match = !q || s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.school.toLowerCase().includes(q) || s.guardianPhone.includes(q);
      const gradeMatch = !filterGrade || s.grade === filterGrade;
      const statusMatch = !filterStatus || s.status === filterStatus;
      const classMatch = !filterClass || s.classIds.includes(filterClass);
      return match && gradeMatch && statusMatch && classMatch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
      if (sortBy === "id") return a.studentId.localeCompare(b.studentId);
      return b.joinDate.localeCompare(a.joinDate);
    });

  const handleDelete = (id: string) => {
    deleteStudent(id);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground">{allStudents.length} students registered</p>
        </div>
        <Link href="/students/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity" data-testid="add-student-btn">
          <Plus className="w-4 h-4" /> Add Student
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-testid="student-search"
            type="search"
            placeholder="Search by name, ID, school, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select data-testid="filter-grade" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-36">
          <option value="">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select data-testid="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Status</option>
          {['Active','Inactive','Graduated','Suspended'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select data-testid="filter-class" value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-40">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select data-testid="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value as "name" | "id" | "joined")} className="px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="name">Sort: Name</option>
          <option value="id">Sort: ID</option>
          <option value="joined">Sort: Joined</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">School</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Grade</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Classes</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Monthly Fee</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No students found.</td></tr>
              ) : filtered.map(s => {
                const studentClasses = classes.filter(c => s.classIds.includes(c.id));
                return (
                  <tr key={s.id} data-testid={`row-student-${s.id}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">{s.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.school}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{s.grade}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {studentClasses.slice(0, 2).map(c => (
                          <span key={c.id} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{c.subject}</span>
                        ))}
                        {studentClasses.length > 2 && <span className="text-xs text-muted-foreground">+{studentClasses.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell font-medium">{formatCurrency(s.monthlyFee)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/students/${s.id}`} className="text-xs text-primary hover:underline" data-testid={`view-student-${s.id}`}>View</Link>
                        <button onClick={() => setDeleteId(s.id)} className="text-xs text-destructive hover:underline" data-testid={`delete-student-${s.id}`}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground bg-muted/20">
          Showing {filtered.length} of {allStudents.length} students
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Delete Student</h3>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90" data-testid="confirm-delete-student">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

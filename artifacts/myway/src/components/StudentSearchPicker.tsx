import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, User } from "lucide-react";
import type { Student } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StudentSearchPickerProps {
  students: Student[];
  onSelect: (student: Student) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Searchable student picker for the cashier workflow.
 * Searches across fullName, studentId, registerNo, guardianPhone, whatsapp, school.
 * Shows a dropdown of matching students; tap to select.
 */
export default function StudentSearchPicker({
  students,
  onSelect,
  placeholder = "Search student by name, ID, phone, or school...",
  autoFocus = false,
  className,
}: StudentSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(s => {
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.registerNo || "").toLowerCase().includes(q) ||
          (s.guardianPhone || "").toLowerCase().includes(q) ||
          (s.whatsapp || "").toLowerCase().includes(q) ||
          (s.studentPhone || "").toLowerCase().includes(q) ||
          (s.school || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 50); // cap at 50 for performance
  }, [query, students]);

  const handleSelect = (s: Student) => {
    onSelect(s);
    setQuery("");
    setOpen(false);
    setHighlighted(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlighted]) handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No students match "<span className="font-medium">{query}</span>"
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                {results.length} student{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border last:border-0",
                    i === highlighted ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {s.photo ? (
                      <img src={s.photo} alt={s.fullName} className="w-full h-full object-cover" />
                    ) : (
                      (s.fullName || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{s.fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.studentId} · {s.grade} · {s.school}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block">
                    {s.guardianPhone}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {open && !query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-6 z-50 text-center">
          <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Start typing to search students by name, ID, phone, or school
          </p>
        </div>
      )}
    </div>
  );
}

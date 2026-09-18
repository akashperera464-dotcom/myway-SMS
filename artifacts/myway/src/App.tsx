import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentNew from "@/pages/StudentNew";
import StudentProfile from "@/pages/StudentProfile";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import Attendance from "@/pages/Attendance";
import Payments from "@/pages/Payments";
import Results from "@/pages/Results";
import Teachers from "@/pages/Teachers";
import Subjects from "@/pages/Subjects";
import Notices from "@/pages/Notices";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import Profile from "@/pages/Profile";
import Expenses from "@/pages/Expenses";
import TeacherPayroll from "@/pages/TeacherPayroll";
import TeacherDashboard from "@/pages/TeacherDashboard";
import NotFound from "@/pages/not-found";
import { getSessionUser, getUser, setSessionUser } from "@/lib/storage";
import type { AppUser } from "@/lib/types";
import { useState, createContext, useContext } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const queryClient = new QueryClient();

// ─── Auth Context ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AppUser | null;
  login: (u: AppUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Login Page ───────────────────────────────────────────────────────────────
function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // ── Step 1: Check local user store first (covers all users created in User Management) ──
      const localUser = getUser(username, password);
      if (localUser) {
        if (localUser.status !== 'Active') {
          setError("Your account is inactive. Please contact the administrator.");
          setLoading(false);
          return;
        }
        setSessionUser(localUser);
        login(localUser);
        setLocation("/");
        return;
      }

      // ── Step 2: Fall back to Firebase for accounts not in local storage ──
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      // Firebase succeeded but no local record — create a generic session
      const firebaseUser = {
        id: userCredential.user.uid,
        username: userCredential.user.email || username,
        fullName: (userCredential.user.email || username).split('@')[0],
        role: 'Super Admin' as const,
        status: 'Active' as const,
        password: ''
      };
      setSessionUser(firebaseUser);
      login(firebaseUser);
      setLocation("/");
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[380px] relative z-10">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-5 glow-teal">
              <span className="text-primary-foreground font-black text-xl tracking-tight">MW</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">MYWAY</h1>
          <p className="text-sm text-muted-foreground mt-1 tracking-wide">Educational Institute Management</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl relative overflow-hidden">
          {/* Card top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                className="w-full px-4 py-2.5 border border-input rounded-xl bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                placeholder="you@myway.lk"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                className="w-full px-4 py-2.5 border border-input rounded-xl bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                placeholder="••••••••"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 glow-teal mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          © 2025 MYWAY Educational Institute
        </p>
      </div>
    </div>
  );
}

// ─── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/">
          {user.role === 'Teacher' ? <TeacherDashboard /> : <Dashboard />}
        </Route>
        <Route path="/students" component={Students} />
        <Route path="/students/new" component={StudentNew} />
        <Route path="/students/:id" component={StudentProfile} />
        <Route path="/classes" component={Classes} />
        <Route path="/classes/:id" component={ClassDetail} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/payments" component={Payments} />
        <Route path="/results" component={Results} />
        <Route path="/teachers" component={Teachers} />
        <Route path="/subjects" component={Subjects} />
        <Route path="/notices" component={Notices} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/users" component={Users} />
        <Route path="/profile" component={Profile} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/payroll" component={TeacherPayroll} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<AppUser | null>(getSessionUser);

  const login = (u: AppUser) => setUser(u);
  const logout = () => {
    setSessionUser(null);
    setUser(null);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthContext.Provider value={{ user, login, logout }}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </AuthContext.Provider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

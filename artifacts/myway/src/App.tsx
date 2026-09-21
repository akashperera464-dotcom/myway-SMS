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
import { getSessionUser, getUser, setSessionUser, getSettings, useStorageSync } from "@/lib/storage";
import type { AppUser } from "@/lib/types";
import { useState, createContext, useContext, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, ensureFirebaseAuth } from "@/lib/firebase";

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
  useStorageSync(['myway_settings']);

  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const settings = getSettings();
  const bgUrl = settings.loginBgUrl;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // ── Step 1: Check local user store first ──
      const localUser = getUser(username, password);
      if (localUser) {
        if (localUser.status !== 'Active') {
          setError("Your account is inactive. Please contact the administrator.");
          setLoading(false);
          return;
        }

        // Connect Firebase Auth so Firestore operations are fully permitted
        try {
          await signInWithEmailAndPassword(auth, username, password);
        } catch {
          // If user not in Firebase Auth, ensure fallback Firebase Auth connection
          await ensureFirebaseAuth();
        }

        setSessionUser(localUser);
        login(localUser);
        setLocation("/");
        return;
      }

      // ── Step 2: Fall back to Firebase for accounts not in local storage ──
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const firebaseUser: AppUser = {
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
    } catch (err: unknown) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center px-4 relative overflow-hidden bg-slate-950"
      style={{
        // 100dvh = dynamic viewport height: accounts for mobile address bar / toolbar
        // appearing/disappearing so the background image always fills the actual
        // visible screen on every phone. Falls back to 100vh on older browsers
        // via the .min-h-screen-dvh class in index.css.
        minHeight: "100dvh",
        height: "100dvh",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        ...(bgUrl
          ? {
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "scroll", // 'fixed' breaks on iOS Safari + Android WebView
              backgroundOrigin: "border-box",
              backgroundClip: "border-box",
            }
          : {}),
      }}
    >
      {/* Dark frosted glass overlay over background image to guarantee high contrast */}
      <div className={`absolute inset-0 ${bgUrl ? "bg-black/50 backdrop-blur-[1.5px]" : "bg-background"}`} />

      {/* Background decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[390px] relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="relative inline-flex">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.name}
                className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 border-2 border-primary/40 shadow-xl glow-teal bg-black/40"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 glow-teal shadow-xl border border-white/20">
                <span className="text-primary-foreground font-black text-xl tracking-tight">MW</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            {settings.name || "MYWAY"}
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1 tracking-wide drop-shadow-sm">
            Educational Institute Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/70 backdrop-blur-2xl border border-white/25 dark:border-white/15 rounded-2xl p-7 shadow-2xl relative overflow-hidden ring-1 ring-black/20">
          {/* Card top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sign in to your institute account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground/90 block mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                className="w-full px-4 py-2.5 border border-white/15 rounded-xl bg-background/85 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/60 shadow-inner backdrop-blur-md"
                placeholder="you@myway.lk"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/90 block mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                className="w-full px-4 py-2.5 border border-white/15 rounded-xl bg-background/85 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/60 shadow-inner backdrop-blur-md"
                placeholder="••••••••"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-destructive/15 border border-destructive/30 rounded-xl text-sm text-destructive font-medium flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 glow-teal mt-2 shadow-lg"
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

        <p className="text-center text-xs text-slate-400 mt-6 drop-shadow-sm font-medium">
          © {new Date().getFullYear()} {settings.name || "MYWAY Educational Institute"}
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
        <Route path="/index.html">
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

  useEffect(() => {
    // Ensure Firebase Auth session is connected for Firestore live synchronization
    ensureFirebaseAuth();
  }, []);

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

import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Notices from "@/pages/Notices";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { getSessionUser, getUser, setSessionUser } from "@/lib/storage";
import type { AppUser } from "@/lib/types";
import { useState, createContext, useContext } from "react";

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
  const [username, setUsername] = useState("akash@myway.lk");
  const [password, setPassword] = useState("akash123");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser(username, password);
    if (!user) {
      setError("Invalid username or password. Please check your credentials.");
      return;
    }
    setSessionUser(user);
    login(user);
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">MW</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">MYWAY</h1>
          <p className="text-sm text-muted-foreground">Educational Institute</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="akash@myway.lk"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>

        </form>
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
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/students/new" component={StudentNew} />
        <Route path="/students/:id" component={StudentProfile} />
        <Route path="/classes" component={Classes} />
        <Route path="/classes/:id" component={ClassDetail} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/payments" component={Payments} />
        <Route path="/results" component={Results} />
        <Route path="/teachers" component={Teachers} />
        <Route path="/notices" component={Notices} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
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
  );
}

export default App;

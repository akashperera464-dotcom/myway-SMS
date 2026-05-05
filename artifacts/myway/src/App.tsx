import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
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
import { useState } from "react";

const queryClient = new QueryClient();

function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('akash@myway.lk');
  const [password, setPassword] = useState('akash123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser(username, password);
    if (!user) {
      setError('Invalid username or password');
      return;
    }
    setSessionUser(user);
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MYWAY Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg bg-background" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg">Login</button>
        <p className="text-xs text-muted-foreground">Default superadmin: akash@myway.lk / akash123</p>
      </form>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getSessionUser();
  if (!user) return <Login />;
  return <>{children}</>;
}

function Router() {
  return (
    <RequireAuth>
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
    </RequireAuth>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}> 
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

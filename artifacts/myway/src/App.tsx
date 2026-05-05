import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router() {
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

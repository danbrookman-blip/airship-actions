import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EnquiriesProvider } from "@/store/enquiries";
import AppLayout from "@/components/AppLayout";
import Inbox from "@/pages/Inbox";
import Dashboard from "@/pages/Dashboard";
import Pipeline from "@/pages/Pipeline";
import EnquiryDetail from "@/pages/EnquiryDetail";
import CalendarPage from "@/pages/CalendarPage";
import Reporting from "@/pages/Reporting";
import Admin from "@/pages/Admin";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Hash routing in production so deep links work on static hosts (GitHub Pages)
// without server-side SPA rewrites; clean paths in local dev.
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <EnquiriesProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Inbox />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/enquiry/:id" element={<EnquiryDetail />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </EnquiriesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

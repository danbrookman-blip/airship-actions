import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="ml-[240px] flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

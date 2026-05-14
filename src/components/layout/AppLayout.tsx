import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { useFCM } from "@/hooks/useFCM";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";

function LayoutContent() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { collapsed } = useSidebar();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Real-time sync hooks
  useFCM();
  useFirestoreSync();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? 64 : 260 }}
      >
        <TopBar transparent={isHome && !scrolled} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
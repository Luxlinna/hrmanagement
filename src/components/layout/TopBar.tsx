import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/context/AuthContext";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  path: string;
  category: string;
}

const moduleResults: SearchResult[] = [
  { id: "m-dashboard", label: "Dashboard", sublabel: "Main overview", icon: "ri-dashboard-line", path: "/", category: "Module" },
  { id: "m-employees", label: "Employee Directory", sublabel: "Browse all staff", icon: "ri-user-search-line", path: "/employees", category: "Module" },
  { id: "m-branches", label: "Branch Management", sublabel: "10 branches", icon: "ri-building-line", path: "/branches", category: "Module" },
  { id: "m-analytics", label: "Analytics", sublabel: "Charts & insights", icon: "ri-bar-chart-2-line", path: "/analytics", category: "Module" },
  { id: "m-onboarding", label: "Onboarding", sublabel: "New hire pipeline", icon: "ri-user-add-line", path: "/onboarding", category: "Module" },
  { id: "m-checklist", label: "Onboarding Checklist", sublabel: "Task assignments", icon: "ri-task-line", path: "/onboarding-checklist", category: "Module" },
  { id: "m-leave", label: "Leave Requests", sublabel: "Approve / reject", icon: "ri-calendar-event-line", path: "/leave", category: "Module" },
  { id: "m-leave-cal", label: "Leave Calendar", sublabel: "Team availability", icon: "ri-calendar-2-line", path: "/leave-calendar", category: "Module" },
  { id: "m-hire", label: "Hire / Recruitment", sublabel: "Candidates & jobs", icon: "ri-briefcase-line", path: "/hire", category: "Module" },
  { id: "m-offboard", label: "Offboarding", sublabel: "Exit workflows", icon: "ri-user-unfollow-line", path: "/offboard", category: "Module" },
  { id: "m-orgchart", label: "Org Chart", sublabel: "Reporting structure", icon: "ri-organization-chart", path: "/org-chart", category: "Module" },
  { id: "m-payroll", label: "Payroll", sublabel: "Monthly payroll", icon: "ri-money-dollar-circle-line", path: "/payroll-module", category: "Module" },
  { id: "m-payapproval", label: "Payroll Approval", sublabel: "Review & approve runs", icon: "ri-file-check-line", path: "/payroll-approval", category: "Module" },
  { id: "m-finance", label: "Finance", sublabel: "Expense tracking", icon: "ri-bank-line", path: "/finance", category: "Module" },
  { id: "m-it", label: "IT Management", sublabel: "Assets & tickets", icon: "ri-computer-line", path: "/it-management", category: "Module" },
  { id: "m-benefits", label: "Benefits", sublabel: "Plans & enrollment", icon: "ri-heart-pulse-line", path: "/benefits", category: "Module" },
  { id: "m-tools", label: "HR Tools", sublabel: "Productivity tools", icon: "ri-tools-line", path: "/tools", category: "Module" },
  { id: "m-reports", label: "Reports & Export", sublabel: "CSV / PDF reports", icon: "ri-file-chart-line", path: "/reports", category: "Module" },
  { id: "m-audit", label: "Audit Log", sublabel: "Activity history", icon: "ri-shield-check-line", path: "/audit-log", category: "Module" },
  { id: "m-selfservice", label: "Self-Service Portal", sublabel: "Employee view", icon: "ri-user-settings-line", path: "/self-service", category: "Module" },
  { id: "m-unity", label: "Unity Apps", sublabel: "Integrations hub", icon: "ri-apps-line", path: "/unity-apps", category: "Module" },
  { id: "m-settings", label: "Settings", sublabel: "System configuration", icon: "ri-settings-3-line", path: "/settings", category: "Module" },
  { id: "m-notifications", label: "Notifications", sublabel: "Alerts & updates", icon: "ri-notification-3-line", path: "/notifications", category: "Module" },
];

export default function TopBar({ transparent }: { transparent: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const query = q.trim().toLowerCase();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    const [empRes, candRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, status")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,role.ilike.%${query}%,department.ilike.%${query}%`)
        .limit(5),
      supabase
        .from("candidates")
        .select("id, full_name, position, stage")
        .or(`full_name.ilike.%${query}%,position.ilike.%${query}%`)
        .limit(4),
    ]);

    const results: SearchResult[] = [];

    (empRes.data || []).forEach((e: any) => {
      results.push({
        id: `emp-${e.id}`,
        label: `${e.first_name} ${e.last_name}`,
        sublabel: `${e.role} · ${e.department}`,
        icon: "ri-user-line",
        path: `/employees/${e.id}`,
        category: "Employee",
      });
    });

    (candRes.data || []).forEach((c: any) => {
      results.push({
        id: `cand-${c.id}`,
        label: c.full_name,
        sublabel: `${c.position} · ${c.stage}`,
        icon: "ri-briefcase-line",
        path: `/hire/candidate/${c.id}`,
        category: "Candidate",
      });
    });

    const matchedModules = moduleResults.filter(
      (m) =>
        m.label.toLowerCase().includes(query) ||
        m.sublabel.toLowerCase().includes(query)
    ).slice(0, 4);
    results.push(...matchedModules);

    setSearchResults(results);
    setSearchOpen(results.length > 0);
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 280);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.path);
    setSearchQuery("");
    setSearchOpen(false);
    setSearchFocused(false);
  };

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setNotifs(data || []));

    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  const isHome = location.pathname === "/";
  const textColor = isHome && transparent ? "text-white/70 hover:text-white" : "text-gray-600 hover:text-gray-900";
  const iconColor = isHome && transparent ? "text-white/80" : "text-gray-700";
  const bgClass = transparent ? "bg-transparent" : "bg-white/80 backdrop-blur-md border-b border-gray-100";

  const displayName = user?.displayName || user?.email?.split("@")[0] || "HR Admin";

  return (
    <header className={`sticky top-0 z-40 ${bgClass} transition-all duration-300`}>
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Prominent sidebar toggle */}
          <button
            onClick={toggle}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg bg-[#0D7377] text-white shadow-md hover:bg-[#0a5e61] active:scale-95 transition-all"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`${collapsed ? "ri-menu-unfold-line" : "ri-menu-fold-line"} text-lg`} />
          </button>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-black/5"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`ri-menu-line text-lg ${iconColor}`} />
          </button>

          <nav className="hidden md:flex items-center gap-5">
            <Link to="/employees" className={`text-[13px] font-medium ${textColor} transition-colors`}>
              Directory
            </Link>
            <Link to="/branches" className={`text-[13px] font-medium ${textColor} transition-colors`}>
              Branches
            </Link>
            <Link to="/analytics" className={`text-[13px] font-medium ${textColor} transition-colors`}>
              Analytics
            </Link>
          </nav>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-xs lg:max-w-md mx-4" ref={searchRef}>
          <div className="relative">
            <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
              searchFocused ? "text-[#0D7377]" : "text-gray-400"
            } pointer-events-none`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search employees, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); if (searchResults.length > 0) setSearchOpen(true); }}
              className={`w-full pl-9 pr-9 py-2 rounded-lg text-[12px] transition-all outline-none ${
                isHome && transparent
                  ? "bg-white/15 text-white placeholder:text-white/60 border border-white/20 focus:bg-white/25 focus:border-white/40"
                  : "bg-gray-100 text-gray-700 placeholder:text-gray-400 border border-transparent focus:bg-white focus:border-[#0D7377]/30"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchOpen(false); searchInputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center"
              >
                <i className="ri-close-line text-sm" />
              </button>
            )}
            {searchLoading && !searchQuery && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
            )}

            {/* Dropdown Results */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden z-50 max-h-[380px] overflow-y-auto" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                {["Employee", "Candidate", "Module"].map((category) => {
                  const catResults = searchResults.filter((r) => r.category === category);
                  if (catResults.length === 0) return null;
                  return (
                    <div key={category}>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{category}s</span>
                      </div>
                      {catResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#0D7377]/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center shrink-0">
                            <i className={`${result.icon} text-[#0D7377] text-sm w-4 h-4 flex items-center justify-center`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{result.label}</p>
                            <p className="text-[11px] text-gray-500 truncate">{result.sublabel}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] text-gray-400">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              </div>
            )}

            {searchOpen && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 p-5 text-center z-50" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                <i className="ri-search-line text-2xl text-gray-300 mb-2 block" />
                <p className="text-[12px] text-gray-500">No results for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/notifications" className={`hidden sm:block text-[13px] font-medium ${textColor} transition-colors`}>
            Notifications
          </Link>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={`p-2 rounded-full hover:bg-black/5 transition-colors relative ${iconColor}`}
            >
              <i className="ri-notification-3-line text-lg" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
                  <Link to="/notifications" className="text-[11px] text-[#0D7377] font-medium" onClick={() => setNotifOpen(false)}>
                    View All
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        !n.is_read ? "bg-[#0D7377]/5" : ""
                      }`}
                    >
                      <p className="text-[12px] font-semibold text-gray-900">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0D7377] flex items-center justify-center text-white text-[12px] font-bold">
                {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <span className={`hidden md:block text-[13px] font-medium ${isHome && transparent ? "text-white/80" : "text-gray-700"}`}>
                {displayName}
              </span>
              <i className={`ri-arrow-down-s-line text-sm ${iconColor}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900">{displayName}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-settings-3-line text-sm text-gray-400" />
                    Settings
                  </Link>
                  <Link
                    to="/analytics"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-bar-chart-2-line text-sm text-gray-400" />
                    Analytics
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <i className="ri-logout-box-r-line text-sm" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {[
            { path: "/", label: "Dashboard" },
            { path: "/employees", label: "Directory" },
            { path: "/branches", label: "Branches" },
            { path: "/onboarding", label: "Onboarding" },
            { path: "/leave", label: "Leave" },
            { path: "/payroll-module", label: "Payroll" },
            { path: "/finance", label: "Finance" },
            { path: "/it-management", label: "IT" },
            { path: "/hire", label: "Hire" },
            { path: "/offboard", label: "Off Board" },
            { path: "/org-chart", label: "Org Chart" },
            { path: "/tools", label: "Tools" },
            { path: "/benefits", label: "Benefits" },
            { path: "/settings", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
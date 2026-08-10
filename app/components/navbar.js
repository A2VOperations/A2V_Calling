import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../lib/apiConfig";

const Navbar = ({ user, onToggleSidebar, leads = [], setActiveTab }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const prevCountRef = useRef(0);

  // Search Bar State
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchFollowUps();
    // Poll every minute for new notifications
    const interval = setInterval(fetchFollowUps, 60000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/followups`);
      const data = await response.json();
      if (data.success) {
        // Filter only pending follow-ups that are due in the next 24 hours or overdue
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcoming = data.followUps.filter((f) => {
          if (f.status !== "Pending") return false;
          const scheduled = new Date(f.scheduledAt);
          return scheduled < tomorrow;
        });

        const newFollowUps = upcoming.sort(
          (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
        );
        setFollowUps(newFollowUps);

        // Auto-open and close after 5 seconds if we have new notifications
        if (newFollowUps.length > prevCountRef.current) {
          setIsNotificationsOpen(true);
          setTimeout(() => {
            setIsNotificationsOpen(false);
          }, 5000);
        }
        prevCountRef.current = newFollowUps.length;
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const hasNotifications = followUps.length > 0;

  // Filtered Leads & Navigation items for search
  const filteredLeads =
    searchTerm.trim() === ""
      ? []
      : (leads || [])
          .filter((lead) => {
            const q = searchTerm.toLowerCase();
            return (
              (lead.name || "").toLowerCase().includes(q) ||
              (lead.company || "").toLowerCase().includes(q) ||
              (lead.phone || "").toLowerCase().includes(q) ||
              (lead.email || "").toLowerCase().includes(q) ||
              (lead.status || "").toLowerCase().includes(q)
            );
          })
          .slice(0, 5);

  const navOptions = [
    { id: "dashboard", label: "Dashboard Overview" },
    { id: "leads", label: "Leads Manager" },
    { id: "follow-ups", label: "Follow-ups" },
    { id: "reports", label: "Reports & Analytics" },
    ...(user?.role === "admin"
      ? [{ id: "users", label: "User Authorization & Management" }]
      : []),
    { id: "settings", label: "Settings" },
  ];

  const filteredNav =
    searchTerm.trim() === ""
      ? []
      : navOptions.filter((item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  const handleSelectLead = (lead) => {
    if (setActiveTab) setActiveTab("leads");
    setIsSearchOpen(false);
    setSearchTerm("");
  };

  const handleSelectNav = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    setIsSearchOpen(false);
    setSearchTerm("");
  };

  return (
    <header className="h-16 bg-[#1e293b] text-white px-20 flex items-center justify-between shadow-md border-b border-slate-800 select-none">
      {/* Left section: Brand & Search */}
      <div className="flex items-center gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 w-25">
          <img src="/logo/A2V  Groups Logo.png" alt="" />
        </div>

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-800"
          title="Toggle Sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Search Bar with Live Instant Results */}
        <div ref={searchRef} className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search leads, phone, company, or sections..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchTerm.trim()) setIsSearchOpen(true);
            }}
            className="w-72 h-9 bg-slate-800/80 rounded-xl pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-400 border border-slate-700/60 focus:border-sky-500 focus:bg-slate-900 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setIsSearchOpen(false);
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}

          {/* Live Search Results Dropdown */}
          {isSearchOpen && searchTerm.trim() !== "" && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-fade-in">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Search Results</span>
                <span>{filteredLeads.length + filteredNav.length} matches</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {/* Matching Navigation Pages */}
                {filteredNav.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                      Quick Navigation
                    </span>
                    {filteredNav.map((nav) => (
                      <button
                        key={nav.id}
                        onClick={() => handleSelectNav(nav.id)}
                        className="w-full text-left px-2.5 py-2 hover:bg-sky-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <span className="text-xs font-bold text-slate-700 group-hover:text-sky-600">
                          {nav.label}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 group-hover:bg-sky-100 group-hover:text-sky-700 px-1.5 py-0.5 rounded">
                          Go to section ▶
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Matching Leads */}
                {filteredLeads.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                      Matching Leads ({filteredLeads.length})
                    </span>
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead._id || lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className="w-full text-left px-2.5 py-2 hover:bg-sky-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                            {(lead.name || "L").substring(0, 2)}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-600">
                              {lead.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {lead.company ||
                                lead.email ||
                                lead.phone ||
                                "No contact details"}
                            </span>
                          </div>
                        </div>
                        {lead.status && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {lead.status}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {filteredLeads.length === 0 && filteredNav.length === 0 && (
                  <div className="p-6 text-center text-slate-500">
                    <svg
                      className="w-8 h-8 text-slate-300 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-xs font-bold text-slate-700">
                      No results found
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      No leads or sections matched &quot;{searchTerm}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Actions & User Info */}
      <div className="flex items-center gap-5">
        {/* Action icons */}
        <div className="flex items-center gap-3 text-slate-300">
          {/* Settings Button */}
          <button
            onClick={() => setActiveTab && setActiveTab("settings")}
            title="Settings"
            className="hover:text-white transition-colors p-1 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Notifications button with red indicator dot */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="hover:text-white transition-colors p-1 relative cursor-pointer"
              title="Notifications"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {hasNotifications && (
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full absolute top-1 right-1 animate-pulse" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in text-left cursor-default">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
                    Notifications
                    {hasNotifications && (
                      <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {followUps.length}
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!hasNotifications ? (
                    <div className="p-6 text-center">
                      <span className="text-2xl block mb-2">🎉</span>
                      <p className="text-xs font-semibold text-slate-500">
                        You&apos;re all caught up!
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        No upcoming follow-ups due.
                      </p>
                    </div>
                  ) : (
                    followUps.map((f) => {
                      const date = new Date(f.scheduledAt);
                      const isOverdue = date < new Date();

                      return (
                        <div
                          key={f._id}
                          className="p-4 hover:bg-slate-50 border-b border-slate-50 transition-colors relative"
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${isOverdue ? "bg-rose-500" : "bg-amber-400"}`}
                          ></div>
                          <div className="pl-2">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-slate-800">
                                Call {f.leadName}
                              </p>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${isOverdue ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}
                              >
                                {isOverdue ? "Overdue" : "Upcoming"}
                              </span>
                            </div>
                            {f.phoneNumber && (
                              <p className="text-[10px] font-mono text-slate-500 mt-1">
                                📞 {f.phoneNumber}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                              {f.description || "No description provided."}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 mt-2 block">
                              Due:{" "}
                              {date.toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User profile details */}
        {user && (
          <div
            onClick={() => setActiveTab && setActiveTab("settings")}
            title="View Profile Settings"
            className="flex items-center gap-3 border-l border-slate-700 pl-5 cursor-pointer group"
          >
            <div className="flex flex-col text-right">
              <span className="font-bold text-xs leading-tight tracking-wide group-hover:text-sky-400 transition-colors">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 leading-tight">
                {user.email}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-extrabold text-xl uppercase text-sky-400 select-none shadow group-hover:border-sky-500 transition-colors">
              {user.name?.substring(0, 1)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

import React from "react";

const Sidebar = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  incomingCount = 0,
}) => {
  const companyItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-4.5 h-4.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "incoming-leads",
      label: "Incoming Leads",
      badge: incomingCount,
      icon: (
        <svg
          className="w-4.5 h-4.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      ),
    },
    {
      id: "leads",
      label: "Leads",
      icon: (
        <svg
          className="w-4.5 h-4.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "follow-ups",
      label: "Follow-ups",
      icon: (
        <svg
          className="w-4.5 h-4.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const featureItems = [
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: (
        <svg
          className="w-4.5 h-4.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    ...(user?.role === "admin"
      ? [
          {
            id: "recycle-bin",
            label: "Recycle Bin",
            icon: (
              <svg
                className="w-4.5 h-4.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            ),
          },
          {
            id: "users",
            label: "User Authorization",
            icon: (
              <svg
                className="w-4.5 h-4.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            ),
          },
        ]
      : []),
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg
          className="w-4.5 h-4.5 shrink-0"
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
      ),
    },
  ];

  const renderNavContent = (collapsed = isCollapsed) => (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* YOUR COMPANY SECTION */}
        <div className="px-2 mb-6">
          <nav className="flex flex-col gap-0.5">
            {companyItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center ${collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"} rounded text-xs font-semibold tracking-wide transition-all text-left cursor-pointer group ${
                    isActive
                      ? "bg-sky-50/70 text-[#2d8cf0] font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div
                    className={`flex items-center ${collapsed ? "justify-center relative" : "gap-3"}`}
                  >
                    <span
                      className={`transition-colors ${isActive ? "text-[#2d8cf0]" : "text-slate-400 group-hover:text-slate-600"}`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                    {collapsed && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-blue-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.badge > 0 && (
                        <span className="bg-blue-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {item.badge}
                        </span>
                      )}
                      <span
                        className={`text-[10px] transition-transform ${isActive ? "text-[#2d8cf0]" : "text-slate-300 group-hover:text-slate-400"}`}
                      >
                        ▶
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* OUR FEATURES SECTION */}
        <div className="px-2">
          {!collapsed && (
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-2 px-3">
              Our Features
            </span>
          )}
          <nav className="flex flex-col gap-0.5">
            {featureItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center ${collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"} rounded text-xs font-semibold tracking-wide transition-all text-left cursor-pointer group ${
                    isActive
                      ? "bg-sky-50/70 text-[#2d8cf0] font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div
                    className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
                  >
                    <span
                      className={`transition-colors ${isActive ? "text-[#2d8cf0]" : "text-slate-400 group-hover:text-slate-600"}`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <span
                      className={`text-[10px] transition-transform ${isActive ? "text-[#2d8cf0]" : "text-slate-300 group-hover:text-slate-400"}`}
                    >
                      ▶
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Logout button at Sidebar bottom */}
      <div className="px-2 pt-4 border-t border-slate-100 mt-auto">
        <button
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full py-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-bold uppercase rounded tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Mobile Slide-Over Drawer Sidebar */}
      {isMobileOpen && (
        <aside className="fixed top-0 bottom-0 left-0 w-64 bg-white z-50 flex flex-col justify-between py-4 shadow-2xl md:hidden animate-fade-in border-r border-slate-200">
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100 mb-2">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
              Navigation Menu
            </span>
            <button
              onClick={onCloseMobile}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          {renderNavContent(false)}
        </aside>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-slate-200/80 flex-col justify-between h-[calc(100vh-64px)] sticky top-16 select-none shrink-0 py-4 transition-all duration-300 overflow-hidden`}
      >
        {renderNavContent(isCollapsed)}
      </aside>
    </>
  );
};

export default Sidebar;

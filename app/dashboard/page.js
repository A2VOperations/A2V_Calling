"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import DashboardOverview from "../components/dashboard-overview";
import LeadsManager from "../components/leads-manager";
import FollowUpsView from "../components/follow-ups-view";
import ReportsView from "../components/reports-view";
import SettingsView from "../components/settings-view";
import UserManagement from "../components/user-management";
import IncomingLeadsView from "../components/incoming-leads-view";
import ChatView from "../components/chat-view";
import DesignProjectsView from "../components/design-projects-view";
import { API_BASE_URL } from "../../lib/apiConfig";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Interactive Leads State with complete fields
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUsers = useCallback(
    async (currentUser) => {
      try {
        const activeUser = currentUser || user;
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            "x-user-id":
              activeUser?.id || activeUser?._id || activeUser?.email || "",
            "x-user-role": activeUser?.role || "",
          },
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
          const myProfile = data.users.find(
            (u) =>
              (activeUser?.email && u.email?.toLowerCase() === activeUser.email.toLowerCase()) ||
              (activeUser?.id && String(u._id) === String(activeUser.id))
          );
          if (myProfile && myProfile.role && myProfile.role !== activeUser?.role) {
            const updatedUser = { ...activeUser, role: myProfile.role, name: myProfile.name || activeUser.name };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
    [user?.id, user?._id, user?.email, user?.role],
  );

  const fetchLeads = useCallback(
    async (currentUser) => {
      try {
        const activeUser = currentUser || user;
        const userId =
          activeUser?.id || activeUser?._id || activeUser?.email || "";
        const response = await fetch(`${API_BASE_URL}/api/leads`, {
          headers: {
            "x-user-id": userId,
            "x-user-role": activeUser?.role || "",
          },
        });
        const data = await response.json();
        if (data.success) {
          const formattedLeads = data.leads.map((l) => ({ ...l, id: l._id }));
          setLeads(formattedLeads);
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    },
    [user?.id, user?._id, user?.email, user?.role],
  );

  const fetchFollowUps = useCallback(
    async (currentUser) => {
      try {
        const activeUser = currentUser || user;
        const userId =
          activeUser?.id || activeUser?._id || activeUser?.email || "";
        const userRole = activeUser?.role || "";
        const response = await fetch(`${API_BASE_URL}/api/followups`, {
          headers: {
            "x-user-id": userId,
            "x-user-role": userRole,
          },
        });
        const data = await response.json();
        if (data.success) {
          const formattedTodos = data.followUps.map((f) => ({
            id: f._id,
            text: f.description || `Follow up with ${f.leadName || "client"}`,
            completed: f.status === "Completed",
          }));
          setTodos(formattedTodos);
        }
      } catch (error) {
        console.error("Error fetching follow-ups:", error);
      }
    },
    [user?.id, user?._id, user?.email, user?.role],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.role === "designer" && activeTab === "dashboard") {
          setActiveTab("design-projects");
        }
        setUser((prev) => {
          if (
            prev &&
            (prev.id || prev._id || prev.email) ===
              (parsedUser.id || parsedUser._id || parsedUser.email)
          ) {
            return prev;
          }
          return parsedUser;
        });
      } catch (err) {
        console.error("Error parsing user from localStorage:", err);
        router.push("/");
      }
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchUsers(user);
      fetchLeads(user);
      fetchFollowUps(user);
    }
  }, [user, fetchUsers, fetchLeads, fetchFollowUps]);

  // Presence Heartbeat & Window Closure Tracking
  const sendPresenceStatus = useCallback((isOnlineState) => {
    if (!user) return;
    const userId = user.id || user._id || user.email;
    const payload = JSON.stringify({
      userId,
      email: user.email,
      isOnline: isOnlineState,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon && !isOnlineState) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(`${API_BASE_URL}/api/users/status`, blob);
    } else {
      fetch(`${API_BASE_URL}/api/users/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: payload,
        keepalive: !isOnlineState,
      }).catch((err) => console.warn("Presence status update notice:", err.message));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Send immediate online status
    sendPresenceStatus(true);

    // Heartbeat ping every 15 seconds to maintain active status
    const intervalId = setInterval(() => {
      sendPresenceStatus(true);
    }, 15000);

    // Unload handlers for browser/tab closure
    const handleUnload = () => {
      sendPresenceStatus(false);
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [user, sendPresenceStatus]);

  // Redirect non-admins away from user management and recycle bin tabs, and designers away from lead tabs
  useEffect(() => {
    if (
      (activeTab === "users" || activeTab === "recycle-bin") &&
      user &&
      user.role !== "admin"
    ) {
      setActiveTab("dashboard");
    }

    if (
      (activeTab === "dashboard" || activeTab === "incoming-leads" || activeTab === "leads" || activeTab === "follow-ups" || activeTab === "recycle-bin" || activeTab === "users") &&
      user &&
      user.role === "designer"
    ) {
      setActiveTab("design-projects");
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    if (user) {
      sendPresenceStatus(false);
    }
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return (
      <main className="flex min-h-screen bg-slate-50 items-center justify-center font-sans text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-sky-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Verifying Credentials...
          </span>
        </div>
      </main>
    );
  }

  // Todo handlers
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: "Manual Task",
          description: newTodoText.trim(),
          status: "Pending",
          scheduledAt: new Date(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTodos((prev) => [
          ...prev,
          {
            id: data.followUp._id,
            text: data.followUp.description,
            completed: false,
          },
        ]);
        setNewTodoText("");
      }
    } catch (err) {
      console.error("Error adding todo:", err);
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const newStatus = todo.completed ? "Pending" : "Completed";

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );

    try {
      await fetch(`${API_BASE_URL}/api/followups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Error updating todo:", err);
      // Revert on error
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
    }
  };

  const deleteTodo = async (id) => {
    // Optimistic update
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`${API_BASE_URL}/api/followups/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting todo:", err);
      fetchFollowUps(); // Refresh from server on error
    }
  };

  const incomingCount = leads.filter(
    (l) => !l.handledBy || l.status === "Incoming",
  ).length;

  const handleAcceptLead = async (leadId, customUser = null) => {
    const acceptingUser = customUser || user;
    if (!acceptingUser || !leadId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/leads/${leadId}/accept`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: acceptingUser,
            status: "Active",
          }),
        },
      );
      const data = await response.json();
      if (data.success) {
        const updatedLead = { ...data.lead, id: data.lead._id };
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? updatedLead : l)),
        );
      } else {
        alert("Failed to accept lead: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error accepting lead:", err);
      alert("Error connecting to backend server.");
    }
  };

  const handleForwardLead = async (leadId, targetUser, remark = "") => {
    if (!user || !leadId || !targetUser)
      return { success: false, error: "Missing required parameters" };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/leads/${leadId}/forward`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || user?._id || "",
          },
          body: JSON.stringify({
            targetUserId: targetUser.id || targetUser._id,
            targetUserName: targetUser.name,
            targetUserEmail: targetUser.email,
            remark,
            user,
          }),
        },
      );
      const data = await response.json();
      if (data.success) {
        const updatedLead = { ...data.lead, id: data.lead._id };
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? updatedLead : l)),
        );
        return { success: true, message: data.message, lead: updatedLead };
      } else {
        alert("Failed to forward lead: " + (data.error || "Unknown error"));
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error forwarding lead:", err);
      alert("Error connecting to backend server.");
      return { success: false, error: err.message };
    }
  };

  const handleForwardBulkLeads = async (leadIds, targetUser, remark = "") => {
    if (
      !user ||
      !Array.isArray(leadIds) ||
      leadIds.length === 0 ||
      !targetUser
    ) {
      return { success: false, error: "Missing required parameters" };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/forward-bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || user?._id || "",
        },
        body: JSON.stringify({
          leadIds,
          targetUserId: targetUser.id || targetUser._id,
          targetUserName: targetUser.name,
          targetUserEmail: targetUser.email,
          remark,
          user,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const updatedMap = new Map(
          (data.leads || []).map((l) => [l._id, { ...l, id: l._id }]),
        );
        setLeads((prev) => prev.map((l) => updatedMap.get(l.id) || l));
        return { success: true, message: data.message, leads: data.leads };
      } else {
        alert("Failed to forward leads: " + (data.error || "Unknown error"));
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Error forwarding leads:", err);
      alert("Error connecting to backend server.");
      return { success: false, error: err.message };
    }
  };

  // Rendering Helper for active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            todos={todos}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            newTodoText={newTodoText}
            setNewTodoText={setNewTodoText}
            handleAddTodo={handleAddTodo}
            leads={leads}
            setActiveTab={setActiveTab}
            user={user}
            users={users}
            handleAcceptLead={handleAcceptLead}
            handleForwardLead={handleForwardLead}
          />
        );
      case "incoming-leads":
        return (
          <IncomingLeadsView
            leads={leads}
            setLeads={setLeads}
            user={user}
            users={users}
            handleAcceptLead={handleAcceptLead}
            handleForwardLead={handleForwardLead}
          />
        );
      case "leads":
        return (
          <LeadsManager
            leads={leads}
            setLeads={setLeads}
            user={user}
            users={users}
            handleAcceptLead={handleAcceptLead}
            handleForwardLead={handleForwardLead}
            handleForwardBulkLeads={handleForwardBulkLeads}
          />
        );
      case "follow-ups":
        return <FollowUpsView user={user} />;
      case "design-projects":
        return <DesignProjectsView user={user} users={users} />;
      case "chat":
        return (
          <ChatView
            user={user}
            onUnreadCountChange={(count) => setUnreadChatCount(count)}
          />
        );
      case "reports":
        return <ReportsView user={user} />;
      case "settings":
        return <SettingsView user={user} />;
      case "users":
        return <UserManagement user={user} />;
      case "recycle-bin":
        return (
          <LeadsManager
            leads={leads}
            setLeads={setLeads}
            user={user}
            users={users}
            handleAcceptLead={handleAcceptLead}
            handleForwardLead={handleForwardLead}
            handleForwardBulkLeads={handleForwardBulkLeads}
            initialFilter="recycled"
          />
        );
      default:
        return (
          <div className="text-slate-500 text-xs font-semibold">
            Tab page not found.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onToggleSidebar={toggleSidebar}
        onToggleMobileMenu={toggleMobileMenu}
        leads={leads}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          closeMobileMenu();
        }}
        unreadChatCount={unreadChatCount}
      />

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            closeMobileMenu();
          }}
          user={user}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={closeMobileMenu}
          incomingCount={incomingCount}
          unreadChatCount={unreadChatCount}
        />

        {/* Scrollable Main Console */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 max-h-[calc(100vh-64px)]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

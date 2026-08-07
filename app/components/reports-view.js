import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../lib/apiConfig';
import { createPortal } from 'react-dom';
import {
  Calendar,
  User,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  BarChart2,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  PhoneCall,
  Activity,
  Award,
  FileText,
  CheckCheck,
  X,
  Flame,
  Zap,
  AlertCircle,
  ArrowUpRight,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function ReportsView({ user: currentUser }) {
  const loggedInUser = currentUser || (typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
  const isAdmin = loggedInUser?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & State
  const [selectedUser, setSelectedUser] = useState(() => isAdmin ? 'all' : (loggedInUser?.name || loggedInUser?.email || 'all'));

  // Default to current year-month (e.g. 2026-08)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [activeTab, setActiveTab] = useState('dayReport'); // 'dayReport' | 'userLeaderboard' | 'activityLog'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayDetail, setSelectedDayDetail] = useState(null); // YYYY-MM-DD for modal
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, leadsRes, followUpsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users`).then(res => res.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/leads`).then(res => res.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/followups`).then(res => res.json()).catch(() => ({ success: false }))
      ]);

      if (usersRes.success) {
        setUsers(usersRes.users || []);
      } else {
        // Fallback default users if users endpoint returns empty
        setUsers([
          { _id: '1', name: currentUser?.name || 'Admin', email: currentUser?.email || 'admin@crm.com', role: currentUser?.role || 'admin' }
        ]);
      }

      if (leadsRes.success) {
        setLeads(leadsRes.leads || []);
      }

      if (followUpsRes.success) {
        setFollowUps(followUpsRes.followUps || []);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load performance reports. Please verify backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Format date into YYYY-MM-DD
  const formatYYYYMMDD = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // User list including current user if not present
  const allUserOptions = useMemo(() => {
    const map = new Map();
    users.forEach(u => {
      if (u.name || u.email) map.set(u.email || u.name, u);
    });
    // Add creators found in leads/followups
    leads.forEach(l => {
      if (l.createdBy && !map.has(l.createdBy)) {
        map.set(l.createdBy, { _id: l.createdBy, name: l.createdBy, email: l.createdBy, role: 'user' });
      }
    });
    followUps.forEach(f => {
      if (f.createdBy && !map.has(f.createdBy)) {
        map.set(f.createdBy, { _id: f.createdBy, name: f.createdBy, email: f.createdBy, role: 'user' });
      }
    });
    return Array.from(map.values());
  }, [users, leads, followUps]);

  // Filtered Leads & FollowUps based on user & month
  const filteredData = useMemo(() => {
    const isUserMatch = (itemUser) => {
      if (selectedUser === 'all') return true;
      if (!itemUser) return selectedUser === 'Unassigned' || selectedUser === 'Admin';
      return itemUser.toLowerCase() === selectedUser.toLowerCase();
    };

    // Filter leads
    const filteredLeads = leads.filter(l => {
      const dateStr = formatYYYYMMDD(l.createdAt || l.leadDate);
      const isMonthMatch = dateStr.startsWith(selectedMonth);
      return isUserMatch(l.createdBy) && isMonthMatch;
    });

    // Filter followups
    const filteredFollowUps = followUps.filter(f => {
      const dateStr = formatYYYYMMDD(f.updatedAt || f.createdAt || f.scheduledAt);
      const isMonthMatch = dateStr.startsWith(selectedMonth);
      return isUserMatch(f.createdBy) && isMonthMatch;
    });

    return { filteredLeads, filteredFollowUps };
  }, [leads, followUps, selectedUser, selectedMonth]);

  // Days breakdown for selected month (1 to last day of month)
  const monthlyDays = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayNumStr = String(day).padStart(2, '0');
      const fullDateStr = `${selectedMonth}-${dayNumStr}`;
      const dateObj = new Date(year, month, day);
      const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      // Leads added on this day
      const dayLeads = leads.filter(l => {
        const isUserMatch = selectedUser === 'all' || (l.createdBy && l.createdBy.toLowerCase() === selectedUser.toLowerCase());
        const leadDateStr = formatYYYYMMDD(l.createdAt || l.leadDate);
        return isUserMatch && leadDateStr === fullDateStr;
      });

      // Follow-ups on this day (scheduled or completed)
      const dayFollowUps = followUps.filter(f => {
        const isUserMatch = selectedUser === 'all' || (f.createdBy && f.createdBy.toLowerCase() === selectedUser.toLowerCase());
        const fuDateStr = formatYYYYMMDD(f.updatedAt || f.createdAt || f.scheduledAt);
        return isUserMatch && fuDateStr === fullDateStr;
      });

      const dayCompletedFollowUps = dayFollowUps.filter(f => f.status === 'Completed');
      const totalActivities = dayLeads.length + dayFollowUps.length;

      let intensity = 'none';
      if (totalActivities >= 5) intensity = 'high';
      else if (totalActivities >= 2) intensity = 'medium';
      else if (totalActivities >= 1) intensity = 'low';

      result.push({
        dayNumber: day,
        dateStr: fullDateStr,
        dayOfWeek: dayOfWeekName,
        isWeekend: dayOfWeekName === 'Sat' || dayOfWeekName === 'Sun',
        leadsCount: dayLeads.length,
        followUpsCount: dayFollowUps.length,
        completedFollowUpsCount: dayCompletedFollowUps.length,
        totalActivities,
        intensity,
        leadsList: dayLeads,
        followUpsList: dayFollowUps
      });
    }

    return result;
  }, [selectedMonth, selectedUser, leads, followUps]);

  // Overall Statistics for KPI Cards
  const stats = useMemo(() => {
    const leadsCount = filteredData.filteredLeads.length;
    const followUpsCount = filteredData.filteredFollowUps.length;
    const completedFollowUps = filteredData.filteredFollowUps.filter(f => f.status === 'Completed').length;
    const totalActivities = leadsCount + completedFollowUps;

    // Count days with at least 1 activity
    const activeDays = monthlyDays.filter(d => d.totalActivities > 0).length;
    const avgDailyActivities = activeDays > 0 ? (totalActivities / activeDays).toFixed(1) : '0';

    return {
      leadsCount,
      followUpsCount,
      completedFollowUps,
      totalActivities,
      activeDays,
      avgDailyActivities
    };
  }, [filteredData, monthlyDays]);

  // User Activeness Leaderboard Calculation
  const userActivenessList = useMemo(() => {
    return allUserOptions.map(usr => {
      const uName = usr.name || usr.email;

      // Leads added by user in selected month
      const monthLeads = leads.filter(l => {
        const dateStr = formatYYYYMMDD(l.createdAt || l.leadDate);
        return l.createdBy?.toLowerCase() === uName.toLowerCase() && dateStr.startsWith(selectedMonth);
      });

      // All-time leads added by user
      const totalLeads = leads.filter(l => l.createdBy?.toLowerCase() === uName.toLowerCase());

      // Followups by user in selected month
      const monthFollowUps = followUps.filter(f => {
        const dateStr = formatYYYYMMDD(f.updatedAt || f.createdAt || f.scheduledAt);
        return f.createdBy?.toLowerCase() === uName.toLowerCase() && dateStr.startsWith(selectedMonth);
      });

      const monthCompletedFollowUps = monthFollowUps.filter(f => f.status === 'Completed');

      // All time completed followups
      const totalCompletedFollowUps = followUps.filter(f => f.createdBy?.toLowerCase() === uName.toLowerCase() && f.status === 'Completed');

      const monthTotalActivities = monthLeads.length + monthCompletedFollowUps.length;

      // Active days count for user
      const userActiveDays = monthlyDays.filter(d => {
        const dayUserLeads = d.leadsList.filter(l => l.createdBy?.toLowerCase() === uName.toLowerCase());
        const dayUserFUs = d.followUpsList.filter(f => f.createdBy?.toLowerCase() === uName.toLowerCase());
        return (dayUserLeads.length + dayUserFUs.length) > 0;
      }).length;

      let statusTier = 'Low';
      let statusColor = 'bg-slate-100 text-slate-600 border-slate-200';
      if (monthTotalActivities >= 12 || userActiveDays >= 10) {
        statusTier = 'Highly Active';
        statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10';
      } else if (monthTotalActivities >= 4 || userActiveDays >= 3) {
        statusTier = 'Active';
        statusColor = 'bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-500/10';
      }

      return {
        user: usr,
        name: usr.name || 'User',
        email: usr.email || '',
        role: usr.role || 'user',
        monthLeadsCount: monthLeads.length,
        totalLeadsCount: totalLeads.length,
        monthFollowUpsCount: monthFollowUps.length,
        monthCompletedFollowUpsCount: monthCompletedFollowUps.length,
        totalCompletedFollowUpsCount: totalCompletedFollowUps.length,
        monthTotalActivities,
        userActiveDays,
        statusTier,
        statusColor
      };
    }).filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.role.toLowerCase().includes(q);
    }).sort((a, b) => b.monthTotalActivities - a.monthTotalActivities);
  }, [allUserOptions, leads, followUps, selectedMonth, monthlyDays, searchQuery]);

  // Export to CSV function
  const exportReportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "User Name,Email,Role,Leads Added (Month),Follow-ups Completed (Month),Total Activities (Month),Active Days\n";

    userActivenessList.forEach(u => {
      csvContent += `"${u.name}","${u.email}","${u.role}",${u.monthLeadsCount},${u.monthCompletedFollowUpsCount},${u.monthTotalActivities},${u.userActiveDays}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `User_Activeness_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render detail data for selected day modal
  const selectedDayObj = useMemo(() => {
    if (!selectedDayDetail) return null;
    return monthlyDays.find(d => d.dateStr === selectedDayDetail);
  }, [selectedDayDetail, monthlyDays]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Fetching User Activeness & Daily Reports...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Activeness & Daily Reports</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Track leads added, follow-ups completed, and daily activities breakdown per month
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* User Selector Dropdown (Admin Only) */}
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Team Members</option>
                {allUserOptions.map(u => (
                  <option key={u._id || u.email} value={u.name || u.email}>
                    {u.name} ({u.role || 'user'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200/80 px-3 py-2 rounded-xl text-xs font-bold text-sky-700">
              <User className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>{loggedInUser?.name || loggedInUser?.email || 'My Performance'}</span>
            </div>
          )}

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportReportCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Leads Added */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-sky-300/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leads Added</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.leadsCount}</span>
            <span className="text-xs font-medium text-slate-400 ml-2">this month</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Selected User: {selectedUser === 'all' ? 'All Team' : selectedUser}</span>
            <span className="text-emerald-600 font-bold">Monthly</span>
          </div>
        </div>

        {/* Card 2: Follow-ups Completed */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-purple-300/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Follow-ups Done</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.completedFollowUps}</span>
            <span className="text-xs font-medium text-slate-400 ml-2">/ {stats.followUpsCount} total</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Completion Rate</span>
            <span className="text-purple-600 font-bold">
              {stats.followUpsCount > 0 ? `${Math.round((stats.completedFollowUps / stats.followUpsCount) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Day Activities */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-amber-300/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Month Activity</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalActivities}</span>
            <span className="text-xs font-medium text-slate-400 ml-2">actions</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Leads + Follow-ups</span>
            <span className="text-amber-600 font-bold">{stats.activeDays} Active Days</span>
          </div>
        </div>

        {/* Card 4: Daily Average Rate */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-sky-300/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Avg Rate</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.avgDailyActivities}</span>
            <span className="text-xs font-medium text-slate-400 ml-2">actions / active day</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Consistency Index</span>
            <span className="text-sky-600 font-bold">
              {stats.activeDays >= 15 ? 'High' : stats.activeDays >= 5 ? 'Moderate' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('dayReport')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${activeTab === 'dayReport'
              ? 'text-sky-600 border-b-2 border-sky-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Activities in a Day Report ({selectedMonth})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('userLeaderboard')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${activeTab === 'userLeaderboard'
                ? 'text-sky-600 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>User Activeness Leaderboard ({userActivenessList.length})</span>
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">Admin Only</span>
          </button>
        )}
      </div>

      {/* TAB 1: ACTIVITIES IN A DAY REPORT OF MONTH */}
      {activeTab === 'dayReport' && (
        <div className="flex flex-col gap-6">
          {/* Daily Calendar Matrix */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Daily Activity Calendar View</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any day cell to view exact leads added and follow-ups completed on that day
                </p>
              </div>

              {/* Intensity Legend */}
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Activity Level:</span>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200"></span>
                  <span>None</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-sky-100 border border-sky-300"></span>
                  <span>Low (1)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-sky-400 text-white"></span>
                  <span>Medium (2-4)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 text-white"></span>
                  <span>High (5+)</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid (Days of Month) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {monthlyDays.map((d) => {
                let bgStyle = "bg-slate-50/70 border-slate-200/70 hover:border-slate-300";
                let textBadgeStyle = "text-slate-600";

                if (d.intensity === 'high') {
                  bgStyle = "bg-emerald-50/80 border-emerald-300 hover:border-emerald-500 shadow-2xs";
                  textBadgeStyle = "text-emerald-700 font-bold";
                } else if (d.intensity === 'medium') {
                  bgStyle = "bg-sky-50/80 border-sky-300 hover:border-sky-500 shadow-2xs";
                  textBadgeStyle = "text-sky-700 font-bold";
                } else if (d.intensity === 'low') {
                  bgStyle = "bg-indigo-50/60 border-indigo-200 hover:border-indigo-400";
                  textBadgeStyle = "text-indigo-700 font-bold";
                }

                return (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDayDetail(d.dateStr)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-24 cursor-pointer group ${bgStyle}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-extrabold text-slate-800 group-hover:text-sky-600 transition-colors">
                        Day {d.dayNumber}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${d.isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>
                        {d.dayOfWeek}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      {d.totalActivities > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Plus className="w-3 h-3 text-emerald-500" /> Leads:
                            </span>
                            <span className="font-bold text-slate-800">{d.leadsCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-500" /> Follow-ups:
                            </span>
                            <span className="font-bold text-slate-800">{d.followUpsCount}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic mt-2">No activity</span>
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[10px]">
                      <span className={textBadgeStyle}>{d.totalActivities} total</span>
                      <Eye className="w-3 h-3 text-slate-400 group-hover:text-sky-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Activity Summary Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Month Daily Breakdown Table</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detailed day-by-day logs for {selectedMonth}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                {monthlyDays.length} Days
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Leads Added</th>
                    <th className="py-3 px-4">Follow-ups Scheduled</th>
                    <th className="py-3 px-4">Follow-ups Completed</th>
                    <th className="py-3 px-4">Total Activities</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {monthlyDays.map((d) => (
                    <tr key={d.dateStr} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.dateStr}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${d.isWeekend ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                          {d.dayOfWeek}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{d.leadsCount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{d.followUpsCount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700">{d.completedFollowUpsCount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-extrabold ${d.totalActivities >= 5 ? 'bg-emerald-100 text-emerald-800' :
                            d.totalActivities >= 1 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {d.totalActivities} actions
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedDayDetail(d.dateStr)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACTIVENESS LEADERBOARD (ADMIN ONLY) */}
      {activeTab === 'userLeaderboard' && isAdmin && (
        <div className="flex flex-col gap-6">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing performance for <strong className="text-slate-800">{selectedMonth}</strong>
            </span>
          </div>

          {/* User Performance Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Leads Added (Month)</th>
                    <th className="py-3.5 px-4">Follow-ups Done</th>
                    <th className="py-3.5 px-4">Total Activities</th>
                    <th className="py-3.5 px-4">Active Days</th>
                    <th className="py-3.5 px-4">Activeness Tier</th>
                    <th className="py-3.5 px-5 text-right">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {userActivenessList.length > 0 ? (
                    userActivenessList.map((item, idx) => (
                      <tr key={item.email || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {idx === 0 && item.monthTotalActivities > 0 && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md flex items-center gap-0.5">
                                    <Award className="w-3 h-3 text-amber-600" /> Top
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal">{item.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 text-sm">{item.monthLeadsCount}</span>
                            <span className="text-[10px] text-slate-400 font-normal">All-time: {item.totalLeadsCount}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-purple-700 text-sm">{item.monthCompletedFollowUpsCount}</span>
                            <span className="text-[10px] text-slate-400 font-normal">Scheduled: {item.monthFollowUpsCount}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black">
                            {item.monthTotalActivities}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-800">{item.userActiveDays} days</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${item.statusColor}`}>
                            {item.statusTier}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(item.name);
                              setActiveTab('dayReport');
                            }}
                            className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>View Calendar</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        No team member activeness records found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NON-ADMIN FALLBACK FOR LEADERBOARD */}
      {activeTab === 'userLeaderboard' && !isAdmin && (
        <div className="bg-amber-50/80 border border-amber-200 p-8 rounded-2xl text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-600" />
          <h3 className="text-base font-bold text-slate-900">Administrator Authorization Required</h3>
          <p className="text-xs text-slate-600 max-w-md">
            The User Activeness Leaderboard is restricted to Administrator accounts. Standard team members can track their individual activities in the Daily Activity Report.
          </p>
        </div>
      )}

      {/* FULL-SCREEN DAY DETAIL MODAL */}
      {selectedDayObj && isClient && createPortal(
        <div className="fixed inset-0 z-99999 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 md:p-6 animate-fade-in font-sans">
          <div className="bg-white w-full h-full md:max-w-6xl md:h-[92vh] md:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shadow-2xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Full Activity Report for {selectedDayObj.dateStr}</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md font-extrabold uppercase">
                      {selectedDayObj.dayOfWeek}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Filter Scope: <strong className="text-slate-800">{selectedUser === 'all' ? 'All Team Members' : selectedUser}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Close Report</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-slate-50/50">
              {/* Day Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leads Created</div>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-1">{selectedDayObj.leadsCount}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Follow-ups Performed</div>
                    <div className="text-2xl font-extrabold text-purple-600 mt-1">{selectedDayObj.followUpsCount}</div>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Actions</div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{selectedDayObj.totalActivities}</div>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Grid 2 Column: Leads & Followups */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads Section */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Leads Created on this Day ({selectedDayObj.leadsList.length})</span>
                    </h4>
                  </div>
                  {selectedDayObj.leadsList.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {selectedDayObj.leadsList.map((lead) => (
                        <div key={lead._id || lead.id} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {lead.phone || lead.email} {lead.campaign ? `• ${lead.campaign}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                              {lead.status || 'New'}
                            </span>
                            <div className="text-[11px] text-slate-400 font-medium mt-1">
                              By: {lead.createdBy || 'Admin'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No leads created on this date.
                    </div>
                  )}
                </div>

                {/* Follow-ups Section */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Follow-ups Scheduled / Performed ({selectedDayObj.followUpsList.length})</span>
                    </h4>
                  </div>
                  {selectedDayObj.followUpsList.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {selectedDayObj.followUpsList.map((fu) => (
                        <div key={fu._id || fu.id} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{fu.leadName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {fu.description || 'Follow-up call/meeting'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] ${fu.status === 'Completed' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {fu.status || 'Pending'}
                            </span>
                            <div className="text-[11px] text-slate-400 font-medium mt-1">
                              By: {fu.createdBy || 'Admin'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No follow-ups recorded on this date.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                Detailed Activity Report • {selectedDayObj.dateStr}
              </span>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

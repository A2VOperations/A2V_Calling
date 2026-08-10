import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  CheckCircle2,
  User,
  Search,
  Grid,
  List,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUpDown,
  Building,
  CheckSquare,
  Square,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Flame,
  Zap,
  Tag,
} from "lucide-react";

export default function IncomingLeadsView({
  leads = [],
  setLeads,
  user,
  handleAcceptLead,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'name'
  const [quickViewLead, setQuickViewLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Filter incoming unassigned leads
  const incomingLeads = useMemo(() => {
    return leads
      .filter((l) => {
        const isUnassigned = !l.handledBy || l.status === "Incoming";
        if (!isUnassigned) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.businessName && l.businessName.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.areaZone && l.areaZone.toLowerCase().includes(q)) ||
          (l.createdBy && l.createdBy.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest")
          return (
            new Date(b.createdAt || b.leadDate || 0) -
            new Date(a.createdAt || a.leadDate || 0)
          );
        if (sortBy === "oldest")
          return (
            new Date(a.createdAt || a.leadDate || 0) -
            new Date(b.createdAt || b.leadDate || 0)
          );
        if (sortBy === "name")
          return (a.name || "").localeCompare(b.name || "");
        return 0;
      });
  }, [leads, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalIncoming = incomingLeads.length;
    const totalSystemLeads = leads.length;
    const myHandled = leads.filter(
      (l) =>
        l.handledBy &&
        user &&
        l.handledBy.toLowerCase() ===
          (user.name || user.email || "").toLowerCase(),
    ).length;
    const totalHandled = leads.filter((l) => l.handledBy).length;

    return {
      totalIncoming,
      totalSystemLeads,
      myHandled,
      totalHandled,
    };
  }, [leads, incomingLeads, user]);

  // Handle single lead acceptance
  const onAccept = async (leadId, leadName) => {
    if (handleAcceptLead) {
      await handleAcceptLead(leadId);
    }
    showToast(`🎉 You are now handling ${leadName || "this lead"}!`);
    if (
      quickViewLead &&
      (quickViewLead.id === leadId || quickViewLead._id === leadId)
    ) {
      setQuickViewLead(null);
    }
  };

  // Handle bulk lead acceptance
  const onAcceptSelected = async () => {
    if (selectedLeadIds.length === 0) return;
    const idsToAccept = [...selectedLeadIds];
    for (const id of idsToAccept) {
      if (handleAcceptLead) {
        await handleAcceptLead(id);
      }
    }
    showToast(`🎉 Successfully accepted ${idsToAccept.length} incoming leads!`);
    setSelectedLeadIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === incomingLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(incomingLeads.map((l) => l.id || l._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] px-4 py-3 bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#1E293B] text-white p-3 md:p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Sparkles className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Incoming Leads & Assignment Hub
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 text-white">
            <div className="p-3 bg-white/20 rounded-xl">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-200">
                My Handled
              </div>
              <div className="text-2xl font-black">{stats.myHandled} Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Bulk Accept, View Switcher & Sort */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, phone, zone, or business..."
            className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bulk Action & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bulk Accept Button */}
          {selectedLeadIds.length > 0 && (
            <button
              onClick={onAcceptSelected}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Selected ({selectedLeadIds.length})</span>
            </button>
          )}

          {/* Select All Checkbox Button */}
          {incomingLeads.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              {selectedLeadIds.length === incomingLeads.length ? (
                <CheckSquare className="w-4 h-4 text-amber-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedLeadIds.length === incomingLeads.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
          )}

          {/* Sort Select */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Client Name (A-Z)</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-amber-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-amber-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {incomingLeads.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center flex flex-col items-center gap-3 shadow-xs">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Incoming Leads Pending Acceptance!
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            {searchQuery
              ? "No incoming unassigned leads match your active search terms. Try clearing your search."
              : "All incoming leads have been accepted and assigned to team members. Great job!"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {incomingLeads.map((lead) => {
            const leadId = lead.id || lead._id;
            const isSelected = selectedLeadIds.includes(leadId);

            return (
              <div
                key={leadId}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 relative group ${
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
                    : "border-slate-200/90 hover:border-amber-300"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSelectOne(leadId)}
                      className="text-slate-400 hover:text-amber-600 cursor-pointer pt-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                        <span>{lead.name}</span>
                      </h3>
                      {lead.businessName && (
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{lead.businessName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0 border border-amber-200">
                    <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                    Incoming
                  </span>
                </div>

                {/* Details Body */}
                <div className="flex flex-col gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {lead.phone || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                    </span>
                    <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                      {lead.email || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Zone:
                    </span>
                    <span className="font-bold text-slate-800">
                      {lead.areaZone || "General Zone"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-500" /> Added By:
                    </span>
                    <span className="font-bold text-slate-700">
                      {lead.createdBy || "System / Unspecified"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setQuickViewLead(lead)}
                    className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quick View</span>
                  </button>

                  <button
                    onClick={() => onAccept(leadId, lead.name)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Lead</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      {selectedLeadIds.length === incomingLeads.length &&
                      incomingLeads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Business</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Area Zone</th>
                  <th className="py-3.5 px-4">Added By</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {incomingLeads.map((lead) => {
                  const leadId = lead.id || lead._id;
                  const isSelected = selectedLeadIds.includes(leadId);

                  return (
                    <tr
                      key={leadId}
                      className={`hover:bg-amber-50/30 transition-colors ${isSelected ? "bg-amber-50/40" : ""}`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleSelectOne(leadId)}
                          className="cursor-pointer text-slate-400 hover:text-amber-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {lead.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {lead.businessName || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div>{lead.phone || "-"}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {lead.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[11px]">
                          {lead.areaZone || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {lead.createdBy || "System"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setQuickViewLead(lead)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Quick View"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button
                            onClick={() => onAccept(leadId, lead.name)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK VIEW DRAWER MODAL */}
      {quickViewLead &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
              {/* Header */}
              <div className="bg-amber-600 text-white p-5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                  <h3 className="font-extrabold text-base text-white">
                    Incoming Lead Profile
                  </h3>
                </div>
                <button
                  onClick={() => setQuickViewLead(null)}
                  className="text-amber-200 hover:text-white p-1 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
                <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Status
                    </div>
                    <div className="font-black text-amber-900 text-sm mt-0.5">
                      Incoming / Unassigned
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500 text-white font-extrabold rounded-full text-xs shadow-xs">
                    Requires Acceptance
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Client Name
                  </span>
                  <div className="text-lg font-black text-slate-900">
                    {quickViewLead.name}
                  </div>
                  {quickViewLead.businessName && (
                    <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quickViewLead.businessName}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                    Contact Details
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Phone Number
                      </span>
                      <span className="font-extrabold text-slate-800 font-mono text-sm">
                        {quickViewLead.phone || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Email Address
                      </span>
                      <span className="font-semibold text-slate-800">
                        {quickViewLead.email || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Area Zone
                      </span>
                      <span className="font-semibold text-slate-800">
                        {quickViewLead.areaZone || "General"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Added By User
                      </span>
                      <span className="font-semibold text-slate-800">
                        {quickViewLead.createdBy || "System"}
                      </span>
                    </div>
                  </div>
                </div>

                {(quickViewLead.remark || quickViewLead.remark2) && (
                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                      Initial Remarks
                    </h4>
                    <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-xl text-slate-800 font-medium">
                      {quickViewLead.remark || quickViewLead.remark2}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() =>
                    onAccept(
                      quickViewLead.id || quickViewLead._id,
                      quickViewLead.name,
                    )
                  }
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Lead Now</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

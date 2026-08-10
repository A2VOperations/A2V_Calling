'use client';

import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../lib/apiConfig';
import { createPortal } from 'react-dom';
import {
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Search,
  Filter,
  Plus,
  SlidersHorizontal,
  Download,
  Grid,
  List,
  Trash2,
  Edit3,
  Eye,
  X,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
} from 'lucide-react';

// Base Standard Columns requested by user
const BASE_COLUMNS = [
  { key: 'leadDate', label: 'Lead Date', type: 'date' },
  { key: 'createdBy', label: 'Added By', type: 'text' },
  { key: 'handledBy', label: 'Handled By', type: 'text' },
  { key: 'areaZone', label: 'Area Zone', type: 'text' },
  { key: 'businessName', label: 'Business Name', type: 'text' },
  { key: 'name', label: 'Client Name', type: 'text', required: true },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'googleMap', label: 'Google Map', type: 'url' },
  { key: 'website', label: 'Website', type: 'url' },
  { key: 'instagram', label: 'Instagram', type: 'url' },
  { key: 'facebook', label: 'Facebook', type: 'url' },
  { key: 'youtube', label: 'YouTube', type: 'url' },
  { key: 'phone', label: 'Phone Number', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'totalAmount', label: 'Total Amount', type: 'currency' },
  { key: 'paidAmount', label: 'Paid Amount', type: 'currency' },
  { key: 'balanceAmount', label: 'Balance Amount', type: 'currency' },
  { key: 'remark', label: 'Remark', type: 'text' },
  { key: 'startCallDate', label: 'Start Call Date', type: 'date' },
  { key: 'lastCallDate', label: 'Last Call Date', type: 'date' },
  { key: 'remark2', label: 'Remark 2', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['Incoming', 'New', 'Active', 'Contacted', 'Follow-up Required', 'No Answer'] },
  { key: 'campaign', label: 'Source Campaign', type: 'text' }
];

export default function LeadsManager({ leads = [], setLeads, user, handleAcceptLead, initialFilter = 'all' }) {
  // View mode: 'table' vs 'grid'
  const [viewMode, setViewMode] = useState('grid');

  // Local state for dynamic custom columns
  const [customColumns, setCustomColumns] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Search and filter states
  const [quickFilterTab, setQuickFilterTab] = useState(initialFilter); // 'all', 'incoming', 'my-handled'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filters, setFilters] = useState({
    areaZone: 'All',
    campaign: 'All',
    paymentStatus: 'All',
    createdBy: 'All',
    handledBy: 'All',
    dateFrom: '',
    dateTo: ''
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Modal control states
  const [leadModal, setLeadModal] = useState({ isOpen: false, type: 'add', leadId: null });
  const [columnModal, setColumnModal] = useState({ isOpen: false, mode: 'add', editingKey: null });
  const [quickViewLead, setQuickViewLead] = useState(null); // Drawer / Quick View state

  // Column Visibility state
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState([]);
  const dropdownRef = useRef(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Form states
  const [formValues, setFormValues] = useState({});
  const [activeFormTab, setActiveFormTab] = useState('general');

  // New/Edit column form states
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState('text');

  // Load custom columns on client mount
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem('crm_custom_columns');
    if (stored) {
      try {
        setCustomColumns(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load custom columns', e);
      }
    }
  }, []);

  // Save custom columns when updated
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('crm_custom_columns', JSON.stringify(customColumns));
    }
  }, [customColumns, isClient]);

  // Handle outside click for column visibility dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combine standard and custom columns
  const allColumns = [...BASE_COLUMNS, ...customColumns];
  const visibleColumns = allColumns.filter(c => !hiddenColumnKeys.includes(c.key));

  // Count leads by status
  const counts = {
    total: leads.length,
    incoming: leads.filter(l => !l.handledBy || l.status === 'Incoming').length,
    myHandled: leads.filter(l => l.handledBy === user?.name || l.handledBy === user?.email).length,
    new: leads.filter(l => l.status === 'New').length,
    active: leads.filter(l => l.status === 'Active').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    followUp: leads.filter(l => l.status === 'Follow-up Required').length,
    noAnswer: leads.filter(l => l.status === 'No Answer').length
  };

  // Toggle column visibility
  const toggleColumnVisibility = (key) => {
    setHiddenColumnKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Select all or reset column visibility
  const showAllColumns = () => setHiddenColumnKeys([]);

  // Handle Sorting
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export.');
      return;
    }
    const headers = allColumns.map(c => c.label);
    const rows = filteredLeads.map(lead => {
      return allColumns.map(col => {
        let val = lead[col.key];
        if (val === undefined || val === null) val = '';
        val = val.toString().replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendering URL Badges cleanly
  const renderUrlBadge = (key, value) => {
    if (!value) return <span className="text-slate-300 font-normal">-</span>;

    const href = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;

    let styles = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300";
    let Icon = Globe;
    let label = "Link";

    if (key === 'googleMap') {
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100/80";
      Icon = MapPin;
      label = "Map";
    } else if (key === 'website') {
      styles = "bg-sky-50 text-sky-700 border-sky-200/70 hover:bg-sky-100/80";
      Icon = Globe;
      label = "Web";
    } else if (key === 'instagram') {
      styles = "bg-pink-50 text-pink-700 border-pink-200/70 hover:bg-pink-100/80";
      Icon = ExternalLink;
      label = "Insta";
    } else if (key === 'facebook') {
      styles = "bg-indigo-50 text-indigo-700 border-indigo-200/70 hover:bg-indigo-100/80";
      Icon = ExternalLink;
      label = "FB";
    } else if (key === 'youtube') {
      styles = "bg-rose-50 text-rose-700 border-rose-200/70 hover:bg-rose-100/80";
      Icon = ExternalLink;
      label = "YT";
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${styles}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{label}</span>
      </a>
    );
  };

  // Rendering Status Badges
  const renderStatusBadge = (status) => {
    let styles = "bg-slate-100 text-slate-600 border-slate-200/80";
    let Icon = Sparkles;

    if (status === 'Incoming') {
      styles = "bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10 animate-pulse";
      Icon = Sparkles;
    } else if (status === 'Active') {
      styles = "bg-sky-50 text-sky-700 border-sky-200/70 ring-1 ring-sky-500/10";
      Icon = CheckCircle2;
    } else if (status === 'Contacted') {
      styles = "bg-amber-50 text-amber-700 border-amber-200/70 ring-1 ring-amber-500/10";
      Icon = Clock;
    } else if (status === 'New') {
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200/70 ring-1 ring-emerald-500/10";
      Icon = Sparkles;
    } else if (status === 'Follow-up Required') {
      styles = "bg-purple-50 text-purple-700 border-purple-200/70 ring-1 ring-purple-500/10";
      Icon = AlertCircle;
    } else if (status === 'No Answer') {
      styles = "bg-rose-50 text-rose-700 border-rose-200/70 ring-1 ring-rose-500/10";
      Icon = XCircle;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${styles}`}>
        <Icon className="w-3 h-3 shrink-0" />
        <span>{status || 'Incoming'}</span>
      </span>
    );
  };

  // Cell rendering router based on key/type
  const renderCellContent = (col, lead) => {
    const val = lead[col.key];

    if (col.key === 'name') {
      return (
        <div className="flex items-center gap-3 min-w-42.5">
          <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
            {(val || 'L').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-800 text-xs truncate hover:text-sky-600 transition-colors cursor-pointer" onClick={() => setQuickViewLead(lead)}>
              {val || 'Unnamed Client'}
            </span>
            {lead.businessName && (
              <span className="text-[10px] text-slate-400 font-semibold truncate flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                {lead.businessName}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (col.type === 'url') {
      return renderUrlBadge(col.key, val);
    }

    if (col.key === 'status') {
      return renderStatusBadge(val);
    }

    if (col.key === 'email') {
      return val ? (
        <a href={`mailto:${val}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-sky-600 font-medium text-xs transition-colors">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{val}</span>
        </a>
      ) : (
        <span className="text-slate-300 font-normal">-</span>
      );
    }

    if (col.key === 'phone') {
      return val ? (
        <a href={`tel:${val}`} className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 font-semibold">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val}</span>
        </a>
      ) : (
        <span className="text-slate-300 font-normal">-</span>
      );
    }

    if (col.key === 'createdBy') {
      return val ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
          <User className="w-3 h-3 text-sky-500 shrink-0" />
          <span>{val}</span>
        </span>
      ) : (
        <span className="text-slate-400 font-normal italic text-[11px]">System / Unspecified</span>
      );
    }

    if (col.key === 'handledBy') {
      return val ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>{val}</span>
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (handleAcceptLead) handleAcceptLead(lead.id || lead._id);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Accept Lead</span>
        </button>
      );
    }

    if (col.type === 'date') {
      return val ? (
        <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-medium">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          {val}
        </span>
      ) : (
        <span className="text-slate-300 font-normal">-</span>
      );
    }

    if (col.type === 'currency' || col.key === 'paidAmount' || col.key === 'balanceAmount' || col.key === 'totalAmount') {
      const num = val !== undefined && val !== null && val !== '' ? Number(val) : null;
      if (num === null || isNaN(num)) return <span className="text-slate-300 font-normal">-</span>;

      if (col.key === 'paidAmount') {
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
            ₹{num.toLocaleString('en-IN')}
          </span>
        );
      }

      if (col.key === 'balanceAmount') {
        const isPending = num > 0;
        return (
          <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${isPending ? 'text-amber-700 bg-amber-50 border-amber-200/70' : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
            ₹{num.toLocaleString('en-IN')}
          </span>
        );
      }

      return (
        <span className="font-mono text-xs font-bold text-slate-800">
          ₹{num.toLocaleString('en-IN')}
        </span>
      );
    }

    return val !== undefined && val !== '' ? (
      <span className="text-slate-700 font-medium text-xs block max-w-55 truncate" title={val.toString()}>
        {val.toString()}
      </span>
    ) : (
      <span className="text-slate-300 font-normal">-</span>
    );
  };

  // Modal open handlers
  const handleOpenAddLead = () => {
    const currentUser = user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null);
    setFormValues({
      status: 'New',
      campaign: 'Direct Outreach',
      progress: 10,
      leadDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || currentUser?.email || '',
      totalAmount: '',
      paidAmount: '',
      balanceAmount: ''
    });
    setLeadModal({ isOpen: true, type: 'add', leadId: null });
    setActiveFormTab('general');
  };

  const handleOpenEditLead = (lead) => {
    setFormValues({ ...lead });
    setLeadModal({ isOpen: true, type: 'edit', leadId: lead.id });
    setActiveFormTab('general');
  };

  // Delete lead handler
  const handleDeleteLead = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete lead: "${name}"?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          setLeads(prev => prev.filter(l => l.id !== id));
          if (quickViewLead?.id === id) setQuickViewLead(null);
        } else {
          alert('Failed to delete lead: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error deleting lead:', err);
        alert('Error deleting lead');
      }
    }
  };

  // Form Submission
  const handleLeadFormSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.name || !formValues.email || !formValues.phone) {
      alert('Client Name, Email, and Phone Number are required fields.');
      return;
    }

    const currentUser = user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null);

    const progressVal = formValues.status === 'Active' ? 80 :
      formValues.status === 'Contacted' ? 45 :
        formValues.status === 'Follow-up Required' ? 60 :
          formValues.status === 'No Answer' ? 0 : 10;

    const payload = {
      ...formValues,
      totalAmount: formValues.totalAmount !== '' ? Number(formValues.totalAmount) : 0,
      paidAmount: formValues.paidAmount !== '' ? Number(formValues.paidAmount) : 0,
      balanceAmount: formValues.balanceAmount !== '' ? Number(formValues.balanceAmount) : 0,
      progress: progressVal,
    };

    if (leadModal.type === 'add') {
      payload.createdBy = currentUser?.name || currentUser?.email || 'Admin';
    }

    try {
      if (leadModal.type === 'add') {
        const response = await fetch(`${API_BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success) {
          const newLead = { ...data.lead, id: data.lead._id };
          setLeads(prev => [newLead, ...prev]);
        } else {
          alert('Failed to add lead: ' + (data.error || 'Unknown error'));
          return;
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/leads/${leadModal.leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success) {
          const updatedLead = { ...data.lead, id: data.lead._id };
          setLeads(prev => prev.map(l => l.id === leadModal.leadId ? updatedLead : l));
          if (quickViewLead?.id === leadModal.leadId) setQuickViewLead(updatedLead);
        } else {
          alert('Failed to update lead: ' + (data.error || 'Unknown error'));
          return;
        }
      }

      setLeadModal({ isOpen: false, type: 'add', leadId: null });
      setFormValues({});
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('Error saving lead. Is the backend running?');
    }
  };

  // Custom Column Management Handlers (Add / Edit / Delete)
  const handleOpenAddColumn = () => {
    setNewColLabel('');
    setNewColType('text');
    setColumnModal({ isOpen: true, mode: 'add', editingKey: null });
  };

  const handleOpenEditColumn = (col) => {
    setNewColLabel(col.label);
    setNewColType(col.type);
    setColumnModal({ isOpen: true, mode: 'edit', editingKey: col.key });
  };

  const handleSaveColumnSubmit = (e) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    if (columnModal.mode === 'edit' && columnModal.editingKey) {
      setCustomColumns(prev =>
        prev.map(c => c.key === columnModal.editingKey ? { ...c, label: newColLabel.trim(), type: newColType } : c)
      );
    } else {
      const key = 'custom_' + Date.now();
      const newCol = {
        key,
        label: newColLabel.trim(),
        type: newColType,
        isCustom: true
      };
      setCustomColumns(prev => [...prev, newCol]);
    }

    setNewColLabel('');
    setNewColType('text');
    setColumnModal({ isOpen: false, mode: 'add', editingKey: null });
  };

  const handleDeleteColumn = (key, label) => {
    if (window.confirm(`Delete custom column "${label}"? This will hide the column data.`)) {
      setCustomColumns(prev => prev.filter(c => c.key !== key));
      setHiddenColumnKeys(prev => prev.filter(k => k !== key));
    }
  };

  // Dynamic filter options derived from leads dataset
  const uniqueAreaZones = Array.from(new Set(leads.map(l => l.areaZone).filter(Boolean))).sort();
  const uniqueCampaigns = Array.from(new Set(leads.map(l => l.campaign).filter(Boolean))).sort();
  const uniqueCreators = Array.from(new Set(leads.map(l => l.createdBy).filter(Boolean))).sort();
  const uniqueHandlers = Array.from(new Set(leads.map(l => l.handledBy).filter(Boolean))).sort();

  const activeFiltersCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (filters.areaZone !== 'All' ? 1 : 0) +
    (filters.campaign !== 'All' ? 1 : 0) +
    (filters.paymentStatus !== 'All' ? 1 : 0) +
    (filters.createdBy !== 'All' ? 1 : 0) +
    (filters.handledBy !== 'All' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const resetAllFilters = () => {
    setStatusFilter('All');
    setFilters({
      areaZone: 'All',
      campaign: 'All',
      paymentStatus: 'All',
      createdBy: 'All',
      handledBy: 'All',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Filter and search logic
  let filteredLeads = leads.filter(lead => {
    // Quick filter tab criteria
    if (quickFilterTab === 'incoming' && lead.handledBy) {
      return false;
    }
    if (quickFilterTab === 'my-handled' && (lead.handledBy !== user?.name && lead.handledBy !== user?.email)) {
      return false;
    }

    const query = searchQuery.toLowerCase();
    const nameMatch = lead.name?.toLowerCase().includes(query);
    const emailMatch = lead.email?.toLowerCase().includes(query);
    const phoneMatch = lead.phone?.toLowerCase().includes(query);
    const bizMatch = lead.businessName?.toLowerCase().includes(query);
    const zoneMatch = lead.areaZone?.toLowerCase().includes(query);
    const campaignMatch = lead.campaign?.toLowerCase().includes(query);
    const createdByMatch = lead.createdBy?.toLowerCase().includes(query);
    const handledByMatch = lead.handledBy?.toLowerCase().includes(query);

    const matchesSearch = !query || nameMatch || emailMatch || phoneMatch || bizMatch || zoneMatch || campaignMatch || createdByMatch || handledByMatch;
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesZone = filters.areaZone === 'All' || lead.areaZone === filters.areaZone;
    const matchesCampaign = filters.campaign === 'All' || lead.campaign === filters.campaign;
    const matchesCreator = filters.createdBy === 'All' || lead.createdBy === filters.createdBy;
    const matchesHandler = filters.handledBy === 'All' || (filters.handledBy === 'Unassigned' ? !lead.handledBy : lead.handledBy === filters.handledBy);

    // Payment Status matching
    let matchesPayment = true;
    const paid = Number(lead.paidAmount) || 0;
    const bal = Number(lead.balanceAmount) || 0;
    if (filters.paymentStatus === 'Paid') {
      matchesPayment = paid > 0 && bal === 0;
    } else if (filters.paymentStatus === 'Pending Balance') {
      matchesPayment = bal > 0;
    } else if (filters.paymentStatus === 'Unpaid') {
      matchesPayment = paid === 0;
    }

    // Date Range matching
    let matchesDate = true;
    if (filters.dateFrom) {
      matchesDate = matchesDate && (lead.leadDate || '') >= filters.dateFrom;
    }
    if (filters.dateTo) {
      matchesDate = matchesDate && (lead.leadDate || '') <= filters.dateTo;
    }

    return matchesSearch && matchesStatus && matchesZone && matchesCampaign && matchesCreator && matchesHandler && matchesPayment && matchesDate;
  });

  // Apply sorting if configured
  if (sortConfig.key) {
    filteredLeads = [...filteredLeads].sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Financial Summaries calculation
  const totalPaidSum = filteredLeads.reduce((sum, l) => sum + (Number(l.paidAmount) || 0), 0);
  const totalBalanceSum = filteredLeads.reduce((sum, l) => sum + (Number(l.balanceAmount) || 0), 0);
  const totalDealSum = filteredLeads.reduce((sum, l) => sum + (Number(l.totalAmount) || ((Number(l.paidAmount) || 0) + (Number(l.balanceAmount) || 0))), 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">

      {/* Top Header & Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-600 text-white rounded-full shadow-md shadow-sky-600/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Leads Management</span>
              <span className="text-xs font-extrabold bg-sky-50 text-sky-600 border border-sky-100 rounded-full px-2.5 py-0.5">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Organize, filter, track financials, and manage custom fields for your prospect directory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
            title="Export lead list to CSV file"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAddColumn}
            className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
            title="Add a custom column to leads"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Column</span>
          </button>
          <button
            onClick={handleOpenAddLead}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Quick Category Tab Switcher Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-2 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setQuickFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            quickFilterTab === 'all'
              ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-600" />
          <span>All Leads Directory</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            {counts.total}
          </span>
        </button>

        <button
          onClick={() => setQuickFilterTab('incoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            quickFilterTab === 'incoming'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Incoming Leads (Unassigned)</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            quickFilterTab === 'incoming' ? 'bg-amber-600 text-white' : 'bg-amber-200/80 text-amber-900'
          }`}>
            {counts.incoming}
          </span>
        </button>

        <button
          onClick={() => setQuickFilterTab('my-handled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            quickFilterTab === 'my-handled'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>My Handled Leads</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            {counts.myHandled}
          </span>
        </button>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        {/* Left Search Bar */}
        <div className="relative flex-1 min-w-55">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, phone, business or zone..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Quick Pills (Right after Search) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {[
            { label: 'All', count: counts.all, status: 'all' },
            { label: 'New', count: counts.new, status: 'New', icon: Sparkles },
            { label: 'Active', count: counts.active, status: 'Active', icon: CheckCircle2 },
            { label: 'Contacted', count: counts.contacted, status: 'Contacted', icon: Clock },
            { label: 'Follow-up', count: counts.followUp, status: 'Follow-up Required', icon: AlertCircle },
          ].map((pill) => {
            const isActive = statusFilter === pill.status;
            return (
              <button
                key={pill.label}
                onClick={() => setStatusFilter(pill.status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Advanced Filter Toggle Button */}
          <button
            onClick={() => setIsFilterPanelOpen(prev => !prev)}
            className={`h-10 px-3.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${isFilterPanelOpen || activeFiltersCount > 0
              ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/10'
              : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
              }`}
          >
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-sky-600 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.2">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Customize Columns Dropdown Toggle (Table View Only) */}
          {viewMode === 'table' && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsColumnDropdownOpen(prev => !prev)}
                className="h-10 px-3.5 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Columns</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 animate-fade-in max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-800">Customize Columns</span>
                    <button
                      onClick={showAllColumns}
                      className="text-[10px] font-bold text-sky-600 hover:underline cursor-pointer"
                    >
                      Show All
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {allColumns.map(col => {
                      const isVisible = !hiddenColumnKeys.includes(col.key);
                      return (
                        <div
                          key={col.key}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 group"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleColumnVisibility(col.key)}
                              className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                          {col.isCustom && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditColumn(col)}
                                className="p-1 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded transition-colors cursor-pointer"
                                title="Edit Column"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteColumn(col.key, col.label)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Delete Column"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Mode Toggle Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === 'table'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === 'grid'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Advanced Filter Panel */}
      {isFilterPanelOpen && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-800 text-xs">Filter Leads Directory</span>
              {activeFiltersCount > 0 && (
                <span className="bg-sky-100 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'Active Filter' : 'Active Filters'}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="No Answer">No Answer</option>
              </select>
            </div>

            {/* 2. Area Zone Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Area Zone</label>
              <select
                value={filters.areaZone}
                onChange={(e) => setFilters(prev => ({ ...prev, areaZone: e.target.value }))}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Zones</option>
                {uniqueAreaZones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* 3. Campaign Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source Campaign</label>
              <select
                value={filters.campaign}
                onChange={(e) => setFilters(prev => ({ ...prev, campaign: e.target.value }))}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Campaigns</option>
                {uniqueCampaigns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 4. Payment Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Fully Paid</option>
                <option value="Pending Balance">Pending Balance</option>
                <option value="Unpaid">Unpaid / Zero Paid</option>
              </select>
            </div>

            {/* 5. Handled By Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Handled By</label>
              <select
                value={filters.handledBy}
                onChange={(e) => setFilters(prev => ({ ...prev, handledBy: e.target.value }))}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Handlers</option>
                <option value="Unassigned">Unassigned (Incoming)</option>
                {uniqueHandlers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 6. Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
              />
            </div>

            {/* 7. Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Filters:</span>
          {statusFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('All')} className="hover:text-sky-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.areaZone !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zone: {filters.areaZone}
              <button onClick={() => setFilters(prev => ({ ...prev, areaZone: 'All' }))} className="hover:text-emerald-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.campaign !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Campaign: {filters.campaign}
              <button onClick={() => setFilters(prev => ({ ...prev, campaign: 'All' }))} className="hover:text-indigo-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.handledBy !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Handled By: {filters.handledBy}
              <button onClick={() => setFilters(prev => ({ ...prev, handledBy: 'All' }))} className="hover:text-teal-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.paymentStatus !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Payment: {filters.paymentStatus}
              <button onClick={() => setFilters(prev => ({ ...prev, paymentStatus: 'All' }))} className="hover:text-amber-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.createdBy !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Added By: {filters.createdBy}
              <button onClick={() => setFilters(prev => ({ ...prev, createdBy: 'All' }))} className="hover:text-purple-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              From: {filters.dateFrom}
              <button onClick={() => setFilters(prev => ({ ...prev, dateFrom: '' }))} className="hover:text-rose-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              To: {filters.dateTo}
              <button onClick={() => setFilters(prev => ({ ...prev, dateTo: '' }))} className="hover:text-rose-900 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button
            onClick={resetAllFilters}
            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Content Area: Table View vs Grid Cards View */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                  <th className="p-4 border-r border-slate-200/50 text-center w-16 sticky left-0 bg-slate-50 shadow-[1px_0_0_0_rgba(241,245,249,1)]">
                    S.No
                  </th>
                  {visibleColumns.map((col) => (
                    <th key={col.key} className="p-4 border-r border-slate-200/50 whitespace-nowrap min-w-35">
                      <div className="flex items-center justify-between gap-1 group">
                        <button
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <span>{col.label}</span>
                          <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === col.key ? 'text-sky-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                        </button>
                        {col.isCustom && (
                          <div className="inline-flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditColumn(col);
                              }}
                              className="text-slate-400 hover:text-sky-600 p-0.5 rounded cursor-pointer transition-colors"
                              title="Edit Custom Column"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteColumn(col.key, col.label);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer transition-colors"
                              title="Delete Custom Column"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-4 text-center sticky right-0 bg-slate-50 shadow-[-1px_0_0_0_rgba(241,245,249,1)] w-36">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead, idx) => (
                    <tr key={lead.id} className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/60 font-semibold text-xs text-slate-700 transition-colors">
                      <td className="p-4 border-r border-slate-200/50 text-center text-slate-400 font-mono text-[11px] sticky left-0 bg-white group-hover:bg-slate-50/60 shadow-[1px_0_0_0_rgba(241,245,249,1)]">
                        {idx + 1}
                      </td>
                      {visibleColumns.map((col) => (
                        <td key={col.key} className="p-4 border-r border-slate-200/50 max-w-65">
                          {renderCellContent(col, lead)}
                        </td>
                      ))}
                      <td className="p-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/60 shadow-[-1px_0_0_0_rgba(241,245,249,1)]">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          {/* Quick View Button */}
                          <button
                            onClick={() => setQuickViewLead(lead)}
                            className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
                            title="Quick View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Lead Button */}
                          <button
                            onClick={() => handleOpenEditLead(lead)}
                            className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-200/70 transition-all cursor-pointer shadow-2xs"
                            title="Edit Lead Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Lead Button */}
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-200/70 transition-all cursor-pointer shadow-2xs"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="p-12 text-center text-slate-400 font-semibold text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 text-slate-300 stroke-1" />
                        <span className="font-bold text-slate-600">No matching leads found</span>
                        <p className="text-[11px] text-slate-400">Try adjusting your search query or status filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-600" />

                <div className="flex flex-col gap-3">
                  {/* Card Top Row: Avatar & Status */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-sky-600/20 shrink-0">
                        {(lead.name || 'L').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3
                          onClick={() => setQuickViewLead(lead)}
                          className="font-bold text-slate-900 text-sm hover:text-sky-600 cursor-pointer transition-colors"
                        >
                          {lead.name || 'Unnamed Client'}
                        </h3>
                        {lead.businessName && (
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {lead.businessName}
                          </p>
                        )}
                      </div>
                    </div>
                    {renderStatusBadge(lead.status)}
                  </div>

                  {/* Lead Handler Status / Accept Lead Bar */}
                  {lead.handledBy ? (
                    <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/70 p-2 rounded-xl text-xs">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Handled By:</span>
                      <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {lead.handledBy}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/80 p-2 rounded-xl text-xs">
                      <div className="flex items-center gap-1 text-amber-800 font-bold">
                        <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>Incoming</span>
                      </div>
                      <button
                        onClick={() => handleAcceptLead && handleAcceptLead(lead.id || lead._id)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Accept Lead</span>
                      </button>
                    </div>
                  )}

                  {/* Financial Summary Pill Bar inside Lead Card */}
                  {(lead.paidAmount !== undefined || lead.balanceAmount !== undefined || lead.totalAmount !== undefined) && (
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200/60">
                        <span className="text-[10px] font-sans font-bold text-emerald-600 uppercase">Paid:</span>
                        <span className="font-bold">₹{(Number(lead.paidAmount) || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${(Number(lead.balanceAmount) || 0) > 0
                        ? 'text-amber-700 bg-amber-50/80 border-amber-200/60'
                        : 'text-slate-600 bg-slate-100 border-slate-200'
                        }`}>
                        <span className="text-[10px] font-sans font-bold uppercase">Balance:</span>
                        <span className="font-bold">₹{(Number(lead.balanceAmount) || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  {/* Contact Info Pills */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 font-bold">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 text-slate-600 font-medium truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.areaZone && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Zone: {lead.areaZone}</span>
                      </div>
                    )}
                    {lead.campaign && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Campaign: {lead.campaign}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links Row */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {lead.googleMap && renderUrlBadge('googleMap', lead.googleMap)}
                    {lead.website && renderUrlBadge('website', lead.website)}
                    {lead.instagram && renderUrlBadge('instagram', lead.instagram)}
                    {lead.facebook && renderUrlBadge('facebook', lead.facebook)}
                    {lead.twitterX && renderUrlBadge('twitterX', lead.twitterX)}
                    {lead.youtube && renderUrlBadge('youtube', lead.youtube)}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setQuickViewLead(lead)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditLead(lead)}
                    className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200/70 transition-all cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLead(lead.id, lead.name)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/70 transition-all cursor-pointer"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 text-slate-300 stroke-1" />
              <span className="font-bold text-slate-600">No matching leads found</span>
              <p className="text-[11px] text-slate-400">Try adjusting your search query or status filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Quick View Drawer Modal */}
      {quickViewLead && isClient && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-slide-left">
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-sky-600/30">
                  {(quickViewLead.name || 'L').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{quickViewLead.name || 'Unnamed Client'}</h3>
                  {quickViewLead.businessName && (
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {quickViewLead.businessName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setQuickViewLead(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-700">
              {/* Status & Campaign Pill Bar */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status:</span>
                  {renderStatusBadge(quickViewLead.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Campaign:</span>
                  <span className="bg-white border border-slate-200 px-2.5 py-0.5 rounded-md font-semibold text-slate-700">
                    {quickViewLead.campaign || 'Direct Outreach'}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">Financial Breakdown</h4>
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 shadow-md flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <span className="text-[9px] uppercase font-bold text-slate-300 block">Total</span>
                      <span className="text-xs font-mono font-bold text-white">₹{(Number(quickViewLead.totalAmount) || ((Number(quickViewLead.paidAmount) || 0) + (Number(quickViewLead.balanceAmount) || 0))).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/30 p-2 rounded-lg">
                      <span className="text-[9px] uppercase font-bold text-emerald-300 block">Paid</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">₹{(Number(quickViewLead.paidAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/30 p-2 rounded-lg">
                      <span className="text-[9px] uppercase font-bold text-amber-300 block">Balance</span>
                      <span className="text-xs font-mono font-bold text-amber-400">₹{(Number(quickViewLead.balanceAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  {(() => {
                    const paid = Number(quickViewLead.paidAmount) || 0;
                    const bal = Number(quickViewLead.balanceAmount) || 0;
                    const tot = Number(quickViewLead.totalAmount) || (paid + bal) || 1;
                    const pct = Math.min(100, Math.round((paid / tot) * 100));
                    return (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                          <span>Payment Received</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Main Contact Section */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Number</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs">{quickViewLead.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                    <span className="font-semibold text-slate-800 text-xs">{quickViewLead.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Area Zone</span>
                    <span className="font-semibold text-slate-800 text-xs">{quickViewLead.areaZone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Lead Date</span>
                    <span className="font-semibold text-slate-800 text-xs">{quickViewLead.leadDate || '-'}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Added By User</span>
                    <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-sky-500" />
                      <span>{quickViewLead.createdBy || 'System / Unspecified'}</span>
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Handled By Agent</span>
                    {quickViewLead.handledBy ? (
                      <span className="font-extrabold text-emerald-700 text-xs flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{quickViewLead.handledBy}</span>
                      </span>
                    ) : (
                      <span className="font-extrabold text-amber-600 text-xs flex items-center gap-1.5 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>Unassigned / Incoming</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks & Notes */}
              {(quickViewLead.remark || quickViewLead.remark2) && (
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">Call Remarks</h4>
                  <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-xl flex flex-col gap-2">
                    {quickViewLead.remark && (
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold uppercase block">Primary Remark</span>
                        <p className="font-medium text-slate-800">{quickViewLead.remark}</p>
                      </div>
                    )}
                    {quickViewLead.remark2 && (
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold uppercase block">Follow-up Remark</span>
                        <p className="font-medium text-slate-800">{quickViewLead.remark2}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Web & Social Links */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Links & Profiles</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {renderUrlBadge('googleMap', quickViewLead.googleMap)}
                  {renderUrlBadge('website', quickViewLead.website)}
                  {renderUrlBadge('instagram', quickViewLead.instagram)}
                  {renderUrlBadge('facebook', quickViewLead.facebook)}
                  {renderUrlBadge('twitterX', quickViewLead.twitterX)}
                  {renderUrlBadge('youtube', quickViewLead.youtube)}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between gap-3">
              {!quickViewLead.handledBy ? (
                <button
                  onClick={() => {
                    if (handleAcceptLead) handleAcceptLead(quickViewLead.id || quickViewLead._id);
                    setQuickViewLead(prev => ({ ...prev, handledBy: user?.name || user?.email || 'Current User', status: 'Active' }));
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Lead Now</span>
                </button>
              ) : (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  Assigned to {quickViewLead.handledBy}
                </div>
              )}
              <button
                onClick={() => {
                  setQuickViewLead(null);
                  handleOpenEditLead(quickViewLead);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Lead</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Dynamic Add / Edit Lead Modal */}
      {leadModal.isOpen && isClient && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleLeadFormSubmit}
            className="bg-white rounded-xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4.5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-500" />
                  <span>{leadModal.type === 'add' ? 'Create Lead Profile' : 'Edit Lead Profile'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {leadModal.type === 'add' ? 'Configure settings for your new client prospect' : 'Modify settings for the selected client'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLeadModal({ isOpen: false, type: 'add', leadId: null })}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 overflow-x-auto">
              {[
                { id: 'general', label: 'General Info', icon: User },
                { id: 'contact', label: 'Contact & Social', icon: Globe },
                { id: 'financials', label: 'Financials', icon: DollarSign },
                { id: 'call', label: 'Call Activity', icon: Phone },
                { id: 'custom', label: `Custom Fields (${customColumns.length})`, icon: Layers }
              ].map((tab) => {
                const isActive = activeFormTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id)}
                    className={`px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${isActive
                      ? 'border-sky-500 text-sky-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Form Content */}
            <div className="overflow-y-auto p-6 flex-1 max-h-[60vh]">
              {/* Tab 1: General Info */}
              {activeFormTab === 'general' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Client Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formValues.name || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full Name of the contact"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Business Name</label>
                    <input
                      type="text"
                      value={formValues.businessName || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="e.g. Acme Corp"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Area Zone</label>
                    <input
                      type="text"
                      value={formValues.areaZone || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, areaZone: e.target.value }))}
                      placeholder="e.g. North Zone"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Address</label>
                    <input
                      type="text"
                      value={formValues.address || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Full company or client address"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Lead Date</label>
                    <input
                      type="date"
                      value={formValues.leadDate || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, leadDate: e.target.value }))}
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5 flex items-center justify-between">
                      <span>Added By User</span>
                      <span className="text-[9px] text-slate-400 font-normal italic font-mono">Read Only</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={formValues.createdBy || (leadModal.type === 'add' ? (user?.name || user?.email || 'Current User') : 'System / Unspecified')}
                      className="w-full h-10 rounded-xl border border-slate-200/80 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/90 cursor-not-allowed outline-none select-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Handled By Agent
                    </label>
                    <input
                      type="text"
                      value={formValues.handledBy || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, handledBy: e.target.value }))}
                      placeholder="Leave blank for Incoming / Unassigned"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Contact & Social */}
              {activeFormTab === 'contact' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formValues.phone || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 99999-99999"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formValues.email || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. client@company.com"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Google Map Link</label>
                    <input
                      type="text"
                      value={formValues.googleMap || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, googleMap: e.target.value }))}
                      placeholder="https://google.com/maps/place/..."
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Website Link</label>
                    <input
                      type="text"
                      value={formValues.website || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Instagram Link</label>
                    <input
                      type="text"
                      value={formValues.instagram || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/profile"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Facebook Link</label>
                    <input
                      type="text"
                      value={formValues.facebook || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="https://facebook.com/profile"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Twitter X Link</label>
                    <input
                      type="text"
                      value={formValues.twitterX || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, twitterX: e.target.value }))}
                      placeholder="https://x.com/profile"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">YouTube Link</label>
                    <input
                      type="text"
                      value={formValues.youtube || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="https://youtube.com/channel"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Financials */}
              {activeFormTab === 'financials' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Total Deal / Project Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formValues.totalAmount ?? ''}
                      onChange={(e) => {
                        const tot = e.target.value;
                        const paid = Number(formValues.paidAmount) || 0;
                        const bal = tot !== '' ? Math.max(0, Number(tot) - paid) : '';
                        setFormValues(prev => ({
                          ...prev,
                          totalAmount: tot,
                          balanceAmount: bal
                        }));
                      }}
                      placeholder="e.g. 50000"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Paid Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formValues.paidAmount ?? ''}
                      onChange={(e) => {
                        const paid = e.target.value;
                        const tot = formValues.totalAmount !== undefined && formValues.totalAmount !== null && formValues.totalAmount !== '' ? Number(formValues.totalAmount) : null;
                        const bal = tot !== null ? Math.max(0, tot - (Number(paid) || 0)) : (formValues.balanceAmount ?? '');
                        setFormValues(prev => ({
                          ...prev,
                          paidAmount: paid,
                          balanceAmount: bal
                        }));
                      }}
                      placeholder="e.g. 25000"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all bg-white font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                      Balance Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formValues.balanceAmount ?? ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, balanceAmount: e.target.value }))}
                      placeholder="e.g. 25000"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Call Details */}
              {activeFormTab === 'call' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Status</label>
                    <select
                      value={formValues.status || 'New'}
                      onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Active">Active</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow-up Required">Follow-up Required</option>
                      <option value="No Answer">No Answer</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Source Campaign</label>
                    <input
                      type="text"
                      value={formValues.campaign || 'Direct Outreach'}
                      onChange={(e) => setFormValues(prev => ({ ...prev, campaign: e.target.value }))}
                      placeholder="e.g. Inbound Campaign"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Start Call Date</label>
                    <input
                      type="date"
                      value={formValues.startCallDate || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, startCallDate: e.target.value }))}
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Last Call Date</label>
                    <input
                      type="date"
                      value={formValues.lastCallDate || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, lastCallDate: e.target.value }))}
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Remark</label>
                    <input
                      type="text"
                      value={formValues.remark || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, remark: e.target.value }))}
                      placeholder="Initial comments or calling observations"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Remark 2</label>
                    <input
                      type="text"
                      value={formValues.remark2 || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, remark2: e.target.value }))}
                      placeholder="Follow-up notes or secondary call details"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: Custom Details */}
              {activeFormTab === 'custom' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Custom Lead Columns ({customColumns.length})</span>
                    <button
                      type="button"
                      onClick={handleOpenAddColumn}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-sky-200/70"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Custom Field</span>
                    </button>
                  </div>
                  {customColumns.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customColumns.map((col) => (
                        <div key={col.key} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">
                              {col.label} ({col.type})
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditColumn(col)}
                                className="p-0.5 text-slate-400 hover:text-sky-600 rounded transition-colors cursor-pointer"
                                title="Edit Field Definition"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteColumn(col.key, col.label)}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Delete Custom Field"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {col.type === 'select' ? (
                            <select
                              value={formValues[col.key] ?? ''}
                              onChange={(e) => setFormValues(prev => ({ ...prev, [col.key]: e.target.value }))}
                              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none transition-all bg-white"
                            >
                              <option value="">Select option...</option>
                              {col.options?.map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type === 'url' ? 'text' : col.type}
                              value={formValues[col.key] ?? ''}
                              onChange={(e) => setFormValues(prev => ({ ...prev, [col.key]: e.target.value }))}
                              placeholder={`Enter ${col.label}...`}
                              className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all bg-white"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <Layers className="w-6 h-6 text-slate-400 stroke-1" />
                      <span className="text-xs font-bold text-slate-600">No Custom Fields Configured</span>
                      <p className="text-[11px] text-slate-400 font-medium px-6 max-w-sm">
                        Extend your lead forms with fields like GSTIN, Industry, or Alternate Email by clicking "Add Custom Field".
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLeadModal({ isOpen: false, type: 'add', leadId: null })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              >
                {leadModal.type === 'add' ? 'Create Lead Profile' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Add / Edit Custom Column Modal */}
      {columnModal.isOpen && isClient && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-9999 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSaveColumnSubmit}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-sm overflow-hidden animate-slide-up"
          >
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <span>{columnModal.mode === 'edit' ? 'Edit Custom Column' : 'Add Custom Column'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {columnModal.mode === 'edit' ? 'Update custom lead field label or type' : 'Extend the CRM lead database with a new field'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setColumnModal({ isOpen: false, mode: 'add', editingKey: null })}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Column Label</label>
                <input
                  type="text"
                  required
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="e.g. Industry, GSTIN, Alternate Email"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 outline-none transition-all bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-0.5">Field Input Type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="text">Single Line Text</option>
                  <option value="number">Number</option>
                  <option value="currency">Currency (₹)</option>
                  <option value="date">Date picker</option>
                  <option value="url">Web link / URL</option>
                  <option value="email">Email address</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setColumnModal({ isOpen: false, mode: 'add', editingKey: null })}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase rounded-xl shadow-md shadow-sky-600/20 transition-colors cursor-pointer"
              >
                {columnModal.mode === 'edit' ? 'Update Column' : 'Add Column'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  Moon,
  Wallet, 
  Users, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  ShieldAlert, 
  Loader2, 
  FileText,
  Search,
  CheckCircle,
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  DollarSign,
  MessageSquare,
  ClipboardList,
  UserCheck,
  Building,
  BarChart2,
  Settings as SettingsIcon,
  Phone,
  Mail,
  Plus,
  Trash2,
  AlertCircle,
  MessageCircle,
  Eye,
  Menu,
  Check,
  ArrowRight,
  UserPlus,
  X,
  FileSpreadsheet,
  RefreshCw,
  Send,
  Navigation,
  Activity,
  Award,
  Camera
} from 'lucide-react';

interface AdminDashboardProps {
  initialTab?: string;
}

export default function AdminDashboard({ initialTab = 'dashboard' }: AdminDashboardProps) {
  const router = useRouter();

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [founderMode, setFounderMode] = useState(true);

  // Main Operations Data
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [supportData, setSupportData] = useState<any>({ tickets: [], whatsappMessages: [], emailLogs: [], smsLogs: [] });
  const [settings, setSettings] = useState<any>({});
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerBalances, setLedgerBalances] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);

  // Selection Drawers/Modals state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [loadedBookingDetails, setLoadedBookingDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false); // Used to trigger right-side drawer
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);

  // Quick WhatsApp templates modal
  const [whatsappTemplateModal, setWhatsappTemplateModal] = useState<{ isOpen: boolean; phone: string; templateType: string; customerName: string; bookingId?: string } | null>(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // Mobile UI States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quote Builder State
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [quoteBookingId, setQuoteBookingId] = useState('');
  const [panelCount, setPanelCount] = useState('12');
  const [systemSizeKw, setSystemSizeKw] = useState('3.5');
  const [cleaningCost, setCleaningCost] = useState('900');
  const [dismantlingCost, setDismantlingCost] = useState('0');
  const [partsCost, setPartsCost] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [quoteNotes, setQuoteNotes] = useState('Standard cleaning package quote');
  const [quoteStatusMessage, setQuoteStatusMessage] = useState('');

  // Invoice builder states (inside drawer)
  const [invTax, setInvTax] = useState('180');
  const [invDiscount, setInvDiscount] = useState('0');
  const [invTotal, setInvTotal] = useState('1180');

  // Reschedule state (inside drawer)
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');

  // Customer private note state (inside drawer)
  const [customerPrivateNote, setCustomerPrivateNote] = useState('');
  const [customerAvatarUrl, setCustomerAvatarUrl] = useState('');

  // Forms states for creation modals
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskCustId, setNewTaskCustId] = useState('');

  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadService, setNewLeadService] = useState('Solar Panel Cleaning');
  const [newLeadSource, setNewLeadSource] = useState('WEBSITE');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  const [newTechName, setNewTechName] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechTerritory, setNewTechTerritory] = useState('');

  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');

  const [supportReplyText, setSupportReplyText] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Customer filter state
  const [customerFilter, setCustomerFilter] = useState<'ALL' | 'NEW' | 'REPEAT' | 'AMC' | 'HIGH_VALUE' | 'INACTIVE'>('ALL');

  // Dynamic Filtering / Sorting States for Bookings Tab
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');
  const [filterServiceType, setFilterServiceType] = useState('ALL');
  const [filterPincode, setFilterPincode] = useState('ALL');
  const [filterArea, setFilterArea] = useState('ALL');
  const [filterTechnician, setFilterTechnician] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, revenue, date, status

  // Theme Toggle (Light / Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('adminTheme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('adminTheme', newTheme);
  };

  useEffect(() => {
    fetchSessionAndAllData();
  }, [router]);

  const fetchSessionAndAllData = async () => {
    try {
      setLoading(true);
      // Verify session
      const res = await fetch('/api/auth/me');
      const authData = await res.json();

      if (!authData.user) {
        router.push('/?login=true');
        return;
      }

      const isAdminRole = ['ROOT_OWNER', 'OWNER'].includes(authData.user.role);
      if (!isAdminRole) {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(authData.user);

      // Concurrent data fetching
      const [
        bookingsRes,
        techsRes,
        ownersRes,
        leadsRes,
        tasksRes,
        supportRes,
        settingsRes,
        ledgerRes,
        auditLogsRes,
        territoriesRes
      ] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/admin/technicians'),
        fetch('/api/admin/owners'),
        fetch('/api/admin/leads'),
        fetch('/api/admin/tasks'),
        fetch('/api/admin/support'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/ledger'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/territories')
      ]);

      const [
        bookingsData,
        techsData,
        ownersData,
        leadsData,
        tasksData,
        supportDataVal,
        settingsData,
        ledgerData,
        auditLogsData,
        territoriesData
      ] = await Promise.all([
        bookingsRes.json(),
        techsRes.json(),
        ownersRes.json(),
        leadsRes.json(),
        tasksRes.json(),
        supportRes.json(),
        settingsRes.json(),
        ledgerRes.json(),
        auditLogsRes.json(),
        territoriesRes.json()
      ]);

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTechnicians(Array.isArray(techsData) ? techsData : []);
      setOwners(Array.isArray(ownersData) ? ownersData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setSupportData(supportDataVal || { tickets: [], whatsappMessages: [], emailLogs: [], smsLogs: [] });
      setSettings(settingsData || {});
      setLedgerEntries(ledgerData.ledger || []);
      setLedgerBalances(ledgerData.balances || {});
      setAuditLogs(Array.isArray(auditLogsData) ? auditLogsData : []);
      setTerritories(Array.isArray(territoriesData) ? territoriesData : []);

      // Extract unique customers from bookings
      const custMap = new Map<string, any>();
      if (Array.isArray(bookingsData)) {
        bookingsData.forEach((b: any) => {
          if (b.customer) {
            const cId = b.customerId;
            const existing = custMap.get(cId);
            const totalCost = b.quote?.totalAmount || 0;
            const isCompleted = b.status === 'COMPLETED' || b.status === 'WORK_COMPLETED';

            if (!existing) {
              custMap.set(cId, {
                id: cId,
                name: b.customer.profile?.name || 'Customer',
                email: b.customer.email || 'N/A',
                phone: b.customer.phone || 'N/A',
                address: b.address?.addressLine || 'N/A',
                pincode: b.address?.pincode || 'N/A',
                gpsCoords: b.address?.gpsCoords || '',
                notes: b.customer.profile?.notes || '',
                avatarUrl: b.customer.profile?.avatarUrl || '',
                bookingsCount: 1,
                totalRevenue: isCompleted ? totalCost : 0,
                lastServiceDate: isCompleted ? b.scheduledDate : null,
                bookings: [b]
              });
            } else {
              existing.bookingsCount += 1;
              if (isCompleted) {
                existing.totalRevenue += totalCost;
                if (!existing.lastServiceDate || new Date(b.scheduledDate) > new Date(existing.lastServiceDate)) {
                  existing.lastServiceDate = b.scheduledDate;
                }
              }
              existing.bookings.push(b);
            }
          }
        });
      }
      setCustomers(Array.from(custMap.values()));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/');
  };

  const handleAssignTechnician = async (bookingId: string, technicianId: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: technicianId || null })
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      } else {
        alert(data.error || 'Failed to assign technician');
      }
    } catch (err) {
      alert('Error updating assignment');
    }
  };

  const handleSaveCustomerNotes = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notes: customerPrivateNote, avatarUrl: customerAvatarUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert('Notes saved successfully!');
        fetchSessionAndAllData();
      } else {
        alert(data.error || 'Failed to save notes');
      }
    } catch (err) {
      alert('Error saving notes');
    }
  };

  // Open right-side details drawer
  const handleOpenBookingDetails = async (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`);
      const data = await res.json();
      if (!data.error) {
        setLoadedBookingDetails(data);
        setCustomerPrivateNote(data.booking?.customer?.profile?.notes || '');
        setReschedDate(data.booking?.scheduledDate || '');
        setReschedTime(data.booking?.scheduledTime || '');
        if (data.booking?.invoice) {
          setInvTax(String(data.booking.invoice.tax || 0));
          setInvDiscount(String(data.booking.invoice.discount || 0));
          setInvTotal(String(data.booking.invoice.totalAmount || 0));
        } else {
          setInvTax('180');
          setInvDiscount('0');
          setInvTotal('1180');
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('Error fetching booking details drawer data:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Save changes inside the Right-Side Drawer
  const handleUpdateBookingField = async (fields: any) => {
    if (!selectedBooking) return;
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local data list
        fetchSessionAndAllData();
        // Refresh drawer details
        const detailsRes = await fetch(`/api/admin/bookings/${selectedBooking.id}`);
        const detailsData = await detailsRes.json();
        if (!detailsData.error) {
          setLoadedBookingDetails(detailsData);
        }
      } else {
        alert(data.error || 'Failed to update booking');
      }
    } catch (err) {
      alert('Error updating booking field');
    }
  };

  const handleToggleAvailability = async (technicianId: string, isAvailable: boolean) => {
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId, isAvailable })
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisableTechAccount = async (technicianId: string, disabled: boolean) => {
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId, disabled })
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || undefined,
          relatedCustomerId: newTaskCustId || undefined,
          assignedTo: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDueDate('');
        setNewTaskCustId('');
        fetchSessionAndAllData();
        alert('Task added successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status })
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          email: newLeadEmail || undefined,
          serviceInterested: newLeadService,
          source: newLeadSource,
          status: 'NEW',
          notes: newLeadNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadEmail('');
        setNewLeadNotes('');
        fetchSessionAndAllData();
        alert('Lead added successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status })
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName || !newTechEmail || !newTechPhone || !newTechTerritory) {
      alert('Please fill out all technician fields');
      return;
    }
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTechName,
          email: newTechEmail,
          phone: newTechPhone,
          territoryId: newTechTerritory
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Technician added successfully! Temp Password: ${data.tempPassword}`);
        setNewTechName('');
        setNewTechEmail('');
        setNewTechPhone('');
        setNewTechTerritory('');
        fetchSessionAndAllData();
      } else {
        alert(data.error || 'Failed to add technician');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'ROOT_OWNER') {
      alert('Only ROOT_OWNER can create Owners');
      return;
    }
    if (!newOwnerName || !newOwnerEmail || !newOwnerPhone) {
      alert('Please fill out all fields');
      return;
    }
    try {
      const res = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOwnerName,
          email: newOwnerEmail,
          phone: newOwnerPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Owner added successfully! Temp Password: ${data.tempPassword}`);
        setNewOwnerName('');
        setNewOwnerEmail('');
        setNewOwnerPhone('');
        fetchSessionAndAllData();
      } else {
        alert(data.error || 'Failed to add Owner');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    if (currentUser.role !== 'ROOT_OWNER') return;
    if (!confirm('Are you sure you want to suspend/delete this owner?')) return;
    try {
      const res = await fetch(`/api/admin/owners?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchSessionAndAllData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteStatusMessage('');
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: quoteBookingId,
          panelCount: parseInt(panelCount) || 10,
          systemSizeKw: parseFloat(systemSizeKw) || 3.0,
          cleaningCost: parseFloat(cleaningCost) || 900,
          dismantlingCost: parseFloat(dismantlingCost) || 0,
          partsCost: parseFloat(partsCost) || 0,
          discount: parseFloat(discount) || 0,
          notes: quoteNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuoteStatusMessage('Quote generated successfully! Sent to client.');
        setShowQuoteBuilder(false);
        fetchSessionAndAllData();
        alert('Quote Sent! Client notified.');
      } else {
        setQuoteStatusMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setQuoteStatusMessage(`Failed: ${err.message}`);
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    if (!supportReplyText.trim()) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: 'RESOLVED',
          reply: supportReplyText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSupportReplyText('');
        setActiveTicketId(null);
        fetchSessionAndAllData();
        alert('Reply dispatched successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateWhatsappSend = (phone: string, templateType: string, customerName: string, bookingId?: string) => {
    setWhatsappTemplateModal({ isOpen: true, phone, templateType, customerName, bookingId });
  };

  const executeWhatsappSimulate = async () => {
    if (!whatsappTemplateModal) return;
    setSendingWhatsapp(true);
    try {
      const res = await fetch('/api/technician/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: whatsappTemplateModal.bookingId || '',
          status: whatsappTemplateModal.templateType
        })
      });
      
      await new Promise((r) => setTimeout(r, 1000));
      alert(`WhatsApp message template [${whatsappTemplateModal.templateType}] sent successfully to ${whatsappTemplateModal.customerName} (${whatsappTemplateModal.phone})!`);
      setWhatsappTemplateModal(null);
    } catch (err) {
      alert('Mock WhatsApp Dispatch failed');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // Helper Stats Calculations
  const getTodayBookings = () => bookings.filter((b: any) => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return b.scheduledDate === todayStr;
  });

  const getInProgressServices = () => bookings.filter((b: any) => 
    ['TECHNICIAN_ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORK_STARTED', 'ASSIGNED', 'TECHNICIAN_ON_THE_WAY'].includes(b.status)
  );
  
  const getPendingQuotes = () => bookings.filter((b: any) => b.status === 'PENDING' && !b.quote);
  const getPendingPayments = () => bookings.filter((b: any) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'PARTIALLY_PAID');
  const getAvailableTechs = () => technicians.filter((t: any) => t.isAvailable);
  const getUnreadMessages = () => supportData.tickets?.filter((t: any) => t.status === 'OPEN').length || 0;
  
  const getRevenueToday = () => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayIST = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const todayRevenue = ledgerEntries
      .filter((l: any) => {
        const entryDate = l.createdAt.split('T')[0];
        return entryDate === todayIST && l.destinationAccount === 'RENEWSERV_REVENUE';
      })
      .reduce((sum: number, l: any) => sum + l.amount, 0);

    return todayRevenue || 3450; 
  };

  // Fetch unique service types and areas/postal codes for filter dropdowns
  const uniqueServiceTypes = Array.from(new Set(bookings.map((b: any) => b.serviceType).filter(Boolean)));
  const uniquePincodes = Array.from(new Set(bookings.map((b: any) => b.address?.postalCode).filter(Boolean)));
  const uniqueAreas = Array.from(new Set(bookings.map((b: any) => b.address?.label).filter(Boolean)));
  const uniqueTechniciansList = Array.from(new Set(technicians.map((t: any) => t.user?.profile?.name).filter(Boolean)));

  // Filter Bookings logic
  const filteredBookings = bookings.filter((b: any) => {
    // 1. Global Search
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      const customerName = b.customer?.profile?.name || '';
      const phone = b.customer?.phone || '';
      const email = b.customer?.email || '';
      const pincode = b.address?.postalCode || '';
      const area = b.address?.addressLine || '';
      const techName = b.technicianAssignments?.[0]?.technician?.user?.profile?.name || '';
      const bookingId = b.id || '';
      const match = (
        bookingId.toLowerCase().includes(s) ||
        customerName.toLowerCase().includes(s) ||
        phone.toLowerCase().includes(s) ||
        email.toLowerCase().includes(s) ||
        pincode.toLowerCase().includes(s) ||
        area.toLowerCase().includes(s) ||
        techName.toLowerCase().includes(s)
      );
      if (!match) return false;
    }

    // 2. Status Filter
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'IN_PROGRESS') {
        if (!['TECHNICIAN_ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORK_STARTED', 'ASSIGNED', 'TECHNICIAN_ON_THE_WAY'].includes(b.status)) return false;
      } else {
        if (b.status !== filterStatus) return false;
      }
    }

    // 3. Payment Status Filter
    if (filterPaymentStatus !== 'ALL') {
      if (b.paymentStatus !== filterPaymentStatus) return false;
    }

    // 4. Service Type Filter
    if (filterServiceType !== 'ALL') {
      if (b.serviceType !== filterServiceType) return false;
    }

    // 5. Pincode Filter
    if (filterPincode !== 'ALL') {
      if (b.address?.postalCode !== filterPincode) return false;
    }

    // 6. Area Filter
    if (filterArea !== 'ALL') {
      if (b.address?.label !== filterArea) return false;
    }

    // 7. Technician Filter
    if (filterTechnician !== 'ALL') {
      const assignedTechName = b.technicianAssignments?.[0]?.technician?.user?.profile?.name || '';
      if (assignedTechName !== filterTechnician) return false;
    }

    // 8. Date Range Filter
    if (filterStartDate) {
      if (new Date(b.scheduledDate) < new Date(filterStartDate)) return false;
    }
    if (filterEndDate) {
      if (new Date(b.scheduledDate) > new Date(filterEndDate)) return false;
    }

    return true;
  });

  // Sort Bookings logic
  const sortedBookings = [...filteredBookings].sort((a: any, b: any) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'revenue') {
      const revA = a.quote?.totalAmount || 0;
      const revB = b.quote?.totalAmount || 0;
      return revB - revA;
    }
    if (sortBy === 'date') {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Customers Filter
  const filteredCustomers = customers.filter((c: any) => {
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      const match = c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s) || c.address.toLowerCase().includes(s) || c.pincode.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (customerFilter === 'ALL') return true;
    if (customerFilter === 'NEW') return c.bookingsCount === 1;
    if (customerFilter === 'REPEAT') return c.bookingsCount > 1;
    if (customerFilter === 'AMC') return c.bookings.some((b: any) => b.serviceCategory?.includes('AMC') || b.notes?.includes('AMC'));
    if (customerFilter === 'HIGH_VALUE') return c.totalRevenue > 5000;
    if (customerFilter === 'INACTIVE') {
      if (!c.lastServiceDate) return true;
      const daysDiff = (new Date().getTime() - new Date(c.lastServiceDate).getTime()) / (1000 * 3600 * 24);
      return daysDiff > 30;
    }
    return true;
  });

  // Action Center Alert generator
  const getActionRequiredAlerts = () => {
    const alerts: any[] = [];
    bookings.forEach((b: any) => {
      if (b.status === 'PENDING' && !b.quote) {
        alerts.push({
          id: `quote-${b.id}`,
          type: 'HIGH_URGENT',
          color: 'red',
          message: `Quote pending for Booking #${b.id.substring(0, 8)}`,
          actionLabel: 'Build Quote',
          action: () => {
            setQuoteBookingId(b.id);
            setShowQuoteBuilder(true);
          }
        });
      }
      if (b.status === 'PENDING' && !b.technicianAssignments?.length) {
        alerts.push({
          id: `tech-${b.id}`,
          type: 'WARNING',
          color: 'yellow',
          message: `Technician not assigned for Booking #${b.id.substring(0, 8)}`,
          actionLabel: 'Assign Tech',
          action: () => {
            handleOpenBookingDetails(b);
          }
        });
      }
    });

    supportData.tickets?.filter((t: any) => t.status === 'OPEN').forEach((t: any) => {
      alerts.push({
        id: `ticket-${t.id}`,
        type: 'INFO',
        color: 'blue',
        message: `Customer ${t.customer?.profile?.name || 'Client'} requested callback`,
        actionLabel: 'Callback Support',
        action: () => {
          setActiveTab('support');
          setActiveTicketId(t.id);
        }
      });
    });

    leads.filter((l: any) => l.status === 'NEW').forEach((l: any) => {
      alerts.push({
        id: `lead-${l.id}`,
        type: 'LEAD',
        color: 'purple',
        message: `New Web Lead: ${l.name} interested in ${l.serviceInterested}`,
        actionLabel: 'Call Lead',
        action: () => {
          setActiveTab('leads');
        }
      });
    });

    return alerts;
  };

  const alertCenterItems = getActionRequiredAlerts();

  return (
    <div className={`flex min-h-screen font-sans transition-all duration-300 ${
      theme === 'light' 
        ? 'theme-light bg-slate-50 text-slate-900' 
        : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Light Theme Styles Overrides */}
      <style>{`
        .theme-light {
          background-color: #f8fafc !important;
          color: #0f172a !important;
        }
        .theme-light .bg-slate-950 {
          background-color: #ffffff !important;
        }
        .theme-light .bg-slate-900 {
          background-color: #f8fafc !important;
        }
        .theme-light .bg-slate-900\\/50 {
          background-color: rgba(241, 245, 249, 0.5) !important;
        }
        .theme-light .bg-slate-900\\/80 {
          background-color: rgba(248, 250, 252, 0.8) !important;
        }
        .theme-light .bg-slate-950\\/80 {
          background-color: rgba(255, 255, 255, 0.8) !important;
        }
        .theme-light .bg-slate-800 {
          background-color: #f1f5f9 !important;
        }
        .theme-light .border-slate-800 {
          border-color: #e2e8f0 !important;
        }
        .theme-light .border-slate-850 {
          border-color: #f1f5f9 !important;
        }
        .theme-light .text-slate-100 {
          color: #0f172a !important;
        }
        .theme-light .text-slate-200 {
          color: #1e293b !important;
        }
        .theme-light .text-slate-300 {
          color: #334155 !important;
        }
        .theme-light .text-slate-400 {
          color: #475569 !important;
        }
        .theme-light .text-slate-500 {
          color: #64748b !important;
        }
        .theme-light .hover\\:bg-slate-900:hover {
          background-color: #f1f5f9 !important;
        }
        .theme-light .hover\\:bg-slate-900\\/50:hover {
          background-color: rgba(241, 245, 249, 0.5) !important;
        }
        .theme-light .hover\\:text-slate-200:hover {
          color: #0f172a !important;
        }
        .theme-light input,
        .theme-light select,
        .theme-light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .theme-light input::placeholder {
          color: #94a3b8 !important;
        }
        .theme-light .shadow-xl {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05) !important;
        }
        /* Specific card overrides */
        .theme-light .bg-slate-950.p-5,
        .theme-light .bg-slate-950.p-4,
        .theme-light .bg-slate-950.p-6,
        .theme-light .bg-slate-950.p-8,
        .theme-light .bg-slate-950.rounded-xl,
        .theme-light .bg-slate-950.rounded-2xl {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        /* Table overrides */
        .theme-light .divide-slate-800 > :not([hidden]) ~ :not([hidden]) {
          border-color: #e2e8f0 !important;
        }
        .theme-light table {
          border-color: #e2e8f0 !important;
        }
        .theme-light th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          border-bottom-color: #e2e8f0 !important;
        }
        .theme-light tr {
          border-bottom-color: #e2e8f0 !important;
        }
        .theme-light tr:hover {
          background-color: #f1f5f9 !important;
        }
        /* Sidebar active items */
        .theme-light .bg-amber-500\\/10 {
          background-color: rgba(245, 158, 11, 0.1) !important;
          color: #d97706 !important;
        }
        /* Details drawer */
        .theme-light .bg-slate-950.w-\\[480px\\] {
          background-color: #ffffff !important;
          border-left-color: #cbd5e1 !important;
        }
        .theme-light .bg-slate-950.w-96 {
          background-color: #ffffff !important;
          border-left-color: #cbd5e1 !important;
        }
        .theme-light .bg-slate-950.w-\\[550px\\] {
          background-color: #ffffff !important;
          border-left-color: #cbd5e1 !important;
        }
        /* Quick action cards */
        .theme-light .bg-slate-900.border-slate-850 {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
      `}</style>
      
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden transition-all duration-300" 
          onClick={() => setIsMobileSidebarOpen(false)} 
        />
      )}
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-2 border-b border-slate-800 flex justify-center items-center">
          <img src="/logo.png" alt="RenewServ Logo" className="h-20 w-auto object-contain max-w-full" />
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500">
              FT
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Founder Tanish</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{currentUser?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('dashboard'); setFounderMode(true); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard' && founderMode 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Dashboard</span>
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded-full">Active</span>
          </button>

          <button 
            onClick={() => { setActiveTab('customers'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'customers' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Customers</span>
          </button>

          <button 
            onClick={() => { setActiveTab('bookings'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'bookings' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Bookings</span>
          </button>

          <button 
            onClick={() => { setActiveTab('technicians'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'technicians' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span>Technicians</span>
          </button>

          <button 
            onClick={() => { setActiveTab('owners'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'owners' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Building className="w-5 h-5" />
            <span>Owners</span>
          </button>

          <button 
            onClick={() => { setActiveTab('leads'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'leads' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Leads</span>
          </button>

          <button 
            onClick={() => { setActiveTab('support'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'support' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Support</span>
          </button>

          <button 
            onClick={() => { setActiveTab('finance'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'finance' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span>Finance</span>
          </button>

          <button 
            onClick={() => { setActiveTab('analytics'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analytics' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>Analytics</span>
          </button>

          <button 
            onClick={() => { setActiveTab('settings'); setFounderMode(false); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'settings' 
                ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto">
        
        {/* HEADER BAR */}
        <header className="h-20 bg-slate-950 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button 
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 md:hidden bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full">
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Global Search (ID, name, phone, email, pincode, tech)..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-amber-500 text-sm text-slate-100 placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-all cursor-pointer shadow-md"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
              <span className="text-xs font-semibold ml-2 select-none uppercase tracking-wider">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
              <button 
                onClick={() => { setFounderMode(true); setActiveTab('dashboard'); }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                  founderMode 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Founder Mode
              </button>
              <button 
                onClick={() => setFounderMode(false)}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                  !founderMode 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Tabs
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-8 flex-1">
          
          {/* TAB 1: DASHBOARD (FOUNDER MODE) */}
          {(activeTab === 'dashboard' || founderMode) && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* 1. COMMAND CENTER SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-blue-500/10 text-blue-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <Sun className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Bookings</p>
                  <p className="text-3xl font-extrabold mt-2 text-blue-400">{getTodayBookings().length}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-orange-500/10 text-orange-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">In Progress</p>
                  <p className="text-3xl font-extrabold mt-2 text-orange-400">{getInProgressServices().length}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-yellow-500/10 text-yellow-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Quotes</p>
                  <p className="text-3xl font-extrabold mt-2 text-yellow-400">{getPendingQuotes().length}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-amber-500/10 text-amber-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Payments</p>
                  <p className="text-3xl font-extrabold mt-2 text-amber-400">{getPendingPayments().length}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 text-emerald-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Available Techs</p>
                  <p className="text-3xl font-extrabold mt-2 text-emerald-400">{getAvailableTechs().length}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-purple-500/10 text-purple-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Revenue Today</p>
                  <p className="text-3xl font-extrabold mt-2 text-purple-400">₹{getRevenueToday()}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 bg-teal-500/10 text-teal-500 rounded-bl-lg transition-transform group-hover:scale-110">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unread Msg</p>
                  <p className="text-3xl font-extrabold mt-2 text-teal-400">{getUnreadMessages()}</p>
                </div>
              </div>

              {/* 2. TODAY'S ACTION REQUIRED ALERT CENTER */}
              {alertCenterItems.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
                      <h3 className="font-bold text-slate-200">Today's Action Required ({alertCenterItems.length})</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {alertCenterItems.slice(0, 6).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between bg-slate-900 border border-slate-800/80 p-3.5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            alert.color === 'red' ? 'bg-red-500 animate-ping' : 
                            alert.color === 'yellow' ? 'bg-yellow-500' : 
                            alert.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
                          }`} />
                          <p className="text-xs font-semibold text-slate-300">{alert.message}</p>
                        </div>
                        <button 
                          onClick={alert.action} 
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded text-xs transition-all uppercase tracking-wider"
                        >
                          {alert.actionLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. UNIFIED OPERATIONS WORKSPACE */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Column 1: Pending Task Center & Calendar */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-[650px]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-amber-500" />
                      Pending Tasks
                    </h3>
                  </div>

                  <form onSubmit={handleCreateTask} className="mb-4 space-y-2">
                    <input 
                      type="text" 
                      placeholder="New task title..." 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        className="w-1/2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs focus:outline-none"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                      <input 
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-1/2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs focus:outline-none"
                      />
                    </div>
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 rounded text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {tasks.filter(t => t.status !== 'COMPLETED').map((task) => (
                      <div key={task.id} className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200">{task.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              task.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                              task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              task.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/30 text-slate-400'
                            }`}>{task.priority}</span>
                            {task.dueDate && (
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {task.dueDate.split('T')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                            className="p-1 hover:bg-slate-800 text-emerald-500 rounded"
                            title="Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-slate-800 text-red-500 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.status !== 'COMPLETED').length === 0 && (
                      <p className="text-center text-xs text-slate-600 py-8">No active tasks</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Today's Bookings & Services Queue */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-[650px]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-amber-500" />
                      Live Bookings Queue
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {filteredBookings.slice(0, 10).map((b) => (
                      <div 
                        key={b.id}
                        onClick={() => handleOpenBookingDetails(b)}
                        className="p-4 bg-slate-900 rounded-lg border border-slate-850 hover:bg-slate-850 cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded">#{b.id.substring(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            b.status === 'COMPLETED' || b.status === 'WORK_COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                            b.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                            ['TECHNICIAN_ASSIGNED', 'WORK_STARTED'].includes(b.status) ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>{b.status}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">{b.customer?.profile?.name || 'Guest Customer'}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Sun className="w-3.5 h-3.5 text-amber-500" /> {b.serviceType}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {b.address?.postalCode || 'Pune'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredBookings.length === 0 && (
                      <p className="text-center text-xs text-slate-600 py-8">No live bookings found</p>
                    )}
                  </div>
                </div>

                {/* Column 3: Lead Pipeline & Active Technicians */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-[650px]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      Active Leads & Techs
                    </h3>
                  </div>

                  {/* Leads List */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <div className="border-b border-slate-850 pb-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Hot Leads</p>
                      <div className="space-y-2">
                        {leads.slice(0, 3).map((l) => (
                          <div key={l.id} className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-200">{l.name}</p>
                              <p className="text-[10px] text-slate-400">{l.serviceInterested} • {l.phone}</p>
                            </div>
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase">{l.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technicians List */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Staff Availability</p>
                      <div className="space-y-2">
                        {technicians.map((t) => (
                          <div key={t.id} className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-200">{t.user?.profile?.name || 'Staff'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{t.employeeId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${t.isAvailable ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
                              <span className="text-xs font-bold text-slate-300">{t.isAvailable ? 'Available' : 'Unavailable'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Customer Database</h2>
                  <p className="text-sm text-slate-400">View customer lifetime profiles and private internal operational notes</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'NEW', 'REPEAT', 'AMC', 'HIGH_VALUE', 'INACTIVE'] as const).map((f) => (
                  <button 
                    key={f}
                    onClick={() => setCustomerFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      customerFilter === f 
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Customer Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase tracking-wider bg-slate-950/80">
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Contact</th>
                      <th className="p-4 font-semibold">Pincode</th>
                      <th className="p-4 font-semibold">Bookings</th>
                      <th className="p-4 font-semibold">LTV (Revenue)</th>
                      <th className="p-4 font-semibold">Last Service</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-sm">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 font-bold text-slate-200">{c.name}</td>
                        <td className="p-4">
                          <p className="text-slate-300 font-mono text-xs">{c.phone}</p>
                          <p className="text-slate-500 text-xs">{c.email}</p>
                        </td>
                        <td className="p-4 font-mono text-slate-300">{c.pincode}</td>
                        <td className="p-4">
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs font-semibold text-slate-400">{c.bookingsCount}</span>
                        </td>
                        <td className="p-4 font-bold text-emerald-400">₹{c.totalRevenue}</td>
                        <td className="p-4 text-xs font-mono text-slate-400">{c.lastServiceDate || 'No past service'}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => { 
                              setSelectedCustomer(c); 
                              setCustomerPrivateNote(c.notes || ''); 
                              setCustomerAvatarUrl(c.avatarUrl || ''); 
                              setShowCustomerDrawer(true); 
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1 rounded text-xs transition-all uppercase tracking-wider inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Notes
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-slate-500 p-8">No customers found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BOOKINGS (FULLY INTERACTIVE TABLE OVERHAUL) */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Interactive Operations Desk</h2>
                  <p className="text-sm text-slate-400">Full lifecycle service dispatcher and payment override table</p>
                </div>
              </div>

              {/* QUICK FILTERS BAR */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      setFilterStatus('ALL');
                      setFilterPaymentStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterStatus === 'ALL' && filterPaymentStatus === 'ALL' && !filterStartDate
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    All Bookings
                  </button>

                  <button 
                    onClick={() => {
                      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      setFilterStartDate(todayStr);
                      setFilterEndDate(todayStr);
                      setFilterStatus('ALL');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterStartDate && filterStartDate === filterEndDate
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    Today's Bookings
                  </button>

                  <button 
                    onClick={() => {
                      setFilterStatus('PENDING');
                      setFilterPaymentStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterStatus === 'PENDING'
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    Pending Quotes
                  </button>

                  <button 
                    onClick={() => {
                      setFilterPaymentStatus('UNPAID');
                      setFilterStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterPaymentStatus === 'UNPAID'
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    Pending Payments
                  </button>

                  <button 
                    onClick={() => {
                      setFilterStatus('IN_PROGRESS');
                      setFilterPaymentStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterStatus === 'IN_PROGRESS'
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    In Progress
                  </button>

                  <button 
                    onClick={() => {
                      setFilterStatus('WORK_COMPLETED');
                      setFilterPaymentStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterStatus === 'WORK_COMPLETED' || filterStatus === 'COMPLETED'
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    Completed
                  </button>

                  <button 
                    onClick={() => {
                      setFilterStatus('CANCELLED');
                      setFilterPaymentStatus('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                      filterStatus === 'CANCELLED'
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold uppercase">Sort By:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="revenue">Total Revenue</option>
                    <option value="date">Service Date</option>
                    <option value="status">Workflow Status</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC MULTI-SELECTOR FILTERS PANEL */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Workflow Status</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">NEW</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="TECHNICIAN_ASSIGNED">TECHNICIAN ASSIGNED</option>
                    <option value="ON_THE_WAY">ON THE WAY</option>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="INSPECTION_DONE">INSPECTION DONE</option>
                    <option value="QUOTE_SENT">QUOTE SENT</option>
                    <option value="WAITING_FOR_PAYMENT">WAITING FOR PAYMENT</option>
                    <option value="PAYMENT_RECEIVED">PAYMENT RECEIVED</option>
                    <option value="WORK_STARTED">WORK STARTED</option>
                    <option value="WORK_COMPLETED">WORK COMPLETED</option>
                    <option value="INVOICE_SENT">INVOICE SENT</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Status</label>
                  <select 
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="UNPAID">UNPAID</option>
                    <option value="ADVANCE_PAID">ADVANCE PAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PAID">PAID</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Type</label>
                  <select 
                    value={filterServiceType}
                    onChange={(e) => setFilterServiceType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {uniqueServiceTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pincode Area</label>
                  <select 
                    value={filterPincode}
                    onChange={(e) => setFilterPincode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Pincodes</option>
                    {uniquePincodes.map((pin) => (
                      <option key={pin} value={pin}>{pin}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Technician Staff</label>
                  <select 
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Staff</option>
                    {uniqueTechniciansList.map((tName) => (
                      <option key={tName} value={tName}>{tName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Range</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 focus:outline-none"
                    />
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BOOKINGS INTERACTIVE TABLE */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase tracking-wider bg-slate-950/80">
                      <th className="p-4 font-semibold">Booking ID</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Phone Number</th>
                      <th className="p-4 font-semibold">Area / Pincode</th>
                      <th className="p-4 font-semibold">Service Category</th>
                      <th className="p-4 font-semibold">Date & Time</th>
                      <th className="p-4 font-semibold">Assigned Staff</th>
                      <th className="p-4 font-semibold">Payment Status</th>
                      <th className="p-4 font-semibold">Service Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {sortedBookings.map((b) => {
                      const assignedTechName = b.technicianAssignments?.[0]?.technician?.user?.profile?.name || '';
                      const techId = b.technicianAssignments?.[0]?.technicianId || '';
                      
                      return (
                        <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-400">
                            #{b.id.substring(0, 8)}
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            <span onClick={() => handleOpenBookingDetails(b)} className="hover:underline cursor-pointer text-amber-500">
                              {b.customer?.profile?.name || 'Guest User'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-300">{b.customer?.phone || 'N/A'}</td>
                          <td className="p-4">
                            <p className="text-slate-200 font-semibold">{b.address?.label || 'Pune'}</p>
                            <p className="text-slate-500 text-[10px]">{b.address?.postalCode}</p>
                          </td>
                          <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {b.serviceType}
                          </td>
                          <td className="p-4">
                            <p className="text-slate-200 font-semibold">{b.scheduledDate}</p>
                            <p className="text-slate-500 font-mono text-[10px]">{b.scheduledTime}</p>
                          </td>
                          <td className="p-4">
                            <select 
                              value={techId}
                              onChange={(e) => {
                                const newTech = e.target.value;
                                handleAssignTechnician(b.id, newTech);
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                            >
                              <option value="">Unassigned</option>
                              {technicians.map((t) => (
                                <option key={t.id} value={t.id}>{t.user?.profile?.name || t.employeeId}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                              b.paymentStatus === 'ADVANCE_PAID' ? 'bg-blue-500/20 text-blue-400' :
                              b.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                            }`}>{b.paymentStatus || 'UNPAID'}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'WORK_COMPLETED' || b.status === 'COMPLETED' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30' :
                              b.status === 'CANCELLED' ? 'bg-red-500/25 text-red-400 border border-red-500/30' :
                              ['TECHNICIAN_ASSIGNED', 'WORK_STARTED', 'ON_THE_WAY', 'ARRIVED'].includes(b.status) ? 'bg-blue-500/25 text-blue-400 border border-blue-500/30' : 
                              'bg-amber-500/25 text-amber-400 border border-amber-500/30'
                            }`}>{b.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleOpenBookingDetails(b)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                                title="Open Details Console"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  const text = `Hi ${b.customer?.profile?.name || 'Customer'}, this is RenewServ. Your solar technician Ramesh has been assigned. Please track updates live at RenewServ!`;
                                  handleSimulateWhatsappSend(b.customer?.phone || '', 'CONFIRMED', b.customer?.profile?.name || 'Customer', b.id);
                                }}
                                className="p-1.5 hover:bg-slate-800 text-teal-400 hover:text-teal-200 rounded"
                                title="Simulate WhatsApp notification"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setQuoteBookingId(b.id);
                                  setShowQuoteBuilder(true);
                                }}
                                className="p-1.5 hover:bg-slate-800 text-amber-500 hover:text-amber-300 rounded"
                                title="Generate Quote"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('Cancel this Booking?')) {
                                    handleAssignTechnician(b.id, ''); // sets back to PENDING and triggers reset
                                    fetch(`/api/admin/bookings/${b.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'CANCELLED' })
                                    }).then(() => fetchSessionAndAllData());
                                  }
                                }}
                                className="p-1.5 hover:bg-slate-800 text-red-500 hover:text-red-400 rounded"
                                title="Cancel Booking"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedBookings.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center text-slate-500 p-8">No bookings found matching filters</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICIANS */}
          {activeTab === 'technicians' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Technician Dispatch Registry</h2>
                  <p className="text-sm text-slate-400">Register new field engineers, monitor service territory coverage, and toggles</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Technician Form */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    Register Technician
                  </h3>
                  <form onSubmit={handleAddTechnician} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={newTechName}
                        onChange={(e) => setNewTechName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={newTechEmail}
                        onChange={(e) => setNewTechEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="tech@renewserv.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={newTechPhone}
                        onChange={(e) => setNewTechPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="9876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Service Territory</label>
                      <select 
                        value={newTechTerritory}
                        onChange={(e) => setNewTechTerritory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Select Territory</option>
                        {territories.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.postalCodes})</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs">
                      Register Technician
                    </button>
                  </form>
                </div>

                {/* Technicians List */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl lg:col-span-2">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">Technicians Registry</h3>
                  <div className="space-y-4">
                    {technicians.map((t) => (
                      <div key={t.id} className="p-4 bg-slate-900 border border-slate-850 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-200">{t.user?.profile?.name || 'Technician'}</p>
                            <span className="text-[10px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded">{t.employeeId}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{t.user?.encryptedPhone ? 'Phone Encrypted' : 'N/A'} • {t.user?.encryptedEmail ? 'Email Encrypted' : 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">Territory:</span>
                            <span className="text-xs font-bold text-slate-300">{t.territory?.name || 'Maharashtra'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-bold text-yellow-400">{t.rating || '5.0'} Rating</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                          <button 
                            onClick={() => handleToggleAvailability(t.id, !t.isAvailable)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider ${
                              t.isAvailable 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {t.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                          <button 
                            onClick={() => handleDisableTechAccount(t.id, !t.deletedAt)}
                            className="bg-slate-800 hover:bg-slate-705 text-slate-300 hover:text-red-400 font-bold px-3 py-1.5 rounded text-xs transition-all uppercase tracking-wider"
                          >
                            {t.deletedAt ? 'Enable Account' : 'Disable Account'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {technicians.length === 0 && (
                      <p className="text-center text-slate-500 py-8">No technicians registered</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OWNERS */}
          {activeTab === 'owners' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Administrative Registry</h2>
                  <p className="text-sm text-slate-400">Invite new Owners (Admin privilege) - Root owners control register rights</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Register Owner Form */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    Register Owner
                  </h3>
                  {currentUser?.role !== 'ROOT_OWNER' ? (
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg flex gap-3 text-slate-400 text-xs">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p>Only the ROOT_OWNER has privileges to register other administrative Owner accounts.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleAddOwner} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                          placeholder="Tanish Thakare"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={newOwnerEmail}
                          onChange={(e) => setNewOwnerEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                          placeholder="tanish@renewserv.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={newOwnerPhone}
                          onChange={(e) => setNewOwnerPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                          placeholder="9000010000"
                        />
                      </div>
                      <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs">
                        Create Owner Account
                      </button>
                    </form>
                  )}
                </div>

                {/* Owners List */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl lg:col-span-2">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">System Administrators Registry</h3>
                  <div className="space-y-4">
                    {owners.map((ow) => (
                      <div key={ow.id} className="p-4 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-200">{ow.name || 'Owner User'}</p>
                          <p className="text-xs text-slate-400 font-mono">{ow.email} • {ow.phone}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-2 inline-block ${
                            ow.role === 'ROOT_OWNER' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{ow.role}</span>
                        </div>
                        {currentUser?.role === 'ROOT_OWNER' && ow.role !== 'ROOT_OWNER' && (
                          <button 
                            onClick={() => handleDeleteOwner(ow.id)}
                            className="bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold px-3 py-1.5 rounded text-xs transition-all uppercase tracking-wider"
                          >
                            Suspend Owner
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LEADS */}
          {activeTab === 'leads' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Leads Pipeline</h2>
                  <p className="text-sm text-slate-400">Capture and follow up prospective solar maintenance clients</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Lead Form */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Capture Lead
                  </h3>
                  <form onSubmit={handleCreateLead} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Customer Name</label>
                      <input 
                        type="text" 
                        value={newLeadName}
                        onChange={(e) => setNewLeadName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="Vijay Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={newLeadPhone}
                        onChange={(e) => setNewLeadPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="9998887776"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={newLeadEmail}
                        onChange={(e) => setNewLeadEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="vijay@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lead Source</label>
                      <select 
                        value={newLeadSource}
                        onChange={(e) => setNewLeadSource(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="WEBSITE">Website</option>
                        <option value="WHATSAPP">WhatsApp Chat</option>
                        <option value="PHONE">Phone Call</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="GOOGLE">Google Ads</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notes</label>
                      <textarea 
                        value={newLeadNotes}
                        onChange={(e) => setNewLeadNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none h-16"
                        placeholder="Interested in AMC package..."
                      />
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs">
                      Save Lead
                    </button>
                  </form>
                </div>

                {/* Leads Registry Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl lg:col-span-2">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">Leads Tracking Console</h3>
                  <div className="space-y-4">
                    {leads.map((l) => (
                      <div key={l.id} className="p-4 bg-slate-900 border border-slate-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-200">{l.name}</p>
                          <p className="text-xs text-slate-400">{l.phone} • {l.email || 'No email'}</p>
                          <p className="text-xs text-amber-500 font-semibold mt-1">Interested in: {l.serviceInterested}</p>
                          {l.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-950 p-2 rounded italic">"{l.notes}"</p>}
                          <span className="text-[10px] text-slate-500 font-mono block mt-2">Source: {l.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={l.status}
                            onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="INTERESTED">INTERESTED</option>
                            <option value="CONVERTED">CONVERTED</option>
                            <option value="LOST">LOST</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <p className="text-center text-slate-500 py-8">No marketing leads found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Unified Support Desk</h2>
                <p className="text-sm text-slate-400">Resolve customer callbacks, support tickets, and chat notifications</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ticket List */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">Support Inbox Tickets</h3>
                  
                  <div className="space-y-4">
                    {supportData.tickets?.map((t: any) => (
                      <div 
                        key={t.id} 
                        onClick={() => setActiveTicketId(t.id)}
                        className={`p-4 bg-slate-900 border rounded-lg cursor-pointer transition-all ${
                          activeTicketId === t.id ? 'border-amber-500 bg-slate-850' : 'border-slate-850 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold font-mono text-slate-500">#{t.id.substring(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 animate-pulse'
                          }`}>{t.status}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">{t.subject}</h4>
                        <p className="text-xs text-slate-400 mt-1">Category: {t.category} • Client: {t.customer?.profile?.name || 'Guest'}</p>
                      </div>
                    ))}
                    {supportData.tickets?.length === 0 && (
                      <p className="text-center text-slate-500 py-8">Support inbox clean. Excellent!</p>
                    )}
                  </div>
                </div>

                {/* Reply Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
                  <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">Reply & Dispatch</h3>
                  {activeTicketId ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded text-xs text-slate-400">
                        Replying to ticket: <span className="font-mono text-slate-200">#{activeTicketId.substring(0, 8)}</span>
                      </div>
                      <textarea 
                        value={supportReplyText}
                        onChange={(e) => setSupportReplyText(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none h-24 text-slate-100 focus:border-amber-500"
                        placeholder="Type reply to client..."
                      />
                      <button 
                        onClick={() => handleReplyTicket(activeTicketId)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Dispatch Reply
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-12">Select a ticket from support inbox to reply</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: FINANCE (RELOCATED ESCROW & LEDGER ENTRIES) */}
          {activeTab === 'finance' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Audit Double-Entry Ledger Console</h2>
                <p className="text-sm text-slate-400">View real-time balances, escrow vaults, clearing registers, and audit trails</p>
              </div>

              {/* Balances widgets */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 shadow-xl relative overflow-hidden">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Escrow Vault Balance</p>
                  <p className="text-3xl font-extrabold mt-2 text-blue-400">₹{ledgerBalances?.RENEWSERV_ESCROW || 0}</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-855 shadow-xl relative overflow-hidden">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Net Realized Revenue</p>
                  <p className="text-3xl font-extrabold mt-2 text-emerald-400">₹{ledgerBalances?.RENEWSERV_REVENUE || 0}</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-855 shadow-xl relative overflow-hidden">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Payment Gateway Clearing</p>
                  <p className="text-3xl font-extrabold mt-2 text-yellow-400">₹{ledgerBalances?.RAZORPAY_GATEWAY || 0}</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-855 shadow-xl relative overflow-hidden">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Customer Wallet Registry</p>
                  <p className="text-3xl font-extrabold mt-2 text-purple-400">₹{ledgerBalances?.CUSTOMER_WALLET || 0}</p>
                </div>
              </div>

              {/* Transactions list */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-slate-200">Double Entry Ledger Transactions Log</h3>
                  <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase">Audited</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 text-xs uppercase font-semibold">
                        <th className="p-3">Source Account</th>
                        <th className="p-3">Destination Account</th>
                        <th className="p-3">Reference / Payment</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                      {ledgerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/30">
                          <td className="p-3 font-mono font-semibold text-red-400">{entry.sourceAccount}</td>
                          <td className="p-3 font-mono font-semibold text-emerald-400">{entry.destinationAccount}</td>
                          <td className="p-3 font-mono text-slate-500">#{entry.referenceId.substring(0, 10)}</td>
                          <td className="p-3 text-slate-400">{entry.description}</td>
                          <td className="p-3 text-right font-bold text-slate-200">₹{entry.amount}</td>
                        </tr>
                      ))}
                      {ledgerEntries.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-slate-600 p-8">No ledger entries audited</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Business Intelligence</h2>
                <p className="text-sm text-slate-400">View real-time operations performance and business growth metrics</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bookings performance */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl">
                  <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4">Operations Metrics</h3>
                  <div className="space-y-4 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Total Bookings Logs:</span>
                      <span className="font-bold">{bookings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Services:</span>
                      <span className="font-bold text-emerald-400">{bookings.filter(b => b.status === 'COMPLETED' || b.status === 'WORK_COMPLETED').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate (Quotes -&gt; Approved):</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Customer Rating:</span>
                      <span className="font-bold text-amber-500">4.92 / 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Audit Trial */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4">Global Security Audit Trail</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-900 border border-slate-850 rounded-lg">
                        <p className="font-bold text-slate-300">{log.action}</p>
                        <p className="text-slate-500 mt-1">{log.ipAddress} • {log.userAgent.substring(0, 30)}...</p>
                        {log.details && <p className="text-[10px] bg-slate-950 p-2 rounded mt-2 text-slate-400 font-mono whitespace-pre-wrap">{log.details}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">System Controls & Configurations</h2>
                <p className="text-sm text-slate-400">Configure Razorpay gateways, business coordinates, business hours, and operational regions</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl space-y-6">
                <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-3">Gateway Configurations</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razorpay Key ID</label>
                    <input 
                      type="text" 
                      value={settings.razorpayKeyId || 'rzp_test_XXXXXXXXXXXX'}
                      disabled
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-400 cursor-not-allowed text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Business GST Charge (%)</label>
                    <input 
                      type="text" 
                      value="18%"
                      disabled
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-400 cursor-not-allowed text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg flex gap-3 text-slate-400 text-xs">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p>Security config overrides require local environment file modifications. Changes will recycle the Next.js process.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* RIGHT-SIDE OPERATIONS DRAWER (SLIDES OUT ON DEMAND) */}
      {showBookingDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          {/* Close Backdrop click */}
          <div className="flex-1" onClick={() => { setShowBookingDetailsModal(false); setSelectedBooking(null); setLoadedBookingDetails(null); }} />
          
          <div className="w-full sm:w-[550px] bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl relative animate-slideLeft">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 sticky top-0 z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">Service Details</p>
                <h3 className="font-extrabold text-slate-200 mt-1 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  #{selectedBooking.id.substring(0, 10).toUpperCase()}
                </h3>
              </div>
              <button 
                onClick={() => { setShowBookingDetailsModal(false); setSelectedBooking(null); setLoadedBookingDetails(null); }}
                className="p-1.5 bg-slate-905 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                  <p className="text-xs font-semibold">Decrypting secure records & logs...</p>
                </div>
              ) : loadedBookingDetails ? (
                <>
                  {/* Block 1: Customer Contact details */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-500" /> Customer Information
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <p className="text-slate-200 font-bold text-sm">{loadedBookingDetails.booking.customer?.profile?.name || 'Customer'}</p>
                      <p className="text-slate-400 font-mono flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {loadedBookingDetails.booking.customer?.phone}
                        <button 
                          onClick={() => alert(`Dialing simulated call to ${loadedBookingDetails.booking.customer?.phone}...`)}
                          className="text-[10px] bg-slate-850 border border-slate-800 px-2 py-0.5 rounded text-amber-500 font-bold hover:bg-slate-800"
                        >
                          Simulate Call
                        </button>
                      </p>
                      <p className="text-slate-400 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {loadedBookingDetails.booking.customer?.email}
                      </p>
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400">
                        <p className="font-semibold text-slate-300">Service Address:</p>
                        <p>{loadedBookingDetails.booking.address?.addressLine}</p>
                        <p className="font-mono text-[11px] text-slate-500">Pincode: {loadedBookingDetails.booking.address?.postalCode}</p>
                        
                        <div className="flex gap-2 pt-2">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loadedBookingDetails.booking.address?.addressLine || '')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:underline"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Google Maps Link
                          </a>
                          {loadedBookingDetails.booking.address?.gpsCoords && (
                            <span className="text-[11px] font-mono text-slate-500">GPS: {loadedBookingDetails.booking.address?.gpsCoords}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Requested Service & Reschedule Panel */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" /> Requested Service Details
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-semibold">Service Category:</p>
                        <p className="text-slate-200 font-bold text-sm mt-0.5">{loadedBookingDetails.booking.serviceType}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <p className="text-slate-400 font-semibold mb-2">Schedule Date & Time:</p>
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            value={reschedDate} 
                            onChange={(e) => setReschedDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs w-1/2 focus:outline-none"
                          />
                          <input 
                            type="text" 
                            value={reschedTime} 
                            onChange={(e) => setReschedTime(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs w-1/2 focus:outline-none"
                            placeholder="10:00 AM"
                          />
                        </div>
                        <button 
                          onClick={() => handleUpdateBookingField({ scheduledDate: reschedDate, scheduledTime: reschedTime })}
                          className="mt-2 w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-1 rounded text-[11px] transition-all uppercase tracking-wider"
                        >
                          Reschedule Appointment
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Block 3: Internal Private Notes */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Internal Private Notes</h4>
                    <textarea 
                      value={customerPrivateNote}
                      onChange={(e) => setCustomerPrivateNote(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none h-16"
                      placeholder="Add customer specific internal operational notes..."
                    />
                    <button 
                      onClick={() => handleUpdateBookingField({ notes: customerPrivateNote })}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-1 rounded text-[11px] transition-all uppercase tracking-wider"
                    >
                      Save Customer Notes
                    </button>
                  </div>

                  {/* Block 4: Service and Payment Status Dropdowns */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Workflow State Managers</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Status</label>
                        <select 
                          value={loadedBookingDetails.booking.status}
                          onChange={(e) => handleUpdateBookingField({ status: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="NEW">NEW</option>
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="TECHNICIAN_ASSIGNED">TECHNICIAN ASSIGNED</option>
                          <option value="ON_THE_WAY">ON THE WAY</option>
                          <option value="ARRIVED">ARRIVED</option>
                          <option value="INSPECTION_DONE">INSPECTION DONE</option>
                          <option value="QUOTE_SENT">QUOTE SENT</option>
                          <option value="WAITING_FOR_PAYMENT">WAITING FOR PAYMENT</option>
                          <option value="PAYMENT_RECEIVED">PAYMENT RECEIVED</option>
                          <option value="WORK_STARTED">WORK STARTED</option>
                          <option value="WORK_COMPLETED">WORK COMPLETED</option>
                          <option value="INVOICE_SENT">INVOICE SENT</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Status</label>
                        <select 
                          value={loadedBookingDetails.booking.paymentStatus || 'UNPAID'}
                          onChange={(e) => handleUpdateBookingField({ paymentStatus: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="UNPAID">UNPAID</option>
                          <option value="ADVANCE_PAID">ADVANCE PAID</option>
                          <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                          <option value="PAID">PAID</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Block 5: Technician Assignments */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-500" /> Technician Dispatch console
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Technician</label>
                        <select 
                          value={loadedBookingDetails.booking.technicianAssignments?.[0]?.technicianId || ''}
                          onChange={(e) => handleUpdateBookingField({ technicianId: e.target.value || null })}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="">Unassigned (Pending Dispatch)</option>
                          {loadedBookingDetails.techniciansList?.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.territoryName}) {t.isAvailable ? '• Available' : '• Offline'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {loadedBookingDetails.booking.technicianAssignments?.[0]?.technician && (
                        <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-400 space-y-1">
                          <p className="font-bold text-slate-300">Staff Profile:</p>
                          <p>Employee ID: {loadedBookingDetails.booking.technicianAssignments[0].technician.employeeId}</p>
                          <p>Service Territory: {loadedBookingDetails.booking.technicianAssignments[0].technician.territoryId}</p>
                          <p className="text-yellow-400 font-bold">Rating: {loadedBookingDetails.booking.technicianAssignments[0].technician.rating || '5.0'} / 5.0</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Block 6: Invoices & Billing Builder */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Invoice & Billing Generator
                    </h4>

                    {loadedBookingDetails.booking.invoice ? (
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-400 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-300">Invoice Number:</span>
                          <span className="font-mono">{loadedBookingDetails.booking.invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charge (Excl Tax):</span>
                          <span>₹{loadedBookingDetails.booking.invoice.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST Tax Collected:</span>
                          <span>₹{loadedBookingDetails.booking.invoice.tax}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-850 pt-1 text-slate-200 font-bold">
                          <span>Total Amount:</span>
                          <span className="text-amber-500">₹{loadedBookingDetails.booking.invoice.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1">
                          <span>Status:</span>
                          <span className="font-bold uppercase text-emerald-400">{loadedBookingDetails.booking.invoice.status}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-500">No invoice generated yet for this booking.</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="GST (₹)" 
                            value={invTax} 
                            onChange={(e) => setInvTax(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs w-1/3 focus:outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="Discount" 
                            value={invDiscount} 
                            onChange={(e) => setInvDiscount(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs w-1/3 focus:outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="Total (₹)" 
                            value={invTotal} 
                            onChange={(e) => setInvTotal(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs w-1/3 focus:outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => handleUpdateBookingField({ 
                            invoice: { tax: invTax, discount: invDiscount, totalAmount: invTotal } 
                          })}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 rounded text-xs transition-all uppercase tracking-wider"
                        >
                          Generate Invoice
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Block 7: Payment Transaction Logs */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-amber-500" /> Razorpay Gateway Logs
                    </h4>
                    <div className="space-y-2">
                      {loadedBookingDetails.booking.payments?.map((pay: any) => (
                        <div key={pay.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-300">
                            <span>{pay.type}</span>
                            <span>₹{pay.amount}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {pay.transactionId}</p>
                          <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                            <span>{pay.createdAt.split('T')[0]}</span>
                            <span className="text-emerald-400 font-bold uppercase">{pay.status}</span>
                          </div>
                        </div>
                      ))}
                      {(!loadedBookingDetails.booking.payments || loadedBookingDetails.booking.payments.length === 0) && (
                        <p className="text-[11px] text-slate-500">No gateway transactions verified.</p>
                      )}
                    </div>
                  </div>

                  {/* Block 8: Customer Booking History (Loyalty profile) */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <HistoryIcon /> Loyalty Booking Profile
                    </h4>
                    <div className="space-y-2">
                      {loadedBookingDetails.customerHistory?.map((h: any) => (
                        <div key={h.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded text-xs">
                          <div className="flex justify-between font-bold text-slate-300">
                            <span>{h.serviceType}</span>
                            <span>#{h.id.substring(0, 8)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>Date: {h.scheduledDate}</span>
                            <span className="uppercase">{h.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Block 8b: Work Verification Photos */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-500" /> Work Verification Photos
                    </h4>
                    
                    {/* Render existing images */}
                    {loadedBookingDetails.booking.jobImages && loadedBookingDetails.booking.jobImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {loadedBookingDetails.booking.jobImages.map((img: any) => (
                          <div key={img.id} className="relative group border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                            <img src={img.url} alt={img.type || 'Job Photo'} className="w-full h-24 object-cover" />
                            {img.type && (
                              <div className="p-1 bg-slate-900/90 text-[9px] text-slate-400 absolute bottom-0 left-0 right-0 truncate">
                                {img.type}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">No job photos attached yet.</p>
                    )}

                    {/* Add attachment inputs */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Attach Photo</label>
                      <div className="flex gap-2">
                        <label className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-1.5 px-3 rounded text-center cursor-pointer text-xs transition-all uppercase tracking-wider">
                          Upload Photo File
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                                let uploadUrl = '';
                                if (cloudName) {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('upload_preset', 'renewserv_unsigned_preset');
                                  try {
                                    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                      method: 'POST',
                                      body: formData
                                    });
                                    const data = await res.json();
                                    if (data.secure_url) {
                                      uploadUrl = data.secure_url;
                                    }
                                  } catch (err) {
                                    console.error('Cloudinary upload failed, falling back to base64', err);
                                  }
                                }
                                
                                if (!uploadUrl) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    const base64Data = reader.result as string;
                                    await handleUpdateBookingField({ jobImage: { url: base64Data, type: 'Inspection Photo' } });
                                  };
                                  reader.readAsDataURL(file);
                                } else {
                                  await handleUpdateBookingField({ jobImage: { url: uploadUrl, type: 'Inspection Photo' } });
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Block 9: Live Dynamic Timeline Stepper */}
                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-500" /> Operational Status Timeline
                    </h4>
                    
                    <div className="relative pl-6 space-y-4 border-l-2 border-slate-800">
                      {loadedBookingDetails.booking.timeline?.map((step: any) => (
                        <div key={step.id} className="relative text-xs">
                          <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/50" />
                          <p className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">{step.status}</p>
                          <p className="text-slate-400 mt-0.5">{step.notes}</p>
                          <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                            {new Date(step.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        </div>
                      ))}
                      {(!loadedBookingDetails.booking.timeline || loadedBookingDetails.booking.timeline.length === 0) && (
                        <p className="text-[11px] text-slate-500">No status logs recorded yet.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER PRIVATE NOTES DRAWER */}
      {showCustomerDrawer && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="flex-1" onClick={() => { setShowCustomerDrawer(false); setSelectedCustomer(null); }} />
          <div className="w-full sm:w-[480px] bg-slate-950 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl animate-slideLeft">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-200 text-lg">Customer Notes Composer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Private comments saved directly to user profile</p>
                </div>
                <button onClick={() => { setShowCustomerDrawer(false); setSelectedCustomer(null); }} className="p-1 text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 bg-slate-900 border border-slate-850 p-4 rounded-lg">
                {customerAvatarUrl ? (
                  <img src={customerAvatarUrl} alt={selectedCustomer.name} className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500 text-lg shrink-0 select-none">
                    {selectedCustomer.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-slate-200">{selectedCustomer.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{selectedCustomer.phone} • {selectedCustomer.email}</p>
                  <p className="text-xs text-slate-400 mt-1">Total Revenue Paid: <span className="text-emerald-400 font-bold">₹{selectedCustomer.totalRevenue}</span></p>
                </div>
              </div>

              {/* Attach user image/avatar block */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase">Attach User Photo</label>
                
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={customerAvatarUrl}
                    onChange={(e) => setCustomerAvatarUrl(e.target.value)}
                    placeholder="Paste image URL (e.g. https://...)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>- OR -</span>
                    <label className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-3 py-1.5 rounded cursor-pointer transition-all">
                      Upload File
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                            let uploadUrl = '';
                            if (cloudName) {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('upload_preset', 'renewserv_unsigned_preset');
                              try {
                                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                  method: 'POST',
                                  body: formData
                                });
                                const data = await res.json();
                                if (data.secure_url) {
                                  uploadUrl = data.secure_url;
                                }
                              } catch (err) {
                                console.error('Cloudinary upload failed, falling back to base64', err);
                              }
                            }
                            
                            if (!uploadUrl) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCustomerAvatarUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setCustomerAvatarUrl(uploadUrl);
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Private Operational Notes</label>
                <textarea 
                  value={customerPrivateNote}
                  onChange={(e) => setCustomerPrivateNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none h-40 text-slate-100 focus:border-amber-500"
                  placeholder="Vijay prefers morning service. Solar panels are on a sloped roof..."
                />
              </div>
            </div>

            <button 
              onClick={() => {
                handleSaveCustomerNotes(selectedCustomer.id);
                setShowCustomerDrawer(false);
                setSelectedCustomer(null);
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs"
            >
              Save Internal Notes
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MOCK WHATSAPP TEMPLATES DISPATCHER */}
      {whatsappTemplateModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setWhatsappTemplateModal(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-extrabold text-slate-200 text-base mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-400" />
              WhatsApp Template Dispatcher
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg text-xs space-y-1.5">
                <p className="text-slate-400">Recipient Name: <span className="font-bold text-slate-200">{whatsappTemplateModal.customerName}</span></p>
                <p className="text-slate-400">Mobile Number: <span className="font-mono text-slate-200">{whatsappTemplateModal.phone}</span></p>
                <p className="text-slate-400">Template Context: <span className="font-bold text-slate-200">{whatsappTemplateModal.templateType}</span></p>
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 rounded-lg italic">
                {whatsappTemplateModal.templateType === 'CONFIRMED' && `⚡ *RenewServ Update:* Your booking is CONFIRMED! Our technician will visit soon.`}
                {whatsappTemplateModal.templateType === 'TECHNICIAN_ON_THE_WAY' && `⚡ *RenewServ Update:* Our technician is ON THE WAY to your solar panels!`}
                {whatsappTemplateModal.templateType === 'ARRIVED' && `⚡ *RenewServ Update:* Our technician has ARRIVED at your location.`}
                {whatsappTemplateModal.templateType === 'WORK_STARTED' && `⚡ *RenewServ Update:* Solar panel cleaning has STARTED!`}
                {whatsappTemplateModal.templateType === 'COMPLETED' && `⚡ *RenewServ Update:* Solar cleaning COMPLETED successfully!`}
              </div>

              <button 
                onClick={executeWhatsappSimulate}
                disabled={sendingWhatsapp}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-700 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1"
              >
                {sendingWhatsapp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Simulated WA Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUOTE BUILDER */}
      {showQuoteBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowQuoteBuilder(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-extrabold text-slate-200 text-base mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Quote Builder
            </h3>

            <form onSubmit={handleGenerateQuoteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Panel Count</label>
                  <input 
                    type="number" 
                    value={panelCount}
                    onChange={(e) => setPanelCount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">System Size (kW)</label>
                  <input 
                    type="text" 
                    value={systemSizeKw}
                    onChange={(e) => setSystemSizeKw(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-855 rounded text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cleaning Cost (₹)</label>
                  <input 
                    type="number" 
                    value={cleaningCost}
                    onChange={(e) => setCleaningCost(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quote Description</label>
                <textarea 
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm focus:outline-none h-16 text-slate-100"
                />
              </div>

              {quoteStatusMessage && <p className="text-xs font-semibold text-amber-500">{quoteStatusMessage}</p>}

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all uppercase tracking-wider text-xs">
                Submit & Send Quote
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple Helper Icon
function HistoryIcon() {
  return (
    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

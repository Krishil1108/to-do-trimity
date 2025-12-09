import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Calendar, Users, Bell, MessageCircle, Plus, Edit2, Trash2, Filter, Check, Clock, AlertCircle, X, LogOut, User, Mail, Lock, Menu, CheckCircle, XCircle, LayoutGrid, List, Eye, Download, FileText, BarChart3, TrendingUp, FolderKanban, UserPlus, Search, MoreVertical } from 'lucide-react';
import API_URL from './config';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-styles.css';
import './pwa-styles.css';
import notificationService from './services/notificationService';
import UpdateChecker from './components/UpdateChecker';
import CustomDialog from './components/CustomDialog';

// Server optimization for render.com deployment
const keepServerAlive = () => {
  if (process.env.NODE_ENV === 'production') {
    // Ping server every 4 minutes to prevent sleep
    setInterval(() => {
      fetch(API_URL.replace('/api', '/health')).catch(() => {
        console.log('🏥 Server keep-alive ping');
      });
    }, 240000); // 4 minutes
  }
};

// Wake up server immediately for faster notifications
const wakeServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏰ Waking up render server for faster notifications...');
    try {
      const start = Date.now();
      await fetch(API_URL.replace('/api', '/health'), { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const duration = Date.now() - start;
      console.log(`✅ Server awake in ${duration}ms`);
      return true;
    } catch (error) {
      console.warn('⚠️ Server wake-up failed:', error.message);
      return false;
    }
  }
  return true;
};

const PRIORITY_COLORS = {
  Low: 'bg-green-100 text-green-800 border-green-300',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  High: 'bg-red-100 text-red-800 border-red-300'
};

const SEVERITY_BADGES = {
  Minor: 'bg-blue-100 text-blue-700',
  Major: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700'
};



const STATUS_COLORS = {
  'Pending': 'bg-yellow-50 border-yellow-200 text-yellow-800',
  'In Progress': 'bg-blue-50 border-blue-200 text-blue-800',
  'In Checking': 'bg-pink-50 border-pink-200 text-pink-800',
  'Completed': 'bg-green-50 border-green-200 text-green-800',
  'Overdue': 'bg-red-50 border-red-200 text-red-800'
};


const TaskManagementSystem = () => {
  
  // 🔧 SEARCH DEBOUNCE CONFIGURATION
  const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds - CHANGE THIS VALUE to adjust debounce timing
  
  // 📊 DEBOUNCE TIMING OPTIONS (based on your logs):
  // - 150ms: Fast typing support (recommended for fast typers)
  // - 300ms: Balanced (current setting - good for most users)
  // - 500ms: Conservative (better for slower typers, less server load)
  // - 800ms: Very patient (minimal server requests)
  //
  // 📈 CURRENT PERFORMANCE: Your actual timing shows ~317ms (within good range)
  // 💡 TIP: If you type very fast, try 150-200ms. If you prefer less server calls, try 500ms.
  // 🔍 Watch browser console for real-time timing analysis
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [associates, setAssociates] = useState([]);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState('new');
  const [newAssociate, setNewAssociate] = useState({ name: '', company: '', email: '', phone: '' });
  
  // External Users management
  const [externalUsers, setExternalUsers] = useState([]);
  const [showExternalUserModal, setShowExternalUserModal] = useState(false);
  const [newExternalUserName, setNewExternalUserName] = useState('');
  const [editingExternalUser, setEditingExternalUser] = useState(null);
  
  // App state
  const [currentView, setCurrentView] = useState('my-tasks');
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedTaskData, setCopiedTaskData] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [subtaskFilter, setSubtaskFilter] = useState('all'); // 'all', 'subtasks-only', 'tasks-only'
  const [associateFilters, setAssociateFilters] = useState({});
  const [associateDateRange, setAssociateDateRange] = useState({ from: '', to: '' });
  const [selectedAssociateTasks, setSelectedAssociateTasks] = useState([]);
  
  // External Users filters
  const [externalFilters, setExternalFilters] = useState({});
  const [externalDateRange, setExternalDateRange] = useState({ from: '', to: '' });
  const [selectedExternalTasks, setSelectedExternalTasks] = useState([]);
  
  // Search and pagination states for all views
  const [searchTerms, setSearchTerms] = useState({
    'my-tasks': '',
    'all-tasks': '',
    'assigned-by-me': '',
    'team-subtasks': '',
    'associate-tasks': '',
    'confidential-tasks': '',
    'external-tasks': ''
  });
  const [currentPages, setCurrentPages] = useState({
    'my-tasks': 1,
    'all-tasks': 1,
    'assigned-by-me': 1,
    'team-subtasks': 1,
    'associate-tasks': 1,
    'confidential-tasks': 1,
    'external-tasks': 1
  });
  const [itemsPerPage] = useState(20);
  
  // Push notification states
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [isRecording, setIsRecording] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'cards' or 'table'
  
  // Admin reporting states
  const [showAdminReports, setShowAdminReports] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({ start: null, end: null });
  const [reportType, setReportType] = useState('alltime'); // 'alltime', 'quarterly', 'halfyearly', 'yearly', 'custom'
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() + 3) / 3));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportDateFilter, setReportDateFilter] = useState({ start: null, end: null });
  const [selectedReportUser, setSelectedReportUser] = useState('all'); // 'all' or specific username
  
  // Modals for task actions
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionReason, setCompletionReason] = useState('');
  const [overdueReason, setOverdueReason] = useState('');
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  
  // PWA Installation states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ title: '', message: '', onConfirm: null });
  
  // Custom Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'error', 'warning', 'confirm', 'delete'
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // Dialog helper functions
  const showDialog = (title, message, type = 'info', onConfirm = null, confirmText = 'OK', cancelText = 'Cancel') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const closeDialog = () => {
    setDialog({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      onConfirm: null,
      confirmText: 'OK',
      cancelText: 'Cancel'
    });
  };

  // Convenience methods for different dialog types
  const showSuccess = (message, title = 'Success') => showDialog(title, message, 'success');
  const showError = (message, title = 'Error') => showDialog(title, message, 'error');
  const showWarning = (message, title = 'Warning') => showDialog(title, message, 'warning');
  const showInfo = (message, title = 'Information') => showDialog(title, message, 'info');
  const showConfirm = (message, onConfirm, title = 'Confirm Action') => showDialog(title, message, 'confirm', onConfirm, 'Confirm', 'Cancel');
  const showDeleteConfirm = (message, onConfirm, title = 'Confirm Delete') => showDialog(title, message, 'delete', onConfirm, 'Delete', 'Cancel');
  
  
  // Check if user is logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadTasks();
      loadUsers();
      loadNotifications();
      loadProjects();
      loadAssociates();
      loadExternalUsers();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentUser]);

  // Initialize push notifications when app loads
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Initialize notification service
        const initialized = await notificationService.initialize();
        
        if (initialized) {
          // Check current subscription status
          const status = await notificationService.getSubscriptionStatus();
          setPushNotificationsEnabled(status.subscribed);
          setNotificationPermission(status.permission);
          
          if (status.subscribed) {
            console.log('Push notifications are already enabled');
            
            // Re-register subscription with backend in case server restarted
            console.log('Re-registering subscription with backend...');
            const reRegistered = await notificationService.reRegisterSubscription();
            if (reRegistered) {
              console.log('✅ Subscription re-registered successfully');
            } else {
              console.warn('⚠️ Failed to re-register subscription, may need to re-enable');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    // Listen for messages from service worker (notification clicks)
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        console.log('🔔 Notification clicked, received in app:', event.data);
        // Could auto-navigate to relevant task or refresh notifications
        loadNotifications();
        
        // Visual feedback - flash the notification icon
        const notificationIcon = document.querySelector('[title="Notifications"]');
        if (notificationIcon) {
          notificationIcon.style.animation = 'pulse 0.5s ease-in-out 3';
        }
      }
    };

    // Only initialize if browser supports service workers
    if ('serviceWorker' in navigator && currentUser) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      initializePushNotifications();
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [currentUser]);

  // PWA Installation handling
  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Check if mobile device
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
             window.innerWidth <= 768;
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('💾 PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // For mobile devices, show install prompt immediately and more prominently
      if (!isInstalled) {
        if (isMobile()) {
          // Show immediately on mobile for better user experience
          setTimeout(() => {
            setShowInstallPrompt(true);
          }, 1500);
        } else {
          // Delay for desktop
          setTimeout(() => {
            setShowInstallPrompt(true);
          }, 3000);
        }
      }
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Always show install prompt on mobile if not already installed
    // This ensures popup appears even if beforeinstallprompt doesn't fire
    if (!isInstalled) {
      const showDelay = isMobile() ? 1000 : 3000; // Faster on mobile
      setTimeout(() => {
        console.log('📱 Showing install prompt - Mobile:', isMobile(), 'Installed:', isInstalled);
        setShowInstallPrompt(true);
      }, showDelay);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt]);

  // Handle PWA installation
  const handleInstallPWA = async () => {
    // Check if it's iOS Safari (which doesn't support standard PWA installation)
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (!deferredPrompt && !isIOSSafari) {
      console.log('No install prompt available');
      // Show manual installation instructions
      showInfo('To install this app:\n\n• Chrome/Edge: Look for the install icon in the address bar\n• Firefox: Menu → Install this site as an app\n• Safari: Share → Add to Home Screen', 'Installation Instructions');
      setShowInstallPrompt(false);
      return;
    }

    if (isIOSSafari) {
      // iOS Safari manual installation instructions
      showInfo('To install TriDo on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nTriDo will then appear as an app icon on your home screen!', 'Install TriDo on iOS');
      setShowInstallPrompt(false);
      return;
    }

    try {
      console.log('🚀 Triggering PWA install prompt');
      const result = await deferredPrompt.prompt();
      console.log('Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
        setShowInstallPrompt(false);
      } else {
        console.log('❌ User dismissed PWA installation');
        // Show again after some time
        setTimeout(() => {
          if (!isInstalled) {
            setShowInstallPrompt(true);
          }
        }, 300000); // 5 minutes
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA installation failed:', error);
      // Fallback: show manual instructions
      showInfo('To install this app:\n\n• Look for the install icon in your browser address bar\n• Or check your browser menu for "Install" or "Add to Home Screen" option', 'Installation Instructions');
      setShowInstallPrompt(false);
    }
  };


  // Helper function to safely get project name
  const getProjectName = (project) => {
    if (!project) return 'No Project';
    return typeof project === 'string' ? project : project?.name || 'No Project';
  };

  // Utility functions for formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (task) => {
    // Create due date at end of day (23:59:59) so it becomes overdue after midnight
    const dueDate = new Date(task.outDate);
    dueDate.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM
    const isPastDue = new Date() > dueDate && task.status !== 'Completed';
    const status = isPastDue ? 'Overdue' : task.status;
    
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'In Checking': 'bg-pink-100 text-pink-700',
      'Completed': 'bg-green-100 text-green-700',
      'Overdue': 'bg-red-100 text-red-700'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const getStatusDropdown = (task) => {
    // Create due date at end of day (23:59:59) so it becomes overdue after midnight
    const dueDate = new Date(task.outDate);
    dueDate.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM
    const isPastDue = new Date() > dueDate && task.status !== 'Completed';
    
    // Use actual task status in dropdown, not computed status
    const currentStatus = task.status || 'Pending';
    
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'In Checking': 'bg-pink-100 text-pink-700 border-pink-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'Overdue': 'bg-red-100 text-red-700 border-red-200'
    };
    
    // If task is past due but not completed, add visual indication with red border
    const borderClass = isPastDue ? 'ring-2 ring-red-300' : '';
    
    return (
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(task, e.target.value)}
        className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[currentStatus]} ${borderClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="In Checking">In Checking</option>
        <option value="Completed">Completed</option>
        <option value="Overdue">Overdue</option>
      </select>
    );
  };

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menus = document.querySelectorAll('[id^="menu-"]');
      menus.forEach(menu => {
        if (!menu.contains(event.target) && !event.target.closest('button')) {
          menu.style.display = 'none';
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Initialize push notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      if (isLoggedIn && currentUser) {
        // Wake up server first for faster notification response
        await wakeServer();
        
        const initialized = await notificationService.initialize();
        if (initialized) {
          const status = await notificationService.getSubscriptionStatus();
          setPushNotificationsEnabled(status.subscribed);
          setNotificationPermission(status.permission);
        }
        
        // Start keep-alive pings
        keepServerAlive();
      }
    };

    initializeNotifications();
  }, [isLoggedIn, currentUser]);

  const loadUsers = async () => {
    try {
      const params = currentUser?.username ? { requestingUser: currentUser.username } : {};
      const response = await axios.get(`${API_URL}/users`, { params });
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Check if current user is admin - only Ketul Lathia
  const isAdmin = useCallback(() => {
    return currentUser && currentUser.username === 'ketul.lathia';
  }, [currentUser]);

  const isTeamMember = useCallback(() => {
    return currentUser && currentUser.manager;
  }, [currentUser]);

  const getMyTeamMembers = useCallback(() => {
    if (!currentUser) return [];
    return users.filter(u => u.manager === currentUser.username && u.isActive);
  }, [currentUser, users]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = currentUser?.username ? { username: currentUser.username } : {};
      const response = await axios.get(`${API_URL}/tasks`, { params });
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_URL}/notifications/user/${currentUser.username}`);
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const params = currentUser?.username ? { username: currentUser.username } : {};
      const response = await axios.get(`${API_URL}/projects`, { params });
      setProjects(response.data); // Store full project objects with _id
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadAssociates = async () => {
    try {
      if (!currentUser?.username) return;
      
      const response = await axios.get(`${API_URL}/associates`, {
        params: { createdBy: currentUser.username }
      });
      setAssociates(response.data);
      console.log('📋 Fetched associates from database:', response.data);
    } catch (error) {
      console.error('Error loading associates:', error);
      // Fallback to localStorage for backward compatibility
      try {
        const savedAssociates = localStorage.getItem('associates');
        if (savedAssociates) {
          setAssociates(JSON.parse(savedAssociates));
        }
      } catch (localError) {
        console.error('Error loading associates from localStorage:', localError);
      }
    }
  };

  const saveAssociate = async (associateData) => {
    try {
      if (!currentUser?.username) {
        showError('Please log in to save associates', 'Login Required');
        return;
      }

      // Clean the data - remove empty strings and convert to undefined
      const cleanedData = {
        name: associateData.name.trim(),
        createdBy: currentUser.username
      };

      // Only add optional fields if they have actual values
      if (associateData.company && associateData.company.trim()) {
        cleanedData.company = associateData.company.trim();
      }
      if (associateData.email && associateData.email.trim()) {
        cleanedData.email = associateData.email.trim();
      }
      if (associateData.phone && associateData.phone.trim()) {
        cleanedData.phone = associateData.phone.trim();
      }

      const response = await axios.post(`${API_URL}/associates`, cleanedData);
      
      console.log('✅ Associate saved to database:', response.data);
      
      // Refresh associates list
      await loadAssociates();
      
      return response.data;
      
    } catch (error) {
      console.error('Error saving associate:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save associate';
      throw new Error(errorMessage);
    }
  };

  const deleteAssociate = async (associateId) => {
    try {
      await axios.delete(`${API_URL}/associates/${associateId}`);
      
      // Refresh associates list
      await loadAssociates();
      
      console.log('✅ Associate deleted from database');
      
    } catch (error) {
      console.error('Error deleting associate:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete associate');
    }
  };

  const saveAssociateToList = async (associateData) => {
    try {
      await saveAssociate(associateData);
      console.log('✅ Associate saved successfully');
      showSuccess('Associate saved successfully!');
    } catch (error) {
      console.error('❌ Error saving associate:', error);
      showError('Failed to save associate: ' + error.message);
    }
  };

  // External Users Management Functions
  const loadExternalUsers = async () => {
    try {
      if (!currentUser?.username) return;
      
      const response = await axios.get(`${API_URL}/external-users`, {
        params: { createdBy: currentUser.username }
      });
      setExternalUsers(response.data);
      console.log('📋 Fetched external users from database:', response.data);
    } catch (error) {
      console.error('Error loading external users:', error);
      // Fallback to localStorage for backward compatibility
      try {
        const savedExternalUsers = localStorage.getItem(`externalUsers_${currentUser?.username}`);
        if (savedExternalUsers) {
          setExternalUsers(JSON.parse(savedExternalUsers));
        }
      } catch (localError) {
        console.error('Error loading external users from localStorage:', localError);
      }
    }
  };

  const saveExternalUser = async (userData) => {
    try {
      if (!currentUser?.username) {
        showError('Please log in to save external users', 'Login Required');
        return;
      }

      const externalUserData = {
        name: userData.name.trim(),
        createdBy: currentUser.username,
        createdAt: new Date().toISOString()
      };

      let response;
      if (userData._id) {
        // Update existing external user
        response = await axios.put(`${API_URL}/external-users/${userData._id}`, externalUserData);
      } else {
        // Create new external user
        response = await axios.post(`${API_URL}/external-users`, externalUserData);
      }

      // Refresh external users list
      await loadExternalUsers();
      
      console.log('✅ External user saved to database:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error saving external user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save external user';
      throw new Error(errorMessage);
    }
  };

  const deleteExternalUser = async (userId) => {
    try {
      await axios.delete(`${API_URL}/external-users/${userId}`);
      
      // Refresh external users list
      await loadExternalUsers();
      
      console.log('✅ External user deleted from database');
      
    } catch (error) {
      console.error('Error deleting external user:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete external user');
    }
  };

  const saveExternalUserToList = async (userData) => {
    try {
      await saveExternalUser(userData);
      console.log('✅ External user saved successfully');
      showSuccess('External user saved successfully!');
    } catch (error) {
      console.error('❌ Error saving external user:', error);
      showError('Failed to save external user: ' + error.message);
    }
  };

  // Push Notification Functions
  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      showWarning('Push notifications are not supported in your browser.', 'Not Supported');
      return;
    }

    try {
      setLoading(true);
      
      // Initialize notification service first
      const initialized = await notificationService.initialize();
      if (!initialized) {
        showError('Failed to initialize notification service. Please try again.');
        return;
      }

      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        const subscription = await notificationService.subscribeToPush();
        if (subscription) {
          setPushNotificationsEnabled(true);
          setNotificationPermission('granted');
          showSuccess('Push notifications enabled successfully! You will now receive notifications for task updates.');
        } else {
          showError('Failed to enable push notifications. Please check the console and try again.');
        }
      } else {
        setNotificationPermission(Notification.permission);
        showWarning('Notification permission denied. Please enable notifications in your browser settings and try again.', 'Permission Denied');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      showError('Failed to enable push notifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const disablePushNotifications = async () => {
    try {
      setLoading(true);
      const success = await notificationService.unsubscribeFromPush();
      if (success) {
        setPushNotificationsEnabled(false);
        showSuccess('Push notifications disabled successfully!');
      } else {
        showError('Failed to disable push notifications.');
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      showError('Failed to disable push notifications.');
    } finally {
      setLoading(false);
    }
  };

  const testPushNotification = async () => {
    try {
      if (!pushNotificationsEnabled) {
        showWarning('Please enable push notifications first.', 'Notifications Not Enabled');
        return;
      }

      console.log('Testing push notification...');
      
      // Show immediate local notification for instant feedback
      await notificationService.testNotification();
      
      // Test server-side push notification with timeout
      console.log('⏱️ Testing server push with 10s timeout...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await axios.post(`${API_URL}/notifications/test-push`, {
          userId: currentUser.username
        }, {
          timeout: 8000,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('✅ Server push test response:', response.data);
      } catch (serverError) {
        console.warn('⚠️ Server push failed or timed out:', serverError.message);
      }
      
      // Also try with user._id if different
      if (currentUser._id && currentUser._id !== currentUser.username) {
        const response2 = await axios.post(`${API_URL}/notifications/test-push`, {
          userId: currentUser._id
        });
        console.log('Server push test response (with _id):', response2.data);
      }
      
      // Also check server subscription stats
      try {
        const statsResponse = await axios.get(`${API_URL}/notifications/push-stats`);
        console.log('📊 Server subscription stats:', statsResponse.data);
      } catch (error) {
        console.log('Could not fetch subscription stats:', error.response?.data);
      }
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      console.error('Error details:', error.response?.data);
      showError('Failed to send test notification: ' + (error.response?.data?.error || error.message));
    }
  };

  const testBurstNotifications = async () => {
    try {
      if (!pushNotificationsEnabled) {
        showWarning('Please enable push notifications first.', 'Notifications Not Enabled');
        return;
      }

      console.log('💥 Testing WhatsApp-style burst notifications...');
      
      // Show immediate local feedback first (no waiting)
      notificationService.showActiveNotification().catch(console.error);
      
      // Start server-side burst notifications in parallel with timeout
      const serverPromise = axios.post(`${API_URL}/notifications/burst-test`, {
        userId: currentUser.username
      }, {
        timeout: 12000 // Longer timeout for burst
      }).then(response => {
        console.log('✅ Server burst test result:', response.data);
        return response.data;
      }).catch(error => {
        console.warn('⚠️ Server burst failed, using local fallback:', error.message);
        return { success: false, error: 'Server timeout - used local notifications' };
      });
      
      // Show local burst immediately while server processes
      setTimeout(() => notificationService.showActiveNotification(), 1000);
      setTimeout(() => notificationService.showActiveNotification(), 3000);
      setTimeout(() => notificationService.showActiveNotification(), 6000);
      
      const result = await serverPromise;
      console.log('🎯 Final burst result:', result);
      
      if (result.success) {
        showSuccess(`💥 WhatsApp-style burst notifications initiated!\n\n${result.message}\n\n⚡ These should be VERY noticeable - just like WhatsApp or Teams!\n\nYou'll receive 3 notifications over 9 seconds with strong vibration.`, 'Burst Notifications Sent');
      } else {
        showError('❌ Failed to send burst notifications: ' + result.error);
      }
      
    } catch (error) {
      console.error('Error sending burst notifications:', error);
      console.error('Error details:', error.response?.data);
      showError('Failed to send burst notifications: ' + (error.response?.data?.error || error.message));
    }
  };

  const sendTaskNotification = async (userId, taskData, type = 'task_assigned') => {
    try {
      console.log('🔔 sendTaskNotification called with:', {
        userId,
        taskData,
        type,
        pushNotificationsEnabled
      });
      
      // Prevent rapid duplicate calls (5-second window)
      const notificationKey = `${userId}_${taskData._id || taskData.id}_${type}`;
      const now = Date.now();
      const lastSent = window.recentNotificationCalls?.get(notificationKey);
      
      if (lastSent && (now - lastSent) < 5000) {
        console.log(`⏭️ Skipping duplicate notification call for ${userId} (${type}) - sent ${now - lastSent}ms ago`);
        return { success: true, message: 'Duplicate call skipped' };
      }
      
      // Initialize tracking if not exists
      if (!window.recentNotificationCalls) {
        window.recentNotificationCalls = new Map();
      }
      
      // Record this call
      window.recentNotificationCalls.set(notificationKey, now);
      
      if (!pushNotificationsEnabled) {
        console.log('❌ Push notifications not enabled, skipping...');
        return;
      }
      
      const notificationData = {
        title: getNotificationTitle(type, taskData),
        body: getNotificationBody(type, taskData),
        data: {
          type,
          taskId: taskData._id,
          taskTitle: taskData.title
        }
      };

      console.log('📤 Sending notification data:', notificationData);

      // Send single push notification (no duplicates) 
      // Priority: username first, then _id as fallback
      let targetUserId = userId;
      let fallbackUserId = null;
      let results = [];
      
      // Check if we have user._id as fallback
      const targetUser = users.find(u => u.username === userId);
      if (targetUser && targetUser._id && targetUser._id !== userId) {
        fallbackUserId = targetUser._id;
      }
      
      console.log(`📨 Sending single push to: ${targetUserId}`);
      
      try {
        // Try primary target first
        const response = await axios.post(`${API_URL}/notifications/send-push`, {
          userId: targetUserId,
          ...notificationData
        }, { timeout: 5000 });
        
        console.log(`✅ Push notification sent successfully to ${targetUserId}:`, response.data);
        results = [{ status: 'fulfilled', value: response }];
        
      } catch (primaryError) {
        console.warn(`⚠️ Primary push failed for ${targetUserId}:`, primaryError.response?.data || primaryError.message);
        
        // Try fallback if available
        if (fallbackUserId) {
          console.log(`📨 Trying fallback target: ${fallbackUserId}`);
          try {
            const fallbackResponse = await axios.post(`${API_URL}/notifications/send-push`, {
              userId: fallbackUserId,
              ...notificationData
            }, { timeout: 5000 });
            
            console.log(`✅ Fallback push succeeded for ${fallbackUserId}:`, fallbackResponse.data);
            results = [{ status: 'fulfilled', value: fallbackResponse }];
            
          } catch (fallbackError) {
            console.error(`❌ Both push attempts failed:`, { primary: primaryError.message, fallback: fallbackError.message });
            results = [{ status: 'rejected', reason: primaryError }];
          }
        } else {
          console.error(`❌ Push notification failed and no fallback available`);
          results = [{ status: 'rejected', reason: primaryError }];
        }
      }
      console.log('📊 Push notification results summary:', results.map(r => ({
        status: r.status,
        success: r.status === 'fulfilled' ? r.value?.data?.success : false,
        error: r.status === 'rejected' ? r.reason?.response?.data || r.reason?.message : null
      })));
      
      // Check if any succeeded
      const hasSuccess = results.some(result => 
        result.status === 'fulfilled' && result.value?.data?.success
      );
      
      if (!hasSuccess) {
        console.warn('⚠️ All push notification attempts failed');
      } else {
        console.log('🎉 At least one push notification succeeded');
      }
      
    } catch (error) {
      console.error('💥 Error in sendTaskNotification:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const getNotificationTitle = (type, taskData) => {
    switch (type) {
      case 'task_assigned':
        return '📋 New Task Assigned';
      case 'task_completed':
        return '✅ Task Completed';
      case 'task_overdue':
        return '⚠️ Task Overdue';
      case 'task_reminder':
        return '🔔 Task Reminder';
      default:
        return 'Task Update';
    }
  };

  const getNotificationBody = (type, taskData) => {
    switch (type) {
      case 'task_assigned':
        return `You have been assigned: ${taskData.title}`;
      case 'task_completed':
        return `Task completed: ${taskData.title}`;
      case 'task_overdue':
        return `Task is overdue: ${taskData.title}`;
      case 'task_reminder':
        return `Reminder: ${taskData.title} is due soon`;
      default:
        return `Update for task: ${taskData.title}`;
    }
  };

  // Database Migration Function
  const runDatabaseMigration = async () => {
    try {
      setLoading(true);
      showInfo('Running database migration... This may take a few moments.', 'Migration Started');
      
      const response = await axios.post(`${API_URL}/migration/fix-indexes`);
      
      if (response.data.success) {
        const message = `${response.data.message}\n\n${response.data.steps.join('\n')}\n\n📊 Summary:\n- Total associates: ${response.data.summary.total}\n- With email: ${response.data.summary.withEmail}\n- Without email: ${response.data.summary.withoutEmail}`;
        showSuccess(message, 'Migration Successful');
      } else {
        showError('Migration failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Migration error:', error);
      showError('Failed to run migration: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (newProjectName.trim()) {
      const projectName = newProjectName.trim();
      
      try {
        if (editingProject) {
          // Editing existing project
          const projectToEdit = editingProject._id ? editingProject : 
            { _id: projects.find(p => typeof p === 'object' && p.name === editingProject)?._id };
          
          await axios.put(`${API_URL}/projects/${editingProject._id}`, { name: projectName });
          
          // Update local state
          await loadProjects();
          
          // Update task form if needed
          if (formData.project === editingProject.name) {
            setFormData({...formData, project: projectName});
          }
          
          setEditingProject(null);
        } else {
          // Adding new project
          await axios.post(`${API_URL}/projects`, { 
            name: projectName, 
            username: currentUser?.username 
          });
          await loadProjects();
          setFormData({...formData, project: projectName}); // Auto-select the new project
        }
        
        setNewProjectName('');
        setShowProjectModal(false);
      } catch (error) {
        console.error('Error saving project:', error);
        if (error.response?.data?.message) {
          showError(error.response.data.message);
        } else {
          showError('Failed to save project');
        }
      }
    }
  };

  const editProject = (projectObj) => {
    setEditingProject(projectObj);
    setNewProjectName(projectObj.name);
    setShowProjectModal(true);
  };

  const deleteProject = async (projectObj) => {
    showDeleteConfirm(
      `Are you sure you want to delete the project "${projectObj.name}"?\n\nThis action cannot be undone.`,
      async () => {
      try {
        await axios.delete(`${API_URL}/projects/${projectObj._id}`);
        await loadProjects();
        
        // Clear from task form if selected
        if (formData.project === projectObj.name) {
          setFormData({...formData, project: ''});
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        showError('Failed to delete project');
      }
    });
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/user/${currentUser.username}/read-all`);
      loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    showDeleteConfirm(
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      async () => {
    try {
      await axios.delete(`${API_URL}/notifications/user/${currentUser.username}/clear-all`);
      loadNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      showError('Failed to clear notifications');
    }
  });
  };

  const createNotification = async (taskId, userId, message, type, assignedBy) => {
    try {
      console.log('📢 createNotification called with:', {
        taskId,
        userId,
        message,
        type,
        assignedBy
      });
      
      // Create in-app notification
      await axios.post(`${API_URL}/notifications`, {
        userId,
        taskId,
        message,
        type,
        assignedBy
      });
      
      console.log('✅ In-app notification created successfully');
      
      // Send push notification if enabled
      const task = tasks.find(t => t._id === taskId) || formData;
      console.log('🔍 Found task for push notification:', task ? {
        id: task._id || 'formData',
        title: task.title || formData.title
      } : 'No task found');
      
      if (task) {
        console.log('🚀 Calling sendTaskNotification...');
        await sendTaskNotification(userId, {
          _id: taskId,
          title: task.title || formData.title,
          description: task.description || formData.description
        }, type);
      } else {
        console.warn('⚠️ No task found, skipping push notification');
      }
    } catch (error) {
      console.error('💥 Error creating notification:', error);
    }
  };

  const [formData, setFormData] = useState({
    project: '',
    title: '',
    description: '',
    priority: 'Medium',
    severity: 'Minor',
    inDate: '',
    outDate: '',
    team: '',
    associates: [],
    assignedTo: '',
    assignedBy: '',
    isAssociate: false,
    associateDetails: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    isExternalUser: false,
    externalUserId: '',
    externalUserDetails: null,
    reminder: '',
    whatsapp: false,
    status: 'Pending',
    isConfidential: false
  });

  const resetForm = () => {
    setFormData({
      project: selectedProject || '',
      title: '',
      description: '',
      priority: 'Medium',
      severity: 'Minor',
      inDate: '',
      outDate: '',
      team: '',
      associates: [],
      assignedTo: '',
      assignedBy: currentUser?.username || '',
      isAssociate: false,
      associateDetails: {
        name: '',
        email: '',
        phone: '',
        company: ''
      },
      isExternalUser: false,
      externalUserId: '',
      externalUserDetails: null,
      reminder: '',
      whatsapp: false,
      status: 'Pending',
      isConfidential: false
    });
    setEditingTask(null);
    setSelectedAssociate('');
  };

  const handleSubmit = async () => {
    if (!formData.project || !formData.title || !formData.inDate || !formData.outDate || !formData.assignedTo) {
      showError('Please fill in all required fields including Assigned To', 'Missing Required Fields');
      return;
    }
    
    // Check if associate is selected when isAssociate is true
    if (formData.isAssociate && !selectedAssociate) {
      showError('Please select an associate from the dropdown or add a new one using the Add button', 'Associate Required');
      return;
    }
    
    // Check if external user is selected when isExternalUser is true
    if (formData.isExternalUser && !formData.externalUserId) {
      showError('Please select an external user from the dropdown or add a new one using the Add button', 'External User Required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Clean up the task data before sending
      const taskData = {
        ...formData,
        assignedBy: currentUser.username,
        reminder: formData.reminder && formData.reminder !== '' ? formData.reminder : null,
        associates: Array.isArray(formData.associates) ? formData.associates : []
      };
      
      // Clean up external user fields
      if (!taskData.isExternalUser || !taskData.externalUserId || taskData.externalUserId === '') {
        delete taskData.externalUserId;
        delete taskData.externalUserDetails;
      }
      
      let savedTask;
      if (editingTask) {
        const response = await axios.put(`${API_URL}/tasks/${editingTask._id}`, taskData);
        savedTask = response.data;
        
        // Notify about update
        await createNotification(
          savedTask._id,
          formData.assignedTo,
          `Task "${formData.title}" was updated by ${currentUser.name}`,
          'task_updated',
          currentUser.username
        );
      } else {
        const response = await axios.post(`${API_URL}/tasks`, taskData);
        savedTask = response.data;
        
        // Notify assigned user
        await createNotification(
          savedTask._id,
          formData.assignedTo,
          `New task "${formData.title}" assigned to you by ${currentUser.name}`,
          'task_assigned',
          currentUser.username
        );
      }
      
      await loadTasks();
      setShowTaskModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save task';
      showError(`Failed to save task: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setConfirmDialogData({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      onConfirm: () => performDeleteTask(id)
    });
    setShowConfirmDialog(true);
  };

  const createSubtask = async (parentTask, subtaskData) => {
    try {
      setLoading(true);
      
      const newSubtask = {
        ...subtaskData,
        parentTask: parentTask._id,
        isSubtask: true,
        project: parentTask.project,
        assignedBy: currentUser.username
      };
      
      const response = await axios.post(`${API_URL}/tasks`, newSubtask);
      const savedSubtask = response.data;
      
      // Update parent task with subtask reference
      await axios.put(`${API_URL}/tasks/${parentTask._id}`, {
        ...parentTask,
        subtasks: [...(parentTask.subtasks || []), savedSubtask._id]
      });
      
      // Notify assigned user
      await createNotification(
        savedSubtask._id,
        subtaskData.assignedTo,
        `New subtask "${subtaskData.title}" assigned from task "${parentTask.title}" by ${currentUser.name}`,
        'task_assigned',
        currentUser.username
      );
      
      await loadTasks();
      setShowSubtaskModal(false);
      setParentTaskForSubtask(null);
      resetForm();
      showSuccess('Subtask created successfully');
    } catch (error) {
      console.error('Error creating subtask:', error);
      showError('Failed to create subtask: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const performDeleteTask = async (id) => {
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/tasks/${id}`);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showError('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const copyTaskToClipboard = (task) => {
    const taskInfo = `Project: ${task.project}
Task Name: ${task.title}
Description: ${task.description || 'No description'}
Target Date: ${new Date(task.dueDate || task.outDate).toLocaleDateString('en-GB')}
Priority: ${task.priority}`;
    
    navigator.clipboard.writeText(taskInfo).then(() => {
      setCopiedTaskData(taskInfo);
      showSuccess('Task details copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showError('Failed to copy task details');
    });
  };

  const sendToWhatsApp = (task) => {
    // Use same format as copy function
    const taskInfo = `Project: ${task.project}
Task Name: ${task.title}
Description: ${task.description || 'No description'}
Target Date: ${new Date(task.dueDate || task.outDate).toLocaleDateString('en-GB')}
Priority: ${task.priority}`;
    
    const phoneNumber = task.isAssociate && task.associateDetails?.phone 
      ? task.associateDetails.phone.replace(/\D/g, '')
      : '';
    
    const whatsappUrl = phoneNumber 
      ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(taskInfo)}`
      : `https://wa.me/?text=${encodeURIComponent(taskInfo)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const copyBulkTasksToClipboard = () => {
    if (selectedAssociateTasks.length === 0) {
      showWarning('Please select tasks to copy', 'No Tasks Selected');
      return;
    }

    const tasksInfo = selectedAssociateTasks.map(taskId => {
      const task = tasks.find(t => t._id === taskId);
      if (!task) return '';

      return `Project: ${task.project}
Task Name: ${task.title}
Description: ${task.description || 'No description'}
Target Date: ${new Date(task.dueDate || task.outDate).toLocaleDateString('en-GB')}
Priority: ${task.priority}`;
    }).filter(Boolean).join('\n' + '='.repeat(49) + '\n');

    navigator.clipboard.writeText(tasksInfo).then(() => {
      showSuccess(`${selectedAssociateTasks.length} tasks copied to clipboard!`);
      setSelectedAssociateTasks([]);
    }).catch(err => {
      console.error('Failed to copy:', err);
      showError('Failed to copy tasks');
    });
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedAssociateTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleAllTasksSelection = (taskIds) => {
    if (selectedAssociateTasks.length === taskIds.length) {
      setSelectedAssociateTasks([]);
    } else {
      setSelectedAssociateTasks(taskIds);
    }
  };

  const editTask = (task) => {
    setFormData({
      project: task.project,
      title: task.title,
      description: task.description,
      priority: task.priority,
      severity: task.severity,
      inDate: task.inDate ? new Date(task.inDate).toISOString().split('T')[0] : '',
      outDate: task.outDate ? new Date(task.outDate).toISOString().split('T')[0] : '',
      team: task.team,
      associates: task.associates,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      isAssociate: task.isAssociate || false,
      associateDetails: task.associateDetails || {
        name: '',
        email: '',
        phone: '',
        company: ''
      },
      reminder: task.reminder ? new Date(task.reminder).toISOString().slice(0, 16) : '',
      whatsapp: task.whatsapp,
      status: task.status
    });
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setTasks([]);
    setNotifications([]);
  };

  // Search functionality
  const handleSearchChange = useCallback((viewName, term) => {
    console.log(`🔄 [Search State Update] ${viewName}:`);
    console.log(`   📝 Setting search term: "${term}"`);
    console.log(`   🔄 Resetting to page 1`);
    console.log(`   ⏰ Update time: ${new Date().toLocaleTimeString()}.${Date.now() % 1000}`);
    
    setSearchTerms(prev => ({ ...prev, [viewName]: term }));
    setCurrentPages(prev => ({ ...prev, [viewName]: 1 })); // Reset to first page on search
    
        console.log(`   ✅ Search state updated for ${viewName}`);
        console.log(`📊 [Summary] Current debounce setting: ${SEARCH_DEBOUNCE_DELAY}ms - Adjust line 76 to change timing`);
  }, [SEARCH_DEBOUNCE_DELAY]);  const filterTasksBySearch = useCallback((tasks, searchTerm) => {
    if (!searchTerm?.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter(task => 
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.project?.toLowerCase().includes(term) ||
      task.assignedTo?.name?.toLowerCase().includes(term) ||
      task.assignedBy?.name?.toLowerCase().includes(term) ||
      task.status?.toLowerCase().includes(term)
    );
  }, []);

  // Pagination functionality
  const paginateTasks = useCallback((tasks, page, perPage = itemsPerPage) => {
    const startIndex = (page - 1) * perPage;
    return tasks.slice(startIndex, startIndex + perPage);
  }, [itemsPerPage]);

  const getTotalPages = useCallback((tasks, perPage = itemsPerPage) => {
    return Math.ceil(tasks.length / perPage);
  }, [itemsPerPage]);

  const handlePageChange = useCallback((viewName, page) => {
    setCurrentPages(prev => ({ ...prev, [viewName]: page }));
  }, []);

  // Memoized Search Input Component with local state to prevent re-render issues
  const SearchInput = React.memo(({ viewName, placeholder, searchValue, onSearchChange }) => {
    const [localValue, setLocalValue] = useState(searchValue);
    const timeoutRef = useRef(null);
    const lastTypingTimeRef = useRef(null);

    // Update local value when external search value changes (like when cleared)
    useEffect(() => {
      setLocalValue(searchValue);
    }, [searchValue]);

    const handleInputChange = useCallback((e) => {
      const value = e.target.value;
      const currentTime = Date.now();
      const timeSinceLastType = lastTypingTimeRef.current ? currentTime - lastTypingTimeRef.current : 0;
      
      lastTypingTimeRef.current = currentTime;
      setLocalValue(value);
      
      console.log(`🔍 [Search Debounce] ${viewName}:`);
      console.log(`   📝 Input: "${value}" (length: ${value.length})`);
      console.log(`   ⏰ Time: ${new Date().toLocaleTimeString()}.${currentTime % 1000}`);
      console.log(`   ⚡ Gap since last keystroke: ${timeSinceLastType}ms`);
      
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log(`   🚫 Previous debounce timer cleared`);
      }
      
      // Set new timeout for debounced search
      timeoutRef.current = setTimeout(() => {
        const actualDebounceTime = Date.now() - currentTime;
        console.log(`🎯 [Search Execute] ${viewName}:`);
        console.log(`   📊 Search term: "${value}"`);
        console.log(`   ⏱️  Actual debounce time: ${actualDebounceTime}ms (target: ${SEARCH_DEBOUNCE_DELAY}ms)`);
        console.log(`   🕐 Executed at: ${new Date().toLocaleTimeString()}.${Date.now() % 1000}`);
        console.log(`   📈 Performance: ${actualDebounceTime <= SEARCH_DEBOUNCE_DELAY + 50 ? '✅ Good' : '⚠️ Slow (>${SEARCH_DEBOUNCE_DELAY + 50}ms)'}`);
        onSearchChange(viewName, value);
      }, SEARCH_DEBOUNCE_DELAY);
      
      console.log(`   ⏳ New debounce timer set for ${SEARCH_DEBOUNCE_DELAY}ms`);
      console.log(`   ────────────────────────────────────────`);
    }, [viewName, onSearchChange, SEARCH_DEBOUNCE_DELAY]);

    const handleClear = useCallback(() => {
      console.log(`🗑️  [Search Clear] ${viewName}: Clearing search input`);
      setLocalValue('');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log(`   ⏹️  Debounce timer cancelled due to clear`);
      }
      lastTypingTimeRef.current = null;
      onSearchChange(viewName, '');
      console.log(`   ✅ Search cleared and filters reset`);
    }, [viewName, onSearchChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder={placeholder}
              value={localValue}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {localValue && (
            <button
              onClick={handleClear}
              className="px-3 py-3 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  });

  // Pagination controls component
  const PaginationControls = ({ viewName, totalTasks, currentPage }) => {
    const totalPages = getTotalPages(totalTasks);
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="pagination-controls" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => handlePageChange(viewName, currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            color: currentPage === 1 ? '#999' : '#333'
          }}
        >
          Previous
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={index} style={{ padding: '8px 4px', color: '#999' }}>...</span>
          ) : (
            <button
              key={index}
              onClick={() => handlePageChange(viewName, page)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: currentPage === page ? '#007bff' : '#fff',
                color: currentPage === page ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: currentPage === page ? 'bold' : 'normal'
              }}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(viewName, currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            color: currentPage === totalPages ? '#999' : '#333'
          }}
        >
          Next
        </button>
        
        <span style={{ marginLeft: '15px', color: '#666', fontSize: '14px' }}>
          Page {currentPage} of {totalPages} ({totalTasks.length} tasks)
        </span>
      </div>
    );
  };

  const handleCompleteTask = (task) => {
    setSelectedTask(task);
    setCompletionReason('');
    setShowCompleteModal(true);
  };

  const handleMarkOverdue = (task) => {
    setSelectedTask(task);
    setOverdueReason('');
    setShowOverdueModal(true);
  };

  const submitCompleteTask = async () => {
    if (!completionReason.trim()) {
      showError('Please provide a reason for task completion', 'Reason Required');
      return;
    }

    try {
      setLoading(true);
      const updatedTask = {
        ...selectedTask,
        status: 'Completed',
        completionReason: completionReason,
        completedAt: new Date().toISOString()
      };
      
      await axios.put(`${API_URL}/tasks/${selectedTask._id}`, updatedTask);
      
      // Notify task creator
      await createNotification(
        selectedTask._id,
        selectedTask.assignedBy,
        `Task "${selectedTask.title}" completed by ${currentUser.name}. Reason: ${completionReason}`,
        'task_completed',
        currentUser.username
      );
      
      await loadTasks();
      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionReason('');
    } catch (error) {
      console.error('Error completing task:', error);
      showError('Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const submitMarkOverdue = async () => {
    if (!overdueReason.trim()) {
      showError('Please provide a reason for marking as overdue', 'Reason Required');
      return;
    }

    try {
      setLoading(true);
      const updatedTask = {
        ...selectedTask,
        status: 'Overdue',
        overdueReason: overdueReason
      };
      
      await axios.put(`${API_URL}/tasks/${selectedTask._id}`, updatedTask);
      
      // Notify task creator
      await createNotification(
        selectedTask._id,
        selectedTask.assignedBy,
        `Task "${selectedTask.title}" marked as overdue by ${currentUser.name}. Reason: ${overdueReason}`,
        'task_overdue',
        currentUser.username
      );
      
      await loadTasks();
      setShowOverdueModal(false);
      setSelectedTask(null);
      setOverdueReason('');
    } catch (error) {
      console.error('Error marking task as overdue:', error);
      showError('Failed to mark task as overdue');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    // If changing to Completed, show completion modal
    if (newStatus === 'Completed') {
      setSelectedTask(task);
      setCompletionReason('');
      setShowCompleteModal(true);
      return;
    }

    // If changing to Overdue, show overdue modal
    if (newStatus === 'Overdue') {
      setSelectedTask(task);
      setOverdueReason('');
      setShowOverdueModal(true);
      return;
    }

    try {
      setLoading(true);
      
      // Clean task data - only send necessary fields for update
      const taskUpdateData = {
        project: task.project,
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        severity: task.severity,
        inDate: task.inDate,
        outDate: task.outDate,
        team: task.team || '',
        associates: Array.isArray(task.associates) ? task.associates : [],
        assignedBy: task.assignedBy,
        assignedTo: task.assignedTo,
        isAssociate: task.isAssociate || false,
        associateDetails: task.associateDetails || { name: '', email: '', phone: '', company: '' },
        whatsapp: task.whatsapp || false,
        status: newStatus,
        completionReason: task.completionReason || '',
        overdueReason: task.overdueReason || ''
      };
      
      // Only include reminder if it's a valid date
      if (task.reminder && task.reminder !== '') {
        taskUpdateData.reminder = task.reminder;
      }
      
      console.log('Sending task update:', taskUpdateData);
      
      const response = await axios.put(`${API_URL}/tasks/${task._id}`, taskUpdateData);
      
      // Notify task creator about status change
      await createNotification(
        task._id,
        task.assignedBy,
        `Task "${task.title}" status changed to ${newStatus} by ${currentUser.name}`,
        'task_updated',
        currentUser.username
      );
      
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.details || error.message || 'Failed to update task status';
      showError(`Failed to update task status: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };



  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Filter out confidential tasks from All Tasks view
      if (task.isConfidential) return false;
      // Filter out subtasks if the filter is set to 'false'
      if (filters.showSubtasks === 'false' && task.isSubtask) return false;
      if (filters.project && task.project !== filters.project) return false;
      if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
      if (filters.team && task.team !== filters.team) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.severity && task.severity !== filters.severity) return false;
      
      // Handle status filtering with special logic for overdue
      if (filters.status) {
        if (filters.status === 'Overdue') {
          // For overdue filter, include tasks with "Overdue" status OR tasks past due date that aren't completed
          const dueDate = new Date(task.outDate);
          dueDate.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM
          const isPastDue = new Date() > dueDate && task.status !== 'Completed';
          if (!(task.status === 'Overdue' || isPastDue)) return false;
        } else {
          // For other statuses, check exact match (but exclude tasks that are past due)
          const dueDate = new Date(task.outDate);
          dueDate.setHours(23, 59, 59, 999);
          const isPastDue = new Date() > dueDate && task.status !== 'Completed';
          if (isPastDue || task.status !== filters.status) return false;
        }
      }
      
      return true;
    });
  };

  const getMyTasks = () => {
    return tasks.filter(task => task.assignedTo === currentUser?.username);
  };

  const getTasksAssignedByMe = () => {
    return tasks.filter(task => task.assignedBy === currentUser?.username);
  };



  const voiceInput = () => {
    setIsRecording(!isRecording);
    setTimeout(() => setIsRecording(false), 2000);
  };

  // Admin Reporting Functions
  const generateAdminReport = useCallback(async () => {
    setLoadingReport(true);
    
    // Show loading notification
    showSuccess('🔄 Generating comprehensive report...', 'Report Generation');
    
    try {
      const currentDate = new Date();
      let startDate, endDate;
      let reportTasks;

      // First apply date filtering
      switch (reportType) {
        case 'alltime':
          reportTasks = tasks; // Include all tasks
          startDate = new Date('2020-01-01'); // Default start date
          endDate = currentDate;
          break;
        case 'quarterly':
          startDate = new Date(selectedYear, (selectedQuarter - 1) * 3, 1);
          endDate = new Date(selectedYear, selectedQuarter * 3, 0);
          reportTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
            return taskDate >= startDate && taskDate <= endDate;
          });
          break;
        case 'halfyearly':
          const selectedHalf = selectedQuarter <= 2 ? 1 : 2; // Q1-Q2 = H1, Q3-Q4 = H2
          startDate = new Date(selectedYear, (selectedHalf - 1) * 6, 1);
          endDate = new Date(selectedYear, selectedHalf * 6, 0);
          reportTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
            return taskDate >= startDate && taskDate <= endDate;
          });
          break;
        case 'yearly':
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          reportTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
            return taskDate >= startDate && taskDate <= endDate;
          });
          break;
        case 'custom':
          startDate = reportDateRange.start;
          endDate = reportDateRange.end;
          reportTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
            return taskDate >= startDate && taskDate <= endDate;
          });
          break;
        default:
          reportTasks = tasks;
          startDate = new Date('2020-01-01');
          endDate = currentDate;
      }

      // For user filtering, we keep all tasks in the date range and filter later in byUser and byAssociate sections
      // This allows us to have different filtering logic for Individual Performance vs Associate Performance

      // Debug logs (commented out to reduce console noise)
      // console.log('Total tasks available:', tasks.length);
      // console.log('Filtered tasks for report:', reportTasks.length);
      // console.log('Report type:', reportType);
      // console.log('Date range:', startDate, 'to', endDate);

      // Get user information for the report
      const selectedUserObj = selectedReportUser === 'all' ? null : users.find(u => u.username === selectedReportUser);
      
      // Debug logging for troubleshooting
      console.log('🔍 Report Generation Debug:');
      console.log('- Report Type:', reportType);
      console.log('- Selected User:', selectedReportUser);
      console.log('- Total Tasks Available:', tasks.length);
      console.log('- Filtered Tasks by Date:', reportTasks.length);
      console.log('- Date Range:', startDate, 'to', endDate);
      
      // Define userTasks based on selection - for summary statistics
      // For 'all' users: show all non-associate tasks in date range
      // For specific user: show only tasks assigned to that user in date range
      let userTasks;
      if (selectedReportUser === 'all') {
        userTasks = reportTasks.filter(t => !t.isAssociate);
      } else {
        userTasks = reportTasks.filter(t => !t.isAssociate && t.assignedTo === selectedReportUser);
      }
      
      console.log('- User-filtered Tasks:', userTasks.length);
      
      // Generate proper report period label based on type
      let periodLabel;
      switch (reportType) {
        case 'alltime':
          periodLabel = 'All Time (Complete History)';
          break;
        case 'quarterly':
          periodLabel = `Q${selectedQuarter} ${selectedYear} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
          break;
        case 'halfyearly':
          const half = selectedQuarter <= 2 ? 'H1' : 'H2';
          periodLabel = `${half} ${selectedYear} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
          break;
        case 'yearly':
          periodLabel = `Year ${selectedYear} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
          break;
        case 'custom':
          periodLabel = `Custom Range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
          break;
        default:
          periodLabel = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
      }
      
      // Generate comprehensive report data
      const report = {
        user: {
          isSpecificUser: selectedReportUser !== 'all',
          username: selectedReportUser,
          name: selectedUserObj ? selectedUserObj.name : 'All Users',
          role: selectedUserObj ? selectedUserObj.role : 'System-wide'
        },
        period: {
          type: reportType,
          startDate,
          endDate,
          label: periodLabel
        },
        summary: {
          totalTasks: userTasks.length,
          completed: userTasks.filter(t => t.status === 'Completed').length,
          pending: userTasks.filter(t => t.status === 'Pending').length,
          inProgress: userTasks.filter(t => t.status === 'In Progress').length,
          inChecking: userTasks.filter(t => t.status === 'In Checking').length,
          overdue: userTasks.filter(t => {
            const dueDate = new Date(t.outDate);
            dueDate.setHours(23, 59, 59, 999);
            const isOverdue = new Date() > dueDate && t.status !== 'Completed';
            return isOverdue || t.status === 'Overdue';
          }).length
        },
        byUser: {},
        byAssociate: {},
        byPriority: {
          High: userTasks.filter(t => t.priority === 'High').length,
          Medium: userTasks.filter(t => t.priority === 'Medium').length,
          Low: userTasks.filter(t => t.priority === 'Low').length
        },
        completionRate: userTasks.length > 0 ? 
          (userTasks.filter(t => t.status === 'Completed').length / userTasks.length * 100).toFixed(2) : '0'
      };

      // Group by user - only include selected user if specific user is chosen
      if (selectedReportUser === 'all') {
        users.forEach(user => {
          const userTasks = reportTasks.filter(t => !t.isAssociate && t.assignedTo === user.username);
          if (userTasks.length > 0) {
            report.byUser[user.name] = {
              total: userTasks.length,
              completed: userTasks.filter(t => t.status === 'Completed').length,
              pending: userTasks.filter(t => t.status === 'Pending').length,
              inProgress: userTasks.filter(t => t.status === 'In Progress').length,
              inChecking: userTasks.filter(t => t.status === 'In Checking').length,
              overdue: userTasks.filter(t => {
                const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
                return isOverdue || t.status === 'Overdue';
              }).length,
              completionRate: userTasks.length > 0 ? 
                (userTasks.filter(t => t.status === 'Completed').length / userTasks.length * 100).toFixed(2) : 0
            };
          }
        });
      } else {
        // Only show the selected user's data - use tasks assigned TO the user only for Individual Performance
        const selectedUser = users.find(u => u.username === selectedReportUser);
        if (selectedUser) {
          const userTasks = reportTasks.filter(t => !t.isAssociate && t.assignedTo === selectedUser.username);
          if (userTasks.length > 0) {
            report.byUser[selectedUser.name] = {
              total: userTasks.length,
              completed: userTasks.filter(t => t.status === 'Completed').length,
              pending: userTasks.filter(t => t.status === 'Pending').length,
              inProgress: userTasks.filter(t => t.status === 'In Progress').length,
              overdue: userTasks.filter(t => {
                const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
                return isOverdue || t.status === 'Overdue';
              }).length,
              completionRate: userTasks.length > 0 ? 
                (userTasks.filter(t => t.status === 'Completed').length / userTasks.length * 100).toFixed(2) : 0
            };
          }
        }
      }

      // Group by associate - properly filter based on user selection and date range
      let associateTasksForReport;
      if (selectedReportUser === 'all') {
        // Show all associates in the date range
        associateTasksForReport = reportTasks.filter(t => t.isAssociate);
      } else {
        // Only show associates assigned by the selected user in the date range
        associateTasksForReport = reportTasks.filter(t => t.isAssociate && t.assignedBy === selectedReportUser);
      }
      
      console.log('- Associate Tasks:', associateTasksForReport.length);
      
      const uniqueAssociates = [...new Set(associateTasksForReport.map(t => t.associateDetails?.name).filter(Boolean))];
      uniqueAssociates.forEach(associateName => {
        const assocTasks = associateTasksForReport.filter(t => t.associateDetails?.name === associateName);
        report.byAssociate[associateName] = {
          total: assocTasks.length,
          completed: assocTasks.filter(t => t.status === 'Completed').length,
          pending: assocTasks.filter(t => t.status === 'Pending').length,
          inProgress: assocTasks.filter(t => t.status === 'In Progress').length,
          overdue: assocTasks.filter(t => {
            const dueDate = new Date(t.outDate);
            dueDate.setHours(23, 59, 59, 999);
            const isOverdue = new Date() > dueDate && t.status !== 'Completed';
            return isOverdue || t.status === 'Overdue';
          }).length,
          completionRate: assocTasks.length > 0 ? 
            (assocTasks.filter(t => t.status === 'Completed').length / assocTasks.length * 100).toFixed(2) : '0'
        };
      });
      
      console.log('- Unique Associates Found:', uniqueAssociates.length, uniqueAssociates);



      setReportData(report);
      
      // Show success notification with report summary
      const totalTasks = report.summary.totalTasks;
      const completionRate = report.completionRate;
      showSuccess(
        `📊 Report generated successfully!\n📈 ${totalTasks} tasks analyzed\n✅ ${completionRate}% completion rate`, 
        'Report Complete'
      );
      
    } catch (error) {
      console.error('Error generating report:', error);
      showError(
        'Failed to generate report. Please try again or contact support if the issue persists.', 
        'Report Generation Failed'
      );
    } finally {
      setLoadingReport(false);
    }
  }, [tasks, users, reportType, reportDateRange, selectedYear, selectedQuarter, selectedReportUser, showSuccess, showError]);

  // Export Functions
  const exportToExcel = useCallback((data, filename = 'task_report') => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['TriDo Report'],
      ['Period', data.period.label],
      ['Report Type', data.period.type.toUpperCase()],
      ['Generated On', new Date().toLocaleDateString()],
      [''],
      ['SUMMARY'],
      ['Total Tasks', data.summary.totalTasks],
      ['Completed', data.summary.completed],
      ['Pending', data.summary.pending],
      ['In Progress', data.summary.inProgress],
      ['Overdue', data.summary.overdue],
      ['Completion Rate (%)', data.completionRate]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // User Analysis Sheet
    const userData = [['User', 'Total Tasks', 'Completed', 'Pending', 'In Progress', 'Overdue', 'Completion Rate (%)']];
    Object.entries(data.byUser).forEach(([user, stats]) => {
      userData.push([user, stats.total, stats.completed, stats.pending, stats.inProgress, stats.overdue, stats.completionRate]);
    });
    const userSheet = XLSX.utils.aoa_to_sheet(userData);
    XLSX.utils.book_append_sheet(wb, userSheet, 'User Analysis');

    // Associate Analysis Sheet
    if (data.byAssociate && Object.keys(data.byAssociate).length > 0) {
      const associateData = [['Associate', 'Total Tasks', 'Completed', 'Pending', 'In Progress', 'Overdue', 'Completion Rate (%)']];
      Object.entries(data.byAssociate).forEach(([associate, stats]) => {
        associateData.push([associate, stats.total, stats.completed, stats.pending, stats.inProgress, stats.overdue, stats.completionRate]);
      });
      const associateSheet = XLSX.utils.aoa_to_sheet(associateData);
      XLSX.utils.book_append_sheet(wb, associateSheet, 'Associate Analysis');
    }



    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, []);

  const exportToPDF = useCallback((data, filename = 'task_report') => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('TriDo Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Period Info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Period: ${data.period.label}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Report Type: ${data.period.type.toUpperCase()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;

    // Summary Table
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Count']],
      body: [
        ['Total Tasks', data.summary.totalTasks],
        ['Completed', data.summary.completed],
        ['Pending', data.summary.pending],
        ['In Progress', data.summary.inProgress],
        ['Overdue', data.summary.overdue],
        ['Completion Rate (%)', data.completionRate + '%']
      ],
      theme: 'grid'
    });

    // User Analysis (New Page)
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('User Analysis', 20, yPosition);
    yPosition += 10;

    const userRows = Object.entries(data.byUser).map(([user, stats]) => [
      user, stats.total, stats.completed, stats.pending, stats.inProgress, stats.overdue, stats.completionRate + '%'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['User', 'Total', 'Completed', 'Pending', 'In Progress', 'Overdue', 'Completion Rate']],
      body: userRows,
      theme: 'grid'
    });

    // Associate Analysis
    if (data.byAssociate && Object.keys(data.byAssociate).length > 0) {
      yPosition = doc.lastAutoTable.finalY + 20;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Associate Analysis', 20, yPosition);
      yPosition += 10;

      const associateRows = Object.entries(data.byAssociate).map(([associate, stats]) => [
        associate, stats.total, stats.completed, stats.pending, stats.inProgress, stats.overdue, stats.completionRate + '%'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Associate', 'Total', 'Completed', 'Pending', 'In Progress', 'Overdue', 'Completion Rate']],
        body: associateRows,
        theme: 'grid'
      });
    }



    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }, []);

  const exportTaskList = useCallback((taskList, format = 'excel', filename = 'tasks') => {
    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const taskData = taskList.map(task => ({
        'Project': task.project,
        'Title': task.title,
        'Description': task.description,
        'Status': task.status,
        'Priority': task.priority,
        'Assigned To': task.assignedTo,
        'Assigned By': task.assignedBy,
        'Start Date': task.inDate ? new Date(task.inDate).toLocaleDateString() : '',
        'Due Date': task.outDate ? new Date(task.outDate).toLocaleDateString() : '',
        'Created Date': task.createdDate ? new Date(task.createdDate).toLocaleDateString() : ''
      }));
      const ws = XLSX.utils.json_to_sheet(taskData);
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  }, []);

  // Login Screen Component
  const LoginScreen = () => {
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerData, setRegisterData] = useState({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'Employee',
      department: ''
    });

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        const response = await axios.post(`${API_URL}/users/login`, loginData);
        const user = response.data.user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        showError(error.response?.data?.message || 'Login failed', 'Login Failed');
      } finally {
        setLoading(false);
      }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        await axios.post(`${API_URL}/users/register`, registerData);
        showSuccess('Registration successful! Please login.');
        setIsRegistering(false);
        setRegisterData({
          username: '',
          password: '',
          name: '',
          email: '',
          role: 'Employee',
          department: ''
        });
      } catch (error) {
        showError(error.response?.data?.message || 'Registration failed', 'Registration Failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">TriDo</h1>
            <p className="text-gray-600 mt-2">
              {isRegistering ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Don't have an account? Register
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={registerData.department}
                  onChange={(e) => setRegisterData({...registerData, department: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., IT, Sales, HR"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}


        </div>
      </div>
    );
  };

  // Horizontal Task Card for list view
  // Table View Component
  const TableView = ({ tasks, showActions = true, showStats = false, stats, showCopyButton = false }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getStatusBadge = (task) => {
      const isPastDue = new Date(task.outDate) < new Date() && task.status !== 'Completed';
      const status = isPastDue ? 'Overdue' : task.status;
      
      const colors = {
        'Pending': 'bg-yellow-100 text-yellow-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'Completed': 'bg-green-100 text-green-700',
        'Overdue': 'bg-red-100 text-red-700'
      };
      
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
          {status}
        </span>
      );
    };

    const getAttendanceBadge = (status) => {
      const colors = {
        'Present': 'bg-green-100 text-green-700',
        'Absent': 'bg-red-100 text-red-700',
        'At office': 'bg-blue-100 text-blue-700'
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
          {status}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        {showStats && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-3 sm:p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-xs font-medium">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stats.pending}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 sm:p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">In Progress</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stats.inProgress}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-3 sm:p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-xs font-medium">In Checking</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stats.inChecking}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 sm:p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stats.completed}</p>
                </div>
                <Check className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-3 sm:p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-xs font-medium">Overdue</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completion Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned By</th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task, index) => {
                const assignedUser = users.find(u => u.username === task.assignedTo);
                
                return (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                          {task.isAssociate && task.associateDetails?.name 
                            ? task.associateDetails.name.charAt(0).toUpperCase() 
                            : (assignedUser?.name?.charAt(0) || 'U')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {task.isAssociate && task.associateDetails?.name 
                              ? `${task.associateDetails.name}${task.associateDetails.company ? ` (${task.associateDetails.company})` : ''}`
                              : (assignedUser?.name || task.assignedTo)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{getProjectName(task.project)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.description || 'No description'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(task.inDate || task.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {/* Due Date with conditional red color */}
                      {task.outDate ? (
                        <div>
                          {(() => {
                            // Create due date at end of day (23:59:59) for proper comparison
                            const dueDate = new Date(task.outDate);
                            dueDate.setHours(23, 59, 59, 999);
                            const isOverdue = new Date() > dueDate;
                            
                            return (
                              <React.Fragment>
                                <div className={`text-sm ${
                                  // Red if current time > due date end of day (23:59:59) AND task not completed before due date
                                  isOverdue && (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate)) ? 'text-red-600 font-semibold' : 'text-gray-700'
                                }`}>
                                  {formatDate(task.outDate)}
                                </div>
                                {/* Status line below due date */}
                                <div className={`text-xs mt-1 ${
                                  // If current time > due date end of day and task is not completed before due date
                                  isOverdue && 
                                  (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate))
                                    ? 'text-red-600 font-semibold' 
                                    : task.status === 'Completed' 
                                      ? 'text-green-600' 
                                      : 'text-gray-500'
                                }`}>
                                  {/* Show status based on conditions */}
                                  {isOverdue && 
                                   (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate))
                                    ? 'Overdue'
                                    : task.status === 'Completed' 
                                      ? 'Completed'
                                      : 'Pending'}
                                </div>
                              </React.Fragment>
                            );
                          })()}
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-700">-</div>
                          <div className="text-xs text-gray-500 mt-1">{task.status === 'Completed' ? 'Completed' : 'Pending'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusDropdown(task)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {/* Completion Date - only show when status is Completed */}
                      {task.status === 'Completed' && task.completedAt ? (
                        <div className="text-sm text-green-600">
                          {formatDate(task.completedAt)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{task.assignedBy}</span>
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                            {/* Copy and WhatsApp buttons for associate tasks */}
                            {showCopyButton && (
                              <>
                                <button
                                  onClick={() => copyTaskToClipboard(task)}
                                  className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                                  title="Copy Task Details"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => sendToWhatsApp(task)}
                                  className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                  title="Send via WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {/* View Details - Always visible */}
                            <button
                              onClick={() => {
                                setTaskDetails(task);
                                setShowTaskDetailsModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>



                            {/* Edit button - always visible for editable tasks */}
                            <button
                              onClick={() => editTask(task)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            {/* Create Subtask button - for assigned tasks where user can create subtasks */}
                            {task.assignedTo === currentUser?.username && (currentUser?.username === 'ketul.lathia' || getMyTeamMembers().length > 0) && (
                              <button
                                onClick={() => {
                                  setParentTaskForSubtask(task);
                                  // Format dates for date input fields (YYYY-MM-DD)
                                  const formatDate = (date) => {
                                    if (!date) return '';
                                    const d = new Date(date);
                                    return d.toISOString().split('T')[0];
                                  };
                                  setFormData({
                                    project: task.project,
                                    title: task.title, // Pre-fill with parent task name
                                    description: task.description,
                                    priority: task.priority,
                                    severity: task.severity,
                                    inDate: formatDate(task.inDate),
                                    outDate: formatDate(task.outDate),
                                    team: task.team,
                                    associates: [],
                                    assignedTo: '', // Keep empty for user selection
                                    assignedBy: currentUser.username,
                                    isAssociate: false,
                                    associateDetails: {
                                      name: '',
                                      email: '',
                                      phone: '',
                                      company: ''
                                    },
                                    isExternalUser: false,
                                    externalUserId: '',
                                    externalUserDetails: null,
                                    reminder: task.reminder || '',
                                    whatsapp: task.whatsapp || false,
                                    status: 'Pending',
                                    isConfidential: task.isConfidential || false
                                  });
                                  setShowSubtaskModal(true);
                                }}
                                className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                                title="Create Subtask"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete button - only for authorized users */}
                            {(currentUser?.role === 'Admin' || task.assignedBy === currentUser?.username) && (
                              <button
                                onClick={() => deleteTask(task._id)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    );
  };

  const HorizontalTaskCard = ({ task, showActions = true, showCopyButton = false }) => {
    const isOverdue = new Date(task.outDate) < new Date() && task.status !== 'Completed';
    const daysUntilDue = Math.ceil((new Date(task.outDate) - new Date()) / (1000 * 60 * 60 * 24));
    const assignedUser = users.find(u => u.username === task.assignedTo);
    const assignedByUser = users.find(u => u.username === task.assignedBy);

    return (
      <div className={`bg-white rounded-lg border-2 p-3 sm:p-4 hover:shadow-md transition-all ${STATUS_COLORS[task.status]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{getProjectName(task.project)}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]} border inline-block w-fit`}>
                {task.priority}
              </span>
            </div>
            <h4 className="font-medium text-gray-800 text-sm mb-1">{task.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description'}</p>
          </div>
          {showActions && (
            <div className="flex items-center gap-1 ml-2 sm:ml-4 flex-shrink-0">
              {/* Copy and WhatsApp buttons for associate tasks */}
              {showCopyButton && (
                <>
                  <button
                    onClick={() => copyTaskToClipboard(task)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Copy Task Details"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => sendToWhatsApp(task)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Send via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                </>
              )}
              
              {/* Edit button - always visible */}
              <button
                onClick={() => editTask(task)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Task"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Create Subtask button - for tasks where user can create subtasks */}
              {task.assignedTo === currentUser?.username && (currentUser?.username === 'ketul.lathia' || getMyTeamMembers().length > 0) && (
                <button
                  onClick={() => {
                    setParentTaskForSubtask(task);
                    // Format dates for date input fields (YYYY-MM-DD)
                    const formatDate = (date) => {
                      if (!date) return '';
                      const d = new Date(date);
                      return d.toISOString().split('T')[0];
                    };
                    setFormData({
                      project: task.project,
                      title: task.title, // Pre-fill with parent task name
                      description: task.description,
                      priority: task.priority,
                      severity: task.severity,
                      inDate: formatDate(task.inDate),
                      outDate: formatDate(task.outDate),
                      team: task.team,
                      associates: [],
                      assignedTo: '', // Keep empty for user selection
                      assignedBy: currentUser.username,
                      isAssociate: false,
                      associateDetails: {
                        name: '',
                        email: '',
                        phone: '',
                        company: ''
                      },
                      isExternalUser: false,
                      externalUserId: '',
                      externalUserDetails: null,
                      reminder: task.reminder || '',
                      whatsapp: task.whatsapp || false,
                      status: 'Pending',
                      isConfidential: task.isConfidential || false
                    });
                    setShowSubtaskModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Create Subtask"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              {(currentUser?.role === 'Admin' || task.assignedBy === currentUser?.username) && (
                <button
                  onClick={() => deleteTask(task._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <span className="text-gray-500">Assigned To:</span>
            <span className="ml-1 font-medium text-gray-900">
              {task.isAssociate ? (
                <span className="text-purple-700">
                  {task.associateDetails?.name || 'Associate'} {task.associateDetails?.company ? `(${task.associateDetails.company})` : ''}
                </span>
              ) : (
                assignedUser?.name || task.assignedTo
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Assigned By:</span>
            <span className="ml-1 font-medium text-gray-900">{assignedByUser?.name || task.assignedBy}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3 h-3" />
              {new Date(task.outDate).toLocaleDateString()}
            </span>
            {task.status !== 'Completed' && (
              <span className={`font-medium ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${SEVERITY_BADGES[task.severity]}`}>
              {task.severity}
            </span>
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium border ${STATUS_COLORS[task.status]}`}>
              {task.status}
            </span>
          </div>
        </div>

        {task.completionReason && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Completion Note:</span> {task.completionReason}
            </p>
          </div>
        )}
        {task.overdueReason && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs text-red-600">
              <span className="font-medium">Overdue Reason:</span> {task.overdueReason}
            </p>
          </div>
        )}
      </div>
    );
  };

  // My Tasks Dashboard
  const MyTasksDashboard = () => {
    const myTasks = getMyTasks();
    
    // Apply filters to my tasks
    const filteredMyTasks = myTasks.filter(task => {
      if (filters.project && task.project !== filters.project) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.severity && task.severity !== filters.severity) return false;
      
      // Handle status filtering with special logic for overdue
      if (filters.status) {
        if (filters.status === 'Overdue') {
          // For overdue filter, include tasks with "Overdue" status OR tasks past due date that aren't completed
          const dueDate = new Date(task.outDate);
          dueDate.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM
          const isPastDue = new Date() > dueDate && task.status !== 'Completed';
          if (!(task.status === 'Overdue' || isPastDue)) return false;
        } else {
          // For other statuses, check exact match (but exclude tasks that are past due)
          const dueDate = new Date(task.outDate);
          dueDate.setHours(23, 59, 59, 999);
          const isPastDue = new Date() > dueDate && task.status !== 'Completed';
          if (isPastDue || task.status !== filters.status) return false;
        }
      }
      
      return true;
    });
    
    // Apply search to filtered tasks
    const searchedTasks = filterTasksBySearch(filteredMyTasks, searchTerms['my-tasks']);
    
    // Apply pagination to searched tasks
    const paginatedTasks = paginateTasks(searchedTasks, currentPages['my-tasks']);
    
    const pendingTasks = paginatedTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = paginatedTasks.filter(t => t.status === 'In Progress');
    const inCheckingTasks = paginatedTasks.filter(t => t.status === 'In Checking');
    const completedTasks = paginatedTasks.filter(t => t.status === 'Completed');
    const overdueTasks = paginatedTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">In Progress</p>
                <p className="text-2xl font-bold mt-1">{inProgressTasks.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs font-medium">In Checking</p>
                <p className="text-2xl font-bold mt-1">{inCheckingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFilters && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <select
                    value={filters.project || ''}
                    onChange={(e) => setFilters({...filters, project: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All</option>
                    {projects.map((p, idx) => {
                      const projectName = typeof p === 'string' ? p : p?.name || '';
                      const projectKey = typeof p === 'object' ? p?._id : idx;
                      return <option key={projectKey} value={projectName}>{projectName}</option>;
                    })}
                  </select>
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => setFilters({...filters, severity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="In Checking">In Checking</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="flex items-end">
              <button 
                onClick={() => setFilters({})}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(filteredMyTasks, 'excel', 'my_tasks')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
            Table View
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <>
            <TableView 
              tasks={paginatedTasks} 
              showActions={true}
              showStats={false}
            />
            <PaginationControls 
              viewName="my-tasks"
              totalTasks={searchedTasks}
              currentPage={currentPages['my-tasks']}
            />
          </>
        ) : (
          <div className="space-y-6">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Overdue Tasks ({overdueTasks.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Tasks ({pendingTasks.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                In Progress ({inProgressTasks.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Completed Tasks ({completedTasks.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        )}

        {searchedTasks.length === 0 && searchTerms['my-tasks'] && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tasks found matching "{searchTerms['my-tasks']}"</p>
            <button 
              onClick={() => handleSearchChange('my-tasks', '')}
              className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {myTasks.length === 0 && !searchTerms['my-tasks'] && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tasks assigned to you yet</p>
          </div>
        )}

        {/* Pagination Controls for Cards View */}
        <PaginationControls 
          viewName="my-tasks"
          totalTasks={searchedTasks}
          currentPage={currentPages['my-tasks']}
        />
          </div>
        )}
      </div>
    );
  };

  // Settings View
  const NotificationSettingsView = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600">Configure your notification preferences.</p>
        </div>

        {/* Push Notification Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Push Notifications
          </h3>
          
          <div className="space-y-4">
            {/* Enable/Disable Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-600">
                  Receive notifications for task updates, assignments, and reminders
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pushNotificationsEnabled ? (
                  <button
                    onClick={disablePushNotifications}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? 'Disabling...' : 'Disable'}
                  </button>
                ) : (
                  <button
                    onClick={enablePushNotifications}
                    disabled={loading || !('serviceWorker' in navigator && 'PushManager' in window)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enabling...' : 'Enable'}
                  </button>
                )}
                <span className="text-xs text-gray-500">
                  Status: {pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Test Notifications */}
            {pushNotificationsEnabled && (
                <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Test Notification</h4>
                    <p className="text-sm text-gray-600">
                      Send a single test notification to verify everything is working
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={testPushNotification}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Send Test
                    </button>
                    <button
                      onClick={async () => {
                        // Direct browser notification - most aggressive
                        try {
                          const permission = await Notification.requestPermission();
                          if (permission === 'granted') {
                            const notif = new Notification('🚨 DIRECT Browser Test!', {
                              body: 'This is a DIRECT browser notification - should be VERY visible!',
                              icon: '/favicon.ico',
                              requireInteraction: true,
                              vibrate: [500, 200, 500, 200, 500, 200, 500],
                              tag: 'direct-test-' + Date.now()
                            });
                            notif.onclick = () => window.focus();
                            console.log('✅ Direct notification sent');
                          } else {
                            showError('❌ Notification permission denied');
                          }
                        } catch (error) {
                          showError('❌ Direct notification failed: ' + error.message);
                        }
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      🚨 Direct
                    </button>
                  </div>
                </div>                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      💥 WhatsApp-Style Active Notifications
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">HOT</span>
                    </h4>
                    <p className="text-sm text-gray-600">
                      Send 3 attention-grabbing notifications like WhatsApp/Teams with strong vibration
                    </p>
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      ⚡ These will be VERY noticeable and persistent!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={testBurstNotifications}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-sm font-medium transform hover:scale-105 shadow-lg"
                    >
                      💥 Test Burst
                    </button>
                    <button
                      onClick={async () => {
                        const diagnostics = await notificationService.diagnoseNotificationIssues();
                        console.log('📊 Diagnostics complete:', diagnostics);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      🔍 Diagnose
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Notification Types
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">📋 Task Assignments</h4>
              <p className="text-sm text-gray-600">Get notified when new tasks are assigned to you</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">⚠️ Due Date Reminders</h4>
              <p className="text-sm text-gray-600">Receive alerts before tasks are due</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">✅ Task Completions</h4>
              <p className="text-sm text-gray-600">Know when tasks assigned by you are completed</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🔄 Status Updates</h4>
              <p className="text-sm text-gray-600">Get updates when task status changes</p>
            </div>
          </div>
        </div>

        {/* PWA Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Install App (PWA)
          </h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Install this app on your device for a better experience and to ensure you receive push notifications even when the browser is closed.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📱 Mobile Installation</h4>
                <p className="text-sm text-gray-600">
                  On your phone, tap the share button in your browser and select "Add to Home Screen"
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">💻 Desktop Installation</h4>
                <p className="text-sm text-gray-600">
                  Look for the install icon in your browser's address bar or use the browser menu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PWA Installation Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
            </svg>
            Install App
          </h3>
          
          <div className="space-y-4">
            {/* Installation Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">App Status</h4>
                <p className="text-sm text-gray-600">
                  {isInstalled ? 'TriDo is installed as an app on your device' : 'TriDo can be installed as a native app'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isInstalled ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isInstalled ? '✅ Installed' : '📱 Available'}
              </div>
            </div>

            {!isInstalled && (
              <div className="space-y-3">
                {/* Install Button */}
                {deferredPrompt && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Install TriDo App</h4>
                      <p className="text-sm text-gray-600">
                        Get offline access, push notifications, and home screen icon
                      </p>
                    </div>
                    <button
                      onClick={handleInstallPWA}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium pwa-pulse"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Install App
                    </button>
                  </div>
                )}

                {/* Features List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Offline Access</p>
                      <p className="text-xs text-gray-600">Work without internet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Push Notifications</p>
                      <p className="text-xs text-gray-600">Never miss updates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Fast Loading</p>
                      <p className="text-xs text-gray-600">Native app speed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Home Screen Icon</p>
                      <p className="text-xs text-gray-600">Easy access</p>
                    </div>
                  </div>
                </div>

                {/* Manual Installation Instructions */}
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="font-medium text-gray-900 mb-2">Manual Installation</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Chrome/Edge:</strong> Click the install icon (📥) in the address bar</p>
                    <p><strong>Safari (iOS):</strong> Tap Share → "Add to Home Screen"</p>
                    <p><strong>Firefox:</strong> Menu → "Install this site as an app"</p>
                  </div>
                </div>
              </div>
            )}

            {isInstalled && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center install-success-check">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-green-900">TriDo is installed!</p>
                    <p className="text-sm text-green-700">You can now use TriDo as a native app with offline access and push notifications.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    );
  };

  // Admin Reports View
  const AdminReportsView = () => {
    // Helper function for mobile-responsive stats cards
    const StatCard = ({ title, value, color, icon: Icon, description }) => (
      <div className={`${color} rounded-xl p-4 lg:p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs lg:text-sm font-medium opacity-90">{title}</p>
            <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">{value}</p>
            {description && (
              <p className="text-xs opacity-75 mt-1 hidden lg:block">{description}</p>
            )}
          </div>
          <Icon className="w-6 h-6 lg:w-8 lg:h-8 opacity-60" />
        </div>
      </div>
    );

    const getQuarterDates = (quarter, year) => {
      const startMonth = (quarter - 1) * 3;
      const endMonth = quarter * 3 - 1;
      return {
        start: new Date(year, startMonth, 1),
        end: new Date(year, endMonth + 1, 0)
      };
    };

    return (
      <div className="space-y-4 lg:space-y-6 p-2 lg:p-0">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-4 lg:p-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Admin Reports Dashboard</h2>
                  <p className="text-sm lg:text-base text-gray-600">Comprehensive analytics & insights</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="bg-white px-3 py-1.5 rounded-full border border-blue-200">
                  <span className="text-xs lg:text-sm text-blue-700 font-medium">
                    📊 Total Tasks: <span className="font-bold">{tasks.length}</span>
                  </span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-full border border-green-200">
                  <span className="text-xs lg:text-sm text-green-700 font-medium">
                    👥 Users: <span className="font-bold">{users.filter(u => u.isActive).length}</span>
                  </span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-full border border-purple-200">
                  <span className="text-xs lg:text-sm text-purple-700 font-medium">
                    🏢 Projects: <span className="font-bold">{projects.length}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {reportData && (
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                <button
                  onClick={() => {
                    // Use filtered data if date filters are active
                    const dataToExport = (reportDateFilter.start || reportDateFilter.end) ? 
                      (() => {
                        // Filter and recalculate data for export
                        const filteredTasks = tasks.filter(task => {
                          const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
                          if (reportDateFilter.start && taskDate < reportDateFilter.start) return false;
                          if (reportDateFilter.end && taskDate > reportDateFilter.end) return false;
                          return true;
                        });
                        
                        return {
                          ...reportData,
                          summary: {
                            totalTasks: filteredTasks.length,
                            completed: filteredTasks.filter(t => t.status === 'Completed').length,
                            pending: filteredTasks.filter(t => t.status === 'Pending').length,
                            inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
                            overdue: filteredTasks.filter(t => {
                              const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
                              return isOverdue || t.status === 'Overdue';
                            }).length
                          },
                          completionRate: filteredTasks.length > 0 ? 
                            (filteredTasks.filter(t => t.status === 'Completed').length / filteredTasks.length * 100).toFixed(2) : 0
                        };
                      })() : reportData;
                    
                    exportToExcel(dataToExport, 'admin_report');
                  }}
                  className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm lg:text-base font-medium shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span> Excel
                </button>
                <button
                  onClick={() => {
                    // Use filtered data if date filters are active
                    const dataToExport = (reportDateFilter.start || reportDateFilter.end) ? 
                      (() => {
                        // Filter and recalculate data for export
                        const filteredTasks = tasks.filter(task => {
                          const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
                          if (reportDateFilter.start && taskDate < reportDateFilter.start) return false;
                          if (reportDateFilter.end && taskDate > reportDateFilter.end) return false;
                          return true;
                        });
                        
                        return {
                          ...reportData,
                          summary: {
                            totalTasks: filteredTasks.length,
                            completed: filteredTasks.filter(t => t.status === 'Completed').length,
                            pending: filteredTasks.filter(t => t.status === 'Pending').length,
                            inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
                            overdue: filteredTasks.filter(t => {
                              const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
                              return isOverdue || t.status === 'Overdue';
                            }).length
                          },
                          completionRate: filteredTasks.length > 0 ? 
                            (filteredTasks.filter(t => t.status === 'Completed').length / filteredTasks.length * 100).toFixed(2) : 0
                        };
                      })() : reportData;
                    
                    exportToPDF(dataToExport, 'admin_report');
                  }}
                  className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm lg:text-base font-medium shadow-sm hover:shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span> PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Report Controls */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Report Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Report Type */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              >
                <option value="alltime">🌍 All Time (Complete History)</option>
                <option value="quarterly">📅 Quarterly (Q1-Q4)</option>
                <option value="halfyearly">📆 Half Yearly (H1/H2)</option>
                <option value="yearly">🗓️ Yearly (Annual)</option>
                <option value="custom">🎯 Custom Range</option>
              </select>
              {reportType === 'alltime' && (
                <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">🌟 Complete System History</span><br/>
                    Analyzes all tasks since system inception
                  </p>
                </div>
              )}
            </div>

            {/* Quarter Selection (for quarterly reports) */}
            {reportType === 'quarterly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>Q1 (Jan-Mar)</option>
                  <option value={2}>Q2 (Apr-Jun)</option>
                  <option value={3}>Q3 (Jul-Sep)</option>
                  <option value={4}>Q4 (Oct-Dec)</option>
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  Select quarter and year for quarterly analysis
                </p>
              </div>
            )}

            {/* Year Selection - Hidden for All Time and Custom reports */}
            {reportType !== 'alltime' && reportType !== 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[...Array(8)].map((_, i) => {
                    const year = new Date().getFullYear() - 4 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  {reportType === 'quarterly' && 'Year for the selected quarter'}
                  {reportType === 'halfyearly' && 'Year for the selected half'}
                  {reportType === 'yearly' && 'Specific year for analysis'}
                </p>
              </div>
            )}

            {/* Half Selection (for half-yearly reports) */}
            {reportType === 'halfyearly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Half</label>
                <select
                  value={selectedQuarter <= 2 ? 1 : 2}
                  onChange={(e) => setSelectedQuarter(parseInt(e.target.value) === 1 ? 1 : 3)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>H1 (Jan-Jun)</option>
                  <option value={2}>H2 (Jul-Dec)</option>
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  Select half and year for half-yearly analysis
                </p>
              </div>
            )}

            {/* All Time Info */}
            {reportType === 'alltime' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">All Time Report</span>
                </div>
                <p className="mt-2 text-sm text-green-600">
                  This will analyze all tasks in your system from the beginning. No date restrictions will be applied.
                </p>
              </div>
            )}
          </div>

          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">User Performance</label>
            <select
              value={selectedReportUser}
              onChange={(e) => setSelectedReportUser(e.target.value)}
              className="w-full md:w-1/3 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users (System-wide Report)</option>
              {users.filter(user => user.isActive).map(user => (
                <option key={user.username} value={user.username}>
                  {user.name} ({user.username}) - {user.role}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              Select a specific user to generate their individual performance report, or choose "All Users" for system-wide analysis
            </p>
          </div>

          {/* Custom Date Range */}
          {reportType === 'custom' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Custom Date Range Report</span>
                </div>
                <p className="mt-2 text-sm text-blue-600">
                  Select specific start and end dates to analyze tasks created within that period.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <DatePicker
                    selected={reportDateRange.start}
                    onChange={(date) => setReportDateRange(prev => ({ ...prev, start: date }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholderText="Select start date"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <DatePicker
                    selected={reportDateRange.end}
                    onChange={(date) => setReportDateRange(prev => ({ ...prev, end: date }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholderText="Select end date"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={generateAdminReport}
            disabled={loadingReport || (reportType === 'custom' && (!reportDateRange.start || !reportDateRange.end))}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loadingReport ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            {loadingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Additional Date Filters for Generated Report */}
        {reportData && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Report Data by Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter From Date</label>
                <DatePicker
                  selected={reportDateFilter.start}
                  onChange={(date) => setReportDateFilter(prev => ({ ...prev, start: date }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholderText="Select start date"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter To Date</label>
                <DatePicker
                  selected={reportDateFilter.end}
                  onChange={(date) => setReportDateFilter(prev => ({ ...prev, end: date }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholderText="Select end date"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setReportDateFilter({ start: null, end: null })}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            {(reportDateFilter.start || reportDateFilter.end) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Active Date Filter:</strong> {reportDateFilter.start ? reportDateFilter.start.toLocaleDateString() : 'All dates'} to {reportDateFilter.end ? reportDateFilter.end.toLocaleDateString() : 'All dates'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Report Results */}
        {reportData && (() => {
          // Filter report data based on date filter if applied
          let filteredReportData = reportData;
          
          if (reportDateFilter.start || reportDateFilter.end) {
            // Get all tasks and filter by date range
            const filteredTasks = tasks.filter(task => {
              const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
              
              if (reportDateFilter.start && taskDate < reportDateFilter.start) return false;
              if (reportDateFilter.end && taskDate > reportDateFilter.end) return false;
              
              return true;
            });
            
            // Recalculate summary with filtered tasks
            const filteredSummary = {
              totalTasks: filteredTasks.length,
              completed: filteredTasks.filter(t => t.status === 'Completed').length,
              pending: filteredTasks.filter(t => t.status === 'Pending').length,
              inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
              overdue: filteredTasks.filter(t => {
                const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
                return isOverdue || t.status === 'Overdue';
              }).length
            };
            
            // Recalculate byUser data
            const filteredByUser = {};
            users.forEach(user => {
              const userTasks = filteredTasks.filter(t => !t.isAssociate && t.assignedTo === user.username);
              if (userTasks.length > 0) {
                filteredByUser[user.name] = {
                  total: userTasks.length,
                  completed: userTasks.filter(t => t.status === 'Completed').length,
                  pending: userTasks.filter(t => t.status === 'Pending').length,
                  inProgress: userTasks.filter(t => t.status === 'In Progress').length,
                  overdue: userTasks.filter(t => {
                    const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
                    return isOverdue || t.status === 'Overdue';
                  }).length,
                  completionRate: userTasks.length > 0 ? 
                    (userTasks.filter(t => t.status === 'Completed').length / userTasks.length * 100).toFixed(2) : 0
                };
              }
            });
            

            
            filteredReportData = {
              ...reportData,
              summary: filteredSummary,
              byUser: filteredByUser,
              completionRate: filteredTasks.length > 0 ? 
                (filteredTasks.filter(t => t.status === 'Completed').length / filteredTasks.length * 100).toFixed(2) : 0
            };
          }
          
          return (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {filteredReportData.user.isSpecificUser 
                        ? `User Performance Report: ${filteredReportData.user.name}` 
                        : 'System-wide Performance Report'
                      }
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filteredReportData.user.isSpecificUser 
                        ? `Role: ${filteredReportData.user.role} | Username: ${filteredReportData.user.username}` 
                        : 'All users and associates across the system'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Period: {filteredReportData.period.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                <StatCard 
                  title="Total Tasks" 
                  value={filteredReportData.summary.totalTasks}
                  color="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-800"
                  icon={CheckCircle}
                  description="All tasks in scope"
                />
                <StatCard 
                  title="Completed" 
                  value={filteredReportData.summary.completed}
                  color="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 text-green-800"
                  icon={Check}
                  description="Successfully finished"
                />
                <StatCard 
                  title="Pending" 
                  value={filteredReportData.summary.pending}
                  color="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 text-yellow-800"
                  icon={Clock}
                  description="Awaiting action"
                />
                <StatCard 
                  title="In Progress" 
                  value={filteredReportData.summary.inProgress}
                  color="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 text-purple-800"
                  icon={Users}
                  description="Currently active"
                />
                <StatCard 
                  title="Overdue" 
                  value={filteredReportData.summary.overdue}
                  color="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 text-red-800"
                  icon={AlertCircle}
                  description="Past due date"
                />
              </div>

            {/* Enhanced Completion Rate */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Overall Completion Rate</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-lg font-bold text-gray-900">{filteredReportData.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 lg:h-8 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-center text-white font-medium text-sm lg:text-base transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(filteredReportData.completionRate, 8)}%` }}
                  >
                    {filteredReportData.completionRate > 15 && `${filteredReportData.completionRate}%`}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Enhanced User Analysis */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Individual Performance</h4>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                  {Object.keys(filteredReportData.byUser).length} users
                </span>
              </div>
              
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {Object.entries(filteredReportData.byUser)
                  .filter(([_, stats]) => stats.total > 0)
                  .sort(([, a], [, b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                  .map(([user, stats]) => (
                    <div key={user} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-gray-900">{user}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          parseFloat(stats.completionRate) >= 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(stats.completionRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stats.completionRate}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="text-green-600 font-medium">{stats.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="text-yellow-600 font-medium">{stats.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Overdue:</span>
                          <span className="text-red-600 font-medium">{stats.overdue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">👤 User</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">📊 Total</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">✅ Completed</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">⏳ Pending</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">🔄 In Progress</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">⚠️ Overdue</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">📈 Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(filteredReportData.byUser)
                      .filter(([_, stats]) => stats.total > 0)
                      .sort(([, a], [, b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                      .map(([user, stats]) => (
                      <tr key={user} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{user}</td>
                        <td className="py-3 px-4 text-center font-semibold">{stats.total}</td>
                        <td className="py-3 px-4 text-center text-green-600 font-medium">{stats.completed}</td>
                        <td className="py-3 px-4 text-center text-yellow-600 font-medium">{stats.pending}</td>
                        <td className="py-3 px-4 text-center text-purple-600 font-medium">{stats.inProgress}</td>
                        <td className="py-3 px-4 text-center text-red-600 font-medium">{stats.overdue}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            parseFloat(stats.completionRate) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(stats.completionRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {stats.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {Object.keys(filteredReportData.byUser).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No user data available for the selected criteria</p>
                </div>
              )}
            </div>



            {/* Enhanced Associate Analysis */}
            {Object.keys(filteredReportData.byAssociate || {}).length > 0 && (
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Associate Performance</h4>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    {Object.keys(filteredReportData.byAssociate || {}).length} associates
                  </span>
                </div>
                
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {Object.entries(filteredReportData.byAssociate)
                    .filter(([_, stats]) => stats.total > 0)
                    .sort(([, a], [, b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                    .map(([associate, stats]) => (
                      <div key={associate} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-gray-900">{associate}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(stats.completionRate) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(stats.completionRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {stats.completionRate}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{stats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed:</span>
                            <span className="text-green-600 font-medium">{stats.completed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pending:</span>
                            <span className="text-yellow-600 font-medium">{stats.pending}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Overdue:</span>
                            <span className="text-red-600 font-medium">{stats.overdue}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">🏢 Associate</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">📊 Total</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">✅ Completed</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">⏳ Pending</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">🔄 In Progress</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">⚠️ Overdue</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">📈 Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.byAssociate)
                        .filter(([_, stats]) => stats.total > 0)
                        .sort(([, a], [, b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                        .map(([associate, stats]) => (
                        <tr key={associate} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{associate}</td>
                          <td className="py-3 px-4 text-center">{stats.total}</td>
                          <td className="py-3 px-4 text-center text-green-600">{stats.completed}</td>
                          <td className="py-3 px-4 text-center text-yellow-600">{stats.pending}</td>
                          <td className="py-3 px-4 text-center text-purple-600">{stats.inProgress}</td>
                          <td className="py-3 px-4 text-center text-red-600">{stats.overdue}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(stats.completionRate) >= 80 ? 'bg-green-100 text-green-800' :
                              parseFloat(stats.completionRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {stats.completionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      </div>
    );
  };

  // All Tasks View (Full List)
  const AllTasksView = () => {
    const allTasks = getFilteredTasks();
    
    // Apply search to all tasks
    const searchedTasks = filterTasksBySearch(allTasks, searchTerms['all-tasks']);
    
    // Apply pagination to searched tasks
    const paginatedTasks = paginateTasks(searchedTasks, currentPages['all-tasks']);
    
    // Calculate stats from searched tasks (before pagination)
    const pendingTasks = searchedTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = searchedTasks.filter(t => t.status === 'In Progress');
    const inCheckingTasks = searchedTasks.filter(t => t.status === 'In Checking');
    const completedTasks = searchedTasks.filter(t => t.status === 'Completed');
    const overdueTasks = searchedTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">In Progress</p>
                <p className="text-2xl font-bold mt-1">{inProgressTasks.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs font-medium">In Checking</p>
                <p className="text-2xl font-bold mt-1">{inCheckingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(searchedTasks, 'excel', 'all_tasks')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
            Table View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFilters && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <select
                    value={filters.project || ''}
                    onChange={(e) => setFilters({...filters, project: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All</option>
                    {projects.map((p, idx) => {
                      const projectName = typeof p === 'string' ? p : p?.name || '';
                      const projectKey = typeof p === 'object' ? p?._id : idx;
                      return <option key={projectKey} value={projectName}>{projectName}</option>;
                    })}
                  </select>
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select
                value={filters.assignedTo || ''}
                onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                {users.map(user => (
                  <option key={user._id} value={user.username}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => setFilters({...filters, severity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="In Checking">In Checking</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show Subtasks</label>
              <select
                value={filters.showSubtasks || 'true'}
                onChange={(e) => setFilters({...filters, showSubtasks: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => setFilters({})}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
            </div>
          )}
        </div>

        {viewMode === 'table' ? (
          <>
            <TableView tasks={paginatedTasks} />
            <PaginationControls 
              viewName="all-tasks"
              totalTasks={searchedTasks}
              currentPage={currentPages['all-tasks']}
            />
          </>
        ) : (
          <>
            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>

            {searchedTasks.length === 0 && searchTerms['all-tasks'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tasks found matching "{searchTerms['all-tasks']}"</p>
                <button 
                  onClick={() => handleSearchChange('all-tasks', '')}
                  className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}

            {allTasks.length === 0 && !searchTerms['all-tasks'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">No tasks found</p>
              </div>
            )}

            {/* Pagination Controls for Cards View */}
            <PaginationControls 
              viewName="all-tasks"
              totalTasks={searchedTasks}
              currentPage={currentPages['all-tasks']}
            />
          </>
        )}
      </div>
    );
  };

  // Tasks Assigned By Me
  const AssignedByMeView = () => {
    const assignedByMeTasks = getTasksAssignedByMe();
    
    // Apply filters to assigned by me tasks
    const filteredTasks = assignedByMeTasks.filter(task => {
      // Apply subtask filter (only for Piyush and Ketul)
      if (['piyush.diwan', 'ketul.lathia'].includes(currentUser?.username)) {
        if (subtaskFilter === 'subtasks-only' && !task.isSubtask) return false;
        if (subtaskFilter === 'tasks-only' && task.isSubtask) return false;
        // 'all' shows both tasks and subtasks
      }
      
      if (filters.project && task.project !== filters.project) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.severity && task.severity !== filters.severity) return false;
      if (filters.status && task.status !== filters.status) return false;
      return true;
    });
    
    // Apply search to filtered tasks
    const searchedTasks = filterTasksBySearch(filteredTasks, searchTerms['assigned-by-me']);
    
    // Apply pagination to searched tasks
    const paginatedTasks = paginateTasks(searchedTasks, currentPages['assigned-by-me']);
    
    // Calculate stats from searched tasks (before pagination)
    const pendingTasks = searchedTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = searchedTasks.filter(t => t.status === 'In Progress');
    const inCheckingTasks = searchedTasks.filter(t => t.status === 'In Checking');
    const completedTasks = searchedTasks.filter(t => t.status === 'Completed');
    const overdueTasks = searchedTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">In Progress</p>
                <p className="text-2xl font-bold mt-1">{inProgressTasks.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs font-medium">In Checking</p>
                <p className="text-2xl font-bold mt-1">{inCheckingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFilters && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <select
                    value={filters.project || ''}
                    onChange={(e) => setFilters({...filters, project: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All</option>
                    {projects.map((p, idx) => {
                      const projectName = typeof p === 'string' ? p : p?.name || '';
                      const projectKey = typeof p === 'object' ? p?._id : idx;
                      return <option key={projectKey} value={projectName}>{projectName}</option>;
                    })}
                  </select>
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => setFilters({...filters, severity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="In Checking">In Checking</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Subtask Filter - Only for Piyush and Ketul */}
            {['piyush.diwan', 'ketul.lathia'].includes(currentUser?.username) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                <select
                  value={subtaskFilter}
                  onChange={(e) => setSubtaskFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All (Tasks + Subtasks)</option>
                  <option value="tasks-only">Only Tasks (No Subtasks)</option>
                  <option value="subtasks-only">Only Subtasks</option>
                </select>
              </div>
            )}

            <div className="flex items-end">
              <button 
                onClick={() => {
                  setFilters({});
                  setSubtaskFilter('all');
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
            </div>
          )}
        </div>
        
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(searchedTasks, 'excel', 'assigned_by_me')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
            Table View
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Tasks You Assigned ({searchedTasks.length})
          </h3>
        </div>

        {viewMode === 'table' ? (
          <>
            <TableView tasks={paginatedTasks} />
            <PaginationControls 
              viewName="assigned-by-me"
              totalTasks={searchedTasks}
              currentPage={currentPages['assigned-by-me']}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>

            {searchedTasks.length === 0 && searchTerms['assigned-by-me'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tasks found matching "{searchTerms['assigned-by-me']}"</p>
                <button 
                  onClick={() => handleSearchChange('assigned-by-me', '')}
                  className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}

            {filteredTasks.length === 0 && !searchTerms['assigned-by-me'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">You haven't assigned any tasks yet</p>
              </div>
            )}

            {/* Pagination Controls for Cards View */}
            <PaginationControls 
              viewName="assigned-by-me"
              totalTasks={searchedTasks}
              currentPage={currentPages['assigned-by-me']}
            />
          </>
        )}
      </div>
    );
  };

  // Team Subtasks View
  const SubtasksView = () => {
    // Get team members under current user
    const teamMembers = getMyTeamMembers();
    const teamMemberUsernames = teamMembers.map(member => member.username);
    
    // Get subtasks assigned to team members OR created by current user
    const mySubtasks = tasks.filter(task => {
      if (!task.isSubtask) return false;
      
      // Show subtasks if:
      // 1. Assigned to any of current user's team members, OR
      // 2. Created by current user (for Ketul and managers)
      return teamMemberUsernames.includes(task.assignedTo) || 
             task.assignedBy === currentUser?.username;
    });
    
    // Apply search to subtasks
    const searchedSubtasks = filterTasksBySearch(mySubtasks, searchTerms['team-subtasks']);
    
    // Apply pagination to searched subtasks
    const paginatedSubtasks = paginateTasks(searchedSubtasks, currentPages['team-subtasks']);
    
    // Calculate stats from searched subtasks (before pagination)
    const pendingSubtasks = searchedSubtasks.filter(t => t.status === 'Pending');
    const inProgressSubtasks = searchedSubtasks.filter(t => t.status === 'In Progress');
    const completedSubtasks = searchedSubtasks.filter(t => t.status === 'Completed');
    const overdueSubtasks = searchedSubtasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Subtasks</h2>
          <p className="text-gray-600">Subtasks assigned to your team members</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-4xl font-bold mt-2">{pendingSubtasks.length}</p>
              </div>
              <Clock className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">In Progress</p>
                <p className="text-4xl font-bold mt-2">{inProgressSubtasks.length}</p>
              </div>
              <Users className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold mt-2">{completedSubtasks.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Overdue</p>
                <p className="text-4xl font-bold mt-2">{overdueSubtasks.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>

        {/* Subtasks Table */}
        {viewMode === 'table' ? (
          <>
            <TableView tasks={paginatedSubtasks} />
            <PaginationControls 
              viewName="team-subtasks"
              totalTasks={searchedSubtasks}
              currentPage={currentPages['team-subtasks']}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {paginatedSubtasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} showActions={true} />
              ))}
            </div>

            {/* Pagination Controls for Cards View */}
            <PaginationControls 
              viewName="team-subtasks"
              totalTasks={searchedSubtasks}
              currentPage={currentPages['team-subtasks']}
            />
          </>
        )}

        {searchedSubtasks.length === 0 && searchTerms['team-subtasks'] && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No subtasks found matching "{searchTerms['team-subtasks']}"</p>
            <button 
              onClick={() => handleSearchChange('team-subtasks', '')}
              className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {mySubtasks.length === 0 && !searchTerms['team-subtasks'] && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subtasks Yet</h3>
            <p className="text-gray-600">Create subtasks from your assigned tasks to delegate work to your team members</p>
          </div>
        )}
      </div>
    );
  };

  // Associate Tasks View
  const AssociateTasksView = () => {
    let associateTasks = tasks.filter(task => task.isAssociate === true);
    
    // Apply filters
    if (associateFilters.project) {
      associateTasks = associateTasks.filter(t => t.project === associateFilters.project);
    }
    if (associateFilters.associate) {
      associateTasks = associateTasks.filter(t => t.associateDetails?.name === associateFilters.associate);
    }
    if (associateFilters.priority) {
      associateTasks = associateTasks.filter(t => t.priority === associateFilters.priority);
    }
    if (associateFilters.severity) {
      associateTasks = associateTasks.filter(t => t.severity === associateFilters.severity);
    }
    if (associateFilters.status) {
      associateTasks = associateTasks.filter(t => t.status === associateFilters.status);
    }
    if (associateFilters.assignedBy) {
      associateTasks = associateTasks.filter(t => t.assignedBy === associateFilters.assignedBy);
    }
    
    // Apply date range filter
    if (associateDateRange.from) {
      associateTasks = associateTasks.filter(t => new Date(t.outDate) >= new Date(associateDateRange.from));
    }
    if (associateDateRange.to) {
      associateTasks = associateTasks.filter(t => new Date(t.outDate) <= new Date(associateDateRange.to));
    }
    
    // Apply search to filtered associate tasks
    const searchedAssociateTasks = filterTasksBySearch(associateTasks, searchTerms['associate-tasks']);
    
    // Apply pagination to searched associate tasks
    const paginatedAssociateTasks = paginateTasks(searchedAssociateTasks, currentPages['associate-tasks']);
    
    // Calculate stats from searched tasks (before pagination)
    const pendingTasks = searchedAssociateTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = searchedAssociateTasks.filter(t => t.status === 'In Progress');
    const inCheckingTasks = searchedAssociateTasks.filter(t => t.status === 'In Checking');
    const completedTasks = searchedAssociateTasks.filter(t => t.status === 'Completed');
    const overdueTasks = searchedAssociateTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));
    
    // Get unique associate names for filter
    const uniqueAssociates = [...new Set(tasks.filter(t => t.isAssociate && t.associateDetails?.name).map(t => t.associateDetails.name))];

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">In Progress</p>
                <p className="text-2xl font-bold mt-1">{inProgressTasks.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs font-medium">In Checking</p>
                <p className="text-2xl font-bold mt-1">{inCheckingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>
        
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(searchedAssociateTasks, 'excel', 'associate_tasks')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
            Table View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFilters && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <select
                    value={associateFilters.project || ''}
                    onChange={(e) => setAssociateFilters({...associateFilters, project: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All</option>
                    {projects.map((p, idx) => {
                      const projectName = typeof p === 'string' ? p : p?.name || '';
                      const projectKey = typeof p === 'object' ? p?._id : idx;
                      return <option key={projectKey} value={projectName}>{projectName}</option>;
                    })}
                  </select>
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Associate</label>
              <select
                value={associateFilters.associate || ''}
                onChange={(e) => setAssociateFilters({...associateFilters, associate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                {uniqueAssociates.map((assoc, idx) => (
                  <option key={idx} value={assoc}>
                    {assoc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={associateFilters.priority || ''}
                onChange={(e) => setAssociateFilters({...associateFilters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={associateFilters.severity || ''}
                onChange={(e) => setAssociateFilters({...associateFilters, severity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={associateFilters.status || ''}
                onChange={(e) => setAssociateFilters({...associateFilters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="In Checking">In Checking</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned By</label>
              <select
                value={associateFilters.assignedBy || ''}
                onChange={(e) => setAssociateFilters({...associateFilters, assignedBy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                {users.map(user => (
                  <option key={user._id} value={user.username}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={associateDateRange.from}
                onChange={(e) => setAssociateDateRange({...associateDateRange, from: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={associateDateRange.to}
                onChange={(e) => setAssociateDateRange({...associateDateRange, to: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setAssociateFilters({});
                  setAssociateDateRange({ from: '', to: '' });
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Associate Tasks ({searchedAssociateTasks.length})
              </h3>
              <p className="text-sm text-gray-500 mt-1">Tasks assigned to external partners and associates</p>
            </div>
            {selectedAssociateTasks.length > 0 && (
              <button
                onClick={copyBulkTasksToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Selected ({selectedAssociateTasks.length})
              </button>
            )}
          </div>
        </div>

        {viewMode === 'table' ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                        <input 
                          type="checkbox" 
                          checked={selectedAssociateTasks.length === paginatedAssociateTasks.length && paginatedAssociateTasks.length > 0}
                          onChange={() => toggleAllTasksSelection(paginatedAssociateTasks.map(t => t._id))}
                          className="rounded border-gray-300" 
                        />
                      </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completion Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedAssociateTasks.map((task, index) => (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedAssociateTasks.includes(task._id)}
                          onChange={() => toggleTaskSelection(task._id)}
                          className="rounded border-gray-300" 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {task.associateDetails?.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {task.associateDetails?.name || task.assignedTo}
                            </div>
                            {task.associateDetails?.company && (
                              <div className="text-xs text-gray-500">{task.associateDetails.company}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{getProjectName(task.project)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500">{task.description || 'No description'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(task.inDate || task.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {/* Due Date with conditional red color */}
                        {task.outDate ? (
                          <div>
                            {(() => {
                              // Create due date at end of day (23:59:59) for proper comparison
                              const dueDate = new Date(task.outDate);
                              dueDate.setHours(23, 59, 59, 999);
                              const isOverdue = new Date() > dueDate;
                              
                              return (
                                <React.Fragment>
                                  <div className={`text-sm ${
                                    // Red if current time > due date end of day (23:59:59)
                                    isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'
                                  }`}>
                                    {formatDate(task.outDate)}
                                  </div>
                                  {/* Status line below due date */}
                                  <div className={`text-xs mt-1 ${
                                    // If current time > due date end of day and task is not completed before due date
                                    isOverdue && 
                                    (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate))
                                      ? 'text-red-600 font-semibold' 
                                      : task.status === 'Completed' 
                                        ? 'text-green-600' 
                                        : 'text-gray-500'
                                  }`}>
                                    {/* Show status based on conditions */}
                                    {isOverdue && 
                                     (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate))
                                      ? 'Overdue'
                                      : task.status === 'Completed' 
                                        ? 'Completed'
                                        : 'Pending'}
                                  </div>
                                </React.Fragment>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-700">-</div>
                            <div className="text-xs text-gray-500 mt-1">{task.status === 'Completed' ? 'Completed' : 'Pending'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusDropdown(task)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {/* Completion Date - only show when status is Completed */}
                        {task.status === 'Completed' && task.completedAt ? (
                          <div className="text-sm text-green-600">
                            {formatDate(task.completedAt)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{task.assignedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => editTask(task)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setTaskDetails(task);
                              setShowTaskDetailsModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => copyTaskToClipboard(task)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                            title="Copy Task Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const menuId = `menu-${task._id}`;
                                const menu = document.getElementById(menuId);
                                if (menu) {
                                  menu.classList.toggle('hidden');
                                }
                              }}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                              title="More Actions"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            <div
                              id={`menu-${task._id}`}
                              className="absolute right-0 top-8 z-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 hidden"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sendToWhatsApp(task);
                                  document.getElementById(`menu-${task._id}`).classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4 text-green-600" />
                                Send via WhatsApp
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setCompletionReason('');
                                  setShowCompleteModal(true);
                                  document.getElementById(`menu-${task._id}`).classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark Complete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDeleteConfirm('Are you sure you want to delete this task?', () => {
                                    deleteTask(task._id);
                                  });
                                  document.getElementById(`menu-${task._id}`).classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Task
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {searchedAssociateTasks.length === 0 && searchTerms['associate-tasks'] && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No tasks found matching "{searchTerms['associate-tasks']}"</p>
                <button 
                  onClick={() => handleSearchChange('associate-tasks', '')}
                  className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
            
              {associateTasks.length === 0 && !searchTerms['associate-tasks'] && (
                <div className="text-center py-12 text-gray-500">
                  <p>No tasks found</p>
                </div>
              )}
            </div>
            
            {/* Pagination Controls for Table View */}
            <PaginationControls 
              viewName="associate-tasks"
              totalTasks={searchedAssociateTasks}
              currentPage={currentPages['associate-tasks']}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedAssociateTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} showCopyButton={true} />
              ))}
            </div>

            {searchedAssociateTasks.length === 0 && searchTerms['associate-tasks'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tasks found matching "{searchTerms['associate-tasks']}"</p>
                <button 
                  onClick={() => handleSearchChange('associate-tasks', '')}
                  className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}

            {associateTasks.length === 0 && !searchTerms['associate-tasks'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">No tasks assigned to associates yet</p>
              </div>
            )}
            
            {/* Pagination Controls for Cards View */}
            <PaginationControls 
              viewName="associate-tasks"
              totalTasks={searchedAssociateTasks}
              currentPage={currentPages['associate-tasks']}
            />
          </>
        )}
      </div>
    );
  };

  // External Users Tasks View
  const ExternalTasksView = () => {
    let externalTasks = tasks.filter(task => task.isExternalUser === true);
    
    // Apply filters
    if (externalFilters.project) {
      externalTasks = externalTasks.filter(t => t.project === externalFilters.project);
    }
    if (externalFilters.externalUser) {
      externalTasks = externalTasks.filter(t => t.externalUserDetails?.name === externalFilters.externalUser);
    }
    if (externalFilters.priority) {
      externalTasks = externalTasks.filter(t => t.priority === externalFilters.priority);
    }
    if (externalFilters.severity) {
      externalTasks = externalTasks.filter(t => t.severity === externalFilters.severity);
    }
    if (externalFilters.status) {
      externalTasks = externalTasks.filter(t => t.status === externalFilters.status);
    }
    if (externalFilters.assignedBy) {
      externalTasks = externalTasks.filter(t => t.assignedBy === externalFilters.assignedBy);
    }
    
    // Apply date range filter
    if (externalDateRange.from) {
      externalTasks = externalTasks.filter(t => new Date(t.outDate) >= new Date(externalDateRange.from));
    }
    if (externalDateRange.to) {
      externalTasks = externalTasks.filter(t => new Date(t.outDate) <= new Date(externalDateRange.to));
    }
    
    // Apply search to filtered external tasks
    const searchedExternalTasks = filterTasksBySearch(externalTasks, searchTerms['external-tasks']);
    
    // Apply pagination to searched external tasks
    const paginatedExternalTasks = paginateTasks(searchedExternalTasks, currentPages['external-tasks']);
    
    // Calculate stats from searched tasks (before pagination)
    const pendingTasks = searchedExternalTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = searchedExternalTasks.filter(t => t.status === 'In Progress');
    const inCheckingTasks = searchedExternalTasks.filter(t => t.status === 'In Checking');
    const completedTasks = searchedExternalTasks.filter(t => t.status === 'Completed');
    const overdueTasks = searchedExternalTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));
    
    // Get unique external user names for filter
    const uniqueExternalUsers = [...new Set(tasks.filter(t => t.isExternalUser && t.externalUserDetails?.name).map(t => t.externalUserDetails.name))];

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">In Progress</p>
                <p className="text-2xl font-bold mt-1">{inProgressTasks.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs font-medium">In Checking</p>
                <p className="text-2xl font-bold mt-1">{inCheckingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Completed</p>
                <p className="text-2xl font-bold mt-1">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">Overdue</p>
                <p className="text-2xl font-bold mt-1">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>
        
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(searchedExternalTasks, 'excel', 'external_tasks')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
            Table View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <svg 
              className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilters && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <select
                    value={externalFilters.project || ''}
                    onChange={(e) => setExternalFilters({...externalFilters, project: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Projects</option>
                    {projects.map((p, idx) => {
                      const projectName = typeof p === 'string' ? p : p?.name || '';
                      const projectKey = typeof p === 'object' ? p?._id : idx;
                      return <option key={projectKey} value={projectName}>{projectName}</option>;
                    })}
                  </select>
                </div>
                
                {/* External User Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">External User</label>
                  <select
                    value={externalFilters.externalUser || ''}
                    onChange={(e) => setExternalFilters({...externalFilters, externalUser: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All External Users</option>
                    {uniqueExternalUsers.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={externalFilters.priority || ''}
                    onChange={(e) => setExternalFilters({...externalFilters, priority: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={externalFilters.severity || ''}
                    onChange={(e) => setExternalFilters({...externalFilters, severity: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Severities</option>
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={externalFilters.status || ''}
                    onChange={(e) => setExternalFilters({...externalFilters, status: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Checking">In Checking</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Assigned By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned By</label>
                  <select
                    value={externalFilters.assignedBy || ''}
                    onChange={(e) => setExternalFilters({...externalFilters, assignedBy: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Assigners</option>
                    {users.map(user => (
                      <option key={user._id} value={user.username}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date From</label>
                  <input
                    type="date"
                    value={externalDateRange.from || ''}
                    onChange={(e) => setExternalDateRange({...externalDateRange, from: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date To</label>
                  <input
                    type="date"
                    value={externalDateRange.to || ''}
                    onChange={(e) => setExternalDateRange({...externalDateRange, to: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setExternalFilters({});
                    setExternalDateRange({});
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        {viewMode === 'table' ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExternalTasks.map(task => (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox"
                          checked={selectedExternalTasks.includes(task._id)}
                          onChange={() => toggleTaskSelection(task._id)}
                          className="rounded border-gray-300" 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                            {task.externalUserDetails?.name?.charAt(0).toUpperCase() || 'E'}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {task.externalUserDetails?.name || 'External User'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{getProjectName(task.project)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500">{task.description || 'No description'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(task.inDate || task.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {/* Due Date with status line below */}
                        {task.outDate ? (
                          <div>
                            {(() => {
                              // Create due date at end of day (23:59:59) for proper comparison
                              const dueDate = new Date(task.outDate);
                              dueDate.setHours(23, 59, 59, 999);
                              const isOverdue = new Date() > dueDate;
                              
                              return (
                                <React.Fragment>
                                  <div className={`text-sm ${
                                    // Red if current time > due date end of day (23:59:59)
                                    isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'
                                  }`}>
                                    {formatDate(task.outDate)}
                                  </div>
                                  {/* Status line below due date */}
                                  <div className={`text-xs mt-1 ${
                                    // If current time > due date end of day and task is not completed before due date
                                    isOverdue && 
                                    (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate))
                                      ? 'text-red-600 font-semibold' 
                                      : task.status === 'Completed' 
                                        ? 'text-green-600' 
                                        : 'text-gray-500'
                                  }`}>
                                    {/* Show status based on conditions */}
                                    {isOverdue && 
                                     (task.status !== 'Completed' || (task.completedAt && new Date(task.completedAt) > dueDate))
                                      ? 'Overdue'
                                      : task.status === 'Completed' 
                                        ? 'Completed'
                                        : 'Pending'}
                                  </div>
                                </React.Fragment>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-700">-</div>
                            <div className="text-xs text-gray-500 mt-1">{task.status === 'Completed' ? 'Completed' : 'Pending'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusDropdown(task)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {/* Completion Date - only show when status is Completed */}
                        {task.status === 'Completed' && task.completedAt ? (
                          <div className="text-sm text-green-600">
                            {formatDate(task.completedAt)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{task.assignedBy}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editTask(task);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {/* Create Subtask Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              createSubtask(task);
                            }}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                            title="Create subtask"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {/* More Actions Dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const menu = document.getElementById(`menu-${task._id}`);
                                menu.classList.toggle('hidden');
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div id={`menu-${task._id}`} className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sendToWhatsApp(task);
                                  document.getElementById(`menu-${task._id}`).classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4 text-green-600" />
                                Send via WhatsApp
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setCompletionReason('');
                                  setShowCompleteModal(true);
                                  document.getElementById(`menu-${task._id}`).classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark Complete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDeleteConfirm('Are you sure you want to delete this task?', () => {
                                    deleteTask(task._id);
                                  });
                                  document.getElementById(`menu-${task._id}`).classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Task
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {searchedExternalTasks.length === 0 && searchTerms['external-tasks'] && (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No tasks found matching "{searchTerms['external-tasks']}"</p>
                <button 
                  onClick={() => handleSearchChange('external-tasks', '')}
                  className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
            
              {externalTasks.length === 0 && !searchTerms['external-tasks'] && (
                <div className="text-center py-12 text-gray-500">
                  <p>No tasks found</p>
                </div>
              )}
            
            {/* Pagination Controls for Table View */}
            <PaginationControls 
              viewName="external-tasks"
              totalTasks={searchedExternalTasks}
              currentPage={currentPages['external-tasks']}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedExternalTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} showCopyButton={true} />
              ))}
            </div>

            {searchedExternalTasks.length === 0 && searchTerms['external-tasks'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tasks found matching "{searchTerms['external-tasks']}"</p>
                <button 
                  onClick={() => handleSearchChange('external-tasks', '')}
                  className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}

            {externalTasks.length === 0 && !searchTerms['external-tasks'] && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">No tasks assigned to external users yet</p>
              </div>
            )}
            
            {/* Pagination Controls for Cards View */}
            <PaginationControls 
              viewName="external-tasks"
              totalTasks={searchedExternalTasks}
              currentPage={currentPages['external-tasks']}
            />
          </>
        )}
      </div>
    );
  };

  // Confidential Tasks View - All confidential tasks (only accessible to Ketul Lathia)
  const ConfidentialTasksView = () => {
    // Get all confidential tasks
    const confidentialTasks = tasks.filter(task => task.isConfidential);

    // Apply search to confidential tasks
    const searchedConfidentialTasks = filterTasksBySearch(confidentialTasks, searchTerms['confidential-tasks']);

    // Apply pagination to searched confidential tasks
    const paginatedConfidentialTasks = paginateTasks(searchedConfidentialTasks, currentPages['confidential-tasks']);

    // Calculate stats from searched confidential tasks (before pagination)
    const pendingTasks = searchedConfidentialTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = searchedConfidentialTasks.filter(t => t.status === 'In Progress');
    const inCheckingTasks = searchedConfidentialTasks.filter(t => t.status === 'In Checking');
    const completedTasks = searchedConfidentialTasks.filter(t => t.status === 'Completed');
    const overdueTasks = searchedConfidentialTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-4xl font-bold mt-2">{pendingTasks.length}</p>
              </div>
              <Clock className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">In Progress</p>
                <p className="text-4xl font-bold mt-2">{inProgressTasks.length}</p>
              </div>
              <Clock className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">In Checking</p>
                <p className="text-4xl font-bold mt-2">{inCheckingTasks.length}</p>
              </div>
              <Clock className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold mt-2">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Overdue</p>
                <p className="text-4xl font-bold mt-2">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>

        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(searchedConfidentialTasks, 'excel', 'confidential_tasks')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
              Table View
            </button>
          </div>
        </div>

        {searchedConfidentialTasks.length > 0 ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-orange-50">
                <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Confidential Tasks ({searchedConfidentialTasks.length})
                </h3>
              </div>

              {viewMode === 'table' ? (
                <TableView tasks={paginatedConfidentialTasks} showConfidentialActions={true} />
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedConfidentialTasks.map(task => (
                      <HorizontalTaskCard key={task._id} task={task} showConfidentialActions={true} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {searchTerms['confidential-tasks'] && searchedConfidentialTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No confidential tasks match your search</p>
                <button 
                  onClick={() => handleSearchChange('confidential-tasks', '')}
                  className="mt-2 px-4 py-2 text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            <PaginationControls 
              viewName="confidential-tasks"
              totalTasks={searchedConfidentialTasks}
              currentPage={currentPages['confidential-tasks']}
            />
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-gray-500 mb-2">No confidential tasks found</p>
            <p className="text-sm text-gray-400">Tasks marked as confidential will appear here</p>
          </div>
        )}
      </div>
    );
  };

  // Notifications Panel
  const NotificationsPanel = () => (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex-1 text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5 px-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex-1 text-xs text-red-600 hover:text-red-700 font-medium py-1.5 px-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  notification.type === 'task_assigned' ? 'bg-blue-100 text-blue-600' :
                  notification.type === 'task_completed' ? 'bg-green-100 text-green-600' :
                  notification.type === 'task_overdue' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auto-update checker component */}
      <UpdateChecker />
      
      {/* Custom Dialog Component */}
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
      />
      
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">TriDo</h1>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{currentUser.name}</span>
                <span className="text-xs text-blue-600 px-2 py-0.5 bg-blue-100 rounded">
                  {currentUser.department}
                </span>
              </div>
              {/* Mobile user info */}
              <div className="lg:hidden flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs">
                <User className="w-3 h-3 text-blue-600" />
                <span className="text-blue-900 font-medium">{currentUser.name.split(' ')[0]}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                onClick={() => {
                  setFormData({...formData, assignedBy: currentUser.username});
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Assign Task</span>
                <span className="sm:hidden">Add</span>
              </button>
              
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 sm:p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowSearchBar(!showSearchBar)}
                className="p-2 sm:p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search Tasks"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
                className="lg:hidden md:block p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Collapsible Search Bar */}
          {/* Collapsible Search Bar */}
          {showSearchBar && (
            <div className="mt-3 pb-3 border-t pt-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 px-4">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${currentView === 'my-tasks' ? 'my' : currentView === 'all-tasks' ? 'all' : currentView === 'assigned-by-me' ? 'assigned by me' : currentView === 'associate-tasks' ? 'associate' : currentView === 'external-tasks' ? 'external' : currentView === 'confidential-tasks' ? 'confidential' : ''} tasks...`}
                  value={searchTerms[currentView] || ''}
                  onChange={(e) => handleSearchChange(currentView, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearchBar(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Navigation - Always Visible */}
          <div className="hidden lg:block mt-3 pb-2 border-t pt-3">
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              <button
                onClick={() => { setCurrentView('my-tasks'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'my-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Tasks
              </button>
              
              {!isTeamMember() && (
                <>
                  {/* All Tasks - hidden from Kinjal and Vraj */}
                  {!['Kinjal Solanki', 'Vraj Patel'].includes(currentUser?.name) && (
                    <button
                      onClick={() => { setCurrentView('all-tasks'); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'all-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      All Tasks
                    </button>
                  )}
                  
                  <button
                    onClick={() => { setCurrentView('assigned-by-me'); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === 'assigned-by-me' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Assigned By Me
                  </button>
                  
                  {/* Associate Tasks - exclude Kinjal Solanki */}
                  {currentUser?.name !== 'Kinjal Solanki' && (
                    <button
                      onClick={() => { setCurrentView('associate-tasks'); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'associate-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Associate Tasks
                    </button>
                  )}

                  {/* External Tasks - exclude Kinjal Solanki */}
                  {currentUser?.name !== 'Kinjal Solanki' && (
                    <button
                      onClick={() => { setCurrentView('external-tasks'); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'external-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      External Tasks
                    </button>
                  )}

                  {/* Confidential Tasks - Only for Ketul Lathia */}
                  {currentUser?.name === 'Ketul Lathia' && (
                    <button
                      onClick={() => { setCurrentView('confidential-tasks'); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'confidential-tasks' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Confidential Tasks
                      </div>
                    </button>
                  )}
                </>
              )}
              
              {isAdmin() && (
                <button
                  onClick={() => { setCurrentView('admin-reports'); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'admin-reports' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Admin Reports
                  </div>
                </button>
              )}
              
              <button
                onClick={() => { setCurrentView('settings'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'settings' ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Settings
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Toggle Menu */}
          {showAdvancedMenu && (
            <div className="lg:hidden mt-3 flex flex-wrap gap-1 sm:gap-2 pb-2 border-t pt-3 overflow-x-auto">
              <button
                onClick={() => { setCurrentView('my-tasks'); setShowAdvancedMenu(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'my-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Tasks
              </button>
              
              {!isTeamMember() && (
                <>
                  {/* All Tasks - hidden from Kinjal and Vraj */}
                  {!['Kinjal Solanki', 'Vraj Patel'].includes(currentUser?.name) && (
                    <button
                      onClick={() => { setCurrentView('all-tasks'); setShowAdvancedMenu(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'all-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      All Tasks
                    </button>
                  )}
                  
                  <button
                    onClick={() => { setCurrentView('assigned-by-me'); setShowAdvancedMenu(false); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === 'assigned-by-me' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Assigned By Me
                  </button>
                  

                  
                  {/* Associate Tasks - exclude Kinjal Solanki */}
                  {currentUser?.name !== 'Kinjal Solanki' && (
                    <button
                      onClick={() => { setCurrentView('associate-tasks'); setShowAdvancedMenu(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'associate-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Associate Tasks
                    </button>
                  )}

                  {/* External Tasks - exclude Kinjal Solanki */}
                  {currentUser?.name !== 'Kinjal Solanki' && (
                    <button
                      onClick={() => { setCurrentView('external-tasks'); setShowAdvancedMenu(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'external-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      External Tasks
                    </button>
                  )}

                  {/* Confidential Tasks - Only for Ketul Lathia */}
                  {currentUser?.name === 'Ketul Lathia' && (
                    <button
                      onClick={() => { setCurrentView('confidential-tasks'); setShowAdvancedMenu(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === 'confidential-tasks' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Confidential Tasks
                      </div>
                    </button>
                  )}
                </>
              )}
              
              {isAdmin() && (
                <button
                  onClick={() => { setCurrentView('admin-reports'); setShowAdvancedMenu(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'admin-reports' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Admin Reports
                  </div>
                </button>
              )}
              
              <button
                onClick={() => { setCurrentView('settings'); setShowAdvancedMenu(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'settings' ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Settings
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        {currentView === 'my-tasks' && <MyTasksDashboard />}
        {currentView === 'all-tasks' && <AllTasksView />}
        {currentView === 'assigned-by-me' && <AssignedByMeView />}
        {currentView === 'associate-tasks' && <AssociateTasksView />}
        {currentView === 'external-tasks' && <ExternalTasksView />}
        {currentView === 'confidential-tasks' && currentUser?.name === 'Ketul Lathia' && <ConfidentialTasksView />}
        {currentView === 'admin-reports' && currentUser?.name === 'Ketul Lathia' && <AdminReportsView />}
        {currentView === 'settings' && <NotificationSettingsView />}
      </div>

      {/* Notifications Panel */}
      {showNotifications && <NotificationsPanel />}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editingProject ? 'Edit Project' : 'Manage Projects'}</h2>
              <button onClick={() => { setShowProjectModal(false); setNewProjectName(''); setEditingProject(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Add/Edit Form */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addProject()}
                  />
                  <button
                    onClick={addProject}
                    disabled={!newProjectName.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {editingProject ? 'Update' : 'Add'}
                  </button>
                  {editingProject && (
                    <button
                      onClick={() => { setEditingProject(null); setNewProjectName(''); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Project List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Existing Projects ({projects.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No projects yet. Add one above.
                    </div>
                  ) : (
                    projects.map((project, index) => {
                      const projectName = typeof project === 'string' ? project : project?.name || '';
                      const projectId = typeof project === 'object' ? project?._id : index;
                      
                      return (
                      <div
                        key={projectId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900">{projectName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editProject(project)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProject(project)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Associate Modal */}
      {showAssociateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-purple-900">Manage Associates</h2>
              <button onClick={() => setShowAssociateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Add Associate Form */}
              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-purple-900">Add New Associate</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newAssociate.name}
                      onChange={(e) => setNewAssociate({...newAssociate, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Associate name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={newAssociate.company}
                      onChange={(e) => setNewAssociate({...newAssociate, company: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newAssociate.email}
                      onChange={(e) => setNewAssociate({...newAssociate, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newAssociate.phone}
                      onChange={(e) => setNewAssociate({...newAssociate, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (newAssociate.name.trim()) {
                      saveAssociateToList(newAssociate);
                      setNewAssociate({ name: '', company: '', email: '', phone: '' });
                    } else {
                      showError('Please enter associate name', 'Name Required');
                    }
                  }}
                  disabled={!newAssociate.name.trim()}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Save Associate
                </button>
              </div>

              {/* Associate List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Saved Associates ({associates.length})</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {associates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No associates saved yet. Add one above.
                    </div>
                  ) : (
                    associates.map((assoc, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold text-gray-900">{assoc.name}</span>
                            {assoc.company && (
                              <span className="text-sm text-gray-500">({assoc.company})</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            {assoc.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {assoc.email}
                              </div>
                            )}
                            {assoc.phone && (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {assoc.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              if (assoc._id) {
                                // Delete from database if it has an ID
                                await deleteAssociate(assoc._id);
                                showSuccess('Associate deleted successfully');
                              } else {
                                // Handle old localStorage entries without _id
                                const updatedAssociates = associates.filter((_, i) => i !== index);
                                setAssociates(updatedAssociates);
                                localStorage.setItem('associates', JSON.stringify(updatedAssociates));
                              }
                            } catch (error) {
                              console.error('Error deleting associate:', error);
                              showError('Failed to delete associate: ' + error.message);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete associate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Users Modal */}
      {showExternalUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editingExternalUser ? 'Edit External User' : 'Manage External Users'}</h2>
              <button onClick={() => { setShowExternalUserModal(false); setNewExternalUserName(''); setEditingExternalUser(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Add/Edit Form */}
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <label className="block text-sm font-medium text-gray-700">External User Name *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExternalUserName}
                    onChange={(e) => setNewExternalUserName(e.target.value)}
                    placeholder="Enter external user name"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const addExternalUser = async () => {
                          if (!newExternalUserName.trim()) return;
                          
                          try {
                            const userData = {
                              name: newExternalUserName.trim(),
                              ...(editingExternalUser && { _id: editingExternalUser._id })
                            };
                            
                            await saveExternalUserToList(userData);
                            setNewExternalUserName('');
                            setEditingExternalUser(null);
                          } catch (error) {
                            console.error('Error saving external user:', error);
                          }
                        };
                        addExternalUser();
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!newExternalUserName.trim()) return;
                      
                      try {
                        const userData = {
                          name: newExternalUserName.trim(),
                          ...(editingExternalUser && { _id: editingExternalUser._id })
                        };
                        
                        await saveExternalUserToList(userData);
                        setNewExternalUserName('');
                        setEditingExternalUser(null);
                      } catch (error) {
                        console.error('Error saving external user:', error);
                      }
                    }}
                    disabled={!newExternalUserName.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {editingExternalUser ? 'Update' : 'Add'}
                  </button>
                  {editingExternalUser && (
                    <button
                      onClick={() => { setEditingExternalUser(null); setNewExternalUserName(''); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* External Users List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Existing External Users ({externalUsers.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {externalUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No external users yet. Add one above.
                    </div>
                  ) : (
                    externalUsers.map((user, index) => {
                      const userName = typeof user === 'string' ? user : user?.name || '';
                      const userId = typeof user === 'object' ? user?._id : index;
                      
                      return (
                      <div
                        key={userId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserPlus className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-900">{userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingExternalUser(user);
                              setNewExternalUserName(userName);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit external user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (user._id) {
                                  // Delete from database if it has an ID
                                  await deleteExternalUser(user._id);
                                  showSuccess('External user deleted successfully');
                                } else {
                                  // Handle old localStorage entries without _id
                                  const updatedUsers = externalUsers.filter((_, i) => i !== index);
                                  setExternalUsers(updatedUsers);
                                  localStorage.setItem(`externalUsers_${currentUser?.username}`, JSON.stringify(updatedUsers));
                                  showSuccess('External user deleted successfully');
                                }
                              } catch (error) {
                                console.error('Error deleting external user:', error);
                                showError('Failed to delete external user: ' + error.message);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete external user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">
                {editingTask ? 'Edit Task' : 'Assign New Task'}
              </h2>
              <button onClick={() => { setShowTaskModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 pb-20 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  value={formData.isAssociate ? 'ASSOCIATE' : formData.assignedTo}
                  onChange={(e) => {
                    if (e.target.value === 'ASSOCIATE') {
                      setFormData({...formData, isAssociate: true, isExternalUser: false, assignedTo: 'Associate'});
                    } else if (e.target.value === 'EXTERNAL_USER') {
                      setFormData({...formData, isAssociate: false, isExternalUser: true, assignedTo: 'External User'});
                    } else {
                      setFormData({...formData, isAssociate: false, isExternalUser: false, assignedTo: e.target.value});
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                >
                  <option value="">Select User</option>
                  <option value="ASSOCIATE">📋 Associate (External Partner)</option>
                  <option value="EXTERNAL_USER">👤 External User</option>
                  {users
                    .filter(user => {
                      // Ketul Lathia and Piyush Diwan can see everyone
                      if (currentUser?.username === 'ketul.lathia' || currentUser?.username === 'piyush.diwan') {
                        return true;
                      }
                      // For other users (like Vraj, Kinjal):
                      // - Hide Studio Team members (Ankit, Happy, Darshit)
                      // - Show Studio Team - Manager (Piyush Diwan)
                      if (user.department === 'Studio Team') {
                        return false; // Hide studio team members
                      }
                      return true; // Show everyone else including Studio Team - Manager
                    })
                    .map(user => (
                      <option key={user._id} value={user.username}>
                        {user.name} - {user.department}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Associate Selection - shown only when Associate is selected */}
              {formData.isAssociate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-2">Select Associate *</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedAssociate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedAssociate(value);
                          if (value) {
                            // Find associate by ID first, then fallback to name for old entries
                            const assoc = associates.find(a => a._id === value || a.name === value);
                            if (assoc) {
                              setFormData({
                                ...formData,
                                associateId: assoc._id, // Store the database ID
                                associateDetails: {
                                  name: assoc.name,
                                  company: assoc.company || '',
                                  email: assoc.email || '',
                                  phone: assoc.phone || ''
                                }
                              });
                            }
                          } else {
                            setFormData({
                              ...formData,
                              associateId: null,
                              associateDetails: { name: '', company: '', email: '', phone: '' }
                            });
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Associate</option>
                        {associates.map((assoc) => (
                          <option key={assoc._id || assoc.name} value={assoc._id || assoc.name}>
                            {assoc.name}{assoc.company ? ` (${assoc.company})` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAssociateModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 whitespace-nowrap"
                        title="Manage associates"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* External User Selection - shown only when External User is selected */}
              {formData.isExternalUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green-900 mb-2">Select External User *</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.externalUserId || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            // Find external user by ID first, then fallback to name for old entries
                            const extUser = externalUsers.find(u => u._id === value || u.name === value);
                            if (extUser) {
                              setFormData({
                                ...formData,
                                externalUserId: extUser._id, // Store the database ID
                                externalUserDetails: {
                                  name: extUser.name,
                                  _id: extUser._id
                                }
                              });
                            }
                          } else {
                            setFormData({
                              ...formData,
                              externalUserId: '',
                              externalUserDetails: null
                            });
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select External User</option>
                        {externalUsers.map((user, idx) => {
                          const userName = typeof user === 'string' ? user : user?.name || '';
                          const userKey = typeof user === 'object' ? user?._id : idx;
                          return (
                            <option key={userKey} value={userKey}>
                              {userName}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowExternalUserModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                        title="Manage external users"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((p, idx) => {
                      const projectName = typeof p === 'string' ? p : p?.name || '';
                      const projectKey = typeof p === 'object' ? p?._id : idx;
                      return <option key={projectKey} value={projectName}>{projectName}</option>;
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                    title="Add new project"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.inDate}
                    onChange={(e) => setFormData({...formData, inDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    value={formData.outDate}
                    onChange={(e) => setFormData({...formData, outDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Checking">In Checking</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Confidential Toggle - Only for Ketul Lathia */}
              {currentUser?.name === 'Ketul Lathia' && (
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isConfidential || false}
                      onChange={(e) => setFormData({...formData, isConfidential: e.target.checked})}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Assign as Confidential Task</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">Task will only be visible in the assigned user's My Tasks view</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Assign Task')}
                </button>
                <button
                  onClick={() => { setShowTaskModal(false); resetForm(); }}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtask Modal */}
      {showSubtaskModal && parentTaskForSubtask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Create Subtask</h2>
                <p className="text-sm text-gray-600 mt-1">From: {parentTaskForSubtask.title}</p>
              </div>
              <button onClick={() => { setShowSubtaskModal(false); setParentTaskForSubtask(null); resetForm(); }} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 pb-20 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                >
                  <option value="">{['ketul.lathia', 'piyush.diwan'].includes(currentUser?.username) ? 'Select User' : 'Select Team Member'}</option>
                  {(['ketul.lathia', 'piyush.diwan'].includes(currentUser?.username) 
                    ? users.filter(user => {
                        // Ketul Lathia and Piyush Diwan can see everyone
                        if (currentUser?.username === 'ketul.lathia' || currentUser?.username === 'piyush.diwan') {
                          return true;
                        }
                        // For other users (like Vraj, Kinjal):
                        // - Hide Studio Team members (Ankit, Happy, Darshit)
                        // - Show Studio Team - Manager (Piyush Diwan)
                        if (user.department === 'Studio Team') {
                          return false; // Hide studio team members
                        }
                        return true; // Show everyone else including Studio Team - Manager
                      })
                    : getMyTeamMembers()
                  ).map(user => (
                    <option key={user._id} value={user.username}>
                      {user.name} - {user.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <input
                  type="text"
                  value={parentTaskForSubtask.project}
                  disabled
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter subtask name"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter task description"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.inDate}
                    onChange={(e) => setFormData({...formData, inDate: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Date *</label>
                  <input
                    type="date"
                    value={formData.outDate}
                    onChange={(e) => setFormData({...formData, outDate: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
                <button
                  onClick={() => { setShowSubtaskModal(false); setParentTaskForSubtask(null); resetForm(); }}
                  className="flex-1 px-4 py-2.5 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createSubtask(parentTaskForSubtask, formData)}
                  disabled={loading || !formData.title || !formData.assignedTo || !formData.inDate || !formData.outDate}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Subtask'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-green-50 border-b border-green-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-green-900">Complete Task</h2>
              </div>
              <button onClick={() => { setShowCompleteModal(false); setSelectedTask(null); setCompletionReason(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Task: <span className="font-semibold text-gray-900">{selectedTask.title}</span></p>
                <p className="text-sm text-gray-600">Project: <span className="font-semibold text-gray-900">{getProjectName(selectedTask.project)}</span></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Reason / Notes *
                </label>
                <textarea
                  value={completionReason}
                  onChange={(e) => setCompletionReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="4"
                  placeholder="Please provide details about task completion (e.g., deliverables, results, notes)..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitCompleteTask}
                  disabled={loading || !completionReason.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? 'Completing...' : 'Mark as Complete'}
                </button>
                <button
                  onClick={() => { setShowCompleteModal(false); setSelectedTask(null); setCompletionReason(''); }}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Overdue Modal */}
      {showOverdueModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-red-900">Mark as Overdue</h2>
              </div>
              <button onClick={() => { setShowOverdueModal(false); setSelectedTask(null); setOverdueReason(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Task: <span className="font-semibold text-gray-900">{selectedTask.title}</span></p>
                <p className="text-sm text-gray-600">Project: <span className="font-semibold text-gray-900">{getProjectName(selectedTask.project)}</span></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Overdue / Delay *
                </label>
                <textarea
                  value={overdueReason}
                  onChange={(e) => setOverdueReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="4"
                  placeholder="Please explain why this task is overdue (e.g., blockers, dependencies, resource issues)..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitMarkOverdue}
                  disabled={loading || !overdueReason.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  {loading ? 'Updating...' : 'Mark as Overdue'}
                </button>
                <button
                  onClick={() => { setShowOverdueModal(false); setSelectedTask(null); setOverdueReason(''); }}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Details Modal */}
      {showTaskDetailsModal && taskDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Task Details</h3>
                  <p className="text-sm text-gray-600">Complete task information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTaskDetailsModal(false);
                  setTaskDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono">{taskDetails._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    taskDetails.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    taskDetails.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    taskDetails.status === 'In Checking' ? 'bg-pink-100 text-pink-700' :
                    taskDetails.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {taskDetails.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <p className="text-lg font-semibold text-gray-900">{taskDetails.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg min-h-[60px]">
                  {taskDetails.description || 'No description provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <p className="text-sm text-gray-900">{taskDetails.project || 'No Project'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    taskDetails.priority === 'High' ? 'bg-red-100 text-red-700' :
                    taskDetails.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {taskDetails.priority || 'Medium'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <p className="text-sm text-gray-900">{taskDetails.assignedTo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned By</label>
                  <p className="text-sm text-gray-900">{taskDetails.assignedBy}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(taskDetails.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <p className="text-sm text-gray-900">
                    {taskDetails.outDate ? 
                      new Date(taskDetails.outDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'No due date'
                    }
                  </p>
                </div>
              </div>
              
              {taskDetails.completionReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Reason</label>
                  <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    {taskDetails.completionReason}
                  </p>
                </div>
              )}
              
              {taskDetails.overdueReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Reason</label>
                  <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    {taskDetails.overdueReason}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowTaskDetailsModal(false);
                  setTaskDetails(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmDialogData.title}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {confirmDialogData.message}
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmDialogData({ title: '', message: '', onConfirm: null });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialogData.onConfirm) {
                    confirmDialogData.onConfirm();
                  }
                  setShowConfirmDialog(false);
                  setConfirmDialogData({ title: '', message: '', onConfirm: null });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-30">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-2">
          <button
            onClick={() => setCurrentView('my-tasks')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
              currentView === 'my-tasks' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <User className="w-4 h-4 mb-1" />
            <span className="text-xs font-medium whitespace-nowrap">My Tasks</span>
          </button>
          
          {/* All Tasks - hidden from Kinjal Solanki and Vraj Patel */}
          {!isTeamMember() && !['Kinjal Solanki', 'Vraj Patel'].includes(currentUser?.name) && (
            <button
              onClick={() => setCurrentView('all-tasks')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
                currentView === 'all-tasks' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium whitespace-nowrap">All Tasks</span>
            </button>
          )}

          {/* Assigned by Me - available to non-team members */}
          {!isTeamMember() && (
            <button
              onClick={() => setCurrentView('assigned-by-me')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
                currentView === 'assigned-by-me' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
            >
              <UserPlus className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium whitespace-nowrap">Assigned by Me</span>
            </button>
          )}



          {/* Associate Tasks - available to non-team members, exclude Kinjal Solanki */}
          {!isTeamMember() && currentUser?.name !== 'Kinjal Solanki' && (
            <button
              onClick={() => setCurrentView('associate-tasks')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
                currentView === 'associate-tasks' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Users className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium whitespace-nowrap">Associates</span>
            </button>
          )}

          {/* External Tasks - available to non-team members, exclude Kinjal Solanki */}
          {!isTeamMember() && currentUser?.name !== 'Kinjal Solanki' && (
            <button
              onClick={() => setCurrentView('external-tasks')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
                currentView === 'external-tasks' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
            >
              <UserPlus className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium whitespace-nowrap">External</span>
            </button>
          )}

          {/* Confidential Tasks - Only for Ketul Lathia */}
          {currentUser?.name === 'Ketul Lathia' && (
            <button
              onClick={() => setCurrentView('confidential-tasks')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
                currentView === 'confidential-tasks' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium whitespace-nowrap">Confidential</span>
            </button>
          )}
          
          {currentUser?.name === 'Ketul Lathia' && (
            <button
              onClick={() => setCurrentView('admin-reports')}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
                currentView === 'admin-reports' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium whitespace-nowrap">Reports</span>
            </button>
          )}
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-max ${
              currentView === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Bell className="w-4 h-4 mb-1" />
            <span className="text-xs font-medium whitespace-nowrap">Settings</span>
          </button>
        </div>
      </div>

      {/* PWA Installation Prompt - Enhanced for Mobile */}
      {showInstallPrompt && !isInstalled && (
        <div className="install-prompt fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 animate-fade-in">
          {/* Mobile-first install modal */}
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:w-96 md:max-w-md mx-0 md:mx-4 shadow-2xl animate-slide-up">
            {/* Header with app icon */}
            <div className="p-6 text-center border-b border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Add TriDo to Home Screen</h2>
              <p className="text-gray-600 text-sm">
                Install TriDo for the best mobile experience with offline access and notifications
              </p>
            </div>

            {/* Features */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-900">Offline Access</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-green-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 010-15c2.5 0 4.5 1 6 2.5L15 7.5z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-900">Fast Loading</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-purple-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 010-15c2.5 0 4.5 1 6 2.5L15 7.5z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-900">Notifications</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-900">Home Icon</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleInstallPWA}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Add to Home Screen
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagementSystem;


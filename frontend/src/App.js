import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Calendar, Users, Bell, MessageCircle, Mic, Plus, Edit2, Trash2, MoreVertical, Filter, Check, Clock, AlertCircle, X, LogOut, User, Mail, Lock, Menu, CheckCircle, XCircle, LayoutGrid, List, Eye, Download, FileText, BarChart3, TrendingUp, FolderKanban } from 'lucide-react';
import API_URL from './config';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-styles.css';

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
  'Completed': 'bg-green-50 border-green-200 text-green-800',
  'Overdue': 'bg-red-50 border-red-200 text-red-800'
};


const TaskManagementSystem = () => {
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  
  // App state
  const [currentView, setCurrentView] = useState('my-tasks');
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  
  // Admin reporting states
  const [showAdminReports, setShowAdminReports] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({ start: null, end: null });
  const [reportType, setReportType] = useState('alltime'); // 'alltime', 'quarterly', 'halfyearly', 'yearly', 'custom'
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Modals for task actions
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionReason, setCompletionReason] = useState('');
  const [overdueReason, setOverdueReason] = useState('');
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ title: '', message: '', onConfirm: null });
  
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
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentUser]);



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

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Check if current user is admin - only Ketul Lathia
  const isAdmin = useCallback(() => {
    return currentUser && currentUser.username === 'ketul.lathia';
  }, [currentUser]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/tasks`);
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
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data); // Store full project objects with _id
    } catch (error) {
      console.error('Error loading projects:', error);
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
          await axios.post(`${API_URL}/projects`, { name: projectName });
          await loadProjects();
          setFormData({...formData, project: projectName}); // Auto-select the new project
        }
        
        setNewProjectName('');
        setShowProjectModal(false);
      } catch (error) {
        console.error('Error saving project:', error);
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('Failed to save project');
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
    if (window.confirm(`Are you sure you want to delete the project "${projectObj.name}"?`)) {
      try {
        await axios.delete(`${API_URL}/projects/${projectObj._id}`);
        await loadProjects();
        
        // Clear from task form if selected
        if (formData.project === projectObj.name) {
          setFormData({...formData, project: ''});
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
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

  const createNotification = async (taskId, userId, message, type, assignedBy) => {
    try {
      await axios.post(`${API_URL}/notifications`, {
        userId,
        taskId,
        message,
        type,
        assignedBy
      });
    } catch (error) {
      console.error('Error creating notification:', error);
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
    reminder: '',
    whatsapp: false,
    status: 'Pending'
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
      reminder: '',
      whatsapp: false,
      status: 'Pending'
    });
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    if (!formData.project || !formData.title || !formData.inDate || !formData.outDate || !formData.assignedTo) {
      alert('Please fill in all required fields including Assigned To');
      return;
    }
    
    try {
      setLoading(true);
      const taskData = {
        ...formData,
        assignedBy: currentUser.username
      };
      
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
      alert('Failed to save task');
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

  const performDeleteTask = async (id) => {
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/tasks/${id}`);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    } finally {
      setLoading(false);
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
      alert('Please provide a reason for task completion');
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
      alert('Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const submitMarkOverdue = async () => {
    if (!overdueReason.trim()) {
      alert('Please provide a reason for marking as overdue');
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
      alert('Failed to mark task as overdue');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filters.project && task.project !== filters.project) return false;
      if (filters.team && task.team !== filters.team) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.severity && task.severity !== filters.severity) return false;
      if (filters.status && task.status !== filters.status) return false;
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
    try {
      const currentDate = new Date();
      let startDate, endDate;
      let reportTasks;

      switch (reportType) {
        case 'alltime':
          reportTasks = tasks; // Include all tasks
          startDate = new Date('2020-01-01'); // Default start date
          endDate = currentDate;
          break;
        case 'quarterly':
          const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
          startDate = new Date(currentDate.getFullYear(), (currentQuarter - 1) * 3, 1);
          endDate = new Date(currentDate.getFullYear(), currentQuarter * 3, 0);
          reportTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
            return taskDate >= startDate && taskDate <= endDate;
          });
          break;
        case 'halfyearly':
          const currentHalf = currentDate.getMonth() >= 6 ? 2 : 1;
          startDate = new Date(currentDate.getFullYear(), (currentHalf - 1) * 6, 1);
          endDate = new Date(currentDate.getFullYear(), currentHalf * 6, 0);
          reportTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdDate || task.assignedDate || task.inDate || Date.now());
            return taskDate >= startDate && taskDate <= endDate;
          });
          break;
        case 'yearly':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          endDate = new Date(currentDate.getFullYear(), 11, 31);
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

      // Debug logs (commented out to reduce console noise)
      // console.log('Total tasks available:', tasks.length);
      // console.log('Filtered tasks for report:', reportTasks.length);
      // console.log('Report type:', reportType);
      // console.log('Date range:', startDate, 'to', endDate);

      // Generate comprehensive report data
      const report = {
        period: {
          type: reportType,
          startDate,
          endDate,
          label: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
        },
        summary: {
          totalTasks: reportTasks.length,
          completed: reportTasks.filter(t => t.status === 'Completed').length,
          pending: reportTasks.filter(t => t.status === 'Pending').length,
          inProgress: reportTasks.filter(t => t.status === 'In Progress').length,
          overdue: reportTasks.filter(t => {
            const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
            return isOverdue || t.status === 'Overdue';
          }).length
        },
        byUser: {},
        byProject: {},
        byPriority: {
          High: reportTasks.filter(t => t.priority === 'High').length,
          Medium: reportTasks.filter(t => t.priority === 'Medium').length,
          Low: reportTasks.filter(t => t.priority === 'Low').length
        },
        completionRate: reportTasks.length > 0 ? 
          (reportTasks.filter(t => t.status === 'Completed').length / reportTasks.length * 100).toFixed(2) : 0
      };

      // Group by user
      users.forEach(user => {
        const userTasks = reportTasks.filter(t => t.assignedTo === user.name);
        report.byUser[user.name] = {
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
      });

      // Group by project
      projects.forEach(project => {
        const projectTasks = reportTasks.filter(t => t.project === project);
        report.byProject[project] = {
          total: projectTasks.length,
          completed: projectTasks.filter(t => t.status === 'Completed').length,
          pending: projectTasks.filter(t => t.status === 'Pending').length,
          inProgress: projectTasks.filter(t => t.status === 'In Progress').length,
          overdue: projectTasks.filter(t => {
            const isOverdue = new Date(t.outDate) < new Date() && t.status !== 'Completed';
            return isOverdue || t.status === 'Overdue';
          }).length,
          completionRate: projectTasks.length > 0 ? 
            (projectTasks.filter(t => t.status === 'Completed').length / projectTasks.length * 100).toFixed(2) : 0
        };
      });

      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoadingReport(false);
    }
  }, [tasks, users, reportType, reportDateRange]);

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

    // Project Analysis Sheet
    const projectData = [['Project', 'Total Tasks', 'Completed', 'Pending', 'In Progress', 'Overdue', 'Completion Rate (%)']];
    Object.entries(data.byProject).forEach(([project, stats]) => {
      projectData.push([project, stats.total, stats.completed, stats.pending, stats.inProgress, stats.overdue, stats.completionRate]);
    });
    const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
    XLSX.utils.book_append_sheet(wb, projectSheet, 'Project Analysis');

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

    // Project Analysis
    yPosition = doc.lastAutoTable.finalY + 20;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Project Analysis', 20, yPosition);
    yPosition += 10;

    const projectRows = Object.entries(data.byProject).map(([project, stats]) => [
      project, stats.total, stats.completed, stats.pending, stats.inProgress, stats.overdue, stats.completionRate + '%'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Project', 'Total', 'Completed', 'Pending', 'In Progress', 'Overdue', 'Completion Rate']],
      body: projectRows,
      theme: 'grid'
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }, []);

  const exportTaskList = useCallback((taskList, format = 'excel', filename = 'tasks') => {
    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const taskData = taskList.map(task => ({
        'Task ID': task._id,
        'Title': task.title,
        'Description': task.description,
        'Status': task.status,
        'Priority': task.priority,
        'Project': task.project,
        'Team': task.team,
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
        alert(error.response?.data?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        await axios.post(`${API_URL}/users/register`, registerData);
        alert('Registration successful! Please login.');
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
        alert(error.response?.data?.message || 'Registration failed');
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
  const TableView = ({ tasks, showActions = true, showStats = false, stats }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-4xl font-bold mt-2">{stats.pending}</p>
                </div>
                <Clock className="w-12 h-12 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">In Progress</p>
                  <p className="text-4xl font-bold mt-2">{stats.inProgress}</p>
                </div>
                <Users className="w-12 h-12 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-4xl font-bold mt-2">{stats.completed}</p>
                </div>
                <Check className="w-12 h-12 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Overdue</p>
                  <p className="text-4xl font-bold mt-2">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-12 h-12 opacity-50" />
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time In</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time Out</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned By</th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task, index) => {
                const timeIn = task.inDate ? formatTime(task.inDate) : '-';
                const timeOut = task.outDate ? formatTime(task.outDate) : '-';
                const totalTime = task.inDate && task.outDate ? 
                  Math.round((new Date(task.outDate) - new Date(task.inDate)) / (1000 * 60 * 60 * 24)) + ' days' : '-';
                const assignedUser = users.find(u => u.username === task.assignedTo);
                
                return (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {String(index + 1).padStart(6, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                          {assignedUser?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignedUser?.name || task.assignedTo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{task.project || 'No Project'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.description || 'No description'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(task.inDate || task.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{timeIn}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{timeOut}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{totalTime}</td>
                    <td className="px-4 py-3">{getStatusBadge(task)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{task.assignedBy}</span>
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
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

                            {/* Quick Actions for assigned users on incomplete tasks */}
                            {task.assignedTo === currentUser?.username && task.status !== 'Completed' && (
                              <>
                                <button
                                  onClick={() => handleCompleteTask(task)}
                                  className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                  title="Mark Complete"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleMarkOverdue(task)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Mark Overdue"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Three Dots Menu - Administrative actions */}
                            <div className="relative">
                              <button 
                                onClick={() => {
                                  const menuId = `menu-${task._id}`;
                                  const menu = document.getElementById(menuId);
                                  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                                }}
                                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                                title="More Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              <div 
                                id={`menu-${task._id}`}
                                className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                                style={{ display: 'none' }}
                              >
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setShowTaskModal(true);
                                    document.getElementById(`menu-${task._id}`).style.display = 'none';
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600 text-sm"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                
                                {(currentUser?.role === 'Admin' || task.assignedBy === currentUser?.username) && (
                                  <button
                                    onClick={() => {
                                      deleteTask(task._id);
                                      document.getElementById(`menu-${task._id}`).style.display = 'none';
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 text-sm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
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

  const HorizontalTaskCard = ({ task, showActions = true }) => {
    const isOverdue = new Date(task.outDate) < new Date() && task.status !== 'Completed';
    const daysUntilDue = Math.ceil((new Date(task.outDate) - new Date()) / (1000 * 60 * 60 * 24));
    const assignedUser = users.find(u => u.username === task.assignedTo);
    const assignedByUser = users.find(u => u.username === task.assignedBy);

    return (
      <div className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all ${STATUS_COLORS[task.status]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900">{task.title}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]} border`}>
                {task.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description'}</p>
          </div>
          {showActions && (
            <div className="flex items-center gap-1 ml-4">
              {/* Tick and Cross buttons for task completion */}
              {task.assignedTo === currentUser?.username && task.status !== 'Completed' && (
                <>
                  <button
                    onClick={() => handleCompleteTask(task)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Mark as Complete"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleMarkOverdue(task)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Mark as Overdue"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              
              <button
                onClick={() => editTask(task)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
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
            <span className="text-gray-500">Project:</span>
            <span className="ml-1 font-medium text-gray-900">{task.project}</span>
          </div>
          <div>
            <span className="text-gray-500">Team:</span>
            <span className="ml-1 font-medium text-gray-900">{task.team}</span>
          </div>
          <div>
            <span className="text-gray-500">Assigned To:</span>
            <span className="ml-1 font-medium text-gray-900">{assignedUser?.name || task.assignedTo}</span>
          </div>
          <div>
            <span className="text-gray-500">Assigned By:</span>
            <span className="ml-1 font-medium text-gray-900">{assignedByUser?.name || task.assignedBy}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_BADGES[task.severity]}`}>
              {task.severity}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[task.status]}`}>
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
    const pendingTasks = myTasks.filter(t => t.status === 'Pending');
    const inProgressTasks = myTasks.filter(t => t.status === 'In Progress');
    const completedTasks = myTasks.filter(t => t.status === 'Completed');
    const overdueTasks = myTasks.filter(t => t.status === 'Overdue' || (new Date(t.outDate) < new Date() && t.status !== 'Completed'));

    return (
      <div className="space-y-6">
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(myTasks, 'excel', 'my_tasks')}
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
          <TableView 
            tasks={myTasks} 
            showActions={true}
            showStats={true}
            stats={{
              pending: pendingTasks.length,
              inProgress: inProgressTasks.length,
              completed: completedTasks.length,
              overdue: overdueTasks.length
            }}
          />
        ) : (
          <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Users className="w-12 h-12 opacity-50" />
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

        {myTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tasks assigned to you yet</p>
          </div>
        )}
          </div>
        )}
      </div>
    );
  };

  // Admin Reports View
  const AdminReportsView = () => {
    const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() + 3) / 3));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const getQuarterDates = (quarter, year) => {
      const startMonth = (quarter - 1) * 3;
      const endMonth = quarter * 3 - 1;
      return {
        start: new Date(year, startMonth, 1),
        end: new Date(year, endMonth + 1, 0)
      };
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Reports</h2>
            <p className="text-gray-600">Comprehensive task analytics and reporting</p>
            <div className="mt-2 text-sm text-blue-600">
              Total Tasks in System: <span className="font-semibold">{tasks.length}</span>
            </div>
          </div>
          
          {reportData && (
            <div className="flex gap-3">
              <button
                onClick={() => exportToExcel(reportData, 'admin_report')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={() => exportToPDF(reportData, 'admin_report')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          )}
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="alltime">All Time</option>
                <option value="quarterly">Quarterly</option>
                <option value="halfyearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
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
              </div>
            )}

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {reportType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <DatePicker
                  selected={reportDateRange.start}
                  onChange={(date) => setReportDateRange(prev => ({ ...prev, start: date }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholderText="Select start date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <DatePicker
                  selected={reportDateRange.end}
                  onChange={(date) => setReportDateRange(prev => ({ ...prev, end: date }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholderText="Select end date"
                />
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

        {/* Report Results */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Tasks</p>
                    <p className="text-2xl font-bold text-blue-800">{reportData.summary.totalTasks}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-800">{reportData.summary.completed}</p>
                  </div>
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-800">{reportData.summary.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-purple-800">{reportData.summary.inProgress}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-red-800">{reportData.summary.overdue}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Overall Completion Rate</h4>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-8 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ width: `${reportData.completionRate}%` }}
                >
                  {reportData.completionRate}%
                </div>
              </div>
            </div>

            {/* User Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Individual Performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">User</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Completed</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Pending</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">In Progress</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Overdue</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Completion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.byUser)
                      .filter(([_, stats]) => stats.total > 0)
                      .sort(([, a], [, b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                      .map(([user, stats]) => (
                      <tr key={user} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{user}</td>
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

            {/* Project Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Analysis</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Project</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Completed</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Pending</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">In Progress</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Overdue</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">Completion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.byProject)
                      .filter(([_, stats]) => stats.total > 0)
                      .sort(([, a], [, b]) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
                      .map(([project, stats]) => (
                      <tr key={project} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{project}</td>
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
          </div>
        )}
      </div>
    );
  };

  // All Tasks View (Full List)
  const AllTasksView = () => {
    const allTasks = getFilteredTasks();

    return (
      <div className="space-y-6">
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(allTasks, 'excel', 'all_tasks')}
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <select
                value={filters.project || ''}
                onChange={(e) => setFilters({...filters, project: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
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

        {viewMode === 'table' ? (
          <TableView tasks={allTasks} />
        ) : (
          <>
            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTasks.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>

            {allTasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">No tasks found</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Tasks Assigned By Me
  const AssignedByMeView = () => {
    const assignedByMe = getTasksAssignedByMe();

    return (
      <div className="space-y-6">
        {/* Export and View Toggle */}
        <div className="flex justify-end items-center gap-4">
          {/* Export Button */}
          <button
            onClick={() => exportTaskList(assignedByMe, 'excel', 'assigned_by_me')}
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
            Tasks You Assigned ({assignedByMe.length})
          </h3>
        </div>

        {viewMode === 'table' ? (
          <TableView tasks={assignedByMe} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedByMe.map(task => (
                <HorizontalTaskCard key={task._id} task={task} />
              ))}
            </div>

            {assignedByMe.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">You haven't assigned any tasks yet</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Notifications Panel
  const NotificationsPanel = () => (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
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
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">TriDo</h1>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{currentUser.name}</span>
                <span className="text-xs text-blue-600 px-2 py-0.5 bg-blue-100 rounded">
                  {currentUser.role}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setFormData({...formData, assignedBy: currentUser.username});
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Assign Task</span>
              </button>
              
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {showAdvancedMenu && (
            <div className="mt-3 flex gap-2 pb-2 border-t pt-3">
              <button
                onClick={() => { setCurrentView('my-tasks'); setShowAdvancedMenu(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'my-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => { setCurrentView('all-tasks'); setShowAdvancedMenu(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'all-tasks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => { setCurrentView('assigned-by-me'); setShowAdvancedMenu(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'assigned-by-me' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Assigned By Me
              </button>
              
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'my-tasks' && <MyTasksDashboard />}
        {currentView === 'all-tasks' && <AllTasksView />}
        {currentView === 'assigned-by-me' && <AssignedByMeView />}
        {currentView === 'admin-reports' && isAdmin() && <AdminReportsView />}
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
                    projects.map((project, index) => (
                      <div
                        key={project._id || index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900">{project.name || project}</span>
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Edit Task' : 'Assign New Task'}
              </h2>
              <button onClick={() => { setShowTaskModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user.username}>
                      {user.name} - {user.department}
                    </option>
                  ))}
                </select>
              </div>

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
                    {projects.map(p => <option key={p._id || p} value={p.name || p}>{p.name || p}</option>)}
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
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

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
                <p className="text-sm text-gray-600">Project: <span className="font-semibold text-gray-900">{selectedTask.project}</span></p>
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
                <p className="text-sm text-gray-600">Project: <span className="font-semibold text-gray-900">{selectedTask.project}</span></p>
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
    </div>
  );
};

export default TaskManagementSystem;


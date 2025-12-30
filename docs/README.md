# Task Management System - MERN Stack with Authentication

A complete, production-ready Task Management System with authentication, role-based access, and real-time notifications built with MongoDB, Express, React, and Node.js.

## ✨ Features

- **🔐 Authentication System**: Secure login/registration with role-based access
- **👥 User Management**: Admin, Manager, Team Lead, and Employee roles
- **📋 Multiple Views**: My Tasks, All Tasks, Assigned By Me
- **📊 Dashboard**: Personalized dashboard showing tasks by status (Pending, In Progress, Completed, Overdue)
- **🔔 Real-time Notifications**: Get notified when tasks are assigned or updated
- **📱 Horizontal Card Layout**: Modern, clean task cards with all important info
- **✅ Task Assignment**: Assign tasks to any user with full tracking
- **🎯 Priority & Severity Levels**: Categorize tasks by importance
- **👨‍💼 Team Assignment**: Organize work by teams
- **🔍 Smart Filters**: Filter by project, team, priority, severity, and status
- **⏰ Due Date Tracking**: Visual indicators for overdue and upcoming tasks
- **💾 MongoDB Storage**: Persistent data storage with full CRUD operations

## 🚀 Quick Start (Simple 3-Step Setup)

### Prerequisites

Make sure you have these installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download here](https://www.mongodb.com/try/download/community)

### Step 1: Install MongoDB

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer (keep default settings)
3. MongoDB will start automatically as a service

**To verify MongoDB is running:**
```powershell
mongod --version
```

### Step 2: Install Dependencies & Seed Database

Open PowerShell in the project folder and run:

```powershell
npm install
npm run install-all
```

Then seed the database with demo users:

```powershell
cd backend
npm run seed
cd ..
```

This creates 4 demo users:
- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `john`, password: `john123`  
- **Team Lead**: username: `jane`, password: `jane123`
- **Employee**: username: `bob`, password: `bob123`

### Step 3: Start the Application

```powershell
npm start
```

This single command starts both:
- **Backend** at http://localhost:5000
- **Frontend** at http://localhost:3000

The app will automatically open in your browser! 🎉

**Login with:** `admin` / `admin123`

## 📁 Project Structure

```
task-management-mern/
├── backend/                    # Express.js backend
│   ├── models/                # MongoDB schemas
│   │   ├── Task.js           # Task model
│   │   ├── User.js           # User model
│   │   └── Notification.js   # Notification model
│   ├── routes/               # API routes
│   │   ├── tasks.js          # Task CRUD endpoints
│   │   ├── users.js          # Auth & user endpoints
│   │   └── notifications.js  # Notification endpoints
│   ├── server.js             # Express server
│   ├── seed.js               # Database seeder
│   ├── package.json
│   └── .env                  # Environment variables
│
├── frontend/                  # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Main React component with auth
│   │   ├── index.js          # React entry point
│   │   ├── index.css         # Tailwind CSS
│   │   └── config.js         # API configuration
│   ├── package.json
│   └── .env                  # Frontend environment variables
│
├── package.json              # Root package (scripts for easy setup)
└── README.md
```

## 🔐 User Roles & Permissions

### Admin
- Full access to all tasks
- Can assign tasks to anyone
- Can delete any task
- See all notifications

### Manager
- Assign tasks to team members
- View all tasks
- Edit/delete tasks they created
- Receive task notifications

### Team Lead
- Assign tasks to team members
- View team tasks
- Edit tasks they created
- Receive task notifications

### Employee
- View assigned tasks
- Update task status
- Receive task notifications
- Cannot delete tasks

## 📝 Usage Guide

### First Time Login

1. Open http://localhost:3000
2. Click **"Register"** to create a new account OR
3. Use demo credentials: `admin` / `admin123`
4. You'll see your personalized dashboard

### Assigning a Task

1. Click **"Assign Task"** button in the top-right
2. Fill in the required fields:
   - **Assign To**: Select the user (shows role & department)
   - **Project**: Select from predefined projects
   - **Title**: Task name
   - **Start Date** and **Due Date**
3. Optional fields:
   - Description, Priority, Severity, Team, Status
4. Click **"Assign Task"**
5. The assigned user gets a notification instantly!

### Views Explained

- **My Tasks**: Your personalized dashboard showing:
  - Overdue tasks (red section)
  - Pending tasks (yellow section)
  - In Progress tasks (blue section)
  - Completed tasks (green section)
  
- **All Tasks**: View all tasks in the system with filters
  - Filter by Project, Team, Priority, Severity, Status
  - See who assigned what to whom

- **Assigned By Me**: Tasks you've assigned to others
  - Track progress of delegated work
  - Edit or delete tasks you assigned

### Notifications

- Click the **bell icon** to view notifications
- Red badge shows unread count
- Click notification to mark as read
- "Mark all read" button to clear all
- Notifications auto-refresh every 30 seconds

### Task Card Information

Each task card shows:
- Task title and priority badge
- Description preview
- Project and Team
- Assigned To and Assigned By (with names)
- Due date with days remaining/overdue
- Severity and Status badges
- Edit and Delete buttons (if permitted)

## 🛠️ Manual Setup (Alternative)

If you prefer to run backend and frontend separately:

### Backend

```powershell
cd backend
npm install
npm run seed    # Create demo users
npm start       # or npm run dev for auto-reload
```

Backend runs at: http://localhost:5000

### Frontend

```powershell
cd frontend
npm install
npm start
```

Frontend runs at: http://localhost:3000

## 🔧 Configuration

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanagement
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🗄️ Database

MongoDB database name: `taskmanagement`

Collections:
- `users` - User accounts and roles
- `tasks` - Task records
- `notifications` - User notifications

**To view your data:**
```powershell
mongosh
use taskmanagement
db.users.find().pretty()
db.tasks.find().pretty()
db.notifications.find().pretty()
```

## 🎨 Customization

### Adding Projects

Edit in `frontend/src/App.js`:
```javascript
const PROJECTS = ['Website Redesign', 'Mobile App', 'Marketing Campaign', 'Infrastructure'];
```

### Adding Teams

Edit in `frontend/src/App.js`:
```javascript
const TEAMS = ['Team A', 'Team B', 'Team C'];
```

### Adding More Roles

1. Update User model in `backend/models/User.js`
2. Update registration form in `frontend/src/App.js`

## 🐛 Troubleshooting

### "Failed to load tasks"
- Make sure MongoDB is running: `mongod --version`
- Check backend is running on port 5000
- Verify connection in backend terminal

### "Login failed" or "Invalid credentials"
- Make sure you ran `npm run seed` in the backend folder
- Check that users exist: `mongosh` → `use taskmanagement` → `db.users.find()`
- Try registering a new account

### Port already in use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Set `PORT=3001` in `frontend/.env`

### MongoDB connection error
- Start MongoDB service:
  - Windows: Run "Services" → Find "MongoDB Server" → Start
  - Or run: `net start MongoDB`

### Notifications not appearing
- Check browser console for errors
- Verify backend notifications route is working
- Clear localStorage: Open DevTools → Application → Local Storage → Clear

## 📦 API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Notifications
- `GET /api/notifications/user/:userId` - Get user notifications
- `GET /api/notifications/user/:userId/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/user/:userId/read-all` - Mark all as read
- `POST /api/notifications` - Create notification

### Health Check
- `GET /api/health` - Server health check

## 🚀 Production Deployment

### Backend (Deploy to Heroku/Railway/Render)

1. Update `MONGODB_URI` to your cloud MongoDB (MongoDB Atlas)
2. Set environment variables in hosting platform
3. Deploy backend folder

### Frontend (Deploy to Vercel/Netlify)

1. Update `REACT_APP_API_URL` to your backend URL
2. Build: `npm run build`
3. Deploy the `build` folder

### MongoDB Atlas (Cloud Database)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Get connection string
4. Update `MONGODB_URI` in backend `.env`
5. Run seed script to create users

## 💡 Tips

- Admin users can see and manage all tasks
- Use filters to focus on specific work
- Notifications help track task assignments
- Horizontal card view makes scanning tasks easy
- Status colors (yellow/blue/green/red) provide quick visual feedback
- Days remaining helps prioritize work

## 🔒 Security Notes

**Important**: This demo uses simple password storage. For production:
- Install bcrypt: `npm install bcrypt`
- Hash passwords before storing
- Add JWT tokens for session management
- Implement rate limiting
- Add HTTPS/SSL

## 📄 License

ISC

## 🤝 Support

If you encounter any issues:
1. Check MongoDB is running
2. Verify both servers are running
3. Check browser console for errors
4. Check terminal for backend errors
5. Make sure you ran the seed script

---

Made with ❤️ using MERN Stack + Authentication

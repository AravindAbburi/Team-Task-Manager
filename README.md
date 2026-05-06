# Task Manager — Team Task Hub

A streamlined, role-based project and task management system built with React, Vite, and Supabase.

## 🚀 Features

- **Role-Based Access Control**:
  - **Admins**: Full control over projects, members, and task assignments.
  - **Members**: Can view projects they are part of, create their own tasks, and manage tasks assigned to them.
- **Project Management**: Create and manage multiple projects with descriptions.
- **Task Board**: Kanban-style task management (To Do, In Progress, Done) with priority levels (Low, Medium, High) and due dates.
- **Direct Assignment**: Admins can assign tasks directly to specific members from the Members page.
- **Real-time Updates**: Powered by Supabase for seamless data handling.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (Auth & Database)
- **Date Handling**: date-fns

## 📖 How to Use

### 1. Authentication
- Sign up or sign in using your email.
- **Admin Access**: Currently restricted to specific verified emails:
  - `aa956@snu.edu.in`/ Password: 'Venkayamma@2005'
### 2. Managing Projects (Admins Only)
- Go to the **Projects** tab.
- Click **"New Project"** to create a project workspace.
- Inside a project, use the **"Add Member"** button to invite team members by their email.

### 3. Creating Tasks
- **In a Project**: Click **"New Task"** within any project you are a member of.
- **From Members Page (Admins)**: Click **"Assign Task"** next to any member to create and assign a task to them instantly.

### 4. Tracking Progress
- View all your assigned tasks across all projects in the **"My Tasks"** tab.
- Use the **Dashboard** for an overview of total, in-progress, completed, and overdue tasks.

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

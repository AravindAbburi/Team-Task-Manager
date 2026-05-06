# Task Manager — Team Task Hub

A streamlined, role-based project and task management system built with React, Vite, and Supabase.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/AravindAbburi/Team-Task-Manager)

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

> **Crucial Requirement**: You must add a member to a project **before** you can assign any tasks to them within that project.

### 1. Authentication
- Sign up or sign in using your email.
- **Admin Access**: Currently restricted to specific verified emails:
  - `aa956@snu.edu.in`/ Password: 'Venkayamma@2005'
### 2. Managing Projects (Admins Only)
- Go to the **Projects** tab.
- Click **"New Project"** to create a project workspace.
- **Important**: Inside the project page, use the **"Add Member"** button to invite team members. A user must be a member of the project to receive tasks.

### 3. Creating and Assigning Tasks
- **Prerequisite**: Ensure the target member has been added to the project first.
- **From Members Page**: Click **"Assign Task"** next to any member. You will select a project they are part of and create the task.
- **In a Project**: Click **"New Task"** within the project board to create and assign tasks to any project member.

### 4. Tracking Progress
- View all your assigned tasks across all projects in the **"My Tasks"** tab.
- Use the **Dashboard** for an overview of total, in-progress, completed, and overdue tasks.

## � Workflow Example

To help you get started, here is a typical workflow:

1. **Setup**: An Admin (`aa956@snu.edu.in`) logs in and creates a project named "Website Redesign".
2. **Invite**: The Admin goes to the "Members" page and sees that "John Doe" has signed up. The Admin adds John to the "Website Redesign" project.
3. **Assign**: From the "Members" page, the Admin clicks **Assign Task** next to John's name, creates a task "Design Homepage Mockup", and assigns it to the "Website Redesign" project.
4. **Member Action**: John logs in, goes to **My Tasks**, sees the "Design Homepage Mockup" task, and moves it from "To Do" to "In Progress".
5. **Collaboration**: John realizes he also needs to "Export Assets", so he goes to the project page and creates that task himself.
6. **Completion**: Once finished, John moves the tasks to "Done". The Admin sees the updated progress on the **Dashboard**.

## �� Local Development

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

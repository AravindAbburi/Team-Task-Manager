import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { CheckSquare, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  projects?: { name: string };
}

const statusColor = {
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  done: "bg-status-done",
};

const Dashboard = () => {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let q = supabase.from("tasks").select("*, projects(name)").order("due_date", { ascending: true, nullsFirst: false });
      if (role !== "admin") q = q.eq("assignee_id", user.id);
      const { data } = await q;
      setTasks((data as any) ?? []);
      setLoading(false);
    };
    load();
  }, [user, role]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.due_date && t.status !== "done" && isPast(parseISO(t.due_date))
  );

  const stats = [
    { label: "Total tasks", value: total, icon: ListTodo, color: "text-foreground" },
    { label: "In progress", value: inProgress, icon: Clock, color: "text-warning" },
    { label: "Completed", value: done, icon: CheckSquare, color: "text-success" },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "admin" ? "Overview of all tasks across the team" : "Your tasks at a glance"}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold">Overdue tasks</h2>
          <p className="text-sm text-muted-foreground">Items past their due date</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : overdue.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Nothing overdue. 🎉</div>
        ) : (
          <div className="divide-y">
            {overdue.map((t) => (
              <Link key={t.id} to={`/projects/${t.project_id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
                <span className={`status-dot ${statusColor[t.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.projects?.name}</div>
                </div>
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  Due {format(parseISO(t.due_date!), "MMM d")}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;

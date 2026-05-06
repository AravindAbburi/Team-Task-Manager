import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isPast, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type Status = "todo" | "in_progress" | "done";
interface Task {
  id: string; title: string; status: Status; priority: string;
  due_date: string | null; project_id: string;
  projects?: { name: string };
}

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*, projects(name)").eq("assignee_id", user!.id).order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data as any) ?? []);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Tasks assigned to you across all projects</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="todo">To do</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No tasks</div>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => {
              const overdue = t.due_date && t.status !== "done" && isPast(parseISO(t.due_date));
              return (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <Link to={`/projects/${t.project_id}`} className="font-medium text-sm hover:underline">{t.title}</Link>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.projects?.name}</div>
                  </div>
                  {t.due_date && (
                    <Badge variant="outline" className={`text-xs ${overdue ? "text-destructive border-destructive/40" : ""}`}>
                      {format(parseISO(t.due_date), "MMM d")}
                    </Badge>
                  )}
                  <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as Status)}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To do</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MyTasks;

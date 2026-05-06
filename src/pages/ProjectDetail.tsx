import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";

type Status = "todo" | "in_progress" | "done";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string; title: string; description: string | null;
  status: Status; priority: Priority;
  due_date: string | null; assignee_id: string | null;
  created_by: string;
}
interface Profile { id: string; full_name: string | null; email: string; }
interface Project { id: string; name: string; description: string | null; }

const statusLabel: Record<Status, string> = { todo: "To do", in_progress: "In progress", done: "Done" };
const statusDot: Record<Status, string> = { todo: "bg-status-todo", in_progress: "bg-status-progress", done: "bg-status-done" };
const priorityColor: Record<Priority, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-warning border-warning/40",
  high: "text-destructive border-destructive/40",
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // task dialog
  const [taskOpen, setTaskOpen] = useState(false);
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tAssignee, setTAssignee] = useState<string>("");
  const [tDue, setTDue] = useState("");
  const [tPriority, setTPriority] = useState<Priority>("medium");

  // member dialog
  const [memOpen, setMemOpen] = useState(false);
  const [memSelect, setMemSelect] = useState<string>("");

  const load = async () => {
    const [p, t, m, allP] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id!).maybeSingle(),
      supabase.from("tasks").select("*").eq("project_id", id!).order("created_at", { ascending: false }),
      supabase.from("project_members").select("user_id").eq("project_id", id!),
      supabase.from("profiles").select("*"),
    ]);
    setProject(p.data as any);
    setTasks((t.data as any) ?? []);
    const memberIds = new Set(((m.data as any) ?? []).map((r: any) => r.user_id));
    const profiles = (allP.data as any) ?? [];
    setMembers(profiles.filter((pf: Profile) => memberIds.has(pf.id)));
    setAllProfiles(profiles);
  };

  useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id, role]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return toast.error("Title required");
    const { error } = await supabase.from("tasks").insert({
      project_id: id!, title: tTitle.trim(), description: tDesc.trim() || null,
      assignee_id: tAssignee && tAssignee !== "__none" ? tAssignee : null,
      due_date: tDue || null, priority: tPriority,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Task created");
    setTTitle(""); setTDesc(""); setTAssignee(""); setTDue(""); setTPriority("medium"); setTaskOpen(false);
    load();
  };

  const updateStatus = async (taskId: string, status: Status) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
    if (error) return toast.error(error.message);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const addMember = async () => {
    if (!memSelect) return;
    const { error } = await supabase.from("project_members").insert({ project_id: id!, user_id: memSelect });
    if (error) return toast.error(error.message);
    toast.success("Member added");
    setMemSelect(""); setMemOpen(false);
    load();
  };

  const removeMember = async (uid: string) => {
    const { error } = await supabase.from("project_members").delete().eq("project_id", id!).eq("user_id", uid);
    if (error) return toast.error(error.message);
    load();
  };

  const canEdit = (t: Task) => role === "admin" || t.assignee_id === user?.id || t.created_by === user?.id;
  const isMember = members.some((m) => m.id === user?.id);
  const availableProfiles = allProfiles.filter((p) => !members.some((m) => m.id === p.id));

  if (!project) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const grouped: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
  tasks.forEach((t) => grouped[t.status].push(t));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>
      <header className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.description || "No description"}</p>
        </div>
        {(role === "admin" || isMember) && (
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> New task</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
              <form onSubmit={createTask} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Assignee</Label>
                    <Select value={tAssignee} onValueChange={setTAssignee}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={tPriority} onValueChange={(v) => setTPriority(v as Priority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <Input type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Create task</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {/* Members */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold">Members</h2>
            <p className="text-xs text-muted-foreground">{members.length} people</p>
          </div>
          {role === "admin" && (
            <Dialog open={memOpen} onOpenChange={setMemOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><UserPlus className="w-4 h-4 mr-1.5" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add member</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Select value={memSelect} onValueChange={setMemSelect}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {availableProfiles.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No users available</div>}
                      {availableProfiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={addMember} disabled={!memSelect}>Add to project</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {members.length === 0 && <span className="text-sm text-muted-foreground">No members yet</span>}
          {members.map((m) => (
            <Badge key={m.id} variant="secondary" className="gap-1.5 py-1 px-2.5">
              {m.full_name || m.email}
              {role === "admin" && (
                <button onClick={() => removeMember(m.id)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Task board */}
      <div className="grid md:grid-cols-3 gap-4">
        {(["todo", "in_progress", "done"] as Status[]).map((col) => (
          <div key={col}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`status-dot ${statusDot[col]}`} />
              <h3 className="font-medium text-sm">{statusLabel[col]}</h3>
              <span className="text-xs text-muted-foreground">{grouped[col].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[col].map((t) => {
                const overdue = t.due_date && t.status !== "done" && isPast(parseISO(t.due_date));
                return (
                  <Card key={t.id} className="p-3.5 hover:shadow-sm transition-shadow">
                    <div className="font-medium text-sm mb-1">{t.title}</div>
                    {t.description && <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description}</div>}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <Badge variant="outline" className={`text-xs ${priorityColor[t.priority]}`}>{t.priority}</Badge>
                      {t.due_date && (
                        <Badge variant="outline" className={`text-xs ${overdue ? "text-destructive border-destructive/40" : ""}`}>
                          {format(parseISO(t.due_date), "MMM d")}
                        </Badge>
                      )}
                    </div>
                    {canEdit(t) ? (
                      <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as Status)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To do</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {t.assignee_id ? `Assigned to ${members.find((m) => m.id === t.assignee_id)?.full_name ?? "someone"}` : "Unassigned"}
                      </div>
                    )}
                  </Card>
                );
              })}
              {grouped[col].length === 0 && (
                <div className="text-xs text-muted-foreground px-1 py-3">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetail;

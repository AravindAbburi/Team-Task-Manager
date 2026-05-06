import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Row {
  id: string;
  full_name: string | null;
  email: string;
  isAdmin: boolean;
}

interface Project {
  id: string;
  name: string;
}

const Members = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Create task state
  const [taskOpen, setTaskOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Row | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tProject, setTProject] = useState("");
  const [tPriority, setTPriority] = useState("medium");
  const [tDue, setTDue] = useState("");

  const load = async () => {
    const [{ data: profiles }, { data: projectsData }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("projects").select("id, name"),
    ]);
    
    const adminEmails = ["aa956@snu.edu.in", "aravind.abburi@snu.edu.in"];
    setRows((profiles ?? []).map((p: any) => ({ ...p, isAdmin: adminEmails.includes(p.email) })));
    setProjects(projectsData ?? []);
  };

  useEffect(() => { load(); }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return toast.error("Title required");
    if (!tProject) return toast.error("Please select a project");
    if (!selectedMember) return;

    const { error } = await supabase.from("tasks").insert({
      project_id: tProject,
      title: tTitle.trim(),
      description: tDesc.trim() || null,
      assignee_id: selectedMember.id,
      priority: tPriority,
      due_date: tDue || null,
      created_by: user!.id,
    });

    if (error) return toast.error(error.message);
    toast.success(`Task assigned to ${selectedMember.full_name || selectedMember.email}`);
    setTTitle(""); setTDesc(""); setTProject(""); setTDue(""); setTPriority("medium");
    setTaskOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">View team members and their roles</p>
      </header>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                {(r.full_name || r.email)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{r.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {r.isAdmin && <Badge>Admin</Badge>}
                {role === "admin" && (
                  <Dialog open={taskOpen && selectedMember?.id === r.id} onOpenChange={(open) => {
                    setTaskOpen(open);
                    if (open) setSelectedMember(r);
                    else setSelectedMember(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Assign Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Task to {r.full_name || r.email}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={createTask} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label>Project</Label>
                          <Select value={tProject} onValueChange={setTProject}>
                            <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                            <SelectContent>
                              {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Title</Label>
                          <Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="Task title" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Description</Label>
                          <Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} rows={3} placeholder="Task details..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Priority</Label>
                            <Select value={tPriority} onValueChange={setTPriority}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Due date</Label>
                            <Input type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">Create and Assign</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No members</div>}
        </div>
      </Card>
    </div>
  );
};

export default Members;

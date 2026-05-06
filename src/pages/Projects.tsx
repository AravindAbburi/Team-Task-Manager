import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

interface Project { id: string; name: string; description: string | null; created_at: string; }

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  description: z.string().trim().max(500).optional(),
});

const Projects = () => {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, description: desc });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const { error } = await supabase.from("projects").insert({
      name: parsed.data.name, description: parsed.data.description ?? null, created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setName(""); setDesc(""); setOpen(false);
    load();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "admin" ? "Manage all projects" : "Projects you're part of"}
          </p>
        </div>
        {role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> New project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pname">Name</Label>
                  <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdesc">Description</Label>
                  <Textarea id="pdesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "Create your first project to get started." : "You haven't been added to any projects yet."}
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="p-5 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {p.description || "No description"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;

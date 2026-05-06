import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const AppLayout = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name ?? user.email ?? "");
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/projects", icon: FolderKanban, label: "Projects" },
    { to: "/tasks", icon: CheckSquare, label: "My Tasks" },
    ...(role === "admin" ? [{ to: "/members", icon: Users, label: "Members" }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 border-r bg-sidebar flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight">Task Manager</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`
              }
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t space-y-2">
          <div className="px-2 py-1.5">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-xs text-muted-foreground capitalize">{role ?? "member"}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

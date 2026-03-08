import { BarChart3, Users, UserCheck, DollarSign, Settings, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AboutDialog } from "@/components/AboutDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Contacts", url: "/contacts", icon: UserCheck },
  { title: "Deals", url: "/deals", icon: DollarSign },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "User Management", url: "/admin/users", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { isAdmin } = useRole();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary shadow-lg shadow-sidebar-primary/25">
              <BarChart3 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-[15px] font-bold text-sidebar-accent-foreground tracking-tight">CRM Pro</span>
                <p className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-widest">Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-5 mb-1">
            {!collapsed && <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">Menu</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/65 transition-all duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-5 mb-1 mt-2">
              {!collapsed && <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">Admin</span>}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-3 space-y-0.5">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/65 transition-all duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-3">
        <SidebarMenu>
          {!collapsed && (
            <SidebarMenuItem>
              <AboutDialog />
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/65 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Users, UserCheck, DollarSign, BarChart3 } from "lucide-react";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 w-full justify-start px-3 py-2 text-[13px] text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground">
          <Info className="h-[18px] w-[18px] shrink-0" />
          <span>About</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            SaaS CRM Dashboard
          </DialogTitle>
          <DialogDescription>
            Your all-in-one customer relationship management solution
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            SaaS CRM Dashboard helps you manage your sales pipeline, track leads, and build stronger customer relationships—all in one place.
          </p>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Key Features:</h4>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Lead Management</p>
                <p className="text-xs text-muted-foreground">Track potential customers from first contact to qualified lead. Organize by status: New, Contacted, Qualified, or Lost.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Contact Database</p>
                <p className="text-xs text-muted-foreground">Store and manage all your customer contacts with company info, job titles, and notes.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Deal Pipeline</p>
                <p className="text-xs text-muted-foreground">Manage deals through stages: New → Contacted → Negotiation → Won/Lost. Track values and expected close dates.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Analytics Dashboard</p>
                <p className="text-xs text-muted-foreground">Visualize your sales performance with real-time charts showing leads, deals, and revenue trends.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <h4 className="font-medium text-sm mb-2">How to Get Started:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Add your leads from the <strong>Leads</strong> page</li>
              <li>Convert qualified leads to <strong>Contacts</strong></li>
              <li>Create <strong>Deals</strong> to track sales opportunities</li>
              <li>Monitor progress on the <strong>Dashboard</strong></li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

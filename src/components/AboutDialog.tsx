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
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground font-medium mb-1">What is SaaS CRM Dashboard?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A comprehensive Customer Relationship Management platform designed for sales teams and businesses of all sizes. 
              It centralizes your entire sales process—from capturing initial leads to closing deals—with real-time analytics 
              that update instantly as your data changes.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Core Modules:</h4>
            
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Lead Management</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Capture and track potential customers through your sales funnel. Each lead includes contact details (name, email, phone), 
                  company information, source tracking, and custom notes. Status workflow: <strong>New</strong> → <strong>Contacted</strong> → <strong>Qualified</strong> → <strong>Lost</strong>.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Contact Database</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Maintain a centralized directory of all your business contacts. Store detailed profiles including full name, 
                  email, phone number, company name, job title, and relationship notes. Contacts can be linked to deals for complete visibility.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Deal Pipeline</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Track revenue opportunities from initial proposal to close. Each deal includes title, monetary value, 
                  expected close date, associated contact, and notes. Pipeline stages: <strong>New</strong> → <strong>Contacted</strong> → <strong>Negotiation</strong> → <strong>Won</strong>/<strong>Lost</strong>. 
                  Won deals automatically contribute to revenue metrics.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Real-Time Analytics Dashboard</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitor key performance indicators with live-updating charts: total leads count, deals won/lost, 
                  conversion rate percentage, total revenue from closed deals, leads by status distribution, 
                  deals by pipeline stage, and 6-month revenue trend analysis.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t space-y-3">
            <h4 className="font-medium text-sm">Step-by-Step Workflow:</h4>
            <ol className="text-xs text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">1</span>
                <span><strong>Capture Leads:</strong> Navigate to Leads → Click "Add Lead" → Enter prospect details and source</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">2</span>
                <span><strong>Qualify & Convert:</strong> Update lead status as you engage → Add qualified leads as Contacts</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">3</span>
                <span><strong>Create Deals:</strong> Go to Deals → Click "Add Deal" → Set value, stage, and link to a contact</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">4</span>
                <span><strong>Track Progress:</strong> Move deals through stages → Mark as Won when closed successfully</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">5</span>
                <span><strong>Analyze Performance:</strong> Review Dashboard metrics → Identify trends and optimize your process</span>
              </li>
            </ol>
          </div>
          
          <div className="pt-3 border-t">
            <p className="text-[10px] text-muted-foreground/70 text-center">
              All data syncs in real-time • Secure role-based access • Activity logging enabled
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

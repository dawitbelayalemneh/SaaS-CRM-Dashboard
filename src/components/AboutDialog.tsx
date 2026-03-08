import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Users, UserCheck, DollarSign, BarChart3, Sparkles, Brain, Mail, StickyNote, ListChecks, MessageSquare } from "lucide-react";

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
            AI-Powered SaaS CRM with Lead Intelligence and Automated Sales Insights
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground font-medium mb-1">What is SaaS CRM Dashboard?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A comprehensive, AI-powered Customer Relationship Management platform designed for sales teams and businesses of all sizes. 
              It centralizes your entire sales process—from capturing initial leads to closing deals—with real-time analytics, 
              intelligent lead scoring, automated sales insights, and an AI assistant that helps you make smarter decisions.
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
                  Capture and track potential customers through your sales funnel. Each lead includes contact details, 
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
                  Maintain a centralized directory of all your business contacts with detailed profiles. 
                  Contacts can be linked to deals for complete visibility.
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
                  Track revenue opportunities with a drag-and-drop Kanban board. Pipeline stages: <strong>New</strong> → <strong>Contacted</strong> → <strong>Negotiation</strong> → <strong>Won</strong>/<strong>Lost</strong>. 
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
                  Monitor KPIs with live-updating charts: lead counts, deals won/lost, conversion rates, 
                  total revenue, pipeline distribution, and 6-month revenue trends.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI-Powered Features:
            </h4>
            
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Lead Scoring & Intelligence</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI analyzes each lead's data—company, contact completeness, interaction history, and related deals—to assign 
                  a conversion score from 1–100. Leads are classified as <strong>Hot</strong> (75+), <strong>Warm</strong> (50+), <strong>Cool</strong> (25+), or <strong>Cold</strong>. 
                  Score all leads in bulk or individually.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Lead Insights</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Get deep analysis of each lead including conversion likelihood, recommended next actions, 
                  follow-up strategies, strengths, risks, and talking points for outreach.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Email Generator</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate professional sales outreach emails tailored to each lead's profile. Choose tone (Professional, Casual, Formal), 
                  edit the draft, copy to clipboard, or open directly in your email client.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <StickyNote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Note Summarization</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  After entering call or meeting notes, AI automatically extracts a summary, key points, 
                  decisions made, and actionable next steps.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListChecks className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Task Recommendations</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The AI analyzes your leads, deals, and activity history to suggest prioritized tasks—follow-up calls, 
                  proposals, meetings, and more. Available on the dashboard and each lead profile.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Sales Insights</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dashboard-level AI analysis showing top performing leads, sales trends, deals likely to close, 
                  deals at risk, and strategic recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">AI CRM Assistant</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A conversational AI chatbot available on every page. Ask natural language questions like 
                  "Which deals are most likely to close?" and get instant, data-driven answers.
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
                <span><strong>AI Score & Analyze:</strong> Click the ✨ icon to score leads → Generate AI Insights for deep analysis</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">3</span>
                <span><strong>Engage & Outreach:</strong> Generate AI emails → Summarize call notes → Follow AI task recommendations</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">4</span>
                <span><strong>Create & Track Deals:</strong> Go to Deals → Drag through pipeline stages → Mark as Won when closed</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">5</span>
                <span><strong>Optimize with AI:</strong> Review Sales Insights on Dashboard → Ask the AI Assistant for guidance</span>
              </li>
            </ol>
          </div>
          
          <div className="pt-3 border-t">
            <p className="text-[10px] text-muted-foreground/70 text-center">
              AI-Powered • Real-Time Sync • Secure Role-Based Access • Activity Logging
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
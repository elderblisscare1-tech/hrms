import Link from "next/link";
import { 
  Users, Building, Building2, Award, Store, Target, 
  CalendarCheck, Clock, CalendarOff, Wallet, BarChart3, 
  TicketCheck, Shield, ClipboardList, Settings, ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Attendance Tracking",
    description: "Monitor daily punch-ins, punch-outs, and precise working hours for all employees.",
    icon: CalendarCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Client Management",
    description: "Manage client details and seamlessly assign your workforce to specific clients.",
    icon: Building,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    title: "Daily Attendance Monitoring",
    description: "View real-time daily logs to instantly know who is present, absent, or on leave today.",
    icon: Clock,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10"
  },
  {
    title: "Departments Management",
    description: "Structure your organization effectively by grouping employees into specific departments.",
    icon: Building2,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  {
    title: "Designations",
    description: "Define job roles and titles to maintain a clear organizational hierarchy.",
    icon: Award,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "EBC Dutys",
    description: "Track specialized internal duties, workflows, and task assignments effortlessly.",
    icon: ClipboardList,
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  {
    title: "Employee Records",
    description: "Maintain complete and secure profiles for your entire workforce in one unified database.",
    icon: Users,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Helpdesk Ticketing",
    description: "Resolve internal queries with an integrated ticketing and support system.",
    icon: TicketCheck,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    title: "Leads Management",
    description: "Track potential business opportunities and client acquisitions in a centralized hub.",
    icon: Target,
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    title: "Leave Management",
    description: "Allow employees to request time off, and give managers tools to approve or reject them.",
    icon: CalendarOff,
    color: "text-pink-500",
    bg: "bg-pink-500/10"
  },
  {
    title: "Payroll Processing",
    description: "Automate salary calculations, manage deductions, and generate accurate payslips.",
    icon: Wallet,
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Reports & Analytics",
    description: "Export data to Excel and visualize key HR metrics to make informed decisions.",
    icon: BarChart3,
    color: "text-violet-500",
    bg: "bg-violet-500/10"
  },
  {
    title: "Role-Based Access Control",
    description: "Granular security policies to ensure users only access what they are authorized to see.",
    icon: Shield,
    color: "text-slate-500",
    bg: "bg-slate-500/10"
  },
  {
    title: "Settings & Configuration",
    description: "Customize company policies, themes, and system preferences to match your brand.",
    icon: Settings,
    color: "text-stone-500",
    bg: "bg-stone-500/10"
  },
  {
    title: "Vendor Management",
    description: "Keep track of suppliers, external partners, and third-party service providers.",
    icon: Store,
    color: "text-teal-500",
    bg: "bg-teal-500/10"
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/80] backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">EBC</span>
            </div>
            <span className="font-bold text-lg tracking-tight">EBC HRMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/secure-api-v1-super-admin-auth-gateway-x908b2a">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/secure-api-v1-super-admin-auth-gateway-x908b2a">
              <Button className="gradient-brand text-white border-0">
                Go to Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[hsl(var(--background))] to-[hsl(var(--background))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            The Ultimate HR Solution
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8">
            Manage your workforce <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              with absolute precision.
            </span>
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
            EBC HRMS provides everything you need to manage employees, track attendance, run payroll, and streamline your operations in one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/secure-api-v1-super-admin-auth-gateway-x908b2a">
              <Button size="lg" className="h-14 px-8 text-lg gradient-brand text-white border-0 shadow-lg shadow-blue-500/25 rounded-full">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features A-Z Section */}
      <section className="py-24 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Complete Feature Set (A to Z)</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              Explore every module inside EBC HRMS designed to automate your workflow step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg} ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    {feature.title}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Subtle step indicator */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className={`h-5 w-5 ${feature.color} opacity-50`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded gradient-brand flex items-center justify-center grayscale">
              <span className="text-white font-bold text-[8px]">EBC</span>
            </div>
            <span className="font-semibold text-sm">EBC HRMS</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} EBC HRMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

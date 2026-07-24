import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import { toast } from "sonner";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { Activity, Cpu, Database, Zap, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Page });

// --- MOCK DATA (Kept for Timeseries) ---
const activityData = [
  { name: "Mon", requests: 120, tokens: 4000 },
  { name: "Tue", requests: 300, tokens: 8500 },
  { name: "Wed", requests: 250, tokens: 7200 },
  { name: "Thu", requests: 450, tokens: 12500 },
  { name: "Fri", requests: 380, tokens: 10100 },
  { name: "Sat", requests: 150, tokens: 3000 },
  { name: "Sun", requests: 200, tokens: 5500 },
];

const tokenUsageByAgent = [
  { name: "General Assistant", tokens: 45000 },
  { name: "Code Reviewer", tokens: 28000 },
  { name: "Data Analyst", tokens: 15000 },
  { name: "Writer", tokens: 8000 },
];

const COLORS = ["#ff007f", "#00f0ff", "#a855f7", "#fb923c"];

// --- CUSTOM TOOLTIPS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium" style={{ color: entry.color }}>
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<any[]>([]);
  const [memoryNodesData, setMemoryNodesData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiFetch("/analytics/");
        
        // Map backend KPIs to our frontend array format
        const kpiArray = [
          { ...data.kpis.tasks, icon: Activity },
          { ...data.kpis.documents, icon: Database },
          { ...data.kpis.memories, icon: Zap },
          { ...data.kpis.notes, icon: Cpu },
        ];
        
        setKpis(kpiArray);
        setMemoryNodesData(data.memoryNodesData);
      } catch (err: any) {
        console.error("Failed to load analytics", err);
        toast.error("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <ModulePage>
      <ModuleHeader 
        eyebrow="Analytics" 
        title="Insights into your OS." 
        description="Usage, memory growth, AI cost, and productivity metrics." 
        hue="ai-cyan"
      />
      
      <div className="mt-6 flex flex-col space-y-6 pb-12 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
        {/* KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass rounded-2xl p-5 border border-border/30 relative overflow-hidden group"
            >
              {/* Subtle gradient background based on hue */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, var(--color-${kpi.hue}), transparent 70%)` }}
              />
              
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-background/50 border border-border/50"
                  style={{ color: `var(--color-${kpi.hue})` }}
                >
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {kpi.change}
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MAIN CHART ROW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass rounded-2xl border border-border/30 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Workspace Activity</h3>
              <p className="text-sm text-muted-foreground">Requests and token consumption over the last 7 days</p>
            </div>
            <button className="flex items-center text-xs font-medium text-ai-blue hover:text-ai-blue/80 transition-colors">
              View Detailed Report <ArrowUpRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff007f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff007f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tokens" stroke="#ff007f" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                <Area type="monotone" dataKey="requests" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* BOTTOM WIDGETS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bar Chart Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass rounded-2xl border border-border/30 p-6"
          >
            <div className="mb-6">
              <h3 className="text-base font-semibold text-foreground">Token Usage by Agent</h3>
              <p className="text-xs text-muted-foreground">Which AI models are doing the most work</p>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenUsageByAgent} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                  <Bar dataKey="tokens" fill="#a855f7" radius={[0, 4, 4, 0]}>
                    {tokenUsageByAgent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="glass rounded-2xl border border-border/30 p-6"
          >
            <div className="mb-2">
              <h3 className="text-base font-semibold text-foreground">Knowledge Graph Distribution</h3>
              <p className="text-xs text-muted-foreground">Types of nodes stored in your second brain</p>
            </div>
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={memoryNodesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {memoryNodesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
        </>
        )}
      </div>
    </ModulePage>
  );
}

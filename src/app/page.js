'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BarChart3, 
  Wallet, 
  ArrowLeftRight, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Percent,
  Search,
  MoreVertical,
  ChevronRight,
  User
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  getDocuments 
} from '@/lib/crudHelpers';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    categorySpending: [],
    recentTransactions: [],
    monthlyChartData: []
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateDashboardStats = useCallback((data) => {
    if (!data || data.length === 0) return;

    const validTransactions = data.filter(t => t.type === 'income' || t.type === 'expense');
    
    const income = validTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = validTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const netSavings = income - expenses;
    const savingsRate = income > 0 ? ((netSavings / income) * 100) : 0;

    const categoryData = {};
    validTransactions.filter(t => t.type === 'expense').forEach(transaction => {
      const category = transaction.category || 'Other';
      categoryData[category] = (categoryData[category] || 0) + (transaction.amount || 0);
    });

    const categorySpending = Object.entries(categoryData)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Mock monthly data for the chart since we don't have historical aggregation yet
    const monthlyChartData = [
      { name: 'Jan', income: 4500, expenses: 3200 },
      { name: 'Feb', income: 5200, expenses: 3800 },
      { name: 'Mar', income: 4800, expenses: 4100 },
      { name: 'Apr', income: 6100, expenses: 3500 },
      { name: 'May', income: 5900, expenses: 4200 },
      { name: 'Jun', income: 6500, expenses: 3800 },
    ];

    setDashboardStats({
      totalIncome: income,
      totalExpenses: expenses,
      netSavings,
      savingsRate,
      categorySpending,
      recentTransactions: validTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      monthlyChartData
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDocuments('hack');
      if (result.success) {
        setTransactions(result.data || []);
        calculateDashboardStats(result.data || []);
      } else {
        setError(result.error || 'Connection Failure');
      }
    } catch (err) {
      setError('System Node Offline');
    } finally {
      setLoading(false);
    }
  }, [calculateDashboardStats]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a45ff]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 lumina-sidebar fixed h-full z-50 hidden md:flex flex-col p-8">
        <div className="mb-10">
          <h1 className="text-slate-900 text-xl font-extrabold tracking-tight mb-1">Wealth Command</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PREMIUM ACCESS</p>
        </div>

        <nav className="flex-1 space-y-4">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" />
          <SidebarItem icon={<Wallet size={20} />} label="Portfolio" />
          <SidebarItem icon={<ArrowLeftRight size={20} />} label="Transactions" />
          <SidebarItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-2">
          <SidebarItem icon={<HelpCircle size={20} />} label="Support" />
          <SidebarItem icon={<LogOut size={20} />} label="Logout" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-12">
            <h1 className="text-[#5a45ff] text-xl font-bold tracking-tight">Lumina Wealth</h1>
            <nav className="flex items-center gap-8 text-sm font-semibold">
              <span className="text-slate-900 cursor-pointer">Dashboard</span>
              <span className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">Portfolio</span>
              <span className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">Analytics</span>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <HelpCircle size={20} className="text-slate-400 cursor-pointer hover:text-slate-600" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Financial Command Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Financial Command</h2>
            <p className="text-slate-400">Welcome back, your portfolio is up 12% this month.</p>
          </div>
          <button className="bg-[#5a45ff] text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform">
            <Plus size={20} />
            <span>New Transaction</span>
          </button>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="TOTAL INCOME" 
            amount={`$${dashboardStats.totalIncome.toLocaleString()}`} 
            change="+14.2%" 
            icon={<TrendingUp size={20} className="text-emerald-500" />}
            color="emerald"
          />
          <StatCard 
            title="EXPENSES" 
            amount={`$${dashboardStats.totalExpenses.toLocaleString()}`} 
            change="-2.4%" 
            icon={<TrendingDown size={20} className="text-rose-500" />}
            color="rose"
          />
          <StatCard 
            title="TOTAL SAVINGS" 
            amount={`$${dashboardStats.netSavings.toLocaleString()}`} 
            change="+8.1%" 
            icon={<PiggyBank size={20} className="text-indigo-500" />}
            color="indigo"
          />
          <StatCard 
            title="SAVINGS RATE" 
            amount={`${dashboardStats.savingsRate.toFixed(1)}%` }
            change="Target: 40%" 
            icon={<Percent size={20} className="text-blue-500" />}
            color="blue"
            isProgress
            progress={dashboardStats.savingsRate}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Income vs Expenses Chart */}
          <div className="lg:col-span-2 lumina-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">Income vs Expenses</h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-400">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <span className="text-slate-400">Expenses</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardStats.monthlyChartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Spending */}
          <div className="lumina-card p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-8">Category Spending</h3>
            <div className="space-y-6">
              {dashboardStats.categorySpending.length > 0 ? (
                dashboardStats.categorySpending.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-700">{item.category}</span>
                      <span className="text-slate-400">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${(item.amount / dashboardStats.totalExpenses * 100)}%`,
                          background: ['#5a45ff', '#3b82f6', '#10b981', '#f59e0b'][idx % 4]
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">No spending data</div>
              )}
            </div>
            <button className="w-full mt-10 py-3 rounded-2xl border border-slate-100 text-[#5a45ff] font-bold text-sm hover:bg-slate-50 transition-colors">
              View Full Report
            </button>
          </div>
        </div>

        {/* Monthly Overview Table */}
        <div className="lumina-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Monthly Overview</h3>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button className="px-4 py-2 bg-white rounded-lg shadow-sm text-xs font-bold text-slate-800">This Month</button>
              <button className="px-4 py-2 text-xs font-bold text-slate-400">Past 3 Months</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="lumina-table">
              <thead>
                <tr className="bg-transparent text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-2">Transaction</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {dashboardStats.recentTransactions.map((t, idx) => {
                  const getIcon = () => {
                    const desc = (t.note || '').toLowerCase();
                    const cat = (t.category || '').toLowerCase();
                    if (desc.includes('amazon') || desc.includes('aws') || desc.includes('cloud')) {
                      return <div className="p-2 bg-indigo-50 text-indigo-500 rounded-full"><TrendingDown size={18} /></div>;
                    }
                    if (cat.includes('income') || cat.includes('salary')) {
                      return <div className="p-2 bg-emerald-50 text-emerald-500 rounded-full"><TrendingUp size={18} /></div>;
                    }
                    if (cat.includes('rent') || desc.includes('rent')) {
                      return <div className="p-2 bg-amber-50 text-amber-500 rounded-full"><TrendingUp size={18} /></div>;
                    }
                    return <div className={`p-2 rounded-full ${t.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>{t.amount > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}</div>;
                  };

                  return (
                    <tr key={idx} className="hover:scale-[1.01] transition-transform duration-200">
                      <td className="flex items-center gap-3">
                        {getIcon()}
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{t.note || 'Transaction'}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.category || 'General'}</p>
                        </div>
                      </td>
                    <td><span className="text-xs font-bold text-slate-500">{t.category || 'General'}</span></td>
                    <td><span className="text-xs font-semibold text-slate-400">{new Date(t.date).toLocaleDateString()}</span></td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${t.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {t.amount > 0 ? 'Completed' : 'Processed'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`font-bold text-sm ${t.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                      </span>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }) {
  return (
    <div className={`sidebar-item cursor-pointer ${active ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatCard({ title, amount, change, icon, color, isProgress = false, progress = 0 }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-500',
    rose: 'bg-rose-50 text-rose-500',
    indigo: 'bg-indigo-50 text-indigo-500',
    blue: 'bg-blue-50 text-blue-500'
  };

  return (
    <div className="lumina-card p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color] || 'bg-slate-50'}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{amount}</h4>
        
        {isProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Target: 40%</span>
            </div>
            <div className="progress-bar-container bg-slate-100">
              <div 
                className="progress-bar-fill bg-[#5a45ff]" 
                style={{ width: `${Math.min(100, (progress / 40) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
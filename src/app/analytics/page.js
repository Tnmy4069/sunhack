'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDocuments } from '@/lib/crudHelpers';
import { calculateFinancialMetrics, getSpendingInsights, exportToCSV } from '@/lib/analytics';
import GoogleTranslate from '@/components/GoogleTranslate';

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ✅ Add error state
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ];

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No data to export');
      return;
    }
    
    try {
      exportToCSV(transactions);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsResult, goalsResult, budgetsResult] = await Promise.all([
        getDocuments('hack'),
        getDocuments('goals'),
        getDocuments('budgets')
      ]);
      
      if (transactionsResult.success) {
        const data = transactionsResult.data || [];
        setTransactions(data);
        setMetrics(calculateFinancialMetrics(data));
        setInsights(getSpendingInsights(data));
      } else {
        setError('Failed to fetch documents');
      }

      if (goalsResult.success) {
        setGoals(goalsResult.data || []);
      }

      if (budgetsResult.success) {
        setBudgets(budgetsResult.data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Unknown error'); // ✅ store error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
  if (window.google && window.google.translate) {
    new window.google.translate.TranslateElement(
      { 
        pageLanguage: 'en', 
        includedLanguages: 'hi,ta,te,kn,mr,gu,pa,ml,or,as' // Indian languages
      }, 
      'google_translate_element'
    );
  }
}, [transactions]); // <- put here any state that loads dynamic content


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  if (error) { // ✅ error is now defined
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadData} // ✅ retry works now
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  const getMonthName = (monthKey) => {
    const month = monthKey.split('-')[1];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(month) - 1];
  };


  
  return (
    <div id='google_translate_element' className=" google_translate_element min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4 justify-center sm:justify-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl">📊</span>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Financial Analytics
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Complete insights into your financial patterns</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-end">
              <Link 
                href="/" 
                className="group bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link 
                href="/goals" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span>🎯</span>
                <span className="hidden sm:inline">Goals</span>
              </Link>
              
              <button 
                onClick={handleExportCSV}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span>📊</span>
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <GoogleTranslate />
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 mt-4 sm:mt-6 bg-slate-100/50 rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Key Insights Banner */}
        {insights.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="grid gap-3 sm:gap-4 " id='google_translate_element'>
              {insights.slice(0, 3).map((insight, index) => (
                <div 
                  key={index} 
                  className={`relative overflow-hidden p-4 sm:p-6 rounded-2xl border shadow-sm backdrop-blur-sm ${
                    insight.type === 'success' 
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                      : insight.type === 'warning' 
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${
                      insight.type === 'success' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : insight.type === 'warning' 
                          ? 'bg-amber-100 text-amber-600' 
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg ${
                        insight.type === 'success' 
                          ? 'text-emerald-800' 
                          : insight.type === 'warning' 
                            ? 'text-amber-800' 
                            : 'text-blue-800'
                      }`}>
                        {insight.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        insight.type === 'success' 
                          ? 'text-emerald-700' 
                          : insight.type === 'warning' 
                            ? 'text-amber-700' 
                            : 'text-blue-700'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                  <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 ${
                    insight.type === 'success' 
                      ? 'bg-emerald-400' 
                      : insight.type === 'warning' 
                        ? 'bg-amber-400' 
                        : 'bg-blue-400'
                  } rounded-full -translate-y-8 translate-x-8`}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Metrics Cards */}
        {metrics && activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-600 text-sm">💰</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-600">Total Income</h3>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                    All Time
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 group-hover:scale-105 transition-transform">
                  ₹{transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                </p>
                <div className="mt-2 h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 text-sm">💸</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-600">Total Expenses</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    metrics.changes.expenses > 0 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {metrics.changes.expenses > 0 ? '+' : ''}{metrics.changes.expenses.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-600 group-hover:scale-105 transition-transform">
                  ₹{transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                </p>
                <div className="mt-2 h-1 bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">💎</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600">Monthly Savings</h3>
                </div>
                <p className={`text-2xl font-bold group-hover:scale-105 transition-transform ${
                  (transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0) - 
                   transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  ₹{(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0) - 
                     transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)).toLocaleString()}
                </p>
                <div className="mt-2 h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full w-4/5 ${
                    metrics.currentMonth.savings >= 0 
                      ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                      : 'bg-gradient-to-r from-red-400 to-red-600'
                  }`}></div>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-bl-full opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">📊</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600">Savings Rate</h3>
                </div>
                <p className={`text-2xl font-bold group-hover:scale-105 transition-transform ${
                  (() => {
                    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
                    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
                    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
                    return savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 10 ? 'text-amber-600' : 'text-red-600';
                  })()
                }`}>
                  {(() => {
                    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
                    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
                    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
                    return savingsRate.toFixed(1);
                  })()}%
                </p>
                <div className="mt-2 h-1 bg-purple-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    (() => {
                      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
                      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
                      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
                      return savingsRate >= 20 
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 w-full' 
                        : savingsRate >= 10 
                          ? 'bg-gradient-to-r from-amber-400 to-amber-600 w-3/4'
                          : 'bg-gradient-to-r from-red-400 to-red-600 w-1/2';
                    })()
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Breakdown */}
        {/* {metrics?.weeklyData && (activeTab === 'overview' || activeTab === 'trends') && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/50 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📈</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Weekly Breakdown</h3>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">All Time Data</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(metrics.weeklyData).map(([week, data], index) => {
                const netAmount = data.income - data.expenses;
                const isProfit = netAmount >= 0;
                
                return (
                  <div key={week} className="relative group">
                    <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border border-slate-100 group-hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700">{week}</h4>
                        <div className={`w-3 h-3 rounded-full ${isProfit ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Income</span>
                          <span className="font-semibold text-emerald-600">₹{data.income.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Expenses</span>
                          <span className="font-semibold text-red-600">₹{data.expenses.toLocaleString()}</span>
                        </div>
                        
                        <hr className="border-slate-200"/>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Net</span>
                          <span className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₹{netAmount.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                              <span className="text-slate-600 text-xs">#</span>
                            </div>
                            <span className="text-xs text-slate-500">{data.transactions} transactions</span>
                          </div>
                        </div>
                      </div>
                    </div> */}
                    
                    {/* Week number indicator */}
                    {/* <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )} */}

        {/* Category Trends */}
        {metrics?.categoryTrends && (activeTab === 'categories' || activeTab === 'trends') && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/50 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🏷️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Category Spending Trends</h3>
            </div>
            
            <div className="grid gap-4">
              {Object.entries(metrics.categoryTrends)
                .sort(([,a], [,b]) => b.current - a.current)
                .slice(0, 6)
                .map(([category, trend]) => {
                  const maxAmount = Math.max(trend.current, trend.last);
                  const currentWidth = (trend.current / maxAmount) * 100;
                  const lastWidth = (trend.last / maxAmount) * 100;
                  
                  return (
                    <div key={category} className="group p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <span className="text-slate-600 text-sm">📊</span>
                          </div>
                          <h4 className="font-bold text-slate-800">{category}</h4>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          trend.change > 0 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : trend.change < 0 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {trend.change > 0 ? '↗' : trend.change < 0 ? '↘' : '→'} {Math.abs(trend.change)}%
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">This month</span>
                          <span className="font-semibold">₹{trend.current.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${currentWidth}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Last month</span>
                          <span className="font-semibold">₹{trend.last.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full transition-all duration-500"
                            style={{ width: `${lastWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Enhanced Transaction Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Spending Categories */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Top Spending Categories</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(
                transactions
                  .filter(t => t.type === 'expense')
                  .reduce((acc, t) => {
                    const category = t.category || 'Other';
                    acc[category] = (acc[category] || 0) + (t.amount || 0);
                    return acc;
                  }, {})
              )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, amount], index) => {
                  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'];
                  
                  return (
                    <div key={category} className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${colors[index]} rounded-xl text-white font-bold flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{category}</span>
                          <div className="text-xs text-slate-500">
                            {transactions.filter(t => t.category === category && t.type === 'expense').length} transactions
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 text-lg">
                        ₹{amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent Large Transactions */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Recent Large Transactions</h3>
            </div>
            
            <div className="space-y-4">
              {transactions
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))
                .slice(0, 5)
                .map((transaction, index) => (
                <div key={transaction._id || index} className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      transaction.type === 'income' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {transaction.category} • {transaction.date}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-lg ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{(transaction.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Statistics */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📈</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Transaction Statistics</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="group text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-blue-600 text-lg">📊</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                {transactions.length}
              </p>
              <p className="text-sm font-medium text-slate-600">Total Transactions</p>
              <div className="mt-3 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="group text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-emerald-600 text-lg">💰</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {transactions.filter(t => t.type === 'income').length}
              </p>
              <p className="text-sm font-medium text-slate-600">Income Entries</p>
              <div className="mt-3 h-1 bg-emerald-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(transactions.filter(t => t.type === 'income').length / transactions.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="group text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-red-600 text-lg">💸</span>
              </div>
              <p className="text-3xl font-bold text-red-600 mb-1">
                {transactions.filter(t => t.type === 'expense').length}
              </p>
              <p className="text-sm font-medium text-slate-600">Expense Entries</p>
              <div className="mt-3 h-1 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(transactions.filter(t => t.type === 'expense').length / transactions.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="group text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-purple-600 text-lg">🏷️</span>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {[...new Set(transactions.map(t => t.category))].length}
              </p>
              <p className="text-sm font-medium text-slate-600">Categories Used</p>
              <div className="mt-3 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-4/5"></div>
              </div>
            </div>
          </div>
          
          {/* Additional Insights */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-700 mb-2">Average Transaction</h4>
                <p className="text-xl font-bold text-slate-800">
                  ₹{transactions.length > 0 ? Math.round(transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length).toLocaleString() : 0}
                </p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-700 mb-2">Largest Transaction</h4>
                <p className="text-xl font-bold text-slate-800">
                  ₹{transactions.length > 0 ? Math.max(...transactions.map(t => t.amount || 0)).toLocaleString() : 0}
                </p>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-700 mb-2">Daily Average</h4>
                <p className="text-xl font-bold text-slate-800">
                  ₹{transactions.length > 0 ? Math.round(transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / 30).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 rounded-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to optimize your finances?</h3>
                <p className="text-blue-100 mb-4">
                  Use these insights to make better financial decisions and reach your goals faster.
                </p>
                <div className="flex gap-4">
                  <Link 
                    href="/budget" 
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Set Budget Goals
                  </Link>
                  <button 
                    onClick={handleExportCSV}
                    className="border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                  >
                    Export Full Report
                  </button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
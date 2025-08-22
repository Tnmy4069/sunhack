'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '@/lib/crudHelpers';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    monthlyBreakdown: [],
    categorySpending: [],
    recentTransactions: [],
    goalProgress: [],
    lendingBorrowing: {
      totalLent: 0,
      totalBorrowed: 0,
      outstandingLent: 0,
      outstandingBorrowed: 0,
      outstanding: []
    }
  });

  // Lending/Borrowing form state
  const [lbForm, setLbForm] = useState({
    type: 'lend',
    person: '',
    amount: '',
    dueDate: '',
    note: ''
  });
  const [submittingLB, setSubmittingLB] = useState(false);

  // Handle responsive behavior and mounting
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    setMounted(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateDashboardStats = useCallback((data) => {
    if (!data || data.length === 0) {
      setDashboardStats({
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        savingsRate: 0,
        monthlyBreakdown: [],
        categorySpending: [],
        recentTransactions: [],
        goalProgress: [],
        lendingBorrowing: {
          totalLent: 0,
          totalBorrowed: 0,
          outstandingLent: 0,
          outstandingBorrowed: 0,
          outstanding: []
        }
      });
      return;
    }

    // Filter out query and unknown type transactions
    const validTransactions = data.filter(t => 
      t.type === 'income' || t.type === 'expense'
    );

    // Lending/Borrowing transactions
    const lbTransactions = data.filter(t => t.type === 'lend' || t.type === 'borrow');
    const totalLent = lbTransactions.filter(t => t.type === 'lend').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalBorrowed = lbTransactions.filter(t => t.type === 'borrow').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const outstandingLB = lbTransactions.filter(t => !t.status || t.status !== 'settled');
    const outstandingLent = outstandingLB.filter(t => t.type === 'lend').reduce((sum, t) => sum + (t.amount || 0), 0);
    const outstandingBorrowed = outstandingLB.filter(t => t.type === 'borrow').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const outstanding = outstandingLB
      .map(t => ({
        _id: t._id,
        type: t.type,
        person: t.person || t.counterparty || 'Unknown',
        amount: t.amount || 0,
        dueDate: t.dueDate || t.due_date || '',
        note: t.note || '',
        date: t.date
      }))
      .sort((a, b) => {
        const dateA = new Date(a.dueDate || '2100-01-01');
        const dateB = new Date(b.dueDate || '2100-01-01');
        return dateA - dateB;
      })
      .slice(0, 10);

    // Calculate total income and expenses
    const income = validTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = validTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const netSavings = income - expenses;
    const savingsRate = income > 0 ? ((netSavings / income) * 100) : 0;

    // Get all unique months from the data, then take the most recent 6
    const monthsSet = new Set();
    validTransactions.forEach(transaction => {
      if (transaction.date && transaction.date !== '2025-08-22') { // Exclude today's empty entries
        const monthKey = transaction.date.slice(0, 7); // YYYY-MM
        monthsSet.add(monthKey);
      }
    });

    // Convert to array and sort, then take the most recent 6 months
    const sortedMonths = Array.from(monthsSet).sort().slice(-6);
    
    // If no months with data, show last 6 months from current date
    if (sortedMonths.length === 0) {
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        sortedMonths.push(monthKey);
      }
    }

    // Initialize monthly data
    const monthlyData = {};
    sortedMonths.forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      monthlyData[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0,
        expenses: 0,
        transactions: 0
      };
    });

    // Fill with actual data
    validTransactions.forEach(transaction => {
      if (transaction.date && transaction.date !== '2025-08-22') {
        const monthKey = transaction.date.slice(0, 7);
        if (monthlyData[monthKey]) {
          if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            monthlyData[monthKey].expenses += transaction.amount || 0;
          }
          monthlyData[monthKey].transactions++;
        }
      }
    });

    const monthlyBreakdown = sortedMonths.map(monthKey => monthlyData[monthKey]);

    // Category spending breakdown (only expenses)
    const categoryData = {};
    validTransactions.filter(t => t.type === 'expense').forEach(transaction => {
      const category = transaction.category || 'Other';
      categoryData[category] = (categoryData[category] || 0) + (transaction.amount || 0);
    });

    const categorySpending = Object.entries(categoryData)
      .map(([category, amount]) => ({ category, amount }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // Recent transactions (last 5, excluding query and unknown types)
    const recentTransactions = validTransactions
      .filter(t => t.date !== '2025-08-22') // Exclude today's empty entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Goal progress (extract unique goals with progress)
    const goalData = {};
    validTransactions.forEach(transaction => {
      if (transaction.goal && transaction.goal.name && transaction.goal.target_amount > 0) {
        const goalName = transaction.goal.name;
        if (!goalData[goalName]) {
          goalData[goalName] = {
            name: goalName,
            target: transaction.goal.target_amount,
            duration: transaction.goal.duration_months,
            saved: 0
          };
        }
        if (transaction.type === 'income') {
          goalData[goalName].saved += transaction.amount || 0;
        }
      }
    });

    const goalProgress = Object.values(goalData).slice(0, 3);

    setDashboardStats({
      totalIncome: income,
      totalExpenses: expenses,
      netSavings,
      savingsRate,
      monthlyBreakdown,
      categorySpending,
      recentTransactions,
      goalProgress,
      lendingBorrowing: {
        totalLent,
        totalBorrowed,
        outstandingLent,
        outstandingBorrowed,
        outstanding
      }
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDocuments('hack');
      
      if (result.success) {
        const data = result.data || [];
        setTransactions(data);
        calculateDashboardStats(data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  }, [calculateDashboardStats]);

  // Handle lending/borrowing form submission
  const handleLBSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!lbForm.person || !lbForm.amount || Number(lbForm.amount) <= 0) return;
    
    setSubmittingLB(true);
    try {
      const payload = {
        type: lbForm.type,
        person: lbForm.person,
        amount: Number(lbForm.amount),
        dueDate: lbForm.dueDate || null,
        note: lbForm.note || '',
        status: 'outstanding',
        date: new Date().toISOString().slice(0, 10)
      };
      
      const result = await createDocument('hack', payload);
      if (result.success) {
        setLbForm({
          type: lbForm.type,
          person: '',
          amount: '',
          dueDate: '',
          note: ''
        });
        fetchTransactions();
      }
    } catch (err) {
      console.error('Error adding lending/borrowing record:', err);
    } finally {
      setSubmittingLB(false);
    }
  }, [lbForm, fetchTransactions]);

  // Mark lending/borrowing as settled
  const markLBSettled = useCallback(async (id) => {
    if (!id) return;
    try {
      const result = await updateDocument('hack', id, { 
        status: 'settled', 
        settledAt: new Date().toISOString() 
      });
      if (result.success) {
        fetchTransactions();
      }
    } catch (err) {
      console.error('Error settling record:', err);
    }
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 relative mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 sm:border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-2 sm:border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4 text-base sm:text-lg font-medium">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
          <button 
            onClick={fetchTransactions}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Financial Health Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your finances smartly and achieve your goals</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Link 
                href="/analytics" 
                className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-center text-sm sm:text-base"
              >
                📊 Analytics
              </Link>
              <Link 
                href="/transactions" 
                className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center text-sm sm:text-base"
              >
                💳 Transactions
              </Link>
              <button 
                onClick={fetchTransactions}
                className="w-full sm:w-auto bg-white text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                title="Refresh Data"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Income */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Income</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {dashboardStats.totalIncome > 0 ? `₹${dashboardStats.totalIncome.toLocaleString()}` : 'No income yet'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.type === 'income').length} income transactions
                </p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <span className="text-green-600 text-xl sm:text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Expenses</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                  {dashboardStats.totalExpenses > 0 ? `₹${dashboardStats.totalExpenses.toLocaleString()}` : 'No expenses yet'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.type === 'expense').length} expense transactions
                </p>
              </div>
              <div className="bg-red-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <span className="text-red-600 text-xl sm:text-2xl">💸</span>
              </div>
            </div>
          </div>

          {/* Net Savings */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Net Savings</p>
                <p className={`text-lg sm:text-2xl font-bold truncate ${dashboardStats.netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {dashboardStats.netSavings !== 0 ? `₹${dashboardStats.netSavings.toLocaleString()}` : 'Break even'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardStats.netSavings >= 0 ? 'Positive balance' : 'Need more income'}
                </p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <span className="text-blue-600 text-xl sm:text-2xl">🏦</span>
              </div>
            </div>
          </div>

          {/* Savings Rate */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Savings Rate</p>
                <p className={`text-lg sm:text-2xl font-bold truncate ${
                  dashboardStats.savingsRate >= 20 ? 'text-green-600' : 
                  dashboardStats.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {dashboardStats.totalIncome > 0 ? `${dashboardStats.savingsRate.toFixed(1)}%` : 'No data'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardStats.savingsRate >= 20 ? 'Excellent!' : 
                   dashboardStats.savingsRate >= 10 ? 'Good' : 'Needs improvement'}
                </p>
              </div>
              <div className="bg-purple-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <span className="text-purple-600 text-xl sm:text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Income vs Expense Pie Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <span>📊</span>
            Income vs Expense Distribution
          </h3>
          {dashboardStats.totalIncome > 0 || dashboardStats.totalExpenses > 0 ? (
            <div className="h-64 sm:h-80">
              {mounted && (
                <div className="w-full h-full flex justify-center">
                  <PieChart width={isMobile ? 300 : 400} height={isMobile ? 250 : 300}>
                    <Pie
                      data={[
                        { name: 'Income', value: dashboardStats.totalIncome },
                        { name: 'Expenses', value: dashboardStats.totalExpenses }
                      ].filter(item => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 80 : 100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`₹${Number(value).toLocaleString()}`, name]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontSize: isMobile ? '12px' : '14px' }}>
                          {value}: ₹{entry.payload.value.toLocaleString()}
                        </span>
                      )}
                    />
                  </PieChart>
                </div>
              )}
              
              {/* Summary stats below chart */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    ₹{dashboardStats.totalIncome.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-green-700 font-medium">Total Income</div>
                  <div className="text-xs text-green-600 mt-1">
                    {dashboardStats.totalIncome + dashboardStats.totalExpenses > 0 
                      ? `${((dashboardStats.totalIncome / (dashboardStats.totalIncome + dashboardStats.totalExpenses)) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </div>
                
                <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-red-600">
                    ₹{dashboardStats.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-red-700 font-medium">Total Expenses</div>
                  <div className="text-xs text-red-600 mt-1">
                    {dashboardStats.totalIncome + dashboardStats.totalExpenses > 0 
                      ? `${((dashboardStats.totalExpenses / (dashboardStats.totalIncome + dashboardStats.totalExpenses)) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </div>
                
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className={`text-lg sm:text-2xl font-bold ${dashboardStats.netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ₹{dashboardStats.netSavings.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700 font-medium">Net Balance</div>
                  <div className={`text-xs mt-1 font-medium ${dashboardStats.netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {dashboardStats.netSavings >= 0 ? 'Surplus' : 'Deficit'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500">
              <div className="text-center px-4">
                <div className="text-4xl sm:text-6xl mb-4">📊</div>
                <p className="text-base sm:text-lg font-medium mb-2">No data to display</p>
                <p className="text-sm mb-4">Add some transactions to see your income vs expense distribution</p>
                <Link 
                  href="/transactions"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <span>+</span>
                  Add Transaction
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Monthly Breakdown */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <span>📈</span>
              Monthly Overview (Recent Months)
            </h3>
            {dashboardStats.monthlyBreakdown.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {dashboardStats.monthlyBreakdown.map((month, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base sm:w-20">{month.month}</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {month.transactions} transaction{month.transactions !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 text-xs sm:text-sm">
                      <div className="text-green-600 font-medium">+₹{month.income.toLocaleString()}</div>
                      <div className="text-red-600 font-medium">-₹{month.expenses.toLocaleString()}</div>
                      <div className={`font-bold ${(month.income - month.expenses) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{(month.income - month.expenses).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-4">📊</div>
                <p className="mb-4 text-sm sm:text-base">No monthly data available</p>
                <Link href="/transactions" className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
                  Add some transactions to see monthly trends →
                </Link>
              </div>
            )}
          </div>

          {/* Category Spending */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <span>🏷️</span>
              Spending by Category
            </h3>
            {dashboardStats.categorySpending.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Pie Chart for Categories */}
                <div className="h-40 sm:h-48">
                  {mounted && (
                    <div className="w-full h-full flex justify-center">
                      <PieChart width={isMobile ? 250 : 300} height={isMobile ? 160 : 200}>
                        <Pie
                          data={dashboardStats.categorySpending}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 60 : 70}
                          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {dashboardStats.categorySpending.map((entry, index) => {
                            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
                            return (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`₹${Number(value).toLocaleString()}`, name]}
                        />
                      </PieChart>
                    </div>
                  )}
                </div>
                
                {/* Category List */}
                <div className="space-y-2 sm:space-y-3">
                  {dashboardStats.categorySpending.map((category, index) => {
                    const percentage = dashboardStats.totalExpenses > 0 
                      ? ((category.amount / dashboardStats.totalExpenses) * 100).toFixed(1) 
                      : 0;
                    const colors = ['bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-cyan-600'];
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % 6]} flex-shrink-0`}></div>
                            <span className="font-medium text-gray-700 text-sm truncate">{category.category}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900 flex-shrink-0">₹{category.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${colors[index % 6]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">{percentage}% of total expenses</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-4">🏷️</div>
                <p className="mb-4 text-sm sm:text-base">No expense categories</p>
                <Link href="/transactions" className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
                  Add expense transactions →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Lending & Borrowing Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <span>🤝</span>
            Lending & Borrowing Management
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Summary Cards */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-green-600 font-medium">Total Lent</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-700 truncate">₹{dashboardStats.lendingBorrowing.totalLent.toLocaleString()}</p>
                    <p className="text-xs text-green-500 mt-1">Outstanding: ₹{dashboardStats.lendingBorrowing.outstandingLent.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-200 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                    <span className="text-green-600 text-lg sm:text-xl">💰</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-red-600 font-medium">Total Borrowed</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-700 truncate">₹{dashboardStats.lendingBorrowing.totalBorrowed.toLocaleString()}</p>
                    <p className="text-xs text-red-500 mt-1">Outstanding: ₹{dashboardStats.lendingBorrowing.outstandingBorrowed.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-200 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                    <span className="text-red-600 text-lg sm:text-xl">💸</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">Net Position</p>
                    <p className={`text-lg sm:text-2xl font-bold truncate ${dashboardStats.lendingBorrowing.outstandingLent >= dashboardStats.lendingBorrowing.outstandingBorrowed ? 'text-green-700' : 'text-red-700'}`}>
                      ₹{Math.abs(dashboardStats.lendingBorrowing.outstandingLent - dashboardStats.lendingBorrowing.outstandingBorrowed).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      {dashboardStats.lendingBorrowing.outstandingLent >= dashboardStats.lendingBorrowing.outstandingBorrowed ? 'Net Lender' : 'Net Borrower'}
                    </p>
                  </div>
                  <div className="bg-blue-200 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                    <span className="text-blue-600 text-lg sm:text-xl">⚖️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Record Form */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Add New Record</h4>
              <form onSubmit={handleLBSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    value={lbForm.type}
                    onChange={(e) => setLbForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lend">I Lent Money</option>
                    <option value="borrow">I Borrowed Money</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Person</label>
                  <input
                    type="text"
                    value={lbForm.person}
                    onChange={(e) => setLbForm(prev => ({ ...prev, person: e.target.value }))}
                    placeholder="Enter person's name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lbForm.amount}
                    onChange={(e) => setLbForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={lbForm.dueDate}
                    onChange={(e) => setLbForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={lbForm.note}
                    onChange={(e) => setLbForm(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Additional details..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submittingLB || !lbForm.person || !lbForm.amount}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-xs sm:text-sm"
                >
                  {submittingLB ? 'Adding...' : 'Add Record'}
                </button>
              </form>
            </div>

            {/* Outstanding Records */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Outstanding Records</h4>
              <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {dashboardStats.lendingBorrowing.outstanding.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <div className="text-2xl sm:text-3xl mb-2">📋</div>
                    <p className="text-xs sm:text-sm">No outstanding records</p>
                  </div>
                ) : (
                  dashboardStats.lendingBorrowing.outstanding.map((record) => (
                    <div key={record._id} className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${record.type === 'lend' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 text-sm truncate">{record.person}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {record.type === 'lend' ? 'You lent' : 'You borrowed'} ₹{record.amount.toLocaleString()}
                            </p>
                            {record.dueDate && (
                              <p className="text-xs text-gray-500">
                                Due: {new Date(record.dueDate).toLocaleDateString()}
                              </p>
                            )}
                            {record.note && (
                              <p className="text-xs text-gray-500 italic truncate">{record.note}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => markLBSettled(record._id)}
                          className="text-xs bg-gray-800 text-white px-2 sm:px-3 py-1 rounded-md hover:bg-gray-700 transition-colors flex-shrink-0"
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        {dashboardStats.goalProgress.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <span>🎯</span>
              Goal Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dashboardStats.goalProgress.map((goal, index) => {
                const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
                return (
                  <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{goal.name}</h4>
                      <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">{goal.duration} months</span>
                    </div>
                    <div className="flex justify-between items-center mb-3 text-xs sm:text-sm">
                      <span className="text-gray-600">₹{goal.saved.toLocaleString()} saved</span>
                      <span className="font-semibold text-gray-800">₹{goal.target.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div 
                        className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
                          progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <span>💳</span>
                Recent Transactions
              </h3>
              <Link 
                href="/transactions"
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardStats.recentTransactions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl sm:text-3xl">💳</span>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No transactions yet</h4>
                <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Start tracking your financial activities to see insights</p>
                <Link 
                  href="/transactions"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                >
                  <span>+</span>
                  Add Your First Transaction
                </Link>
              </div>
            ) : (
              dashboardStats.recentTransactions.map((transaction, index) => (
                <div key={transaction._id || index} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 mt-1 ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {transaction.category} • {transaction.date} • {transaction.currency}
                        </p>
                        {transaction.goal && transaction.goal.name && (
                          <p className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block mt-1 truncate max-w-full">
                            🎯 {transaction.goal.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm sm:text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{(transaction.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 sm:p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to take control of your finances?</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Add transactions, set goals, and track your progress towards financial freedom.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link 
                href="/transactions" 
                className="bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center text-sm sm:text-base"
              >
                Add Transaction
              </Link>
              <Link 
                href="/analytics" 
                className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400 text-center text-sm sm:text-base"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
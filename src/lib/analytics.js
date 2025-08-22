// Analytics and Chart Components for Financial Dashboard

export const calculateFinancialMetrics = (transactions) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  
  // Current month data
  const currentMonthTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
  const currentMonthIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const currentMonthExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Last month data
  const lastMonthTransactions = transactions.filter(t => t.date && t.date.startsWith(lastMonth));
  const lastMonthIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const lastMonthExpenses = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Calculate changes
  const incomeChange = lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
  const expenseChange = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100) : 0;
  
  // Weekly breakdown
  const weeklyData = getWeeklyBreakdown(transactions);
  
  // Category trends
  const categoryTrends = getCategoryTrends(transactions);
  
  return {
    currentMonth: {
      income: currentMonthIncome,
      expenses: currentMonthExpenses,
      savings: currentMonthIncome - currentMonthExpenses,
      savingsRate: currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome * 100) : 0
    },
    changes: {
      income: incomeChange,
      expenses: expenseChange
    },
    weeklyData,
    categoryTrends
  };
};

const getWeeklyBreakdown = (transactions) => {
  const weeks = {};
  const now = new Date();
  
  // Get last 4 weeks
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekKey = `Week ${4 - i}`;
    const weekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= weekStart && transactionDate <= weekEnd;
    });
    
    weeks[weekKey] = {
      income: weekTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0),
      expenses: weekTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0),
      transactions: weekTransactions.length
    };
  }
  
  return weeks;
};

const getCategoryTrends = (transactions) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  
  const currentMonthByCategory = {};
  const lastMonthByCategory = {};
  
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    
    const category = t.category || 'Other';
    const amount = t.amount || 0;
    
    if (t.date && t.date.startsWith(currentMonth)) {
      currentMonthByCategory[category] = (currentMonthByCategory[category] || 0) + amount;
    } else if (t.date && t.date.startsWith(lastMonth)) {
      lastMonthByCategory[category] = (lastMonthByCategory[category] || 0) + amount;
    }
  });
  
  const trends = {};
  const allCategories = [...new Set([...Object.keys(currentMonthByCategory), ...Object.keys(lastMonthByCategory)])];
  
  allCategories.forEach(category => {
    const current = currentMonthByCategory[category] || 0;
    const last = lastMonthByCategory[category] || 0;
    const change = last > 0 ? ((current - last) / last * 100) : (current > 0 ? 100 : 0);
    
    trends[category] = {
      current,
      last,
      change: Math.round(change * 10) / 10
    };
  });
  
  return trends;
};

export const getBudgetAnalysis = (transactions, budgetLimits = {}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + (t.amount || 0);
      return acc;
    }, {});
  
  const analysis = {};
  Object.entries(currentMonthExpenses).forEach(([category, spent]) => {
    const budget = budgetLimits[category] || 0;
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget * 100) : 0;
    
    analysis[category] = {
      spent,
      budget,
      remaining,
      percentage: Math.round(percentage * 10) / 10,
      status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
    };
  });
  
  return analysis;
};

export const getSpendingInsights = (transactions) => {
  const insights = [];
  
  // High spending days
  const dailySpending = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const day = t.date;
    dailySpending[day] = (dailySpending[day] || 0) + (t.amount || 0);
  });
  
  const avgDailySpending = Object.values(dailySpending).reduce((sum, amount) => sum + amount, 0) / Object.keys(dailySpending).length;
  const highSpendingDays = Object.entries(dailySpending).filter(([, amount]) => amount > avgDailySpending * 2);
  
  if (highSpendingDays.length > 0) {
    insights.push({
      type: 'warning',
      title: 'High Spending Days Detected',
      message: `You had ${highSpendingDays.length} days with spending above ₹${Math.round(avgDailySpending * 2)}`
    });
  }
  
  // Category concentration
  const categoryTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const category = t.category || 'Other';
    categoryTotals[category] = (categoryTotals[category] || 0) + (t.amount || 0);
  });
  
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  const dominantCategory = Object.entries(categoryTotals).reduce((max, [category, amount]) => 
    amount > (max[1] || 0) ? [category, amount] : max, ['', 0]
  );
  
  if (dominantCategory[1] > totalExpenses * 0.4) {
    insights.push({
      type: 'info',
      title: 'Category Concentration',
      message: `${dominantCategory[0]} accounts for ${Math.round(dominantCategory[1] / totalExpenses * 100)}% of your expenses`
    });
  }
  
  // Savings rate assessment
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
  
  if (savingsRate < 10) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: `Your savings rate is ${Math.round(savingsRate)}%. Consider reducing expenses or increasing income.`
    });
  } else if (savingsRate > 30) {
    insights.push({
      type: 'success',
      title: 'Excellent Savings Rate',
      message: `Great job! Your savings rate of ${Math.round(savingsRate)}% is above recommended levels.`
    });
  }
  
  return insights;
};

// Simple chart data formatters (can be used with any charting library)
export const formatChartData = {
  monthlyTrend: (monthlyData) => {
    return Object.entries(monthlyData)
      .filter(([, data]) => data.income > 0 || data.expenses > 0)
      .map(([month, data]) => ({
        month: month.slice(-2),
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses
      }));
  },
  
  categoryPie: (categoryBreakdown) => {
    return Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([category, amount]) => ({
        name: category,
        value: amount
      }));
  },
  
  weeklyComparison: (weeklyData) => {
    return Object.entries(weeklyData).map(([week, data]) => ({
      week,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses
    }));
  }
};

export const exportToCSV = (transactions) => {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
  const rows = transactions.map(t => [
    t.date || '',
    t.type || '',
    t.category || '',
    t.description || '',
    t.amount || 0,
    t.currency || 'INR'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

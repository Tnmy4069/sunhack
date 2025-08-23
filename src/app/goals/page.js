'use client';

import { useState, useEffect } from 'react';
import GoogleTranslate from '@/components/GoogleTranslate';
import Link from 'next/link';
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '@/lib/crudHelpers';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('goals');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [goalFormData, setGoalFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    category: 'savings',
    description: '',
    priority: 'medium'
  });

  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    monthly_limit: '',
    current_spent: 0,
    period: 'monthly',
    alert_threshold: 80,
    description: ''
  });

  const goalCategories = ['savings', 'investment', 'purchase', 'emergency', 'vacation', 'education', 'other'];
  const expenseCategories = ['Food', 'Entertainment', 'Transportation', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'];
  const priorities = ['low', 'medium', 'high'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsResult, budgetsResult, transactionsResult] = await Promise.all([
        getDocuments('goals'),
        getDocuments('budgets'),
        getDocuments('hack')
      ]);

      if (goalsResult.success) setGoals(goalsResult.data || []);
      if (budgetsResult.success) setBudgets(budgetsResult.data || []);
      if (transactionsResult.success) setTransactions(transactionsResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetSpent = (category) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        if (t.type !== 'expense' || t.category !== category) return false;
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const handleAddGoal = async () => {
    if (!goalFormData.name || !goalFormData.target_amount) {
      alert('Please fill in required fields');
      return;
    }

    const goal = {
      ...goalFormData,
      target_amount: parseFloat(goalFormData.target_amount),
      current_amount: parseFloat(goalFormData.current_amount) || 0,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    const result = editingItem 
      ? await updateDocument('goals', editingItem._id, goal)
      : await createDocument('goals', goal);

    if (result.success) {
      await fetchData();
      resetGoalForm();
      setShowAddGoalModal(false);
      setEditingItem(null);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleAddBudget = async () => {
    if (!budgetFormData.category || !budgetFormData.monthly_limit) {
      alert('Please fill in required fields');
      return;
    }

    const budget = {
      ...budgetFormData,
      monthly_limit: parseFloat(budgetFormData.monthly_limit),
      current_spent: calculateBudgetSpent(budgetFormData.category),
      created_at: new Date().toISOString(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };

    const result = editingItem 
      ? await updateDocument('budgets', editingItem._id, budget)
      : await createDocument('budgets', budget);

    if (result.success) {
      await fetchData();
      resetBudgetForm();
      setShowAddBudgetModal(false);
      setEditingItem(null);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      const result = await deleteDocument('goals', id);
      if (result.success) {
        await fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const handleDeleteBudget = async (id) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      const result = await deleteDocument('budgets', id);
      if (result.success) {
        await fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const startEditGoal = (goal) => {
    setEditingItem(goal);
    setGoalFormData({
      name: goal.name || '',
      target_amount: goal.target_amount?.toString() || '',
      current_amount: goal.current_amount?.toString() || '0',
      deadline: goal.deadline || '',
      category: goal.category || 'savings',
      description: goal.description || '',
      priority: goal.priority || 'medium'
    });
    setShowAddGoalModal(true);
  };

  const startEditBudget = (budget) => {
    setEditingItem(budget);
    setBudgetFormData({
      category: budget.category || '',
      monthly_limit: budget.monthly_limit?.toString() || '',
      current_spent: budget.current_spent || 0,
      period: budget.period || 'monthly',
      alert_threshold: budget.alert_threshold || 80,
      description: budget.description || ''
    });
    setShowAddBudgetModal(true);
  };

  const resetGoalForm = () => {
    setGoalFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      deadline: '',
      category: 'savings',
      description: '',
      priority: 'medium'
    });
  };

  const resetBudgetForm = () => {
    setBudgetFormData({
      category: '',
      monthly_limit: '',
      current_spent: 0,
      period: 'monthly',
      alert_threshold: 80,
      description: ''
    });
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getBudgetUsagePercentage = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString() || 0}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Goals & Budgets</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Set financial goals and manage budgets</p>
            </div>
            <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
              <Link 
                href="/" 
                className="bg-gray-600 mr-12 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                ← Dashboard
              </Link>

              <GoogleTranslate />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Financial Goals ({goals.length})
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'budgets'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Budget Management ({budgets.length})
            </button>
          </div>
        </div>

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Financial Goals</h2>
              <button
                onClick={() => setShowAddGoalModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Goal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <div key={goal._id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                        goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {goal.priority} priority
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditGoal(goal)}
                        className="text-yellow-600 hover:text-yellow-700 p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{getProgressPercentage(goal.current_amount, goal.target_amount).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(goal.current_amount, goal.target_amount)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>{formatCurrency(goal.current_amount)}</span>
                      <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Category:</strong> {goal.category}</p>
                    {goal.deadline && (
                      <p><strong>Deadline:</strong> {new Date(goal.deadline).toLocaleDateString()}</p>
                    )}
                    {goal.description && (
                      <p><strong>Description:</strong> {goal.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {goals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No goals set yet</p>
                <button
                  onClick={() => setShowAddGoalModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first goal →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Budget Management</h2>
              <button
                onClick={() => setShowAddBudgetModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Budget
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map((budget) => {
                const actualSpent = calculateBudgetSpent(budget.category);
                const usagePercentage = getBudgetUsagePercentage(actualSpent, budget.monthly_limit);
                const isOverBudget = usagePercentage > 100;
                const isNearLimit = usagePercentage >= budget.alert_threshold;

                return (
                  <div key={budget._id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{budget.category}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          isOverBudget ? 'bg-red-100 text-red-800' :
                          isNearLimit ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {isOverBudget ? 'Over Budget' : isNearLimit ? 'Near Limit' : 'On Track'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditBudget(budget)}
                          className="text-yellow-600 hover:text-yellow-700 p-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget._id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Spent this month</span>
                        <span>{usagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            isOverBudget ? 'bg-red-500' :
                            isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>{formatCurrency(actualSpent)}</span>
                        <span>{formatCurrency(budget.monthly_limit)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Remaining:</strong> {formatCurrency(Math.max(0, budget.monthly_limit - actualSpent))}</p>
                      <p><strong>Alert at:</strong> {budget.alert_threshold}%</p>
                      {budget.description && (
                        <p><strong>Description:</strong> {budget.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {budgets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No budgets set yet</p>
                <button
                  onClick={() => setShowAddBudgetModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first budget →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Add'} Goal</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Emergency Fund, New Car, Vacation"
                    value={goalFormData.name}
                    onChange={(e) => setGoalFormData({...goalFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={goalFormData.target_amount}
                      onChange={(e) => setGoalFormData({...goalFormData, target_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Amount</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={goalFormData.current_amount}
                      onChange={(e) => setGoalFormData({...goalFormData, current_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={goalFormData.category}
                      onChange={(e) => setGoalFormData({...goalFormData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {goalCategories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={goalFormData.priority}
                      onChange={(e) => setGoalFormData({...goalFormData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={goalFormData.deadline}
                    onChange={(e) => setGoalFormData({...goalFormData, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Additional details about your goal..."
                    value={goalFormData.description}
                    onChange={(e) => setGoalFormData({...goalFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddGoalModal(false);
                  resetGoalForm();
                  setEditingItem(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? 'Update' : 'Add'} Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Add'} Budget</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      value={budgetFormData.category}
                      onChange={(e) => setBudgetFormData({...budgetFormData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Limit *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={budgetFormData.monthly_limit}
                      onChange={(e) => setBudgetFormData({...budgetFormData, monthly_limit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                    <select
                      value={budgetFormData.period}
                      onChange={(e) => setBudgetFormData({...budgetFormData, period: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold (%)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      placeholder="80"
                      value={budgetFormData.alert_threshold}
                      onChange={(e) => setBudgetFormData({...budgetFormData, alert_threshold: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Additional notes about this budget..."
                    value={budgetFormData.description}
                    onChange={(e) => setBudgetFormData({...budgetFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {budgetFormData.category && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Current month spending in {budgetFormData.category}:</strong> {formatCurrency(calculateBudgetSpent(budgetFormData.category))}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddBudgetModal(false);
                  resetBudgetForm();
                  setEditingItem(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBudget}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? 'Update' : 'Add'} Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

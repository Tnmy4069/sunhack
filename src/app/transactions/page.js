'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '@/lib/crudHelpers';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [addMode, setAddMode] = useState('manual'); // 'manual', 'text', 'voice'
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // New filter states
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [amountRange, setAmountRange] = useState('all'); // 'all', 'small', 'medium', 'large', 'custom'
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category', 'type'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Form states
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: 'INR',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    goal: {
      name: '',
      target_amount: 0,
      duration_months: 0
    }
  });
  const [textInput, setTextInput] = useState('');
  
  const recognitionRef = useRef(null);

  const categories = {
    expense: ['Food', 'Entertainment', 'Transportation', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other']
  };

  useEffect(() => {
    fetchTransactions();
    
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result = await getDocuments('hack');
      if (result.success) {
        setTransactions(result.data || []);
        setLastLoadTime(new Date()); // Track when we loaded transactions
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };
 
  // Filter by creation date (last 24 hours)
  const isNewTransaction = (transaction) => {
    if (!transaction.date) return false;
    
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return transactionDate >= dayAgo;
  };

  // Filter by date range
  const matchesDateRange = (transaction) => {
    if (!transaction.date) return false;
    
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return transactionDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return transactionDate >= monthAgo;
      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          return transactionDate >= startDate && transactionDate <= endDate;
        }
        return true;
      default:
        return true;
    }
  };

  // Filter by amount range
  const matchesAmountRange = (transaction) => {
    const amount = transaction.amount || 0;
    
    switch (amountRange) {
      case 'small':
        return amount <= 1000;
      case 'medium':
        return amount > 1000 && amount <= 10000;
      case 'large':
        return amount > 10000;
      case 'custom':
        const min = parseFloat(minAmount) || 0;
        const max = parseFloat(maxAmount) || Infinity;
        return amount >= min && amount <= max;
      default:
        return true;
    }
  };

  // Sort transactions
  const sortTransactions = (transactions) => {
    return transactions.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const handleAddTransaction = async () => {
    if (addMode === 'manual') {
      if (!formData.amount || !formData.category) {
        alert('Please fill in amount and category');
        return;
      }
      
      const transaction = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      const result = await createDocument('hack', transaction);
      if (result.success) {
        await fetchTransactions();
        resetForm();
        setShowAddModal(false);
      } else {
        alert(`Error: ${result.error}`);
      }
    } else {
      // Handle text/voice input
      const parsedTransaction = parseTextInput(textInput);
      if (parsedTransaction) {
        const result = await createDocument('hack', parsedTransaction);
        if (result.success) {
          await fetchTransactions();
          setTextInput('');
          setShowAddModal(false);
        } else {
          alert(`Error: ${result.error}`);
        }
      } else {
        alert('Could not parse the transaction. Please try again or use manual input.');
      }
    }
  };

  const parseTextInput = (text) => {
    try {
      // Simple text parsing for "Spent 600 Rs on Dinner" format
      const spentMatch = text.match(/spent\s+(\d+)\s*(rs|rupees?|inr)?\s+on\s+(.+)/i);
      const earnedMatch = text.match(/earned\s+(\d+)\s*(rs|rupees?|inr)?\s+from\s+(.+)/i);
      
      if (spentMatch) {
        const [, amount, , description] = spentMatch;
        return {
          type: 'expense',
          amount: parseFloat(amount),
          currency: 'INR',
          category: guessCategory(description, 'expense'),
          description: description.trim(),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          goal: { name: '', target_amount: 0, duration_months: 0 }
        };
      } else if (earnedMatch) {
        const [, amount, , description] = earnedMatch;
        return {
          type: 'income',
          amount: parseFloat(amount),
          currency: 'INR',
          category: guessCategory(description, 'income'),
          description: description.trim(),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          goal: { name: '', target_amount: 0, duration_months: 0 }
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const guessCategory = (description, type) => {
    const desc = description.toLowerCase();
    
    if (type === 'expense') {
      if (desc.includes('food') || desc.includes('dinner') || desc.includes('lunch') || desc.includes('restaurant')) return 'Food';
      if (desc.includes('movie') || desc.includes('netflix') || desc.includes('entertainment')) return 'Entertainment';
      if (desc.includes('uber') || desc.includes('taxi') || desc.includes('bus') || desc.includes('transport')) return 'Transportation';
      if (desc.includes('shopping') || desc.includes('clothes') || desc.includes('amazon')) return 'Shopping';
      if (desc.includes('bill') || desc.includes('electricity') || desc.includes('phone') || desc.includes('internet')) return 'Bills';
      if (desc.includes('doctor') || desc.includes('medicine') || desc.includes('hospital')) return 'Healthcare';
    } else {
      if (desc.includes('salary') || desc.includes('job') || desc.includes('work')) return 'Salary';
      if (desc.includes('freelance') || desc.includes('project') || desc.includes('client')) return 'Freelance';
      if (desc.includes('investment') || desc.includes('dividend') || desc.includes('interest')) return 'Investment';
    }
    
    return 'Other';
  };

  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction || !formData.amount || !formData.category) {
      alert('Please fill in required fields');
      return;
    }
    
    const transaction = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    const result = await updateDocument('hack', editingTransaction._id, transaction);
    if (result.success) {
      await fetchTransactions();
      setShowEditModal(false);
      setEditingTransaction(null);
      resetForm();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      const result = await deleteDocument('hack', id);
      if (result.success) {
        await fetchTransactions();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const startEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type || 'expense',
      amount: transaction.amount?.toString() || '',
      currency: transaction.currency || 'INR',
      category: transaction.category || '',
      description: transaction.description || '',
      date: transaction.date || new Date().toISOString().split('T')[0],
      time: transaction.time || new Date().toLocaleTimeString('en-GB', { hour12: false }),
      goal: transaction.goal || { name: '', target_amount: 0, duration_months: 0 }
    });
    setShowEditModal(true);
  };

  // Helper function to format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      // Handle different date formats
      let date;
      
      // Check if it's DD/MM/YYYY format
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const [day, month, year] = parts;
          date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      } else {
        // Assume it's YYYY-MM-DD or other standard format
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if can't parse
      }
      
      // Format as "Aug 23, 2025"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original if any error
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      currency: 'INR',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      goal: { name: '', target_amount: 0, duration_months: 0 }
    });
    setTextInput('');
  };

  // Updated filter logic with all new filters included
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesNewFilter = !showNewOnly || isNewTransaction(transaction);
    const matchesDateFilter = matchesDateRange(transaction);
    const matchesAmountFilter = matchesAmountRange(transaction);
    
    return matchesSearch && matchesType && matchesCategory && matchesNewFilter && matchesDateFilter && matchesAmountFilter;
  });

  // Apply sorting to filtered transactions
  const sortedAndFilteredTransactions = sortTransactions([...filteredTransactions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your income and expenses</p>
            </div>
            <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
              <Link 
                href="/" 
                className="bg-gray-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                ← Dashboard
              </Link>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-3 mr-15 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                + Add Transaction
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Updated Filters Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border mb-6 sm:mb-8">
          {/* First Row of Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Categories</option>
                {[...new Set([...categories.expense, ...categories.income])].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
              <select
                value={amountRange}
                onChange={(e) => setAmountRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Amounts</option>
                <option value="small">Small (≤₹1,000)</option>
                <option value="medium">Medium (₹1,001-₹10,000)</option>
                <option value="large">Large (&gt;₹10,000)</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Second Row - Conditional Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </>
            )}

            {/* Custom Amount Range */}
            {amountRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Third Row - Sort and Additional Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
                <option value="type">Type</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="desc">Descending (Latest First)</option>
                <option value="asc">Ascending (Oldest First)</option>
              </select>
            </div>
            
            {/* Show New Only filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Filters</label>
              <div className="flex items-center h-10">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showNewOnly}
                    onChange={(e) => setShowNewOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">New only (24h)</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterCategory('all');
                  setShowNewOnly(false);
                  setDateRange('all');
                  setAmountRange('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setMinAmount('');
                  setMaxAmount('');
                  setSortBy('date');
                  setSortOrder('desc');
                }}
                className="w-full px-3 sm:px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Search: &quot;{searchTerm}&quot;
                </span>
              )}
              {filterType !== 'all' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Type: {filterType}
                </span>
              )}
              {filterCategory !== 'all' && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Category: {filterCategory}
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  Date: {dateRange}
                </span>
              )}
              {amountRange !== 'all' && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Amount: {amountRange}
                </span>
              )}
              {showNewOnly && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  New only
                </span>
              )}
              {(sortBy !== 'date' || sortOrder !== 'desc') && (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  Sort: {sortBy} ({sortOrder})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6 border-b">
            <h3 className="text-lg font-semibold">All Transactions ({sortedAndFilteredTransactions.length})</h3>
          </div>
          
          <div className="divide-y">
            {sortedAndFilteredTransactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-sm sm:text-base">No transactions found</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  Add your first transaction →
                </button>
              </div>
            ) : (
              sortedAndFilteredTransactions.map((transaction) => (
                <div key={transaction._id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.description || 'No description'}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {transaction.category} • {formatDate(transaction.date)}
                          {transaction.time && <span> • {transaction.time}</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className={`font-semibold text-base sm:text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.currency || 'INR'}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(transaction)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Add Transaction</h2>
            </div>
            
            <div className="p-6">
              {/* Input Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Input Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddMode('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      addMode === 'manual' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setAddMode('text')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      addMode === 'text' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Text Input
                  </button>
                  <button
                    onClick={() => setAddMode('voice')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      addMode === 'voice' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Voice Input
                  </button>
                </div>
              </div>

              {addMode === 'manual' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value, category: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select category</option>
                        {(categories[formData.type] || []).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      placeholder="Transaction description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time (Optional)</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(addMode === 'text' || addMode === 'voice') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {addMode === 'voice' ? 'Voice Input' : 'Text Input'}
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        placeholder={addMode === 'voice' ? 'Click the microphone to start voice input...' : 'e.g., "Spent 600 Rs on Dinner" or "Earned 5000 Rs from Freelance"'}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        readOnly={addMode === 'voice'}
                      />
                      {addMode === 'voice' && (
                        <button
                          onClick={startVoiceRecognition}
                          disabled={isListening}
                          className={`px-4 py-2 rounded-lg text-white font-medium ${
                            isListening 
                              ? 'bg-red-500 animate-pulse' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isListening ? '🎤 Listening...' : '🎤 Start'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: &quot;Spent 300 Rs on Food&quot;, &quot;Earned 10000 Rs from Salary&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setAddMode('manual');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Transaction</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value, category: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {(categories[formData.type] || []).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    placeholder="Transaction description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTransaction(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditTransaction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
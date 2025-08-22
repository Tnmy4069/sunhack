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
  
  // Form states
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: 'INR',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
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
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
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
      goal: transaction.goal || { name: '', target_amount: 0, duration_months: 0 }
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      currency: 'INR',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      goal: { name: '', target_amount: 0, duration_months: 0 }
    });
    setTextInput('');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

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
        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            
            <div className="flex items-end sm:col-span-1">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterCategory('all');
                }}
                className="w-full px-3 sm:px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6 border-b">
            <h3 className="text-lg font-semibold">All Transactions ({filteredTransactions.length})</h3>
          </div>
          
          <div className="divide-y">
            {filteredTransactions.length === 0 ? (
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
              filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((transaction) => (
                <div key={transaction._id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.description || 'No description'}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{transaction.category} • {transaction.date}</p>
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

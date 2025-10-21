import React, { useState } from 'react';
import { Plus, CreditCard, Calendar, Edit, Trash2 } from 'lucide-react';
import { Expense } from '../types';
import { calculations } from '../utils/calculations';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../utils/formatters';
import SearchBar from './SearchBar';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => void;
  onDeleteExpense?: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ 
  expenses, 
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    displayAmount: '',
    date: '',
    receiptNumber: '',
    notes: ''
  });

  const filteredAndSortedExpenses = () => {
    let filtered = expenses.filter(expense => {
      const matchesSearch = calculations.filterBySearch(searchQuery, [expense]).length > 0;
      const matchesDate = !dateFilter || expense.date.toISOString().split('T')[0] === dateFilter;
      return matchesSearch && matchesDate;
    });
    
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expense: Omit<Expense, 'id'> = {
      category: formData.category,
      description: formData.description,
      amount: parseFormattedNumber(formData.displayAmount),
      date: formData.date ? new Date(formData.date) : new Date(),
      receiptNumber: formData.receiptNumber || undefined,
      notes: formData.notes || undefined
    };

    if (editingExpense && onUpdateExpense) {
      onUpdateExpense(editingExpense.id, expense);
      setEditingExpense(null);
    } else {
      onAddExpense(expense);
    }

    setFormData({
      category: '',
      description: '',
      amount: '',
      displayAmount: '',
      date: '',
      receiptNumber: '',
      notes: ''
    });
    setShowForm(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      displayAmount: formatNumberInput(expense.amount.toString()),
      date: expense.date.toISOString().slice(0, 16),
      receiptNumber: expense.receiptNumber || '',
      notes: expense.notes || ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData({
      category: '',
      description: '',
      amount: '',
      displayAmount: '',
      date: '',
      receiptNumber: '',
      notes: ''
    });
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatNumberInput(value);
    const rawValue = parseFormattedNumber(formatted).toString();
    
    setFormData({
      ...formData,
      amount: rawValue,
      displayAmount: formatted
    });
  };

  const totalExpenses = calculations.getTotalExpenses(filteredAndSortedExpenses());

  const expenseCategories = [
    'Fizetés',
    'Költség',
    'Fejlesztés',
    'Bérleti díj',
    'Rezsi',
    'Marketing',
    'Irodaszer',
    'Szállítás',
    'Biztosítás',
    'Adó',
    'Javítás',
    'Egyéb'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Kiadások</h1>
          <p className="text-gray-400">Kiadások kezelése és nyomon követése</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Új Kiadás
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Keresés kiadásokban kategória, leírás szerint..."
              showResultCount={true}
              resultCount={filteredAndSortedExpenses().length}
              totalCount={expenses.length}
            />
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
            >
              <option value="date">Rendezés dátum szerint</option>
              <option value="category">Rendezés kategória szerint</option>
              <option value="amount">Rendezés összeg szerint</option>
              <option value="description">Rendezés leírás szerint</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
            >
              <option value="asc">Növekvő</option>
              <option value="desc">Csökkenő</option>
            </select>
            <div className="bg-red-900/20 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400">Összes kiadás</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {editingExpense ? 'Kiadás Szerkesztése' : 'Új Kiadás Rögzítése'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  required
                >
                  <option value="" className="text-gray-400">Válassz kategóriát</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Leírás"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Összeg (HUF)"
                  value={formData.displayAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="datetime-local"
                  placeholder="Dátum (opcionális - alapértelmezett: most)"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                 min="1900-01-01T00:00"
                 max="2099-12-31T23:59"
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  title="Ha üresen hagyod, az aktuális dátum és idő lesz használva"
                />
                <input
                  type="text"
                  placeholder="Bizonylat száma (opcionális)"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Megjegyzés (opcionális)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {editingExpense ? 'Frissítés' : 'Kiadás Rögzítése'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Mégse
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Dátum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Kategória
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Leírás
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Összeg
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bizonylat
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredAndSortedExpenses().map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.category === 'Fizetés' ? 'bg-blue-900/20 text-blue-400' :
                      expense.category === 'Költség' ? 'bg-orange-900/20 text-orange-400' :
                      expense.category === 'Fejlesztés' ? 'bg-purple-900/20 text-purple-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-sm text-gray-400">{expense.notes}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {expense.receiptNumber || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                        title="Kiadás szerkesztése"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {onDeleteExpense && (
                        <button
                          onClick={() => {
                            if (window.confirm('Biztosan törölni szeretnéd ezt a kiadást?')) {
                              onDeleteExpense(expense.id);
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                          title="Kiadás törlése"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
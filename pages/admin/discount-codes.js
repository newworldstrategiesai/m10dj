import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Users,
  DollarSign,
  Save,
  X,
  Loader2
} from 'lucide-react';

export default function DiscountCodesAdmin() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_amount: '',
    maximum_discount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    active: true,
    applicable_to: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Simple admin check using Supabase auth
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/signin?redirect=/admin/discount-codes';
        return;
      }

      // Check if user is admin
      const adminEmails = [
        'djbenmurray@gmail.com',
        'admin@m10djcompany.com',
        'manager@m10djcompany.com'
      ];
      
      const isUserAdmin = adminEmails.includes(user.email);
      setIsAdmin(isUserAdmin);
      
      if (isUserAdmin) {
        fetchCodes();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/signin?redirect=/admin/discount-codes';
    } finally {
      setLoading(false);
    }
  };

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/discount-codes');
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    }
  };

  const handleOpenModal = (code = null) => {
    if (code) {
      setEditingCode(code.id);
      setFormData({
        code: code.code,
        description: code.description || '',
        discount_type: code.discount_type,
        discount_value: code.discount_value.toString(),
        minimum_amount: code.minimum_amount ? code.minimum_amount.toString() : '',
        maximum_discount: code.maximum_discount ? code.maximum_discount.toString() : '',
        usage_limit: code.usage_limit ? code.usage_limit.toString() : '',
        valid_from: code.valid_from ? new Date(code.valid_from).toISOString().slice(0, 16) : '',
        valid_until: code.valid_until ? new Date(code.valid_until).toISOString().slice(0, 16) : '',
        active: code.active !== false,
        applicable_to: code.applicable_to || []
      });
    } else {
      setEditingCode(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_amount: '',
        maximum_discount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        active: true,
        applicable_to: []
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : 0,
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        code: formData.code.toUpperCase().trim()
      };

      const url = editingCode 
        ? `/api/admin/discount-codes/${editingCode}`
        : '/api/admin/discount-codes';
      
      const method = editingCode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        handleCloseModal();
        fetchCodes();
      } else {
        setError(data.error || 'Failed to save discount code');
      }
    } catch (error) {
      console.error('Error saving code:', error);
      setError('Failed to save discount code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCodes();
      } else {
        alert('Failed to delete discount code');
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      alert('Failed to delete discount code');
    }
  };

  const toggleActive = async (id, currentActive) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });

      if (response.ok) {
        fetchCodes();
      }
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Discount Codes | Admin | M10 DJ Company</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-8 h-8 text-brand" />
                    Discount Codes
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Create and manage discount codes for quotes
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Code
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {codes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No discount codes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first discount code to start offering promotions
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Code
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valid Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg text-brand">
                            {code.code}
                          </span>
                          {code.description && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {code.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {code.discount_type === 'percentage' ? (
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {code.discount_value}% off
                            </span>
                          ) : (
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${code.discount_value} off
                            </span>
                          )}
                          {code.minimum_amount > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Min: ${code.minimum_amount}
                            </div>
                          )}
                          {code.maximum_discount && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Max: ${code.maximum_discount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {code.usage_count || 0} / {code.usage_limit || '∞'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {code.valid_from && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              From: {new Date(code.valid_from).toLocaleDateString()}
                            </div>
                          )}
                          {code.valid_until && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              Until: {new Date(code.valid_until).toLocaleDateString()}
                            </div>
                          )}
                          {!code.valid_from && !code.valid_until && (
                            <span className="text-gray-400">No date restrictions</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(code.id, code.active)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            code.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {code.active ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(code)}
                            className="text-brand hover:text-brand-dark"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="WEDDING10"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="10% off wedding packages"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Value *
                    </label>
                    <div className="relative">
                      {formData.discount_type === 'percentage' ? (
                        <input
                          type="number"
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                          placeholder="10"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                            placeholder="25"
                            min="0"
                            step="0.01"
                            required
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Discount ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formData.maximum_discount}
                          onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                          placeholder="50"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Cap the maximum discount amount (optional)
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Amount ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.minimum_amount}
                        onChange={(e) => setFormData({ ...formData, minimum_amount: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      placeholder="100 (leave empty for unlimited)"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valid From
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-brand focus:ring-brand rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active (code can be used)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingCode ? 'Update Code' : 'Create Code'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


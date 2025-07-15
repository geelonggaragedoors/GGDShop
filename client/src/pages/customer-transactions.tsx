import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Mail, Package, Receipt, Search, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  customerId: string;
  orderId: string;
  type: string;
  amount: number;
  description: string;
  paymentMethod: string;
  transactionId: string;
  status: string;
  emailSentAt: string;
  createdAt: string;
}

export default function CustomerTransactions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['/api/customer-transactions', user?.id],
    enabled: !!user?.id,
  });

  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    const matchesDate = !dateRange.start || !dateRange.end || 
                       (new Date(transaction.createdAt) >= new Date(dateRange.start) && 
                        new Date(transaction.createdAt) <= new Date(dateRange.end));
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'order_confirmation':
        return 'bg-blue-100 text-blue-800';
      case 'payment_receipt':
        return 'bg-green-100 text-green-800';
      case 'status_update':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'order_confirmation':
        return <Package className="w-4 h-4" />;
      case 'payment_receipt':
        return <Receipt className="w-4 h-4" />;
      case 'status_update':
        return <Mail className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'order_confirmation':
        return 'Order Confirmation';
      case 'payment_receipt':
        return 'Payment Receipt';
      case 'status_update':
        return 'Status Update';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleDownloadInvoice = (transaction: Transaction) => {
    // Create a simple HTML invoice content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${transaction.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .amount { font-size: 1.5rem; font-weight: bold; color: #1e40af; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #1e40af; margin: 0;">Geelong Garage Doors</h1>
          <p>Transaction Record</p>
        </div>
        
        <div class="invoice-details">
          <h2>Transaction Details</h2>
          <p><strong>Transaction ID:</strong> ${transaction.id}</p>
          <p><strong>Order ID:</strong> ${transaction.orderId}</p>
          <p><strong>Type:</strong> ${getTransactionTitle(transaction.type)}</p>
          <p><strong>Amount:</strong> <span class="amount">$${transaction.amount.toFixed(2)}</span></p>
          <p><strong>Payment Method:</strong> ${transaction.paymentMethod}</p>
          <p><strong>Status:</strong> ${transaction.status}</p>
          <p><strong>Date:</strong> ${format(new Date(transaction.createdAt), 'PPP')}</p>
          <p><strong>Description:</strong> ${transaction.description}</p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 0.9rem;">
            Thank you for choosing Geelong Garage Doors<br>
            For support, contact us at info@geelonggaragedoors.com or (03) 5221 8999
          </p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${transaction.orderId}-${transaction.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your transaction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load transaction history</p>
            <p className="text-gray-600">Please try again later or contact support if the issue persists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">View all your invoices, receipts, and order communications</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type">Transaction Type</Label>
              <select
                id="type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="order_confirmation">Order Confirmations</option>
                <option value="payment_receipt">Payment Receipts</option>
                <option value="status_update">Status Updates</option>
              </select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' || dateRange.start || dateRange.end
                  ? "No transactions match your current filters."
                  : "You don't have any transactions yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction: Transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {getTransactionTitle(transaction.type)}
                        </h3>
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{transaction.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(transaction.createdAt), 'PPP')}
                        </span>
                        <span>Order: {transaction.orderId}</span>
                        <span>Payment: {transaction.paymentMethod.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600 mb-2">
                      ${transaction.amount.toFixed(2)}
                    </div>
                    <Button
                      onClick={() => handleDownloadInvoice(transaction)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total Transactions: {filteredTransactions.length}</span>
              <span>
                Total Amount: ${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
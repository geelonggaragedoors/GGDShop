import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Mail, Package, Receipt, Search, Download, Filter, CreditCard, DollarSign, Clock, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  customerId: string;
  orderId: string;
  transactionType: string;
  documentType: string;
  amount: string;
  paymentMethod: string;
  transactionReference: string;
  status: string;
  emailSentAt: Date | null;
  createdAt: Date;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: string;
  currency: string;
  paypalOrderId: string | null;
  createdAt: Date;
}

interface TransactionResponse {
  transactions: Transaction[];
  pendingOrders: PendingOrder[];
}

export default function CustomerTransactions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data, isLoading, error } = useQuery<TransactionResponse>({
    queryKey: ['/api/customer-transactions', user?.id],
    enabled: !!user?.id,
  });

  const transactions = data?.transactions || [];
  const pendingOrders = data?.pendingOrders || [];

  // Enhanced error and success logging
  useEffect(() => {
    if (error) {
      console.error("=== FRONTEND TRANSACTION ERROR ===");
      console.error("Error details:", error);
      console.error("User data:", { id: user?.id, email: user?.email });
    }
    if (data) {
      console.log("=== FRONTEND TRANSACTION SUCCESS ===");
      console.log("Transactions received:", transactions.length);
      console.log("Pending orders received:", pendingOrders.length);
      console.log("User data:", { id: user?.id, email: user?.email });
    }
  }, [error, data, transactions, pendingOrders, user]);

  const filteredTransactions = (transactions as Transaction[]).filter((transaction: Transaction) => {
    const matchesSearch = transaction.transactionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.transactionType === filterType;
    
    const matchesDate = !dateRange.start || !dateRange.end || 
                       (new Date(transaction.createdAt) >= new Date(dateRange.start) && 
                        new Date(transaction.createdAt) <= new Date(dateRange.end));
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800';
      case 'receipt':
        return 'bg-green-100 text-green-800';
      case 'refund':
        return 'bg-red-100 text-red-800';
      case 'credit':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <Package className="w-4 h-4" />;
      case 'receipt':
        return <Receipt className="w-4 h-4" />;
      case 'refund':
        return <CreditCard className="w-4 h-4" />;
      case 'credit':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Order Invoice';
      case 'receipt':
        return 'Payment Receipt';
      case 'refund':
        return 'Refund Receipt';
      case 'credit':
        return 'Credit Note';
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
          <p><strong>Type:</strong> ${getTransactionTitle(transaction.transactionType)}</p>
          <p><strong>Amount:</strong> <span class="amount">$${parseFloat(transaction.amount).toFixed(2)}</span></p>
          <p><strong>Payment Method:</strong> ${transaction.paymentMethod}</p>
          <p><strong>Status:</strong> ${transaction.status}</p>
          <p><strong>Date:</strong> ${format(new Date(transaction.createdAt), 'PPP')}</p>
          <p><strong>Document Type:</strong> ${transaction.documentType}</p>
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

  const handleContinuePayment = (orderId: string) => {
    window.location.href = `/checkout?resume=${orderId}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">View all your invoices, receipts, and order communications</p>
      </div>

      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="w-5 h-5" />
              Pending Orders - Continue Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-lg border border-orange-200 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          Created: {format(new Date(order.createdAt), 'PPP')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Payment Pending
                      </Badge>
                      {order.status === 'shipped' && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Already Shipped
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Total: <span className="font-semibold text-gray-900">{order.currency} ${parseFloat(order.total).toFixed(2)}</span></p>
                      <p>Email: {order.customerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleContinuePayment(order.id)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Continue Payment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Important:</strong> These orders are awaiting payment. Click "Continue Payment" to complete your purchase with PayPal.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <option value="invoice">Invoices</option>
                <option value="receipt">Payment Receipts</option>
                <option value="refund">Refunds</option>
                <option value="credit">Credits</option>
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
                      {getTransactionIcon(transaction.transactionType)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {getTransactionTitle(transaction.transactionType)}
                        </h3>
                        <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{transaction.documentType}</p>
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
                      ${parseFloat(transaction.amount).toFixed(2)}
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
                Total Amount: ${(filteredTransactions as Transaction[]).reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils-format';
import { DollarSign, Receipt, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInvoices();
      // Sort by date, newest first
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setInvoices(sorted);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoices.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    setProcessingPayment(invoiceId);
    try {
      const { url } = await apiClient.createCheckoutSession(invoiceId);
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
      setProcessingPayment(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'paid');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#4A3F35] mb-2">Payments & Invoices</h1>
        <p className="text-[#2D3436] opacity-70">
          View and pay your outstanding invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-[#4A3F35]">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-[#4A3F35]">
                  {unpaidInvoices.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-[#4A3F35]">
                  {paidInvoices.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#4A3F35] mb-4">Outstanding Invoices</h2>
          <div className="space-y-4">
            {unpaidInvoices.map((invoice) => (
              <Card key={invoice.id} className="shadow-sm rounded-xl border-l-4 border-l-[#C97D60]">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-5 h-5 text-[#8B9D83]" />
                        <h3 className="font-semibold text-lg">Invoice #{invoice.invoiceNumber}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Issued: {formatDate(invoice.createdAt)}</p>
                        <p>Due: {formatDate(invoice.dueDate)}</p>
                        {invoice.items && invoice.items.length > 0 && (
                          <p className="text-[#4A3F35] font-medium mt-2">
                            Services: {invoice.items.map(item => item.description).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Amount Due</p>
                        <p className="text-2xl font-bold text-[#4A3F35]">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                      </div>
                      <Button
                        className="bg-[#C97D60] hover:bg-[#B86D50] gap-2"
                        onClick={() => handlePayInvoice(invoice.id)}
                        disabled={processingPayment === invoice.id}
                      >
                        <CreditCard className="w-4 h-4" />
                        {processingPayment === invoice.id ? 'Processing...' : 'Pay Now'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Paid Invoices / Payment History */}
      {paidInvoices.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[#4A3F35] mb-4">Payment History</h2>
          <Card className="shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {paidInvoices.map((invoice, index) => (
                  <div key={invoice.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">Paid on {formatDate(invoice.updatedAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#4A3F35]">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {invoices.length === 0 && (
        <Card className="shadow-sm rounded-xl">
          <CardContent className="py-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No invoices yet</p>
            <p className="text-gray-400 text-sm">
              Your invoices and payment history will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreVertical, Download, Send, CreditCard } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils-format';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { Invoice } from '@/types';
import Link from 'next/link';

export default function InvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const isClient = user?.role === 'client';

  useEffect(() => {
    if (!authLoading && user) {
      loadInvoices();
    }
  }, [authLoading, user]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInvoices();
      setInvoices(data);
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

  const filteredInvoices = invoices.filter((invoice) => {
    const clientName = invoice.client 
      ? `${invoice.client.firstName} ${invoice.client.lastName}`
      : '';
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingAmount = filteredInvoices
    .filter(inv => inv.status === 'issued' || inv.status === 'past_due')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            {isClient ? 'View and pay your invoices' : 'Manage and track all invoices'}
          </p>
        </div>

        {!isClient && (
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Past Due</p>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(
                filteredInvoices
                  .filter(inv => inv.status === 'past_due')
                  .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
              )}
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                {!isClient && <TableHead>Client</TableHead>}
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    {!isClient && <TableCell><Skeleton className="h-8 w-full" /></TableCell>}
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    {!isClient && (
                      <TableCell>
                        {invoice.client 
                          ? `${invoice.client.firstName} ${invoice.client.lastName}`
                          : 'N/A'
                        }
                      </TableCell>
                    )}
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(invoice.totalAmount.toString())}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(invoice.status)}
                      >
                        {invoice.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {isClient && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <DropdownMenuItem 
                              onClick={() => handlePayInvoice(invoice.id)}
                              disabled={processingPayment === invoice.id}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              {processingPayment === invoice.id ? 'Processing...' : 'Pay Now'}
                            </DropdownMenuItem>
                          )}
                          {!isClient && (
                            <>
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                Send to Client
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Invoice</DropdownMenuItem>
                              {invoice.status === 'draft' && (
                                <DropdownMenuItem className="text-destructive">
                                  Delete Invoice
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

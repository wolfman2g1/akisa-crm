'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Search, Plus, MoreVertical, Download, Send } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils-format';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

// Mock data
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'John Doe',
    issueDate: '2024-11-01',
    dueDate: '2024-11-15',
    amount: '150.00',
    status: 'paid',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    clientName: 'Jane Smith',
    issueDate: '2024-11-05',
    dueDate: '2024-11-19',
    amount: '200.00',
    status: 'issued',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    clientName: 'Bob Johnson',
    issueDate: '2024-11-10',
    dueDate: '2024-11-24',
    amount: '175.00',
    status: 'issued',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    clientName: 'Alice Williams',
    issueDate: '2024-10-20',
    dueDate: '2024-11-03',
    amount: '150.00',
    status: 'past_due',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    clientName: 'Charlie Brown',
    issueDate: '2024-11-12',
    dueDate: null,
    amount: '225.00',
    status: 'draft',
  },
];

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isClient } = useAuth();

  const filteredInvoices = mockInvoices.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingAmount = filteredInvoices
    .filter(inv => inv.status === 'issued' || inv.status === 'past_due')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

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
              {filteredInvoices.length === 0 ? (
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
                      <TableCell>{invoice.clientName}</TableCell>
                    )}
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(invoice.amount)}
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
                            <DropdownMenuItem>
                              Pay Now
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

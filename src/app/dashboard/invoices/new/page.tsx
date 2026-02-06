'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Client, Service, CreateInvoiceDTO } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Loader2, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface LineItem {
  service: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  serviceId?: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { isClient, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 30));
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { service: '', description: null, quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirect clients away from admin-only page
  useEffect(() => {
    if (isClient) {
      router.push('/dashboard/invoices');
    }
  }, [isClient, router]);

  // Load clients and services
  useEffect(() => {
    if (authLoading || !user || isClient) return;
    
    const fetchData = async () => {
      try {
        const [clientsData, servicesData] = await Promise.all([
          apiClient.getClients(),
          apiClient.getServices(),
        ]);
        setClients(clientsData);
        setServices(servicesData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients and services',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [authLoading, user, isClient, toast]);

  const addLineItem = () => {
    setLineItems([...lineItems, { service: '', description: null, quantity: 1, unitPrice: 0, serviceId: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      const updated = [...lineItems];
      updated[index] = {
        ...updated[index],
        serviceId,
        service: service.service || service.name,
        description: service.description || null,
        unitPrice: typeof service.price === 'number' ? service.price : parseFloat(String(service.price)) || 0,
      };
      setLineItems(updated);
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const validLineItems = lineItems.filter((item) => item.serviceId && item.unitPrice > 0);
    if (validLineItems.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select at least one service',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData: CreateInvoiceDTO = {
        clientId: selectedClient,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        lineItems: validLineItems.map((item) => ({
          service: item.service,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          serviceId: item.serviceId,
        })),
        notes: notes || undefined,
      };

      await apiClient.createInvoice(invoiceData);
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      router.push('/dashboard/invoices');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">
            Generate a new invoice for a client
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Select the client for this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger disabled={isLoadingData}>
                  <SelectValue placeholder={isLoadingData ? 'Loading...' : 'Select a client'} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add services or items to this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <Label>Service *</Label>
                    <Select
                      value={item.serviceId || ''}
                      onValueChange={(value) => handleServiceSelect(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.service || service.name} - ${typeof service.price === 'number' ? service.price.toFixed(2) : service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Optional description"
                      value={item.description || ''}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value || null)}
                      rows={2}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Total</Label>
                    <div className="h-10 flex items-center font-medium">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-8"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add any additional notes for the invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Payment terms, special instructions, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Due Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Due Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">${calculateSubtotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/invoices">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

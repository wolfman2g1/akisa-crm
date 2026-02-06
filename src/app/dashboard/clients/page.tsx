'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Plus, MoreVertical, Mail, Phone, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getInitials, formatPhoneNumber } from '@/lib/utils-format';
import { apiClient } from '@/lib/api-client';
import { Client, ContactPreference } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  prefContact: ContactPreference;
  serviceCategory?: string;
  street?: string;
  city?: string;
  state?: string;
  postal?: string;
}

export default function ClientsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    prefContact: 'email',
    serviceCategory: '',
    street: '',
    city: '',
    state: '',
    postal: '',
  });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      loadClients();
    }
  }, [authLoading, user]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getClients();
      setClients(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load clients.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = async () => {
    if (!newClientForm.firstName || !newClientForm.lastName || !newClientForm.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingClient(true);
    try {
      const newClient = await apiClient.createClient({
        first_name: newClientForm.firstName,
        last_name: newClientForm.lastName,
        email: newClientForm.email,
        phone: newClientForm.phone || '',
        company: newClientForm.company || null,
        pref_contact: newClientForm.prefContact,
        service_category: newClientForm.serviceCategory || null,
        street: newClientForm.street || null,
        city: newClientForm.city || null,
        state: newClientForm.state || null,
        postal: newClientForm.postal || null,
      });
      
      setClients([newClient, ...clients]);
      setNewClientForm({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '',
        company: '',
        prefContact: 'email',
        serviceCategory: '',
        street: '',
        city: '',
        state: '',
        postal: '',
      });
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Client added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add client',
        variant: 'destructive',
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await apiClient.deleteClient(clientId);
      setClients(clients.filter((c) => c.id !== clientId));
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client list and information
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client account. They will receive an email invitation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newClientForm.firstName}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newClientForm.lastName}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, lastName: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newClientForm.phone}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prefContact">Preferred Contact Method *</Label>
                <Select value={newClientForm.prefContact} onValueChange={(value) =>
                  setNewClientForm({ ...newClientForm, prefContact: value as ContactPreference })
                }>
                  <SelectTrigger id="prefContact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newClientForm.company || ''}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, company: e.target.value || undefined })
                  }
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Service Category</Label>
                <Input
                  id="serviceCategory"
                  value={newClientForm.serviceCategory || ''}
                  onChange={(e) =>
                    setNewClientForm({ ...newClientForm, serviceCategory: e.target.value || undefined })
                  }
                  placeholder="e.g., Therapy, Counseling"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={newClientForm.street || ''}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, street: e.target.value || undefined })
                    }
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newClientForm.city || ''}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, city: e.target.value || undefined })
                    }
                    placeholder="New York"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newClientForm.state || ''}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, state: e.target.value || undefined })
                    }
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input
                    id="postal"
                    value={newClientForm.postal || ''}
                    onChange={(e) =>
                      setNewClientForm({ ...newClientForm, postal: e.target.value || undefined })
                    }
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={isAddingClient}>
                {isAddingClient && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
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
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(client.firstName, client.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {client.firstName} {client.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone ? formatPhoneNumber(client.phone) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/appointments/new?client=${client.id}`)}>
                            Schedule Appointment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices?client=${client.id}`)}>
                            View Invoices
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            Delete Client
                          </DropdownMenuItem>
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

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-3xl font-bold">{clients.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Active This Month</p>
            <p className="text-3xl font-bold">
              {clients.filter(c => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">New This Month</p>
            <p className="text-3xl font-bold">
              {clients.filter(c => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

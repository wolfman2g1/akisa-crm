'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Search, UserPlus, MoreHorizontal, Mail, Phone, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin, isProvider, isClient } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Redirect clients away from admin-only page
  useEffect(() => {
    if (isClient) {
      router.push('/dashboard');
    }
  }, [isClient, router]);

  // Load clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await apiClient.getClients();
        setClients(data);
      } catch (error) {
        console.error('Failed to load clients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, [toast]);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.firstName?.toLowerCase().includes(searchLower) ||
      client.lastName?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
  });

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
        firstName: newClientForm.firstName,
        lastName: newClientForm.lastName,
        email: newClientForm.email,
        phone: newClientForm.phone || undefined,
      });
      
      setClients([newClient, ...clients]);
      setNewClientForm({ firstName: '', lastName: '', email: '', phone: '' });
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

  if (isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage client accounts and view their information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
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
            <div className="grid gap-4 py-4">
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            A list of all registered clients and their contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add your first client to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>
                          {client.firstName} {client.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {client.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.createdAt ? (
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/clients?id=${client.id}`)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/appointments/new?client=${client.id}`)}
                          >
                            Create Appointment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/invoices?client=${client.id}`)}
                          >
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

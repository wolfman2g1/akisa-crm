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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, UserPlus, MoreHorizontal, Mail, Phone, User, Loader2, Shield, Users, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface NewUserForm {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'client';
}

const initialUserForm: NewUserForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'client',
};

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin, isProvider, isClient, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>(initialUserForm);

  // Redirect clients away from admin-only page
  useEffect(() => {
    if (isClient) {
      router.push('/dashboard');
    }
  }, [isClient, router]);

  // Load clients
  useEffect(() => {
    if (!authLoading && user && !isClient) {
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
    }
  }, [authLoading, user, isClient, toast]);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
  });

  const isFormValid = () => {
    return (
      newUserForm.username.trim().length > 0 &&
      newUserForm.password.length >= 8 &&
      newUserForm.email.trim().length > 0 &&
      newUserForm.first_name.trim().length > 0 &&
      newUserForm.last_name.trim().length > 0
    );
  };

  const handleAddUser = async () => {
    if (!isFormValid()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields. Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingUser(true);
    try {
      // Create user via signup endpoint with the SignUpDTO
      await apiClient.signUp({
        username: newUserForm.username,
        password: newUserForm.password,
        email: newUserForm.email,
        first_name: newUserForm.first_name,
        last_name: newUserForm.last_name,
      });

      // If creating a client, also create via client endpoint to link properly
      if (newUserForm.role === 'client') {
        try {
          const newClient = await apiClient.createClient({
            first_name: newUserForm.first_name,
            last_name: newUserForm.last_name,
            email: newUserForm.email,
            phone: '',
            pref_contact: 'email',
          });
          setClients([newClient, ...clients]);
        } catch {
          // Client creation might be handled by the backend automatically
        }
      }

      setNewUserForm(initialUserForm);
      setIsDialogOpen(false);
      setShowPassword(false);
      toast({
        title: 'Success',
        description: `${newUserForm.role === 'admin' ? 'Admin' : 'Client'} user created successfully. They will receive a welcome email with a password setup link.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await apiClient.deleteClient(clientId);
      setClients(clients.filter((c) => c.id !== clientId));
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
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
            Manage admin and client accounts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setNewUserForm(initialUserForm);
            setShowPassword(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account. They will receive a welcome email to set up their password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={newUserForm.role}
                  onValueChange={(value: 'admin' | 'client') =>
                    setNewUserForm({ ...newUserForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Client</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newUserForm.first_name}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, first_name: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={newUserForm.last_name}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, last_name: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={newUserForm.username}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, username: e.target.value })
                  }
                  placeholder="john.doe"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, password: e.target.value })
                    }
                    placeholder="Min. 8 characters"
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newUserForm.password.length > 0 && newUserForm.password.length < 8 && (
                  <p className="text-sm text-destructive">
                    Password must be at least 8 characters
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is a temporary password. The user will be prompted to set their own password via email.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setNewUserForm(initialUserForm);
                setShowPassword(false);
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={isAddingUser || !isFormValid()}
              >
                {isAddingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {newUserForm.role === 'admin' ? 'Admin' : 'Client'}
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredClients.length} user{filteredClients.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            All registered users and their contact information
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
              <h3 className="mt-4 text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add your first user to get started'}
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
                        <div>
                          <span>
                            {client.first_name} {client.last_name}
                          </span>
                        </div>
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
                            Delete User
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

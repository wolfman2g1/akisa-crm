'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar, MoreVertical, Search, Plus } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils-format';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

// Mock data
const mockAppointments = [
  {
    id: '1',
    clientName: 'John Doe',
    date: new Date(2024, 11, 15, 10, 0).toISOString(),
    duration: '60 minutes',
    status: 'confirmed',
    type: 'Initial Consultation',
  },
  {
    id: '2',
    clientName: 'Jane Smith',
    date: new Date(2024, 11, 15, 14, 0).toISOString(),
    duration: '60 minutes',
    status: 'confirmed',
    type: 'Follow-up Session',
  },
  {
    id: '3',
    clientName: 'Bob Johnson',
    date: new Date(2024, 11, 16, 9, 0).toISOString(),
    duration: '60 minutes',
    status: 'tentative',
    type: 'Initial Consultation',
  },
  {
    id: '4',
    clientName: 'Alice Williams',
    date: new Date(2024, 11, 18, 13, 0).toISOString(),
    duration: '90 minutes',
    status: 'confirmed',
    type: 'Assessment',
  },
  {
    id: '5',
    clientName: 'Charlie Brown',
    date: new Date(2024, 11, 10, 11, 0).toISOString(),
    duration: '60 minutes',
    status: 'completed',
    type: 'Follow-up Session',
  },
];

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isClient } = useAuth();

  const filteredAppointments = mockAppointments.filter((appointment) =>
    appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            {isClient ? 'View your upcoming and past appointments' : 'Manage all appointments'}
          </p>
        </div>

        <Button asChild>
          <Link href={isClient ? '/dashboard/appointments/book' : '/dashboard/appointments/new'}>
            <Plus className="mr-2 h-4 w-4" />
            {isClient ? 'Book Appointment' : 'New Appointment'}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Filter by Date
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {!isClient && <TableHead>Client</TableHead>}
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    {!isClient && (
                      <TableCell className="font-medium">
                        {appointment.clientName}
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDate(appointment.date, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(appointment.date, 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.duration}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(appointment.status)}
                      >
                        {appointment.status}
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
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <>
                              <DropdownMenuItem>Reschedule</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Cancel
                              </DropdownMenuItem>
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

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Appointments</CardDescription>
            <CardTitle className="text-3xl">{mockAppointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl">
              {mockAppointments.filter(a => a.status === 'confirmed' || a.status === 'tentative').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {mockAppointments.filter(a => a.status === 'completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled</CardDescription>
            <CardTitle className="text-3xl">
              {mockAppointments.filter(a => a.status === 'cancelled').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

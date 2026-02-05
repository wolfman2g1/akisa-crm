'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthCalendarView, WeekCalendarView } from '@/components/calendar/calendar-views';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { Appointment } from '@/types';

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState({
    confirmed: true,
    tentative: true,
    cancelled: true,
    completed: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAppointments();
      setAppointments(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load appointments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const events = appointments
    .filter((appointment) => statusFilter[appointment.status as keyof typeof statusFilter])
    .map((appointment) => ({
      id: appointment.id,
      title: appointment.client 
        ? `${appointment.client.firstName} ${appointment.client.lastName}`
        : 'Appointment',
      start: new Date(appointment.startAt || appointment.startTime || ''),
      end: new Date(appointment.endAt || appointment.endTime || ''),
      status: appointment.status as 'confirmed' | 'tentative' | 'cancelled' | 'completed',
    }));

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // Open appointment creation modal
  };

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
    // Open appointment details drawer
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your appointments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.confirmed}
                onCheckedChange={(checked) =>
                  setStatusFilter({ ...statusFilter, confirmed: checked })
                }
              >
                Confirmed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.tentative}
                onCheckedChange={(checked) =>
                  setStatusFilter({ ...statusFilter, tentative: checked })
                }
              >
                Tentative
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.cancelled}
                onCheckedChange={(checked) =>
                  setStatusFilter({ ...statusFilter, cancelled: checked })
                }
              >
                Cancelled
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.completed}
                onCheckedChange={(checked) =>
                  setStatusFilter({ ...statusFilter, completed: checked })
                }
              >
                Completed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week')}>
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6">
          <MonthCalendarView
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <WeekCalendarView
            events={events}
            onEventClick={handleEventClick}
          />
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
          <span>Tentative</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

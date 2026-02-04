'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthCalendarView, WeekCalendarView } from '@/components/calendar/calendar-views';
import { Calendar, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data for demonstration
const mockEvents = [
  {
    id: '1',
    title: 'John Doe',
    start: new Date(2024, new Date().getMonth(), 15, 10, 0),
    end: new Date(2024, new Date().getMonth(), 15, 11, 0),
    status: 'confirmed' as const,
  },
  {
    id: '2',
    title: 'Jane Smith',
    start: new Date(2024, new Date().getMonth(), 15, 14, 0),
    end: new Date(2024, new Date().getMonth(), 15, 15, 0),
    status: 'confirmed' as const,
  },
  {
    id: '3',
    title: 'Bob Johnson',
    start: new Date(2024, new Date().getMonth(), 16, 9, 0),
    end: new Date(2024, new Date().getMonth(), 16, 10, 0),
    status: 'tentative' as const,
  },
  {
    id: '4',
    title: 'Alice Williams',
    start: new Date(2024, new Date().getMonth(), 18, 13, 0),
    end: new Date(2024, new Date().getMonth(), 18, 14, 0),
    status: 'confirmed' as const,
  },
];

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [statusFilter, setStatusFilter] = useState({
    confirmed: true,
    tentative: true,
    cancelled: true,
    completed: true,
  });

  const filteredEvents = mockEvents.filter(
    (event) => statusFilter[event.status]
  );

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
            events={filteredEvents}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <WeekCalendarView
            events={filteredEvents}
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

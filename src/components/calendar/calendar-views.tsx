'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: 'tentative' | 'confirmed' | 'cancelled' | 'completed';
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function MonthCalendarView({ events = [], onDateClick, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(event.start, date));
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold border-b border-r last:border-r-0 bg-muted/50"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors',
                  !isCurrentMonth && 'bg-muted/20 text-muted-foreground'
                )}
                onClick={() => onDateClick?.(day)}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1 inline-flex items-center justify-center w-7 h-7 rounded-full',
                    isCurrentDay && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded border truncate',
                        getStatusColor(event.status)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {format(event.start, 'h:mm a')} - {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function WeekCalendarView({ events = [], onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
  
  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Week Grid */}
      <Card className="overflow-auto">
        <div className="grid grid-cols-8 min-w-[800px]">
          {/* Time column header */}
          <div className="p-3 text-center text-sm font-semibold border-b border-r bg-muted/50">
            Time
          </div>
          
          {/* Day headers */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'p-3 text-center border-b border-r last:border-r-0 bg-muted/50',
                isToday(day) && 'bg-primary/10'
              )}
            >
              <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
              <div className={cn(
                'text-lg font-bold mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full',
                isToday(day) && 'bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
          
          {/* Time rows */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-2 text-xs text-right border-b border-r text-muted-foreground">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              {days.map((day) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="relative min-h-[60px] border-b border-r last:border-r-0 hover:bg-muted/50 transition-colors"
                >
                  {/* Events would be positioned here based on time */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

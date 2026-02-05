'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Client, Service, AvailableSlot, CreateAppointmentDTO } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Clock, User, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format, addDays, startOfDay } from 'date-fns';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { isAdmin, isProvider, isClient, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirect clients away from admin-only page
  useEffect(() => {
    if (isClient) {
      router.push('/dashboard/appointments/book');
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

  // Load available slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      
      setIsLoadingSlots(true);
      try {
        const startDate = format(selectedDate, 'yyyy-MM-dd');
        const endDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
        const duration = selectedService ? services.find(s => s.id === selectedService)?.durationMinutes : undefined;
        const slots = await apiClient.getAvailableSlots(startDate, endDate, duration);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Failed to load slots:', error);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedService, services]);

  const handleSubmit = async () => {
    if (!selectedClient || !selectedSlot) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client and time slot',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const appointmentData: CreateAppointmentDTO = {
        clientId: selectedClient,
        serviceId: selectedService || undefined,
        startAt: selectedSlot.startTime,
        endAt: selectedSlot.endTime,
        notes: notes || undefined,
        status: 'confirmed',
      };

      await apiClient.createAppointment(appointmentData);
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
      });
      router.push('/dashboard/calendar');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create appointment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter slots for the selected date
  const filteredSlots = availableSlots.filter((slot) => {
    const slotDate = new Date(slot.startTime);
    return selectedDate && startOfDay(slotDate).getTime() === startOfDay(selectedDate).getTime();
  });

  if (isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/calendar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Appointment</h1>
          <p className="text-muted-foreground">
            Schedule a new appointment for a client
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Selection */}
        <div className="space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Client
              </CardTitle>
              <CardDescription>
                Choose the client for this appointment
              </CardDescription>
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

          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select Service (Optional)
              </CardTitle>
              <CardDescription>
                Choose a service type for this appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger disabled={isLoadingData}>
                  <SelectValue placeholder={isLoadingData ? 'Loading...' : 'Select a service'} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.durationMinutes} min) - ${service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Add any notes for this appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calendar and Slots */}
        <div className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < startOfDay(new Date())}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Available Time Slots</CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Slots for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'Select a date to see available slots'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSlots.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No available slots for this date
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {format(new Date(slot.startTime), 'h:mm a')}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary and Submit */}
      {selectedClient && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <p className="font-medium">
                  {clients.find((c) => c.id === selectedClient)?.firstName}{' '}
                  {clients.find((c) => c.id === selectedClient)?.lastName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date & Time</Label>
                <p className="font-medium">
                  {format(new Date(selectedSlot.startTime), 'MMMM d, yyyy')} at{' '}
                  {format(new Date(selectedSlot.startTime), 'h:mm a')}
                </p>
              </div>
              {selectedService && (
                <div>
                  <Label className="text-muted-foreground">Service</Label>
                  <p className="font-medium">
                    {services.find((s) => s.id === selectedService)?.name}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard/calendar">Cancel</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

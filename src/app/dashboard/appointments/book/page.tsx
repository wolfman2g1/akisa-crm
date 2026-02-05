'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { format, addDays } from 'date-fns';
import { Clock, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
}

export default function BookAppointmentPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { toast } = useToast();

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingSuccess(false);

    if (!date) {
      setAvailableSlots([]);
      return;
    }

    setLoading(true);
    try {
      const startDate = format(date, 'yyyy-MM-dd');
      const endDate = format(addDays(date, 1), 'yyyy-MM-dd');
      const slots = await apiClient.getAvailableSlots(startDate, endDate);
      // Map API response to our TimeSlot interface
      const mappedSlots = slots.map(slot => ({
        start: slot.startTime || slot.start || '',
        end: slot.endTime || slot.end || '',
      }));
      setAvailableSlots(mappedSlots);
      
      if (slots.length === 0) {
        toast({
          title: 'No availability',
          description: 'There are no available time slots for this date.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available time slots.',
        variant: 'destructive',
      });
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot) return;

    setBooking(true);
    try {
      await apiClient.createAppointment({
        startAt: selectedSlot.start,
        endAt: selectedSlot.end,
        status: 'confirmed',
      });

      setBookingSuccess(true);
      toast({
        title: 'Appointment booked!',
        description: 'Your appointment has been successfully scheduled.',
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setSelectedDate(undefined);
        setAvailableSlots([]);
        setSelectedSlot(null);
        setBookingSuccess(false);
      }, 3000);
    } catch (error) {
      toast({
        title: 'Booking failed',
        description: 'Unable to book the appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'h:mm a');
  };

  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((slot) => {
      const hour = new Date(slot.start).getHours();
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlotsByPeriod(availableSlots);

  if (bookingSuccess) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-green-900 mb-2">
              Appointment Confirmed!
            </h2>
            <p className="text-green-700 mb-4">
              Your appointment has been successfully scheduled for:
            </p>
            <div className="bg-white rounded-lg p-4 inline-block">
              <div className="flex items-center gap-2 text-lg font-medium">
                <CalendarIcon className="w-5 h-5" />
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2 text-lg font-medium mt-2">
                <Clock className="w-5 h-5" />
                {selectedSlot && formatTime(selectedSlot.start)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#4A3F35] mb-2">Book Appointment</h1>
        <p className="text-[#2D3436] opacity-70">
          Select a date and available time slot to schedule your appointment
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Select Date</CardTitle>
            <CardDescription>Choose a date to view available time slots</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-lg border"
            />
          </CardContent>
        </Card>

        {/* Time Slots Section */}
        <div className="space-y-6">
          {selectedDate ? (
            <>
              <Card className="shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Available Time Slots</CardTitle>
                  <CardDescription>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No available slots for this date
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {morning.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-600 mb-2">Morning</h3>
                          <div className="space-y-2">
                            {morning.map((slot, idx) => (
                              <Button
                                key={idx}
                                variant={selectedSlot === slot ? 'default' : 'outline'}
                                className={`w-full justify-start ${
                                  selectedSlot === slot
                                    ? 'bg-[#8B9D83] hover:bg-[#7A8C73]'
                                    : ''
                                }`}
                                onClick={() => handleSlotSelect(slot)}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                {formatTime(slot.start)} - {formatTime(slot.end)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {afternoon.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-600 mb-2">Afternoon</h3>
                          <div className="space-y-2">
                            {afternoon.map((slot, idx) => (
                              <Button
                                key={idx}
                                variant={selectedSlot === slot ? 'default' : 'outline'}
                                className={`w-full justify-start ${
                                  selectedSlot === slot
                                    ? 'bg-[#8B9D83] hover:bg-[#7A8C73]'
                                    : ''
                                }`}
                                onClick={() => handleSlotSelect(slot)}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                {formatTime(slot.start)} - {formatTime(slot.end)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {evening.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-600 mb-2">Evening</h3>
                          <div className="space-y-2">
                            {evening.map((slot, idx) => (
                              <Button
                                key={idx}
                                variant={selectedSlot === slot ? 'default' : 'outline'}
                                className={`w-full justify-start ${
                                  selectedSlot === slot
                                    ? 'bg-[#8B9D83] hover:bg-[#7A8C73]'
                                    : ''
                                }`}
                                onClick={() => handleSlotSelect(slot)}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                {formatTime(slot.start)} - {formatTime(slot.end)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confirmation Card */}
              {selectedSlot && (
                <Card className="shadow-md rounded-xl border-[#8B9D83] bg-[#FAF7F2]">
                  <CardHeader>
                    <CardTitle className="text-lg">Confirm Appointment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#8B9D83]" />
                        <span className="font-medium">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8B9D83]" />
                        <span className="font-medium">
                          {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-[#C97D60] hover:bg-[#B86D50]"
                      onClick={handleConfirmBooking}
                      disabled={booking}
                    >
                      {booking ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-sm rounded-xl">
              <CardContent className="py-12 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a date to view available time slots</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Users, FileText, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin, isProvider, isClient } = useAuth();

  const stats = [
    {
      title: 'Upcoming Appointments',
      value: '8',
      icon: Calendar,
      description: 'Next 7 days',
      href: '/dashboard/appointments',
      show: true,
    },
    {
      title: 'Total Clients',
      value: '42',
      icon: Users,
      description: '+3 this month',
      href: '/dashboard/clients',
      show: isAdmin || isProvider,
    },
    {
      title: 'Pending Invoices',
      value: '5',
      icon: FileText,
      description: '$2,450.00 total',
      href: '/dashboard/invoices',
      show: isAdmin || isProvider,
    },
    {
      title: 'Revenue (MTD)',
      value: '$12,840',
      icon: DollarSign,
      description: '+18% from last month',
      href: '/dashboard/invoices',
      show: isAdmin || isProvider,
    },
  ];

  const recentActivities = [
    {
      title: 'Appointment scheduled',
      description: 'Jane Smith - Tomorrow at 2:00 PM',
      time: '2 hours ago',
      icon: Calendar,
    },
    {
      title: 'Payment received',
      description: 'Invoice #INV-2024-042 - $150.00',
      time: '5 hours ago',
      icon: DollarSign,
    },
    {
      title: 'New client added',
      description: 'John Doe',
      time: '1 day ago',
      icon: Users,
    },
    {
      title: 'Invoice generated',
      description: 'Invoice #INV-2024-041 - $200.00',
      time: '2 days ago',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your {isClient ? 'appointments' : 'practice'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats
          .filter((stat) => stat.show)
          .map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <Button
                    variant="link"
                    className="px-0 mt-2 h-auto text-xs"
                    asChild
                  >
                    <Link href={stat.href}>View details →</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isClient ? (
              <>
                <Button className="w-full justify-start" asChild>
                  <Link href="/dashboard/appointments/book">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book an Appointment
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/appointments">
                    <Clock className="mr-2 h-4 w-4" />
                    View My Appointments
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/invoices">
                    <FileText className="mr-2 h-4 w-4" />
                    View Invoices
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button className="w-full justify-start" asChild>
                  <Link href="/dashboard/appointments/new">
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Appointment
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/invoices">
                    <FileText className="mr-2 h-4 w-4" />
                    View Invoices
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/calendar">
                    <Clock className="mr-2 h-4 w-4" />
                    View Calendar
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="rounded-full bg-muted p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

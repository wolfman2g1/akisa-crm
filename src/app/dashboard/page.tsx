'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import Link from 'next/link';
import { Calendar, Users, FileText, DollarSign, Briefcase, Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { DashboardStatistics } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isAdmin, isProvider, isClient } = useAuth();
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin && !isProvider) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiClient.getDashboardStatistics();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isProvider]);

  // Generate trend data for visualizations (simulated historical data)
  const generateTrendData = (current: number, changePercent: number): number[] => {
    const points = 30;
    const data: number[] = [];
    const growthRate = changePercent / 100 / points;
    
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const value = current * (1 - changePercent / 100) * (1 + growthRate * i);
      // Add some randomness for realistic look
      const noise = (Math.random() - 0.5) * current * 0.05;
      data.push(Math.max(0, value + noise));
    }
    
    return data;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      {(isAdmin || isProvider) && (
        <>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Appointments */}
              <StatCard
                title="Appointments This Month"
                value={stats.appointments.thisMonth}
                description={`${stats.appointments.thisWeek} this week, ${stats.appointments.today} today`}
                icon={Calendar}
                href="/dashboard/appointments"
                trend={{
                  value: stats.appointments.trends.last30Days.changePercent,
                  isPositive: stats.appointments.trends.last30Days.changePercent > 0,
                  label: 'vs last month',
                }}
                chartData={generateTrendData(
                  stats.appointments.trends.last30Days.total,
                  stats.appointments.trends.last30Days.changePercent
                )}
              />

              {/* Clients */}
              <StatCard
                title="Total Clients"
                value={stats.clients.total}
                description={`${stats.clients.active} with active accounts`}
                icon={Users}
                href="/dashboard/clients"
              />

              {/* Leads */}
              <StatCard
                title="Lead Conversion"
                value={`${stats.leads.conversionRate.toFixed(1)}%`}
                description={`${stats.leads.converted} of ${stats.leads.total} leads converted`}
                icon={Zap}
                href="/dashboard/leads"
              />

              {/* Revenue */}
              <StatCard
                title="Revenue This Month"
                value={formatCurrency(stats.revenue.thisMonth)}
                icon={DollarSign}
                href="/dashboard/invoices"
                trend={{
                  value: stats.revenue.trends.last30Days.changePercent,
                  isPositive: stats.revenue.trends.last30Days.changePercent > 0,
                  label: 'vs last month',
                }}
                chartData={generateTrendData(
                  stats.revenue.trends.last30Days.total,
                  stats.revenue.trends.last30Days.changePercent
                )}
              />

              {/* Pending Invoices */}
              <StatCard
                title="Pending Invoices"
                value={stats.invoices.totalPending}
                description={`${stats.invoices.pendingThisMonth} issued this month`}
                icon={FileText}
                href="/dashboard/invoices"
              />

              {/* Revenue Trend (90 days) */}
              <StatCard
                title="Quarterly Revenue"
                value={formatCurrency(stats.revenue.trends.last90Days.total)}
                description="Last 90 days"
                icon={DollarSign}
                href="/dashboard/invoices"
                trend={{
                  value: stats.revenue.trends.last90Days.changePercent,
                  isPositive: stats.revenue.trends.last90Days.changePercent > 0,
                  label: 'vs previous period',
                }}
                chartData={generateTrendData(
                  stats.revenue.trends.last90Days.total,
                  stats.revenue.trends.last90Days.changePercent
                )}
              />
            </div>
          ) : null}
        </>
      )}

      {/* Client view - show appointment count */}
      {isClient && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="My Appointments"
            value="—"
            description="View your scheduled appointments"
            icon={Calendar}
            href="/dashboard/appointments"
          />
          <StatCard
            title="My Invoices"
            value="—"
            description="View and pay invoices"
            icon={FileText}
            href="/dashboard/invoices"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
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
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/leads">
                    <Zap className="mr-2 h-4 w-4" />
                    Manage Leads
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Overview - Only for Admin/Provider */}
        {(isAdmin || isProvider) && (
          <Card>
            <CardHeader>
              <CardTitle>Practice Overview</CardTitle>
              <CardDescription>
                Key metrics at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Active Clients</span>
                    </div>
                    <span className="text-sm font-bold">{stats.clients.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Leads in Pipeline</span>
                    </div>
                    <span className="text-sm font-bold">{stats.leads.total - stats.leads.converted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Appointments Today</span>
                    </div>
                    <span className="text-sm font-bold">{stats.appointments.today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Pending Invoices</span>
                    </div>
                    <span className="text-sm font-bold">{stats.invoices.totalPending}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

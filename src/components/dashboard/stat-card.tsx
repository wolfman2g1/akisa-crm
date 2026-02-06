'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendChart } from './trend-chart';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  chartData?: number[];
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  trend,
  chartData,
}: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
        
        {chartData && chartData.length > 0 && (
          <div className="mt-3">
            <TrendChart
              data={chartData}
              color={trend?.isPositive ? '#16a34a' : '#8B9D83'}
              width={250}
              height={40}
            />
          </div>
        )}
        
        {href && (
          <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
            <Link href={href}>View details →</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

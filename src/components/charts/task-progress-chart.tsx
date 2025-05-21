
"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Task, TaskStatus } from "@/types"

interface TaskProgressChartProps {
  tasks: Task[];
  title?: string;
  description?: string;
}

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-1))",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(var(--chart-2))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-3))",
  },
} satisfies Record<string, { label: string; color?: string }>;


export function TaskProgressChart({ tasks, title = "Task Progress", description = "Overview of task statuses" }: TaskProgressChartProps) {
  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const chartData = [
    { status: "Pending", count: taskStatusCounts.pending || 0, fill: chartConfig.pending.color },
    { status: "In Progress", count: taskStatusCounts['in-progress'] || 0, fill: chartConfig.inProgress.color },
    { status: "Completed", count: taskStatusCounts.completed || 0, fill: chartConfig.completed.color },
  ];
  
  const totalTasks = tasks.length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {totalTasks > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="status"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => chartConfig[value.toLowerCase().replace(' ', '') as keyof typeof chartConfig]?.label || value}
              />
              <YAxis allowDecimals={false} />
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent indicator="dot" />} 
              />
              <Bar dataKey="count" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">No tasks available to display progress.</p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Total Tasks: {totalTasks} <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        {totalTasks > 0 && (
          <div className="leading-none text-muted-foreground">
            Showing task distribution by status.
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { TaskProgressChart } from '@/components/charts/task-progress-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Link2, Users, GanttChartSquare } from 'lucide-react';
import Link from 'next/link';
import { useSession } from "next-auth/react";

export default function AdminDashboardPage() {
  const { agencies, users, tasks, urls, currentRole } = useAppContext();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && currentRole !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, currentRole, router]);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }
  if (currentRole !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies.length}</div>
            <Link href="/admin/agencies" className="text-xs text-primary hover:underline">
              Manage Agencies
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urls.length}</div>
             <Link href="/admin/urls" className="text-xs text-primary hover:underline">
              Manage URLs
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <Link href="/admin/users" className="text-xs text-primary hover:underline">
              Manage Users
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Assigned</CardTitle>
            <GanttChartSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <Link href="/admin/tasks/assign" className="text-xs text-primary hover:underline">
              Assign Tasks
            </Link>
          </CardContent>
        </Card>
      </div>

      <TaskProgressChart tasks={tasks} />
    </div>
  );
}

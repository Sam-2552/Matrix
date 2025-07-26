"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { TaskProgressChart } from '@/components/charts/task-progress-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tags, Link2, FileText, Download } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboardPage() {
  const { currentUser, getTasksForUser, agencies, urls } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  const userTasks = getTasksForUser(currentUser.id);
  
  // Simplified count of assigned URLs for the dashboard card
  let assignedUrlsCount = 0;
  userTasks.forEach(task => {
    if (task.assignedItemType === 'urls') {
      assignedUrlsCount += task.assignedUrlIds?.length || 0;
    } else if (task.assignedItemType === 'agency') {
      const agencyUrls = urls.filter(u => u.agencyId === task.assignedAgencyId);
      assignedUrlsCount += agencyUrls.length;
    }
  });


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentUser.name}!</h1>
      <p className="text-muted-foreground">Here's an overview of your tasks and activities.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTasks.length}</div>
            <Link href="/tasks" className="text-xs text-primary hover:underline">
              View My Tasks
            </Link>
          </CardContent>
        </Card>
         <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessible Agencies</CardTitle>
            <Tags className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* This is a simplification. A real app would determine accessible agencies based on tasks. */}
            <div className="text-2xl font-bold">{agencies.length}</div> 
            <Link href="/agencies" className="text-xs text-primary hover:underline">
              View Agencies
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned URLs</CardTitle>
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedUrlsCount}</div>
            <Link href="/urls" className="text-xs text-primary hover:underline">
              View My URLs
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div> 
            <Link href="/download" className="text-xs text-primary hover:underline">
              Access Downloads
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <TaskProgressChart 
        tasks={userTasks} 
        title="My Task Progress"
        description={`Overview of tasks assigned to ${currentUser.name}`}
      />
    </div>
  );
}

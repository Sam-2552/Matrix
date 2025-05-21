"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, Tags } from 'lucide-react';
import type { UrlItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PythonEditor } from '@/components/python-editor';
import { getUrls, updateUrlStatus } from '@/lib/db';
import { UrlStatus } from '@/types';

export default function ViewMyUrlsPage() {
  const { currentUser, getTasksForUser, urls: allUrls, agencies } = useAppContext();
  const router = useRouter();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const urlsData = await getUrls();
        setUrls(urlsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, router]);

  const handleStatusChange = async (urlId: string, newStatus: UrlStatus) => {
    try {
      const url = urls.find(u => u.id === urlId);
      if (!url) return;

      await updateUrlStatus(urlId, newStatus);
      setUrls(prev => prev.map(url =>
        url.id === urlId ? { ...url, status: newStatus } : url
      ));
    } catch (error) {
      console.error('Error updating URL status:', error);
    }
  };

  const handleCodeSave = async (urlId: string, code: string) => {
    try {
      const url = urls.find(u => u.id === urlId);
      if (!url) return;

      await updateUrlStatus(urlId, url.status, code);
      setUrls(prev => prev.map(url =>
        url.id === urlId ? { ...url, pythonCode: code } : url
      ));
    } catch (error) {
      console.error('Error saving Python code:', error);
    }
  };

  if (isLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  const userTasks = getTasksForUser(currentUser.id);
  let assignedUrls: UrlItem[] = [];

  userTasks.forEach(task => {
    if (task.assignedItemType === 'urls' && task.assignedUrlIds) {
      task.assignedUrlIds.forEach(urlId => {
        const url = allUrls.find(u => u.id === urlId);
        if (url && !assignedUrls.find(au => au.id === url.id)) {
          assignedUrls.push(url);
        }
      });
    } else if (task.assignedItemType === 'agency' && task.assignedAgencyId) {
      const agencyUrls = allUrls.filter(u => u.agencyId === task.assignedAgencyId);
      agencyUrls.forEach(url => {
        if (!assignedUrls.find(au => au.id === url.id)) {
          assignedUrls.push(url);
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center">
        <Link2 className="mr-2 h-8 w-8 text-primary"/>My Assigned URLs
      </h1>
      <p className="text-muted-foreground">These are the URLs assigned to you through your tasks.</p>

      {assignedUrls.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignedUrls.map(url => {
              const agency = url.agencyId ? agencies.find(a => a.id === url.agencyId) : null;
              return (
                <Card key={url.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Link2 className="mr-2 h-5 w-5 text-primary flex-shrink-0"/>
                      <a href={url.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate" title={url.link}>
                        {url.link}
                      </a>
                    </CardTitle>
                    <CardDescription>ID: {url.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agency ? (
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Tags className="mr-1 h-4 w-4"/>Agency: <span className="font-semibold text-foreground ml-1">{agency.name}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not associated with a specific agency.</p>
                    )}
                    <div className="mt-4 flex items-center space-x-2">
                      <Select
                        value={url.status}
                        onValueChange={(value) => handleStatusChange(url.id, value as UrlStatus)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <PythonEditor
                        code={url.pythonCode || ''}
                        onSave={(code) => handleCodeSave(url.id, code)}
                        readOnly={url.status === 'completed'}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl">
              <Link2 className="mr-2 h-6 w-6 text-muted-foreground" />No URLs Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You currently have no URLs directly assigned to you via tasks.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

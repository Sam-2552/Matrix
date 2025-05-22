"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, Tags, Loader2 } from 'lucide-react';
import type { UrlItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PythonEditor } from '@/components/python-editor';
import { getUrls, updateUrlStatus } from '@/lib/db';
import { UrlStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';

export default function ViewMyUrlsPage() {
  const { currentUser, getTasksForUser, urls: allUrls, agencies } = useAppContext();
  const router = useRouter();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auditingUrls, setAuditingUrls] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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

      await updateUrlStatus(urlId, newStatus, url.pythonCode);
      setUrls(prev => prev.map(url =>
        url.id === urlId ? { ...url, status: newStatus } : url
      ));

      if (newStatus === 'completed' && url.pythonCode) {
        executePythonCode(urlId, url.pythonCode);
      }
    } catch (error: unknown) {
      console.error('Error updating URL status:', error);
    }
  };

  const executePythonCode = async (urlId: string, code: string) => {
    try {
      setUrls(prev => prev.map(url =>
        url.id === urlId ? { ...url, isExecuting: true } : url
      ));

      const response = await fetch('/api/execute-python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urlId,
          code
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute Python code');
      }

      const result = await response.json();
      
      setUrls(prev => prev.map(url =>
        url.id === urlId ? { 
          ...url, 
          isExecuting: false,
          executionOutput: result.output,
          status: 'completed'
        } : url
      ));
    } catch (error: unknown) {
      console.error('Error executing Python code:', error);
      setUrls(prev => prev.map(url =>
        url.id === urlId ? { 
          ...url, 
          isExecuting: false,
          executionOutput: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'failed'
        } : url
      ));
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

  const handleAudit = async (urlId: string, url: string) => {
    try {
      // Add URL to auditing set
      setAuditingUrls(prev => new Set(prev).add(urlId));

      const response = await fetch('/api/ping-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to ping URL');
      }

      const result = await response.json();
      
      // Update URL status based on ping result
      await updateUrlStatus(urlId, result.success ? 'in_progress' : 'failed');
      setUrls(prev => prev.map(u =>
        u.id === urlId ? { 
          ...u, 
          status: result.success ? 'in_progress' : 'failed',
          executionOutput: result.message
        } : u
      ));

    } catch (error) {
      console.error('Error auditing URL:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to audit URL",
        variant: "destructive"
      });
    } finally {
      // Remove URL from auditing set
      setAuditingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(urlId);
        return newSet;
      });
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
              const isAuditing = auditingUrls.has(url.id);
              
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
                      <Button
                        onClick={() => handleAudit(url.id, url.link)}
                        disabled={isAuditing || url.status === 'completed'}
                        variant="outline"
                        className="w-[100px]"
                      >
                        {isAuditing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Auditing...
                          </>
                        ) : (
                          'Audit'
                        )}
                      </Button>
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
                    {url.executionOutput && (
                      <div className="mt-4 p-4 bg-muted rounded-md">
                        <h4 className="text-sm font-semibold mb-2">Execution Output:</h4>
                        {url.isExecuting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm text-muted-foreground">Executing Python code...</span>
                          </div>
                        ) : (
                          <pre className="text-xs whitespace-pre-wrap bg-background p-2 rounded border">{url.executionOutput}</pre>
                        )}
                      </div>
                    )}
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

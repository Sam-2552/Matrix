"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Code, Download, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function DownloadPage() {
  const { getTasksForUser } = useAppContext();
  const router = useRouter();
  const [randomCode, setRandomCode] = useState<string | null>(null);
  const [randomReport, setRandomReport] = useState<{ taskId: string; fileName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRandomCode();
    fetchRandomReport();
  }, []);

  const fetchRandomCode = async () => {
    try {
      const response = await fetch('/api/db?action=getUrls');
      const urls = await response.json();
      const pythonUrls = urls.filter((url: any) => url.pythonCode);
      
      if (pythonUrls.length > 0) {
        const randomUrl = pythonUrls[Math.floor(Math.random() * pythonUrls.length)];
        setRandomCode(randomUrl.pythonCode);
      }
    } catch (error) {
      console.error('Error fetching random code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRandomReport = async () => {
    try {
      const response = await fetch('/api/db?action=getTasks');
      const tasks = await response.json();
      const tasksWithReports = tasks.filter((task: any) => task.reportPath);
      
      if (tasksWithReports.length > 0) {
        const randomTask = tasksWithReports[Math.floor(Math.random() * tasksWithReports.length)];
        setRandomReport({
          taskId: randomTask.id,
          fileName: randomTask.reportPath
        });
      }
    } catch (error) {
      console.error('Error fetching random report:', error);
    }
  };

  const handleDownloadCode = () => {
    if (!randomCode) return;
    
    const blob = new Blob([randomCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Matrix_Code.py';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Download Started",
      description: "Your Python code is being downloaded.",
    });
  };

  const handleDownloadReport = async () => {
    if (!randomReport) return;
    
    try {
      const response = await fetch(`/api/download-report?fileName=${randomReport.fileName}`);
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = randomReport.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center"><Download className="mr-2 h-8 w-8 text-primary"/>Downloads</h1>
      <p className="text-muted-foreground">Download sample Python code and submitted reports.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Python Code Download Box */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Code className="mr-2 h-6 w-6 text-primary"/>
              Sample Python Code
            </CardTitle>
            <CardDescription>Download a random Python code sample from our database</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : randomCode ? (
              <ScrollArea className="h-40 border rounded-md p-4 bg-muted/50">
                <pre className="text-sm font-mono whitespace-pre-wrap">{randomCode}</pre>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-2"/>
                <p className="text-muted-foreground">No Python code samples available.</p>
                <p className="text-sm text-muted-foreground mt-1">Complete some audits to save code samples.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/audits')}
                >
                  Go to Audits
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleDownloadCode}
              disabled={!randomCode}
            >
              <Download className="mr-2 h-4 w-4"/>
              Download Code
            </Button>
          </CardFooter>
        </Card>

        {/* Report Download Box */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText className="mr-2 h-6 w-6 text-primary"/>
              Submitted Reports
            </CardTitle>
            <CardDescription>Download a random submitted report from our database</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : randomReport ? (
              <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                <FileText className="h-12 w-12 text-primary mb-2"/>
                <p className="text-muted-foreground">Report available for download</p>
                <p className="text-sm text-muted-foreground mt-1">Task ID: {randomReport.taskId}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-2"/>
                <p className="text-muted-foreground">No submitted reports available.</p>
                <p className="text-sm text-muted-foreground mt-1">Complete some tasks and submit reports.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/tasks')}
                >
                  Go to Tasks
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleDownloadReport}
              disabled={!randomReport}
            >
              <Download className="mr-2 h-4 w-4"/>
              Download Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

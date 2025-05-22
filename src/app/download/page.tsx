"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileCode, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getUrls } from '@/lib/db';
import type { UrlItem } from '@/types';

export default function DownloadCodePage() {
  const { toast } = useToast();
  const { currentUser } = useAppContext();
  const router = useRouter();
  const [randomCode, setRandomCode] = useState<UrlItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const fetchRandomCode = async () => {
      try {
        const urls = await getUrls();
        // Filter URLs that have Python code
        const urlsWithCode = urls.filter(url => url.pythonCode && url.pythonCode.trim() !== '');
        
        if (urlsWithCode.length > 0) {
          // Get a random URL with code
          const randomIndex = Math.floor(Math.random() * urlsWithCode.length);
          setRandomCode(urlsWithCode[randomIndex]);
        }
      } catch (error) {
        console.error('Error fetching code:', error);
        toast({
          title: "Error",
          description: "Failed to fetch code samples",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomCode();
  }, [currentUser, router, toast]);

  const handleDownload = () => {
    if (!randomCode?.pythonCode) return;

    const fileName = `Matrix_Code_${randomCode.id}.py`;
    const fileContent = randomCode.pythonCode;
    
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({
      title: "Download Started",
      description: `${fileName} is being downloaded.`,
    });
  };

  if (isLoading || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Download Sample Code</CardTitle>
          <CardDescription>
            {randomCode ? "Download a random Python code sample from completed audits." : "No code samples available."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {randomCode ? (
            <>
              <div className="w-full mb-6 p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Code Preview:</h3>
                <pre className="text-xs whitespace-pre-wrap bg-background p-2 rounded border max-h-40 overflow-y-auto">
                  {randomCode.pythonCode}
                </pre>
              </div>
              <Button onClick={handleDownload} size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" /> Download Code
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Complete some audits and save Python code to enable downloads.
              </p>
              <Button 
                onClick={() => router.push('/urls')} 
                variant="outline" 
                className="w-full"
              >
                Go to Audits
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
        {randomCode ? 
          "This code was randomly selected from completed audits. Each download will show a different sample." :
          "Start by completing audits and saving Python code to build your collection of downloadable samples."
        }
      </p>
    </div>
  );
}

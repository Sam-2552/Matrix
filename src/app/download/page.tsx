"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileCode } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function DownloadCodePage() {
  const { toast } = useToast();
  const { currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }


  const handleDownload = () => {
    // Simulate file download
    const fileName = "Matrix_SampleCode.txt";
    const fileContent = "This is a sample code file from Matrix.\n\nReplace this with actual downloadable content generation logic.";
    
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

  return (
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Download Sample Code</CardTitle>
          <CardDescription>
            Click the button below to download a sample code file.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <FileCode className="h-24 w-24 text-muted-foreground mb-6 opacity-50" data-ai-hint="code file" />
          <Button onClick={handleDownload} size="lg" className="w-full">
            <Download className="mr-2 h-5 w-5" /> Download Now
          </Button>
        </CardContent>
      </Card>
       <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
        This is a placeholder for file download functionality. In a real application, this could provide access to project files, reports, or other relevant data.
      </p>
    </div>
  );
}

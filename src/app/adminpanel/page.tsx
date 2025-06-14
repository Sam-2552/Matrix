"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const [logContent, setLogContent] = useState<string>("");
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLog = async () => {
      try {
        // Intentionally vulnerable to path traversal
        // The file parameter is directly used without sanitization
        const file = searchParams.get('file') || 'sensitive.log';
        const response = await fetch(`/api/logs?file=${encodeURIComponent(file)}`);
        const data = await response.text();
        setLogContent(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load log file",
          variant: "destructive"
        });
      }
    };

    fetchLog();
  }, [searchParams, toast]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel - Log Viewer</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Current Log File</h2>
          <p className="text-sm text-muted-foreground">
            Viewing: {searchParams.get('file') || 'sensitive.log'}
          </p>
        </div>
        <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
          {logContent}
        </pre>
      </div>
    </div>
  );
} 
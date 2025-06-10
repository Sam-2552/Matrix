"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { FileText, MessageSquare, Send, Link2, Tags, CheckCircle, RefreshCw, Circle, Percent, Upload } from 'lucide-react';
import type { TaskStatus, TaskComment, UrlItem, Task, UrlStatus, UrlProgressDetail } from '@/types';
import { format } from 'date-fns';
import { useSession } from "next-auth/react";
import { CommentEditor } from '@/components/comment-editor';
import DOMPurify from 'dompurify';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';

export default function MyTasksPage() {
  const { getTasksForUser, updateTaskStatus, addTaskComment, agencies, urls: allUrls, updateUrlProgress } = useAppContext();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const { toast } = useToast();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (!session?.user?.id) {
    return <div>User not found</div>;
  }

  const userTasks = getTasksForUser(session.user.id); // task.id is number here

  const handleOverallStatusChange = (taskId: number, status: TaskStatus) => { // taskId is number
    const task = userTasks.find(t => t.id === taskId); // number === number
    if (task && task.assignedItemType === 'agency') {
      updateTaskStatus(taskId, status); // updateTaskStatus expects number
      // Clear selected file when status changes
      setSelectedFiles(prev => ({ ...prev, [taskId]: null })); // taskId (number) used as key, JS converts to string
    }
  };

  const handleUrlStatusChange = (taskId: number, urlId: string, newStatus: UrlStatus) => { // taskId is number
    updateUrlProgress(taskId, urlId, newStatus); // updateUrlProgress expects number for taskId
  };

  const handleUrlProgressChange = (taskId: number, urlId: string, progress: number) => { // taskId is number
    const task = userTasks.find(t => t.id === taskId); // number === number
    const urlDetail = task?.urlProgressDetails?.find(upd => upd.urlId === urlId);
    const currentStatus = urlDetail?.status || 'in_progress'; // Fixed status value

    updateUrlProgress(taskId, urlId, progress === 100 ? 'completed' : currentStatus, progress); // updateUrlProgress expects number for taskId
  };

  const handleFileChange = (taskId: number, file: File | null) => { // taskId is number
    setSelectedFiles(prev => ({ ...prev, [taskId]: file })); // taskId (number) used as key
  };

  const handleSubmitReport = async (taskId: number) => { // taskId is number
    const file = selectedFiles[taskId]; // taskId (number) used as key
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      const task = userTasks.find(t => t.id === taskId); // number === number
      if (!task) {
        throw new Error('Task not found');
      }

      // Get the first URL ID from the task's assigned URLs
      let urlId: string | undefined;
      if (task.assignedItemType === 'urls' && task.assignedUrlIds && task.assignedUrlIds.length > 0) {
        urlId = task.assignedUrlIds[0];
      } else if (task.assignedItemType === 'agency' && task.assignedAgencyId) {
        const agencyUrls = allUrls.filter(u => u.agencyId === task.assignedAgencyId);
        if (agencyUrls.length > 0) {
          urlId = agencyUrls[0].id;
        }
      }

      if (!urlId) {
        throw new Error('No URLs found for this task');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('urlId', urlId);

      const response = await fetch('/api/upload-report', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload report');
      }

      toast({
        title: "Success",
        description: "Report submitted successfully",
      });

      // Clear the selected file after successful upload
      setSelectedFiles(prev => ({ ...prev, [taskId]: null })); // taskId (number) used as key
    } catch (error) {
      console.error('Error uploading report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload report",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = (taskId: number) => { // taskId is number
    const text = commentTexts[taskId]; // taskId (number) used as key
    if (text && text.trim()) {
      addTaskComment(taskId, text.trim()); // addTaskComment expects number
      setCommentTexts(prev => ({ ...prev, [taskId]: '' })); // taskId (number) used as key
    }
  };

  const getTaskItemsDetails = (task: Task): { type: 'agency' | 'url', name: string, items: UrlItem[] | UrlProgressDetail[] } => {
    if (task.assignedItemType === 'agency') {
      const agency = agencies.find(a => a.id === task.assignedAgencyId);
      const agencyUrls = allUrls.filter(u => u.agencyId === task.assignedAgencyId);
      return { type: 'agency', name: agency?.name || 'Unknown Agency', items: agencyUrls };
    }
    
    const taskUrlDetails = task.urlProgressDetails?.map(detail => {
      const urlInfo = allUrls.find(u => u.id === detail.urlId);
      return { ...detail, link: urlInfo?.link || 'Unknown URL' };
    }) || [];

    return { type: 'url', name: `${taskUrlDetails.length} URL(s)`, items: taskUrlDetails };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center"><FileText className="mr-2 h-8 w-8 text-primary"/>My Tasks</h1>
      <p className="text-muted-foreground">View your assigned tasks, update their status, and add comments.</p>

      {userTasks.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-18rem)] pr-4">
          <div className="space-y-6">
            {userTasks.map(task => {
              const taskItemsDetails = getTaskItemsDetails(task);
              const isUrlTask = task.assignedItemType === 'urls';
              const isCompleted = task.status === 'completed';

              return (
                <Card key={task.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription>ID: {task.id}</CardDescription>
                      </div>
                      <div className="w-48"> {/* Increased width for clarity */}
                        <Select 
                          value={task.status} 
                          onValueChange={(status) => handleOverallStatusChange(task.id, status as TaskStatus)}
                          disabled={isUrlTask} // Disable overall status for URL tasks
                        >
                          <SelectTrigger className={`h-9 text-xs ${task.status === 'completed' ? 'border-green-500 text-green-600' : task.status === 'in-progress' ? 'border-blue-500 text-blue-600' : 'border-orange-500 text-orange-600'}`}>
                            <SelectValue placeholder="Status"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending"><Circle className="mr-2 h-3 w-3 text-orange-500 fill-orange-500"/>Pending</SelectItem>
                            <SelectItem value="in-progress"><RefreshCw className="mr-2 h-3 w-3 text-blue-500"/>In Progress</SelectItem>
                            <SelectItem value="completed"><CheckCircle className="mr-2 h-3 w-3 text-green-500"/>Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        {isUrlTask && <p className="text-xs text-muted-foreground mt-1 text-right">Overall status derived from URLs.</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
                    
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-1 flex items-center">
                        {taskItemsDetails.type === 'agency' ? <Tags className="mr-1.5 h-4 w-4 text-primary"/> : <Link2 className="mr-1.5 h-4 w-4 text-primary"/>}
                        Assigned: {taskItemsDetails.name}
                      </h4>
                      
                      {taskItemsDetails.items.length > 0 && (
                        <ScrollArea className="h-auto max-h-60 border rounded-md p-2 text-sm">
                           <ul className="space-y-3">
                            {taskItemsDetails.items.map((item, index) => (
                              <li key={isUrlTask ? (item as UrlProgressDetail).urlId : (item as UrlItem).id} className="p-2 rounded-md bg-muted/50">
                                {isUrlTask ? (
                                  (() => {
                                    const urlDetail = item as UrlProgressDetail & { link: string }; // Cast for link access
                                    return (
                                      <div className="space-y-2">
                                        <a href={urlDetail.link} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary hover:underline truncate block font-medium" title={urlDetail.link}>
                                          {urlDetail.link}
                                        </a>
                                        <div className="flex items-center space-x-2">
                                          <Select 
                                            value={urlDetail.status} 
                                            onValueChange={(newStatus) => handleUrlStatusChange(task.id, urlDetail.urlId, newStatus as UrlStatus)}
                                          >
                                            <SelectTrigger className={`h-8 text-xs w-36 ${urlDetail.status === 'completed' ? 'border-green-500 text-green-600' : urlDetail.status === 'in_progress' ? 'border-blue-500 text-blue-600' : 'border-orange-500 text-orange-600'}`}>
                                              <SelectValue placeholder="URL Status"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending"><Circle className="mr-1 h-3 w-3 text-orange-500 fill-orange-500"/>Pending</SelectItem>
                                              <SelectItem value="in-progress"><RefreshCw className="mr-1 h-3 w-3 text-blue-500"/>In Progress</SelectItem>
                                              <SelectItem value="completed"><CheckCircle className="mr-1 h-3 w-3 text-green-500"/>Completed</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {urlDetail.status === 'in_progress' && (
                                            <div className="flex items-center space-x-2 flex-grow">
                                              <Slider
                                                value={[urlDetail.progressPercentage ?? 0]}
                                                onValueChange={(value) => handleUrlProgressChange(task.id, urlDetail.urlId, value[0])}
                                                max={100}
                                                step={1}
                                                className="w-full"
                                              />
                                              <span className="text-xs text-foreground font-medium w-12 text-right">{urlDetail.progressPercentage ?? 0}%</span>
                                            </div>
                                          )}
                                           {urlDetail.status === 'completed' && (
                                              <span className="text-xs text-green-600 font-medium flex items-center"><CheckCircle className="mr-1 h-4 w-4"/>100%</span>
                                           )}
                                           {urlDetail.status === 'pending' && (
                                               <span className="text-xs text-orange-600 font-medium flex items-center"><Circle className="mr-1 h-4 w-4 fill-current"/>0%</span>
                                           )}
                                        </div>
                                      </div>
                                    )
                                  })()
                                ) : (
                                  <a href={(item as UrlItem).link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline truncate block" title={(item as UrlItem).link}>
                                    {(item as UrlItem).link}
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      )}
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="comments">
                        <AccordionTrigger className="text-sm hover:no-underline">
                          <span className="flex items-center"><MessageSquare className="mr-2 h-4 w-4"/>Comments ({task.comments?.length ?? 0})</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          <ScrollArea className="h-40 mb-2 border rounded-md p-2">
                            {task.comments && task.comments.length > 0 ? (
                              <ul className="space-y-3">
                                {task.comments.map((comment: TaskComment) => (
                                  <li key={comment.id} className="text-xs">
                                    <p className="font-semibold text-foreground"><span className="text-muted-foreground font-normal">({format(new Date(comment.timestamp ?? 0), "PPpp")})</span>:</p>
                                    <div 
                                      className="text-muted-foreground prose prose-sm max-w-none prose-headings:my-2 prose-p:my-1 prose-a:text-primary prose-a:underline hover:prose-a:no-underline"
                                      dangerouslySetInnerHTML={{ 
                                        __html: DOMPurify.sanitize(comment.text, {
                                          ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'prompt', 'img'],
                                            ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style', 'onerror']
                                          })
                                      }}
                                    />
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-4">No comments yet.</p>
                            )}
                          </ScrollArea>
                          <div className="flex space-x-2">
                            <Textarea 
                              placeholder="Add a comment" 
                              value={commentTexts[task.id] || ''}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                              className="text-xs min-h-[40px] font-mono"
                              rows={2}
                            />
                            <Button size="sm" onClick={() => handleAddComment(task.id)} disabled={!commentTexts[task.id]?.trim()}>
                              <Send className="h-3.5 w-3.5"/>
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  {isCompleted && task.assignedItemType === 'agency' && (
                    <CardFooter className="border-t pt-4">
                      <div className="w-full space-y-4">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            onChange={(e) => handleFileChange(task.id, e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => handleSubmitReport(task.id)}
                            disabled={!selectedFiles[task.id]}
                            className="flex items-center"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Submit Report
                          </Button>
                        </div>
                        {selectedFiles[task.id] && (
                          <p className="text-sm text-muted-foreground">
                            Selected file: {selectedFiles[task.id]?.name}
                          </p>
                        )}
                      </div>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><FileText className="mr-2 h-6 w-6 text-muted-foreground" />No Tasks Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You currently have no tasks assigned to you. Check back later!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

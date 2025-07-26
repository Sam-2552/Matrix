
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { FileText, MessageSquare, Send, Link2, CheckCircle, RefreshCw, Circle, Waves, Briefcase } from 'lucide-react';
import type { TaskStatus, TaskComment, UrlItem, Task, UrlStatus, Agency } from '@/types';
import { format } from 'date-fns';

interface GroupedUrls {
  agency: Agency;
  urls: UrlItem[];
}

export default function MyTasksPage() {
  const { 
    currentUser, 
    getTasksForUser, 
    updateTaskStatus, 
    addTaskComment, 
    agencies, 
    urls: allUrls,
    updateUrlProgress,
    waves
  } = useAppContext();
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const userTasks = useMemo(() => currentUser ? getTasksForUser(currentUser.id) : [], [currentUser, getTasksForUser]);

  const getTaskItemsDetails = (task: Task): { assignedAgencies: Agency[], assignedUrls: UrlItem[], groupedUrls: GroupedUrls[], individualUrls: UrlItem[] } => {
    const assignedAgencies = (task.assignedAgencyIds || [])
      .map(id => agencies.find(a => a.id === id))
      .filter((a): a is Agency => a !== undefined);

    const specificUrls = (task.assignedUrlIds || [])
      .map(id => allUrls.find(u => u.id === id))
      .filter((u): u is UrlItem => u !== undefined);
      
    const agencyUrls = assignedAgencies.flatMap(agency =>
        allUrls.filter(u => u.agencyId === agency.id)
    );
    
    const combinedUrls = [...specificUrls, ...agencyUrls];
    const uniqueUrls = Array.from(new Map(combinedUrls.map(u => [u.id, u])).values());

    const groupedUrls: GroupedUrls[] = assignedAgencies.map(agency => ({
      agency,
      urls: allUrls.filter(u => u.agencyId === agency.id)
    }));

    const individualUrls = specificUrls;

    return { assignedAgencies, assignedUrls: uniqueUrls, groupedUrls, individualUrls };
  };

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  const handleOverallStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskStatus(taskId, status);
  };

  const handleUrlStatusChange = (taskId: string, urlId: string, newStatus: UrlStatus) => {
    updateUrlProgress(taskId, urlId, newStatus);
  };

  const handleUrlProgressChange = (taskId: string, urlId: string, progress: number) => {
    // Determine status based on progress, but let backend finalize it
    const newStatus: UrlStatus = progress === 100 ? 'completed' : (progress > 0 ? 'in-progress' : 'pending');
    updateUrlProgress(taskId, urlId, newStatus, progress);
  };

  const handleAddComment = (taskId: string) => {
    const text = commentTexts[taskId];
    if (text && text.trim()) {
      addTaskComment(taskId, text.trim());
      setCommentTexts(prev => ({ ...prev, [taskId]: '' }));
    }
  };
  
  const UrlProgressRow = ({ task, url }: { task: Task, url: UrlItem }) => {
    const urlDetail = task.urlProgressDetails?.find(upd => upd.urlId === url.id) || { urlId: url.id, status: 'pending', progressPercentage: 0 };
    const urlStatusColorClass = urlDetail.status === 'completed' ? 'text-green-600' : urlDetail.status === 'in-progress' ? 'text-blue-600' : 'text-orange-600';
    
    return (
      <li key={url.id} className="p-2 rounded-md bg-muted/50">
        <div className="space-y-2">
          <a href={url.link} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary hover:underline truncate block font-medium" title={url.link}>
            {url.link}
          </a>
          <div className="flex items-center space-x-2">
            <Select 
              value={urlDetail.status} 
              onValueChange={(newStatus) => handleUrlStatusChange(task.id, url.id, newStatus as UrlStatus)}
            >
              <SelectTrigger className={`h-8 text-xs w-36 font-medium ${urlStatusColorClass} border-${urlStatusColorClass?.replace('text-', '')?.replace('-600', '-500')}`}>
                <SelectValue placeholder="URL Status"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending"><Circle className="mr-1 h-3 w-3 text-orange-500 fill-orange-500"/>Pending</SelectItem>
                <SelectItem value="in-progress"><RefreshCw className="mr-1 h-3 w-3 text-blue-500"/>In Progress</SelectItem>
                <SelectItem value="completed"><CheckCircle className="mr-1 h-3 w-3 text-green-500"/>Completed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 flex-grow">
                <Slider
                  value={[urlDetail.progressPercentage]}
                  onValueChange={(value) => handleUrlProgressChange(task.id, url.id, value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <span className="text-xs text-foreground font-medium w-12 text-right">{urlDetail.progressPercentage}%</span>
              </div>
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center"><FileText className="mr-2 h-8 w-8 text-primary"/>My Tasks</h1>
      <p className="text-muted-foreground">View your assigned tasks from different waves, update their status, and add comments.</p>

      {userTasks.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-18rem)] pr-4">
          <div className="space-y-6">
            {userTasks.map(task => {
              const { assignedUrls, groupedUrls, individualUrls } = getTaskItemsDetails(task);
              const wave = waves.find(w => w.id === task.waveId);
              const statusColorClass = task.status === 'completed' ? 'text-green-600' : task.status === 'in-progress' ? 'text-blue-600' : 'text-orange-600';

              return (
                <Card key={task.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        {wave && (
                           <CardDescription className="flex items-center gap-2 pt-1"><Waves className="h-4 w-4"/>Wave {wave.number}: {wave.name}</CardDescription>
                        )}
                      </div>
                      <div className="w-48">
                         <Select 
                          value={task.status} 
                          onValueChange={(status) => handleOverallStatusChange(task.id, status as TaskStatus)}
                        >
                          <SelectTrigger className={`h-9 text-xs font-medium ${statusColorClass} border-${statusColorClass?.replace('text-', '')?.replace('-600', '-500')}`}>
                            <SelectValue placeholder="Status"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending"><Circle className="mr-2 h-3 w-3 text-orange-500 fill-orange-500"/>Pending</SelectItem>
                            <SelectItem value="in-progress"><RefreshCw className="mr-2 h-3 w-3 text-blue-500"/>In Progress</SelectItem>
                            <SelectItem value="completed"><CheckCircle className="mr-2 h-3 w-3 text-green-500"/>Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1 text-right">Overall task status.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
                    
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <Link2 className="mr-1.5 h-4 w-4 text-primary"/>
                        Assigned URLs ({assignedUrls.length})
                      </h4>
                      
                      {assignedUrls.length > 0 ? (
                        <div className="h-auto max-h-[22rem] border rounded-md p-2 overflow-y-auto">
                          <Accordion type="multiple" className="w-full space-y-2">
                            {groupedUrls.map(({ agency, urls }) => (
                              urls.length > 0 &&
                              <AccordionItem value={agency.id} key={agency.id} className="border-none">
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline bg-muted/30 px-3 py-2 rounded-md">
                                  <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Agency: {agency.name} ({urls.length})</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                  <ul className="space-y-3 px-1">
                                    {urls.map(url => <UrlProgressRow key={url.id} task={task} url={url} />)}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                            {individualUrls.length > 0 && (
                               <AccordionItem value="individual" className="border-none" defaultChecked>
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline bg-muted/30 px-3 py-2 rounded-md">
                                  <span className="flex items-center gap-2"><Link2 className="h-4 w-4" />Specifically Assigned URLs ({individualUrls.length})</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                  <ul className="space-y-3 px-1">
                                    {individualUrls.map(url => <UrlProgressRow key={url.id} task={task} url={url} />)}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">No URLs have been assigned to this task.</p>
                      )}
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="comments">
                        <AccordionTrigger className="text-sm hover:no-underline">
                          <span className="flex items-center"><MessageSquare className="mr-2 h-4 w-4"/>Comments ({task.comments?.length || 0})</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                           <div className="h-40 mb-2 border rounded-md p-2 overflow-y-auto">
                            {task.comments && task.comments.length > 0 ? (
                              <ul className="space-y-3">
                                {task.comments.map((comment: TaskComment) => (
                                  <li key={comment.id} className="text-xs">
                                    <p className="font-semibold text-foreground">{comment.userName} <span className="text-muted-foreground font-normal">({format(new Date(comment.date), "PPpp")})</span>:</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{comment.text}</p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-4">No comments yet.</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Textarea 
                              placeholder="Add a comment..." 
                              value={commentTexts[task.id] || ''}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                              className="text-xs min-h-[40px]"
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

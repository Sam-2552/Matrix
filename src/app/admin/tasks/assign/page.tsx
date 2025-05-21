"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GanttChartSquare, CheckCircle, User, Briefcase, Link2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { AppUser, Agency, UrlItem } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { useSession } from "next-auth/react";

export default function AssignTaskPage() {
  const { users, agencies, urls, assignTask, tasks: allTasks, deleteTask } = useAppContext();
  const { data: session, status } = useSession();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'agency' | 'urls'>('urls');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [selectedUrlIds, setSelectedUrlIds] = useState<string[]>([]);
  const router = useRouter();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const availableUsers = users.filter(u => u.role === 'user'); // Only assign to regular users

  const handleAssignTask = () => {
    if (!taskTitle.trim() || !selectedUserId) {
      alert('Please provide a task title and select a user.');
      return;
    }

    if (assignmentType === 'agency' && !selectedAgencyId) {
      alert('Please select an agency to assign.');
      return;
    }
    if (assignmentType === 'urls' && selectedUrlIds.length === 0) {
      alert('Please select at least one URL to assign.');
      return;
    }

    assignTask({
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      userId: selectedUserId,
      assignedItemType: assignmentType,
      assignedAgencyId: assignmentType === 'agency' ? selectedAgencyId : undefined,
    });

    // Reset form
    setTaskTitle('');
    setTaskDescription('');
    setSelectedUserId('');
    setAssignmentType('urls');
    setSelectedAgencyId('');
    setSelectedUrlIds([]);
  };
  
  const handleUrlSelection = (urlId: string) => {
    setSelectedUrlIds(prev => 
      prev.includes(urlId) ? prev.filter(id => id !== urlId) : [...prev, urlId]
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteTask(taskId);
    }
  };

  const assignedTasks = allTasks; // Display all tasks for admin overview

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><GanttChartSquare className="mr-2 h-8 w-8 text-primary"/>Assign Tasks</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Create New Task Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-muted-foreground mb-1">Task Title</label>
            <Input id="taskTitle" placeholder="e.g., Review Q1 Marketing URLs" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-muted-foreground mb-1">Task Description (Optional)</label>
            <Textarea id="taskDescription" placeholder="Detailed instructions for the task..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
          </div>
          <div>
            <label htmlFor="assignUser" className="block text-sm font-medium text-muted-foreground mb-1">Assign to User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="assignUser">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Assign Item Type</label>
            <Select value={assignmentType} onValueChange={(value) => setAssignmentType(value as 'agency' | 'urls')}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urls">Specific URLs</SelectItem>
                <SelectItem value="agency">Entire Agency (and its URLs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assignmentType === 'agency' && (
            <div>
              <label htmlFor="assignAgency" className="block text-sm font-medium text-muted-foreground mb-1">Select Agency</label>
              <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                <SelectTrigger id="assignAgency">
                  <SelectValue placeholder="Select an agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map(agency => (
                    <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assignmentType === 'urls' && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Select URLs</label>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="urls-list">
                  <AccordionTrigger className="text-sm hover:no-underline bg-muted px-3 py-2 rounded-md">
                    {selectedUrlIds.length > 0 ? `${selectedUrlIds.length} URL(s) selected` : "Choose URLs"}
                    {selectedUrlIds.length > 0 ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-48 mt-2 border rounded-md p-2">
                      {urls.length > 0 ? urls.map(url => (
                        <div key={url.id} className="flex items-center space-x-2 p-1.5 hover:bg-accent rounded-md">
                          <input 
                            type="checkbox" 
                            id={`url-${url.id}`} 
                            checked={selectedUrlIds.includes(url.id)}
                            onChange={() => handleUrlSelection(url.id)}
                            className="form-checkbox h-4 w-4 text-primary border-muted-foreground rounded focus:ring-primary"
                          />
                          <label htmlFor={`url-${url.id}`} className="text-sm cursor-pointer flex-grow truncate" title={url.link}>
                            {url.link} {url.agencyId && `(${agencies.find(a=>a.id===url.agencyId)?.name})`}
                          </label>
                        </div>
                      )) : <p className="text-sm text-muted-foreground p-2">No URLs available. Add URLs in Manage URLs section.</p>}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          
          <Button onClick={handleAssignTask} className="w-full md:w-auto">
            <CheckCircle className="mr-2 h-4 w-4" /> Assign Task
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Current Task Assignments</CardTitle>
          <CardDescription>Overview of all tasks assigned to users.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedTasks.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-30rem)]">
              <div className="space-y-4">
                {assignedTasks.map(task => {
                  const user = users.find(u => u.id === task.userId);
                  let assignedItemsContent = "";
                  if (task.assignedItemType === 'agency') {
                    const agency = agencies.find(a => a.id === task.assignedAgencyId);
                    assignedItemsContent = `Agency: ${agency?.name || 'N/A'}`;
                  } else {
                    assignedItemsContent = `URLs: ${task.urlProgressDetails?.length || 0}`;
                  }
                  return (
                    <Card key={task.id} className="shadow-sm">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            <CardDescription>
                              Assigned to: <span className="font-medium text-foreground">{user?.name || 'N/A'}</span> | Status: <span className={`capitalize font-medium ${task.status === 'completed' ? 'text-green-600' : task.status === 'in-progress' ? 'text-blue-600' : 'text-orange-600'}`}>{task.status}</span>
                            </CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
                        <p className="text-sm"><span className="font-medium">Assigned:</span> {assignedItemsContent}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">No tasks have been assigned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

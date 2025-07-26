import { clientPromise } from '@/lib/mongodb';
import { Task, TaskComment } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { commentText, userName } = await req.json();
    const { id: taskId } = params;

    const newComment: TaskComment = {
      id: `comment-${Date.now()}`,
      text: commentText,
      userName: userName,
      date: new Date().toISOString(),
    };

    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection<Task>('tasks');
    const result = await tasksCollection.updateOne({ _id: new ObjectId(taskId) }, { $push: { comments: newComment } });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

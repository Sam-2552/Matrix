import { clientPromise } from '@/lib/mongodb';
import { Task } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection<Task>('tasks');
    const tasks = await tasksCollection.find({}).toArray();
    return NextResponse.json(tasks);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

import { clientPromise } from '@/lib/mongodb';
import { Task } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const { id } = params;
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection<Task>('tasks');
    const result = await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

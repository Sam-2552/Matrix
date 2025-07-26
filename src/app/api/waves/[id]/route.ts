import { clientPromise } from '@/lib/mongodb';
import { Wave } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const { id } = params;
    const client = await clientPromise;
    const db = client.db();
    const wavesCollection = db.collection<Wave>('waves');
    const result = await wavesCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

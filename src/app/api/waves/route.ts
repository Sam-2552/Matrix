import { clientPromise } from '@/lib/mongodb';
import { Wave } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const wavesCollection = db.collection<Wave>('waves');
    const waves = await wavesCollection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(waves);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, number, description } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const wavesCollection = db.collection<Wave>('waves');
    const newWave: Omit<Wave, 'id'> = {
      name,
      number,
      description,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
    const result = await wavesCollection.insertOne(newWave);
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

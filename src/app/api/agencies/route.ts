import { clientPromise } from '@/lib/mongodb';
import { Agency } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const agenciesCollection = db.collection<Agency>('agencies');
    const agencies = await agenciesCollection.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json(agencies);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const agenciesCollection = db.collection<Agency>('agencies');
    const result = await agenciesCollection.insertOne({ name });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

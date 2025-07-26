import { clientPromise } from '@/lib/mongodb';
import { UrlItem } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const urlsCollection = db.collection<UrlItem>('urls');
    const urls = await urlsCollection.find({}).toArray();
    return NextResponse.json(urls);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { link, agencyId } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const urlsCollection = db.collection<UrlItem>('urls');
    const result = await urlsCollection.insertOne({ link, agencyId });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

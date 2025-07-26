import { clientPromise } from '@/lib/mongodb';
import { Report } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const reportsCollection = db.collection<Report>('reports');
    const reports = await reportsCollection.find({}).sort({ updatedAt: -1 }).toArray();
    return NextResponse.json(reports);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, agencyId, waveId, sections, status } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const reportsCollection = db.collection<Report>('reports');
    const newReport: Omit<Report, 'id'> = {
      userId,
      agencyId,
      waveId,
      sections,
      status: status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await reportsCollection.insertOne(newReport as Report);
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

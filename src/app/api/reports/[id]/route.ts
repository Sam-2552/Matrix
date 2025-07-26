import { clientPromise } from '@/lib/mongodb';
import { Report } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { agencyId, waveId, sections, status } = await req.json();
    const { id } = params;
    const client = await clientPromise;
    const db = client.db();
    const reportsCollection = db.collection<Report>('reports');
    const result = await reportsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          agencyId,
          waveId,
          sections,
          status,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

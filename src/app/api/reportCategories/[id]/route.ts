import { clientPromise } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const client = await clientPromise;
    const db = client.db();
    const reportCategoriesCollection = db.collection('reportCategories');
    const result = await reportCategoriesCollection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

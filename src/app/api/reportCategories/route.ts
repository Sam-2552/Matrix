import { clientPromise } from '@/lib/mongodb';
import { ReportCategory } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const reportCategoriesCollection = db.collection<ReportCategory>('reportCategories');
    const reportCategories = await reportCategoriesCollection.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json(reportCategories);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const reportCategoriesCollection = db.collection<ReportCategory>('reportCategories');
    const result = await reportCategoriesCollection.insertOne({ name });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

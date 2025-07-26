import { gfs } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const _id = new ObjectId(id);

    const readstream = gfs.createReadStream({ _id });

    readstream.on('error', (err) => {
      return new NextResponse(err.message, { status: 404 });
    });

    return new NextResponse(readstream);

  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

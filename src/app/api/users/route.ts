import { clientPromise } from '@/lib/mongodb';
import { AppUser } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<AppUser>('users');
    const users = await usersCollection.find({}).toArray();
    return NextResponse.json(users);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, username, password, role } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<AppUser>('users');
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return new NextResponse('User already exists', { status: 409 });
    }
    const result = await usersCollection.insertOne({ name, username, password, role });
    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

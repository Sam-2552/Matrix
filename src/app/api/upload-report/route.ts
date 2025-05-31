import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export async function POST(request: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Not authenticated');
    }

    const formData = await request.formData();
    
    // Debug logging
    console.log('Form data entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
    }

    const file = formData.get('file') as File;
    const urlId = formData.get('urlId') as string;

    // More detailed error messages
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file was provided in the request' 
      }, { status: 400 });
    }

    if (!urlId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No URL ID was provided in the request' 
      }, { status: 400 });
    }

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'data', 'reports');
    try {
      await mkdir(reportsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating reports directory:', error);
    }

    // Generate unique filename
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = path.join(reportsDir, fileName);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Get the session token from the request headers
    const sessionToken = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('next-auth.session-token='))
      ?.split('=')[1];

    // Update the database using the existing API endpoint
    const response = await fetch(`${baseUrl}/api/db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionToken}`
      },
      body: JSON.stringify({
        action: 'updateUrlReport',
        data: {
          id: urlId,
          reportPath: fileName
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update database');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report uploaded successfully',
      fileName
    });

  } catch (error: unknown) {
    console.error('Error uploading report:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

async function createDirIfNotExists(dir: string) {
  try {
    await writeFile(dir, '', { flag: 'wx' });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
} 
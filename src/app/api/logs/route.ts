import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the file parameter from the URL
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get('file') || 'sensitive.log';

    // Validate that the file is within the allowed directory
    const allowedPath = path.join(process.cwd(), 'src', 'data');
    const requestedPath = path.join(allowedPath, file);
    
    // Check if the requested path is within the allowed directory
    if (!requestedPath.startsWith(allowedPath)) {
      return new NextResponse('Invalid file path', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(requestedPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read the file content
    const content = fs.readFileSync(requestedPath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    return new NextResponse('Error reading log file', { status: 500 });
  }
}
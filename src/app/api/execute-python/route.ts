import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export async function POST(request: Request) {
  const { urlId, code } = await request.json();

  try {
    // Create a temporary file for the Python code
    const tempDir = path.join(process.cwd(), 'temp');
    const fileName = `${uuidv4()}.py`;
    const filePath = path.join(tempDir, fileName);

    // Write the code to the temporary file
    await writeFile(filePath, code);

    // Execute the Python code and wait for completion
    const output = await new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn('python', [filePath]);
      let output = '';
      let error = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        // Clean up the temporary file
        unlink(filePath).catch((err: Error) => {
          console.error('Error deleting temporary file:', err);
        });

        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || 'Python process failed'));
        }
      });

      // Handle process error
      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    // Get the session
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Not authenticated');
    }

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
        action: 'updateUrlExecutionOutput',
        data: {
          id: urlId,
          executionOutput: output,
          status: 'completed'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update database');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Python code execution completed',
      output
    });

  } catch (error: unknown) {
    console.error('Error executing Python code:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 
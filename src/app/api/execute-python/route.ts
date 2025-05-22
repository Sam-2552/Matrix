import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const { urlId, code } = await request.json();

  try {
    // Create a temporary file for the Python code
    const tempDir = path.join(process.cwd(), 'temp');
    const fileName = `${uuidv4()}.py`;
    const filePath = path.join(tempDir, fileName);

    // Write the code to the temporary file
    await writeFile(filePath, code);

    // Execute the Python code in the background
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
    });

    // Return immediately with a success response
    return NextResponse.json({ 
      success: true, 
      message: 'Python code execution started',
      output: output || error // Include any immediate output
    });

  } catch (error: unknown) {
    console.error('Error executing Python code:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 
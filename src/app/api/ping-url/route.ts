import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url } = await request.json();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Matrix-Audit-Tool/1.0'
      }
    });

    return NextResponse.json({
      success: response.ok,
      message: response.ok 
        ? `URL is accessible (Status: ${response.status})`
        : `URL is not accessible (Status: ${response.status})`
    });

  } catch (error) {
    console.error('Error pinging URL:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to ping URL'
    });
  }
} 
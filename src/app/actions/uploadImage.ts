
"use server";

import { gfs } from '@/lib/mongodb';
import { Readable } from 'stream';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const readableStream = Readable.from(buffer);

    const writestream = gfs.createWriteStream({
      filename: file.name,
      content_type: file.type,
    });

    readableStream.pipe(writestream);

    return new Promise((resolve, reject) => {
      writestream.on('close', (file) => {
        resolve({ success: true, url: `/api/images/${file._id}` });
      });
      writestream.on('error', (err) => {
        console.error('Error uploading file:', err);
        reject({ success: false, error: err.message });
      });
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
}

    
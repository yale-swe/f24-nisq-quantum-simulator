import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  console.log('API route /api/saveOutputs called');
  try {
    const { outputs } = await request.json();

    if (!outputs) {
      console.log('No outputs provided');
      return NextResponse.json(
        { message: 'No outputs provided' },
        { status: 400 }
      );
    }

    // Adjust the file path to write outputs.json to the root directory
    const filePath = path.join(process.cwd(), '..', 'outputs.json');
    fs.writeFileSync(filePath, JSON.stringify(outputs, null, 2));
    console.log('Outputs saved to outputs.json in root directory');

    return NextResponse.json(
      { message: 'Outputs saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error writing outputs to file:', error);
    return NextResponse.json(
      { message: 'Error writing outputs to file' },
      { status: 500 }
    );
  }
}
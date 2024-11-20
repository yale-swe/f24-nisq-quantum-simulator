import { NextResponse } from 'next/server';
import path from 'path';
import { spawn } from 'child_process';

export async function POST(request) {
    try {
        const data = await request.json();
        const { circuit_ir } = data;

        // Call your Python script using spawn
        const pythonScript = path.join(process.cwd(), '..', 'backend', 'propagate_error.py');
        const pythonProcess = spawn('python3', [pythonScript, JSON.stringify(circuit_ir)]);

        return new Promise((resolve, reject) => {
            let resultData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                resultData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new NextResponse(JSON.stringify({ error: errorData }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }));
                    return;
                }

                resolve(new NextResponse(JSON.stringify({ data: JSON.parse(resultData) }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }));
            });
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
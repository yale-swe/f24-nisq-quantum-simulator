import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request) {
    console.log('API route /api/simulate called');

    try {
        const { circuit_ir } = await request.json();

        if (!circuit_ir) {
            console.log('No circuit IR provided');
            return NextResponse.json(
                { message: 'No circuit IR provided' },
                { status: 400 }
            );
        }

        // Path to Python script
        const scriptPath = path.join(process.cwd(), '..', 'backend', 'quantum_simulator.py');

        // Create a promise to handle the Python script execution
        const simulationResult = await new Promise((resolve, reject) => {
            const pythonProcess = spawn('python3', [
                scriptPath,
                JSON.stringify(circuit_ir)
            ]);

            let result = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script exited with code ${code}\n${errorOutput}`));
                } else {
                    try {
                        const parsedResult = JSON.parse(result);
                        resolve(parsedResult);
                    } catch (e) {
                        reject(new Error('Failed to parse Python script output as JSON'));
                    }
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });

        console.log('Quantum simulation completed successfully');

        return NextResponse.json({
            message: 'Simulation completed successfully',
            data: {
                densityMatrix: simulationResult.density_matrix,
                plotImage: simulationResult.plot_image
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error during quantum simulation:', error);
        return NextResponse.json(
            { message: 'Error during quantum simulation', error: error.message },
            { status: 500 }
        );
    }
}
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    console.log('API route /api/simulate called');
    let tempFilePath = null;

    try {
        // Verify multipart/form-data request
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('multipart/form-data')) {
            throw new Error('Request must be multipart/form-data');
        }

        const formData = await request.formData();
        const circuitIRData = formData.get('circuit_ir');
        const noiseModelFile = formData.get('noise_model');

        if (!circuitIRData) {
            console.log('No circuit IR provided');
            return NextResponse.json(
                { message: 'No circuit IR provided' },
                { status: 400 }
            );
        }

        const circuit_ir = JSON.parse(circuitIRData);

        // Create temporary file for noise model if provided
        if (noiseModelFile) {
            tempFilePath = path.join(process.cwd(), '..', 'backend', `temp_${uuidv4()}.npy`);
            const arrayBuffer = await noiseModelFile.arrayBuffer();
            fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
        }

        // Path to Python script
        const scriptPath = path.join(process.cwd(), '..', 'backend', 'quantum_simulator.py');

        // Create promise to handle Python script execution
        const simulationResult = await new Promise((resolve, reject) => {
            const pythonArgs = [
                scriptPath,
                JSON.stringify(circuit_ir)
            ];

            if (tempFilePath) {
                pythonArgs.push('--noise-model');
                pythonArgs.push(tempFilePath);
            }

            const pythonProcess = spawn('python3', pythonArgs);

            let result = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                // Clean up temporary file
                if (tempFilePath && fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }

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
                if (tempFilePath && fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });

        return NextResponse.json({
            message: 'Simulation completed successfully',
            data: {
                densityMatrix: simulationResult.density_matrix,
                plotImage: simulationResult.plot_image
            }
        }, { status: 200 });

    } catch (error) {
        // Clean up temporary file in case of errors
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error('Error during quantum simulation:', error);
        return NextResponse.json(
            { message: 'Error during quantum simulation', error: error.message },
            { status: 500 }
        );
    }
}
// app/api/log-stats/route.js
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { style, dragCount } = await request.json();

        // Create data directory if it doesn't exist
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const statsPath = path.join(dataDir, 'stats.txt');
        const logEntry = `${new Date().toISOString()},${style},${dragCount}\n`;

        fs.appendFileSync(statsPath, logEntry);
        console.log(`Logged stats to ${statsPath}`); // Debug log

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging stats:', error);
        return NextResponse.json(
            { error: 'Failed to log stats', details: error.message },
            { status: 500 }
        );
    }
}
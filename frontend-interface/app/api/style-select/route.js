import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Style options and their rewards tracking
const STYLES = {
    DEFAULT: 'default',  // Changed from empty string to 'default'
    BLACK_WHITE: '_bw',
    INVERTED: '_invert'
};

function analyzeStats() {
    try {
        const dataDir = path.join(process.cwd(), 'data');
        const statsPath = path.join(dataDir, 'stats.txt');

        if (!fs.existsSync(statsPath)) {
            return {
                stats: Object.keys(STYLES).reduce((acc, style) => ({
                    ...acc,
                    [STYLES[style]]: { sum: 0, count: 0, average: 0 }
                }), {}),
                totalTrials: 0
            };
        }

        const data = fs.readFileSync(statsPath, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [_, style, dragCount] = line.split(',');
                return { style, dragCount: parseInt(dragCount) };
            });

        const stats = data.reduce((acc, { style, dragCount }) => {
            if (!acc[style]) acc[style] = { sum: 0, count: 0, average: 0 };
            acc[style].sum += dragCount;
            acc[style].count += 1;
            acc[style].average = acc[style].sum / acc[style].count;
            return acc;
        }, {});

        // Initialize any missing styles
        Object.values(STYLES).forEach(style => {
            if (!stats[style]) {
                stats[style] = { sum: 0, count: 0, average: 0 };
            }
        });

        return {
            stats,
            totalTrials: data.length
        };
    } catch (error) {
        console.error('Error analyzing stats:', error);
        return {
            stats: Object.keys(STYLES).reduce((acc, style) => ({
                ...acc,
                [STYLES[style]]: { sum: 0, count: 0, average: 0 }
            }), {}),
            totalTrials: 0
        };
    }
}

function selectStyle() {
    const EPSILON = 0.1;
    const DEFAULT_BIAS = 0.2;
    const { stats, totalTrials } = analyzeStats();

    // First, check if we should use the default style based on DEFAULT_BIAS
    if (Math.random() < DEFAULT_BIAS) {
        return STYLES.DEFAULT;
    }

    // Exploration: random selection with probability EPSILON
    if (Math.random() < EPSILON) {
        const styles = Object.values(STYLES);
        return styles[Math.floor(Math.random() * styles.length)];
    }

    // Exploitation: Modified UCB1 algorithm with bias towards default
    let bestStyle = '';
    let bestUCB = -Infinity;

    Object.values(STYLES).forEach(style => {
        const armStats = stats[style];
        let ucb;

        if (armStats.count === 0) {
            ucb = Infinity; // Always try unused arms
        } else {
            // UCB1 formula with bias for default style
            ucb = armStats.average + Math.sqrt(2 * Math.log(totalTrials) / armStats.count);
            if (style === STYLES.DEFAULT) {
                ucb *= 1.1; // Increase UCB score for default style by 10%
            }
        }

        if (ucb > bestUCB) {
            bestUCB = ucb;
            bestStyle = style;
        }
    });

    return bestStyle;
}

// Export the GET function correctly
export async function GET(request) {
    try {
        const { stats } = analyzeStats();
        const selectedStyle = selectStyle();

        return NextResponse.json({
            selectedStyle,
            stats,
            message: `Selected style: ${selectedStyle}`,
        });
    } catch (error) {
        console.error('Error in style selection:', error);
        return NextResponse.json(
            { error: 'Failed to select style', details: error.message },
            { status: 500 }
        );
    }
}
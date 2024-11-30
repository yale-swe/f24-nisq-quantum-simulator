'use client';

import dynamic from 'next/dynamic';

const DragAndDropGrid = dynamic(() => import('../components/DragAndDropGrid'), { ssr: false });
const NoiseModel = dynamic(() => import('../components/NoiseModel'), { ssr: false });

export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',            // Full viewport height
      justifyContent: 'space-between', // Distribute space between components
      padding: '20px',
      overflow: 'hidden'          // Prevent scrolling
    }}>
      <div style={{ flex: '1 1 auto', overflow: 'auto' }}> {/* Allow DragAndDropGrid to take available space and scroll if needed */}
        <DragAndDropGrid />
      </div>

      <div style={{ flex: '0 0 auto', padding: '20px' }}> {/* Ensure NoiseModel is always visible and increase padding */}
        <NoiseModel />
      </div>
    </div>
  );
}

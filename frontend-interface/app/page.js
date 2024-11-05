'use client';

import dynamic from 'next/dynamic';

const DragAndDropGrid = dynamic(() => import('../components/DragAndDropGrid'), { ssr: false });
const NoiseModel = dynamic(() => import('../components/NoiseModel'), { ssr: false });

export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',       // Horizontal alignment for side-by-side display
      justifyContent: 'center',   // Centers both components horizontally
      alignItems: 'flex-start',   // Aligns them to the top of the container
      gap: '20px',                // Adds spacing between the components
      padding: '20px'             // Adds padding around the container
    }}>
      <div style={{ flex: 1 }}> {/* Optional: controls the width of each component */}
        <DragAndDropGrid />
      </div>

      <div style={{ flex: .2 }}>
        <NoiseModel />
      </div>
    </div>
  );
}

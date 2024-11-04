'use client';

import dynamic from 'next/dynamic';

const DragAndDropGrid = dynamic(
  () => import('../components/DragAndDropGrid'),
  { ssr: false }
);

const NoiseModel = dynamic(
  () => import('../components/NoiseModel'),
  {ssr: false}
)
export default function HomePage() {
  return <DragAndDropGrid />;
  return < NoiseModel />;
}

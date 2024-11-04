'use client';

import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Updated icons list with assigned values
const initialIcons = [
  { id: uuidv4(), content: '/icons/CNOT.svg', type: 'CNOT', value: 1 },
  { id: uuidv4(), content: '/icons/H_Gate.svg', type: 'H_Gate', value: 2 },
  { id: uuidv4(), content: '/icons/X_Gate.svg', type: 'X_Gate', value: 2 },
  { id: uuidv4(), content: '/icons/Y_Gate.svg', type: 'Y_Gate', value: 3 },
  { id: uuidv4(), content: '/icons/Z_Gate.svg', type: 'Z_Gate', value: 4 },
];

const GRID_ROWS = 2;
const GRID_COLUMNS = 10;

export default function DragAndDropGrid() {
  const [icons, setIcons] = useState(initialIcons);
  const [grid, setGrid] = useState(
    Array(GRID_ROWS)
      .fill(null)
      .map(() =>
        Array(GRID_COLUMNS).fill(null).map(() => ({
          gate: null,
          occupiedBy: null,
        }))
      )
  );

  const getRowValues = (rowIndex) => {
    const row = grid[rowIndex];
    return row.map((cell) => {
      if (cell.gate && cell.gate.value !== null) {
        return cell.gate.value;
      }
      return 0;
    });
  };

	const isCNOTConflict = (destRow, destCol, gateType, currentGateId = null) => {
	  // For single-qubit gates, only check for CNOT conflicts
	  if (!gateType.startsWith('CNOT')) {
	    // Only check if there's a CNOT gate in this column
	    for (let row = 0; row < GRID_ROWS; row++) {
	      const cell = grid[row][destCol];
	      if (cell.gate && cell.gate.type.startsWith('CNOT')) {
	        return true;
	      }
	    }
	    return false;
	  }

    // If placing a CNOT gate, check if any cell in the column is occupied
    if (gateType.startsWith('CNOT')) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const cell = grid[row][destCol];
        if (cell.gate && (!currentGateId || cell.occupiedBy !== currentGateId)) {
          return true;
        }
      }
    }

    return false;
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Handle dragging gates out of the circuit
    if (!destination && source.droppableId.startsWith('cell-')) {
        const [sourceRow, sourceCol] = source.droppableId.split('-').slice(1).map(Number);
        const cellData = grid[sourceRow][sourceCol];

        // Handle CNOT gate removal
        if (cellData.gate.type.startsWith('CNOT')) {
            const newGrid = grid.map(row => {
                return row.map((cell, colIndex) => {
                    if (colIndex === sourceCol && cell.occupiedBy === cellData.gate.id) {
                        return { gate: null, occupiedBy: null };
                    }
                    return cell;
                });
            });
            setGrid(newGrid);
        } else {
            // Handle regular gate removal
            const newGrid = [...grid];
            newGrid[sourceRow][sourceCol] = { gate: null, occupiedBy: null };
            setGrid(newGrid);
        }

        // Remove from database
        try {
            await supabase
                .from('icon_positions')
                .delete()
                .eq('id', draggableId);
        } catch (error) {
            console.error('Error deleting data:', error);
        }
        return;
    }

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle moving within grid
    if (
      source.droppableId.startsWith('cell-') &&
      destination.droppableId.startsWith('cell-')
    ) {
      const [sourceRow, sourceCol] = source.droppableId
        .split('-')
        .slice(1)
        .map(Number);
      const [destRow, destCol] = destination.droppableId
        .split('-')
        .slice(1)
        .map(Number);

      const cellData = grid[sourceRow][sourceCol];
      
      // Check for CNOT conflicts
      if (isCNOTConflict(destRow, destCol, cellData.gate.type, cellData.gate.id)) {
        alert('Cannot move gate here due to CNOT gate conflict.');
        return;
      }

      if (cellData.gate.type.startsWith('CNOT')) {
        let newGrid = grid.map((row, rowIndex) => {
          const newRow = [...row];
          if (newRow[sourceCol].occupiedBy === cellData.gate.id) {
            newRow[sourceCol] = { gate: null, occupiedBy: null };
          }
          return newRow;
        });

        newGrid = newGrid.map((row, rowIndex) => {
          const newRow = [...row];
          newRow[destCol] = {
            gate: rowIndex === 0 ? cellData.gate : null,
            occupiedBy: cellData.gate.id,
          };
          return newRow;
        });

        setGrid(newGrid);
      } else {
        // For regular gates, only check the specific destination cell
        if (grid[destRow][destCol].occupiedBy) {
          alert('Destination cell is occupied.');
          return;
        }

        const newGrid = [...grid];
        newGrid[sourceRow][sourceCol] = { gate: null, occupiedBy: null };
        newGrid[destRow][destCol] = {
          gate: cellData.gate,
          occupiedBy: cellData.gate.id,
        };

        setGrid(newGrid);
      }

      try {
        await supabase
          .from('icon_positions')
          .update({ position_x: destCol, position_y: destRow })
          .eq('id', draggableId);
      } catch (error) {
        console.error('Error updating data:', error);
      }

      return;
    }

    // Handle adding new gate from icons to grid
    if (source.droppableId === 'icons' && destination.droppableId.startsWith('cell-')) {
      const originalIcon = icons.find((icon) => icon.id === draggableId);
      const newGate = { ...originalIcon, id: uuidv4() };
      const [destRow, destCol] = destination.droppableId
        .split('-')
        .slice(1)
        .map(Number);

      // Check for CNOT conflicts with new gate
      if (isCNOTConflict(destRow, destCol, newGate.type)) {
        alert('Cannot place gate here due to CNOT gate conflict.');
        return;
      }

      if (newGate.type.startsWith('CNOT')) {
        const newGrid = grid.map((row, rowIndex) => {
          const newRow = [...row];
          newRow[destCol] = {
            gate: rowIndex === 0 ? newGate : null,
            occupiedBy: newGate.id,
          };
          return newRow;
        });
        setGrid(newGrid);
      } else {
        // For regular gates, only check the specific destination cell
        if (grid[destRow][destCol].occupiedBy) {
          alert('Destination cell is occupied.');
          return;
        }

        const newGrid = [...grid];
        newGrid[destRow][destCol] = {
          gate: newGate,
          occupiedBy: newGate.id,
        };
        setGrid(newGrid);
      }

      try {
        await supabase.from('icon_positions').insert([
          {
            id: newGate.id,
            icon_type: newGate.type,
            position_x: destCol,
            position_y: destRow,
          },
        ]);
      } catch (error) {
        console.error('Error inserting data:', error);
      }
      return;
    }
  };


  // Rest of the component remains the same...
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: 'black' }}>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Icons section */}
        <div style={{ padding: '20px' }}>
          <h2 style={{ color: 'black' }}>Available Icons</h2>
          <Droppable
            droppableId="icons"
            direction="horizontal"
            isDropDisabled={false}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ display: 'flex', gap: '10px' }}
              >
                {icons.map((icon, index) => (
                  <Draggable key={icon.id} draggableId={icon.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          cursor: 'pointer',
                          ...provided.draggableProps.style,
                        }}
                      >
                        <Image
                          src={icon.content}
                          width={50}
                          height={50}
                          alt={icon.type}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Grid section */}
        <div style={{ padding: '20px' }}>
          <h2 style={{ color: 'black' }}>Grid</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${GRID_ROWS}, 60px)`,
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, 60px)`,
              position: 'relative',
            }}
          >
            {Array.from({ length: GRID_ROWS }).map((_, rowIndex) =>
              Array.from({ length: GRID_COLUMNS }).map((_, colIndex) => {
                const cellId = `cell-${rowIndex}-${colIndex}`;
                const cellData = grid[rowIndex][colIndex];
                const isCNOT =
                  cellData.gate &&
                  cellData.gate.type.startsWith('CNOT') &&
                  rowIndex === 0;
                return (
                  <Droppable droppableId={cellId} key={cellId}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderBottom:
                            rowIndex < GRID_ROWS - 1 ? '1px solid black' : 'none',
                          borderRight:
                            colIndex < GRID_COLUMNS - 1 ? '1px solid black' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#fff',
                          gridRowStart: rowIndex + 1,
                          gridColumnStart: colIndex + 1,
                          position: 'relative',
                          overflow: 'visible',
                        }}
                      >
                        {cellData.gate ? (
                          isCNOT ? (
                            <Draggable
                              draggableId={cellData.gate.id}
                              index={0}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    cursor: 'pointer',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '60px',
                                    height: '120px',
                                    gridRow: 'span 2',
                                    zIndex: 1,
                                  }}
                                >
                                  <Image
                                    src={cellData.gate.content}
                                    layout="fixed"
                                    width={60}
                                    height={120}
                                    alt={cellData.gate.type}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ) : cellData.gate.type !== 'CNOT' ? (
                            <Draggable
                              draggableId={cellData.gate.id}
                              index={0}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Image
                                    src={cellData.gate.content}
                                    width={50}
                                    height={50}
                                    alt={cellData.gate.type}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ) : null
                        ) : null}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })
            )}
          </div>
        </div>

        {/* Output Values section */}
        <div style={{ padding: '20px', color: 'black' }}>
          <h2 style={{ color: 'black' }}>Row Outputs</h2>
          {grid.map((_, rowIndex) => (
            <div key={rowIndex}>
              <strong>Row {rowIndex + 1} Output:</strong> [{getRowValues(rowIndex).join(', ')}]
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
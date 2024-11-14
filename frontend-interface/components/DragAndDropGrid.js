'use client';

import { useState } from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
} from '@hello-pangea/dnd';
import Image from 'next/image';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import DensityPlot from './DensityPlot';
import LoadingOverlay from './LoadingOverlay';

const initialIcons = [
    { id: 'cnot-control-down', content: '/icons/CNOT.svg', type: 'CNOT', value: 10 },
    { id: 'cnot-control-up', content: '/icons/CNOT_down.svg', type: 'CNOT', value: 10 },
    { id: 'hadamard-gate', content: '/icons/H_Gate.svg', type: 'H_Gate', value: 8 },
    { id: 'pauli-x-gate', content: '/icons/X_Gate.svg', type: 'X_Gate', value: 4 },
    { id: 'pauli-y-gate', content: '/icons/Y_Gate.svg', type: 'Y_Gate', value: 5 },
    { id: 'pauli-z-gate', content: '/icons/Z_Gate.svg', type: 'Z_Gate', value: 3 },
    { id: 'phase-s-gate', content: '/icons/S_Gate.svg', type: 'S_Gate', value: 6 },
    { id: 'phase-t-gate', content: '/icons/T_Gate.svg', type: 'T_Gate', value: 7 },
];

const GRID_COLUMNS = 10;
const MAX_ROWS = 5;

export default function DragAndDropGrid() {
    const [icons, setIcons] = useState(initialIcons);
    const [numRows, setNumRows] = useState(2);
    const [grid, setGrid] = useState(
        Array(numRows)
            .fill(null)
            .map(() =>
                Array(GRID_COLUMNS).fill(null).map(() => ({
                    gate: null,
                    occupiedBy: null,
                }))
            )
    );
    const [simulationResults, setSimulationResults] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const addWire = () => {
        if (numRows < MAX_ROWS) {
            setNumRows(prev => prev + 1);
            setGrid(prev => [
                ...prev,
                Array(GRID_COLUMNS).fill(null).map(() => ({
                    gate: null,
                    occupiedBy: null,
                }))
            ]);
        }
    };

    const removeWire = (wireIndex) => {
        if (numRows > 1) {
            const newGrid = grid.filter((_, idx) => idx !== wireIndex);

            const finalGrid = newGrid.map(row =>
                row.map(cell => {
                    if (cell.gate?.type === 'CNOT') {
                        const [control, target] = cell.gate.wireIndices || [0, 1];
                        if (control === wireIndex || target === wireIndex) {
                            return { gate: null, occupiedBy: null };
                        }
                        const newControl = control > wireIndex ? control - 1 : control;
                        const newTarget = target > wireIndex ? target - 1 : target;
                        return {
                            ...cell,
                            gate: {
                                ...cell.gate,
                                wireIndices: [newControl, newTarget]
                            }
                        };
                    }
                    return cell;
                })
            );

            setNumRows(prev => prev - 1);
            setGrid(finalGrid);
        }
    };

    const isCNOTConflict = (destRow, destCol, gateType, currentGateId = null) => {
        if (!gateType.startsWith('CNOT')) {
            const cell = grid[destRow][destCol];
            return cell.occupiedBy && grid.some(row =>
                row[destCol]?.gate?.type === 'CNOT' &&
                (row[destCol]?.gate?.wireIndices?.[0] === destRow ||
                    row[destCol]?.gate?.wireIndices?.[1] === destRow)
            );
        }

        const targetRow = (destRow + 1) % numRows;
        return grid[destRow][destCol].gate !== null || grid[targetRow][destCol].gate !== null;
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) {
            if (source.droppableId.startsWith('cell-')) {
                const [sourceRow, sourceCol] = source.droppableId.split('-').slice(1).map(Number);
                const cellData = grid[sourceRow][sourceCol];

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
                    const newGrid = [...grid];
                    newGrid[sourceRow][sourceCol] = { gate: null, occupiedBy: null };
                    setGrid(newGrid);
                }
            }
            return;
        }

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (source.droppableId.startsWith('cell-') && destination.droppableId.startsWith('cell-')) {
            const [sourceRow, sourceCol] = source.droppableId.split('-').slice(1).map(Number);
            const [destRow, destCol] = destination.droppableId.split('-').slice(1).map(Number);

            const cellData = grid[sourceRow][sourceCol];

            if (isCNOTConflict(destRow, destCol, cellData.gate.type, cellData.gate.id)) {
                alert('Cannot move gate here due to CNOT gate conflict.');
                return;
            }

            if (cellData.gate.type.startsWith('CNOT')) {
                const targetRow = (destRow + 1) % numRows;
                let newGrid = grid.map((row, rowIndex) => {
                    const newRow = [...row];
                    if (newRow[sourceCol].occupiedBy === cellData.gate.id) {
                        newRow[sourceCol] = { gate: null, occupiedBy: null };
                    }
                    return newRow;
                });

                newGrid = newGrid.map((row, rowIndex) => {
                    const newRow = [...row];
                    if (rowIndex === destRow) {
                        newRow[destCol] = {
                            gate: {
                                ...cellData.gate,
                                wireIndices: [destRow, targetRow]
                            },
                            occupiedBy: cellData.gate.id,
                        };
                    } else if (rowIndex === targetRow) {
                        newRow[destCol] = {
                            gate: null,
                            occupiedBy: cellData.gate.id,
                        };
                    }
                    return newRow;
                });

                setGrid(newGrid);
            } else {
                const newGrid = [...grid];
                newGrid[sourceRow][sourceCol] = { gate: null, occupiedBy: null };
                newGrid[destRow][destCol] = {
                    gate: cellData.gate,
                    occupiedBy: cellData.gate.id,
                };

                setGrid(newGrid);
            }
            return;
        }

        if (source.droppableId === 'icons' && destination.droppableId.startsWith('cell-')) {
            const originalIcon = icons.find((icon) => icon.id === draggableId);
            const newGate = { ...originalIcon, id: uuidv4() };
            const [destRow, destCol] = destination.droppableId.split('-').slice(1).map(Number);

            if (isCNOTConflict(destRow, destCol, newGate.type)) {
                alert('Cannot place gate here due to CNOT gate conflict.');
                return;
            }

            if (newGate.type.startsWith('CNOT')) {
                const targetRow = (destRow + 1) % numRows;
                const newGrid = grid.map((row, rowIndex) => {
                    const newRow = [...row];
                    if (rowIndex === destRow) {
                        newRow[destCol] = {
                            gate: {
                                ...newGate,
                                wireIndices: [destRow, targetRow]
                            },
                            occupiedBy: newGate.id,
                        };
                    } else if (rowIndex === targetRow) {
                        newRow[destCol] = {
                            gate: null,
                            occupiedBy: newGate.id,
                        };
                    }
                    return newRow;
                });
                setGrid(newGrid);
            } else {
                const newGrid = [...grid];
                newGrid[destRow][destCol] = {
                    gate: newGate,
                    occupiedBy: newGate.id,
                };
                setGrid(newGrid);
            }
        }
    };

    const convertGridToIR = () => {
        const ir = [];
        let currentLayer = [];

        for (let col = 0; col < GRID_COLUMNS; col++) {
            currentLayer = [];
            for (let row = 0; row < numRows; row++) {
                const cell = grid[row][col];
                if (cell.gate) {
                    if (cell.gate.type === 'CNOT' && cell.gate.wireIndices?.[0] === row) {
                        currentLayer.push(['CX', ...cell.gate.wireIndices]);
                    } else if (!cell.gate.type.startsWith('CNOT')) {
                        currentLayer.push([cell.gate.type.replace('_Gate', ''), row]);
                    }
                }
            }
            if (currentLayer.length > 0) {
                ir.push(currentLayer);
            }
        }
        return ir;
    };

    const handleSimulate = async () => {
        setIsSimulating(true);
        try {
            const ir = convertGridToIR();
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ circuit_ir: ir }),
            });
            const result = await response.json();
            if (result.data && result.data.plotImage) {
                setSimulationResults(result.data);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error generating circuit: ' + error.message);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: 'black' }}>
            {/* Title */}
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                borderBottom: '2px solid #eaeaea',
                background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    margin: 0,
                    letterSpacing: '0.5px'
                }}>
                    NISQ Quantum Simulator
                </h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#6c757d',
                    marginTop: '15px',
                    lineHeight: '1.6'
                }}>
                    Design and simulate quantum circuits <br />
                    in a noisy intermediate-scale quantum environment.
                </p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                {/* Icons section */}
                <div style={{ padding: '20px' }}>
                    <h2 style={{ color: 'black' }}>Available Gates</h2>
                    <Droppable droppableId="icons" direction="horizontal">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}
                                style={{ display: 'flex', gap: '10px' }}>
                                {icons.map((icon, index) => (
                                    <Draggable key={icon.id} draggableId={icon.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{ cursor: 'pointer', ...provided.draggableProps.style }}>
                                                <Image src={icon.content} width={50} height={50} alt={icon.type} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* Wire Controls */}
                <div style={{ padding: '20px' }}>
                    <button
                        onClick={addWire}
                        disabled={numRows >= MAX_ROWS}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: numRows >= MAX_ROWS ? '#cccccc' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: numRows >= MAX_ROWS ? 'not-allowed' : 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Add Wire
                    </button>
                </div>

                {/* Circuit section */}
                <div style={{ padding: '20px' }}>
                    <h2 style={{ color: 'black' }}>Quantum Circuit</h2>
                    <div style={{
                        position: 'relative',
                        width: `${GRID_COLUMNS * 60}px`,
                        height: `${numRows * 60}px`,
                        marginLeft: '40px'
                    }}>
                        {/* Horizontal wires with remove buttons */}
                        {Array.from({ length: numRows }).map((_, rowIndex) => (
                            <div key={`wire-container-${rowIndex}`} style={{ position: 'relative' }}>
                                {/* Remove wire button */}
                                {numRows > 1 && (
                                    <button
                                        onClick={() => removeWire(rowIndex)}
                                        style={{
                                            position: 'absolute',
                                            left: '-30px',
                                            top: `${30 + rowIndex * 60}px`,
                                            transform: 'translateY(-12px)',
                                            width: '24px',
                                            height: '24px',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'none',
                                            borderRadius: '50%',
                                            backgroundColor: '#ff4444',
                                            cursor: 'pointer',
                                            zIndex: 2,
                                            color: 'white',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            lineHeight: 1
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                                {/* Wire line */}
                                <div
                                    key={`wire-${rowIndex}`}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: `${30 + rowIndex * 60}px`,
                                        width: '100%',
                                        height: '2px',
                                        backgroundColor: 'black',
                                        zIndex: 0
                                    }}
                                />
                            </div>
                        ))}

                        {/* Grid for gate placement */}
                        <div style={{
                            display: 'grid',
                            gridTemplateRows: `repeat(${numRows}, 60px)`,
                            gridTemplateColumns: `repeat(${GRID_COLUMNS}, 60px)`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            gap: 0
                        }}>
                            {Array.from({ length: numRows }).map((_, rowIndex) =>
                                Array.from({ length: GRID_COLUMNS }).map((_, colIndex) => {
                                    const cellId = `cell-${rowIndex}-${colIndex}`;
                                    const cellData = grid[rowIndex][colIndex];
                                    const isCNOTControl = cellData?.gate?.type === 'CNOT' &&
                                        cellData?.gate?.wireIndices?.[0] === rowIndex;
                                    const isCNOTTarget = cellData?.occupiedBy &&
                                        grid.some(row => row[colIndex]?.gate?.type === 'CNOT' &&
                                            row[colIndex]?.gate?.wireIndices?.[1] === rowIndex);

                                    return (
                                        <Droppable key={cellId} droppableId={cellId}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: 'transparent',
                                                        position: 'relative',
                                                        overflow: 'visible',
                                                    }}
                                                >
                                                    {cellData?.gate && (isCNOTControl ? (
                                                        <Draggable draggableId={cellData.gate.id} index={0}>
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
                                                                        height: `${Math.abs(cellData.gate.wireIndices[1] - cellData.gate.wireIndices[0]) * 60 + 60}px`,
                                                                        zIndex: 1,
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={cellData.gate.content}
                                                                        layout="fixed"
                                                                        width={60}
                                                                        height={Math.abs(cellData.gate.wireIndices[1] - cellData.gate.wireIndices[0]) * 60 + 60}
                                                                        alt={cellData.gate.type}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ) : !isCNOTTarget && cellData.gate.type !== 'CNOT' && (
                                                        <Draggable draggableId={cellData.gate.id} index={0}>
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
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Simulation Button */}
                <div style={{ padding: '20px' }}>
                    <button
                        onClick={handleSimulate}
                        style={{
                            padding: '10px 20px',
                            margin: '20px 0',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Generate Results
                    </button>
                </div>
                <DensityPlot plotImageData={simulationResults?.plotImage} />
                <LoadingOverlay isLoading={isSimulating} />
            </DragDropContext>
        </div>
    );
}
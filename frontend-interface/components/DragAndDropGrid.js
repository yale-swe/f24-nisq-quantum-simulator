'use client';

import { useState, useEffect } from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
} from '@hello-pangea/dnd';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

import DensityPlot from './DensityPlot';
import LoadingOverlay from './LoadingOverlay';

// Define the different style variants
const STYLE_VARIANTS = {
    DEFAULT: 'default',
    BLACK_WHITE: '_bw',
    INVERTED: '_invert'
};

const createInitialIcons = (styleVariant) => [
    { id: 'hadamard-gate', content: `/icons/H_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'H_Gate', value: 8 },
    { id: 'pauli-x-gate', content: `/icons/X_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'X_Gate', value: 4 },
    { id: 'pauli-y-gate', content: `/icons/Y_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Y_Gate', value: 5 },
    { id: 'pauli-z-gate', content: `/icons/Z_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Z_Gate', value: 3 },
    { id: 'phase-s-gate', content: `/icons/S_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'S_Gate', value: 6 },
    { id: 'phase-t-gate', content: `/icons/T_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'T_Gate', value: 7 },
    // CNOT gates don't use style variants
    { id: 'cnot-down', content: '/icons/CNOT.svg', type: 'CNOT', value: 10, controlUp: true },
    { id: 'cnot-up', content: '/icons/CNOT_down.svg', type: 'CNOT', value: 9, controlUp: false },
    { id: 'pauli-x-gate-err', content: `/icons/X_Err${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'X_Err', value: 11 },
    { id: 'pauli-y-gate-err', content: `/icons/Y_Err${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Y_Err', value: 12 },
    { id: 'pauli-z-gate-err', content: `/icons/Z_Err${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Z_Err', value: 13 },
];

const INITIAL_COLUMNS = 10;
const MAX_ROWS = 8;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 20;

export default function DragAndDropGrid() {
    const [selectedStyle, setSelectedStyle] = useState('');
    const [icons, setIcons] = useState([]);
    const [numRows, setNumRows] = useState(2);
    const [errorWarning, setErrorWarning] = useState("");
    const [numColumns, setNumColumns] = useState(INITIAL_COLUMNS);
    const [dragAttempts, setDragAttempts] = useState(0);
    const [grid, setGrid] = useState(
        Array(numRows)
            .fill(null)
            .map(() =>
                Array(numColumns).fill(null).map(() => ({
                    gate: null,
                    occupiedBy: null,
                }))
            )
    );
    const [layerTypes, setLayerTypes] = useState(Array(INITIAL_COLUMNS).fill('empty'));
    const [simulationResults, setSimulationResults] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    // Get MAB-selected style on component mount
    useEffect(() => {
        const fetchStyle = async () => {
            try {
                const response = await fetch('/api/style-select');
                const data = await response.json();
                const style = data.selectedStyle === '' ? 'default' : data.selectedStyle;
                setSelectedStyle(style);
                // When creating icons, convert 'default' back to empty string for the file paths
                setIcons(createInitialIcons(style === 'default' ? '' : style));
            } catch (error) {
                console.error('Failed to get style:', error);
                // Fallback to default style
                setSelectedStyle('default');
                setIcons(createInitialIcons(''));
            }
        };
        fetchStyle();
    }, []);

    // // Get random style on component mount
    // const selectedStyle = useMemo(() => {
    //     const styles = ['', '_bw', '_invert'];
    //     return styles[Math.floor(Math.random() * styles.length)];
    // }, []);

    // Log stats when user leaves/closes page


    const showTemporaryWarning = (message) => {
        setErrorWarning(message);
        setTimeout(() => setErrorWarning(""), 3000);
    };

    const determineLayerType = (column) => {
        let hasErrorGate = false;
        let hasNormalGate = false;

        for (let row = 0; row < numRows; row++) {
            const cell = grid[row][column];
            if (cell.gate) {
                if (cell.gate.type.endsWith('_Err')) {
                    hasErrorGate = true;
                } else {
                    hasNormalGate = true;
                }
            }
        }

        if (hasErrorGate && hasNormalGate) return 'mixed';
        if (hasErrorGate) return 'error';
        if (hasNormalGate) return 'normal';
        return 'empty';
    };

    const checkLayerCompatibility = (destCol, gateType) => {
        const currentLayerType = determineLayerType(destCol);
        const isErrorGate = gateType.endsWith('_Err');

        if (currentLayerType === 'empty') return true;
        if (currentLayerType === 'error' && isErrorGate) return true;
        if (currentLayerType === 'normal' && !isErrorGate) return true;

        showTemporaryWarning('Cannot mix error and non-error gates in the same layer.');
        return false;
    };

    const getCNOTImage = (control, target) => {
        return control < target ? '/icons/CNOT.svg' : '/icons/CNOT_down.svg';
    };

    const addLayer = () => {
        if (numColumns < MAX_COLUMNS) {
            setNumColumns(prev => prev + 1);
            setLayerTypes(prev => [...prev, 'empty']);
            setGrid(prev => prev.map(row => [
                ...row,
                {
                    gate: null,
                    occupiedBy: null,
                }
            ]));
        }
    };

    const checkLastColumnForGates = () => {
        return grid.some(row => row[numColumns - 1].gate !== null);
    };

    const removeLayer = () => {
        if (numColumns > MIN_COLUMNS) {
            if (checkLastColumnForGates()) {
                setShowWarning(true);
                setTimeout(() => setShowWarning(false), 3000);
                return;
            }
            setNumColumns(prev => prev - 1);
            setLayerTypes(prev => prev.slice(0, -1));
            setGrid(prev => prev.map(row => row.slice(0, -1)));
        }
    };

    const addWire = () => {
        if (numRows < MAX_ROWS) {
            setNumRows(prev => prev + 1);
            setGrid(prev => [
                ...prev,
                Array(numColumns).fill(null).map(() => ({
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
            const newLayerTypes = layerTypes.map((_, colIndex) => determineLayerType(colIndex));
            setLayerTypes(newLayerTypes);
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

            if (!checkLayerCompatibility(destCol, cellData.gate.type)) {
                return;
            }

            if (isCNOTConflict(destRow, destCol, cellData.gate.type, cellData.gate.id)) {
                showTemporaryWarning('A CNOT gate occupies this wire. Remove it to place a gate.');
                return;
            }

            // Replace the isCNOTConflict validation check:
            if (cellData.gate.type === 'CNOT') {
                const isControlUp = cellData.gate.controlUp;
                const targetRow = isControlUp ?
                    (destRow + 1) % numRows :
                    destRow - 1;  // Simply target the wire above

                if ((isControlUp && targetRow <= destRow) ||
                    (!isControlUp && targetRow >= destRow)) {
                    showTemporaryWarning('Invalid CNOT placement. Check control/target wire positions.');
                    return;
                }
                // ... rest of the code


                const newGrid = grid.map(row => {
                    return row.map((cell, colIndex) => {
                        if (colIndex === sourceCol && cell.occupiedBy === cellData.gate.id) {
                            return { gate: null, occupiedBy: null };
                        }
                        return cell;
                    });
                });

                newGrid[destRow][destCol] = {
                    gate: {
                        ...cellData.gate,
                        wireIndices: [destRow, targetRow]
                    },
                    occupiedBy: cellData.gate.id,
                };
                newGrid[targetRow][destCol] = {
                    gate: null,
                    occupiedBy: cellData.gate.id,
                };

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

            const newLayerTypes = [...layerTypes];
            newLayerTypes[sourceCol] = determineLayerType(sourceCol);
            newLayerTypes[destCol] = determineLayerType(destCol);
            setLayerTypes(newLayerTypes);
            return;
        }

        if (source.droppableId === 'icons' && destination.droppableId.startsWith('cell-')) {
            if (source.droppableId === 'icons') {
                setDragAttempts(prev => prev + 1);
                try {
                    await fetch('/api/log-stats', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            style: selectedStyle,
                            dragCount: dragAttempts + 1  // +1 because state hasn't updated yet
                        })
                    });
                } catch (error) {
                    console.error('Failed to log stats:', error);
                }
            }

            const originalIcon = icons.find((icon) => icon.id === draggableId);
            const [destRow, destCol] = destination.droppableId.split('-').slice(1).map(Number);

            if (!checkLayerCompatibility(destCol, originalIcon.type)) {
                return;
            }

            const newGate = { ...originalIcon, id: uuidv4() };

            if (newGate.type === 'CNOT') {
                const isControlUp = newGate.controlUp;
                const targetRow = isControlUp ?
                    (destRow + 1) % numRows :
                    (destRow - 1);

                if ((isControlUp && targetRow <= destRow) ||
                    (!isControlUp && targetRow >= destRow) ||
                    targetRow < 0 ||
                    targetRow >= numRows) {
                    showTemporaryWarning('Invalid CNOT placement. Check control/target wire positions.');
                    return;
                }

                const newGrid = [...grid];
                newGrid[destRow][destCol] = {
                    gate: {
                        ...newGate,
                        wireIndices: [destRow, targetRow]
                    },
                    occupiedBy: newGate.id,
                };
                newGrid[targetRow][destCol] = {
                    gate: null,
                    occupiedBy: newGate.id,
                };
                setGrid(newGrid);
            } else {
                const newGrid = [...grid];
                newGrid[destRow][destCol] = {
                    gate: {
                        ...newGate,
                        content: `/icons/${newGate.type}${selectedStyle === 'default' ? '' : selectedStyle}.svg`
                    },
                    occupiedBy: newGate.id,
                };
                setGrid(newGrid);
            }

            const newLayerTypes = [...layerTypes];
            newLayerTypes[destCol] = determineLayerType(destCol);
            setLayerTypes(newLayerTypes);
            return;
        }
    };
    const convertGridToIR = () => {
        const ir = [];
        let currentLayer = [];

        for (let col = 0; col < numColumns; col++) {
            currentLayer = [];
            const layerType = determineLayerType(col);

            for (let row = 0; row < numRows; row++) {
                const cell = grid[row][col];
                if (cell.gate) {
                    if (cell.gate.type === 'CNOT' && cell.gate.wireIndices?.[0] === row) {
                        const [control, target] = cell.gate.wireIndices;
                        currentLayer.push(['CX', control, target]);
                    } else if (!cell.gate.type.startsWith('CNOT')) {
                        const gateType = cell.gate.type.replace('_Gate', '').replace('_Err', '');
                        currentLayer.push([gateType, row]);
                    }
                }
            }

            ir.push({
                gates: currentLayer,
                type: layerType,
                numRows: numRows
            });
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

    const resetCircuit = () => {
        setGrid(Array(numRows)
            .fill(null)
            .map(() =>
                Array(numColumns).fill(null).map(() => ({
                    gate: null,
                    occupiedBy: null,
                }))
            )
        );
        setLayerTypes(Array(numColumns).fill('empty'));
        setSimulationResults(null);
    };

    const handlePropagateErrors = async () => {
        try {
            const ir = convertGridToIR();
            const response = await fetch('/api/propagate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ circuit_ir: ir }),
            });
            const result = await response.json();
            if (result.data) {
                const newGrid = Array(numRows)
                    .fill(null)
                    .map(() =>
                        Array(numColumns).fill(null).map(() => ({
                            gate: null,
                            occupiedBy: null,
                        }))
                    );

                // Store original CNOT positions
                const originalCNOTs = {};
                grid.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        if (cell.gate?.type === 'CNOT' && cell.gate.wireIndices) {
                            originalCNOTs[colIndex] = {
                                control: cell.gate.wireIndices[0],
                                target: cell.gate.wireIndices[1]
                            };
                        }
                    });
                });

                result.data.forEach((layer, colIndex) => {
                    layer.gates.forEach(gate => {
                        if (gate[0] === 'CX') {
                            const [_, control, target] = gate;
                            const gateId = uuidv4();

                            newGrid[control][colIndex] = {
                                gate: {
                                    type: 'CNOT',
                                    content: getCNOTImage(control, target),
                                    id: gateId,
                                    wireIndices: [control, target]
                                },
                                occupiedBy: gateId
                            };
                            newGrid[target][colIndex] = {
                                gate: null,
                                occupiedBy: gateId
                            };
                        } else {
                            const [gateType, row] = gate;
                            const gateId = uuidv4();
                            newGrid[row][colIndex] = {
                                gate: {
                                    type: `${gateType}_${layer.type === 'error' ? 'Err' : 'Gate'}`,
                                    content: `/icons/${gateType}${layer.type === 'error' ? '_Err' : '_Gate'}${selectedStyle === 'default' ? '' : selectedStyle}.svg`,
                                    id: gateId
                                },
                                occupiedBy: gateId
                            };
                        }
                    });
                });

                setGrid(newGrid);

                // Update layer types
                const newLayerTypes = result.data.map(layer => layer.type);
                setLayerTypes(newLayerTypes);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error propagating errors: ' + error.message);
        }
    };

    const updateGridFromPropagatedIR = (propagatedIR) => {
        const newGrid = [...grid];

        propagatedIR.forEach((layer, colIndex) => {
            layer.gates.forEach(gate => {
                if (gate[0] === 'CX') {
                    const [_, control, target] = gate;
                    const gateId = uuidv4();

                    newGrid[control][colIndex] = {
                        gate: {
                            type: 'CNOT',
                            content: getCNOTImage(control, target),
                            id: gateId,
                            wireIndices: [control, target]
                        },
                        occupiedBy: gateId
                    };
                    newGrid[target][colIndex] = {
                        gate: null,
                        occupiedBy: gateId
                    };
                } else {
                    const [gateType, row] = gate;
                    newGrid[row][colIndex] = {
                        gate: {
                            type: `${gateType}_${layer.type === 'error' ? 'Err' : 'Gate'}`,
                            content: `/icons/${gateType}${layer.type === 'error' ? '_Err' : '_Gate'}${selectedStyle === 'default' ? '' : selectedStyle}.svg`,
                            id: uuidv4()
                        },
                        occupiedBy: uuidv4()
                    };
                }
            });
        });

        setGrid(newGrid);
    };
    // The rest of your component remains largely the same, 
    // just update the image paths to use styleVariant where appropriate

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: 'black' }} >
            {/* Title */}
            < div style={{
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
            </div >

            <DragDropContext onDragEnd={onDragEnd}>
                {/* Icons section */}
                <div style={{ padding: '20px' }}>
                    <h2 style={{ color: 'black' }}>Available Gates</h2>
                    <Droppable droppableId="icons" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    marginBottom: '20px'
                                }}
                            >
                                {icons.map((icon, index) => (
                                    <Draggable
                                        key={icon.id}
                                        draggableId={icon.id}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{
                                                    cursor: 'grab',
                                                    ...provided.draggableProps.style
                                                }}
                                            >
                                                <Image
                                                    src={icon.content}
                                                    width={50}
                                                    height={50}
                                                    alt={icon.type}
                                                    draggable={false}
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
                    <button
                        onClick={resetCircuit}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reset Circuit
                    </button>
                </div>

                {/* Circuit section */}
                <div style={{ padding: '20px' }}>
                    <h2 style={{ color: 'black' }}>Quantum Circuit</h2>
                    <div style={{
                        position: 'relative',
                        width: `${numColumns * 60}px`,
                        height: `${numRows * 60}px`,
                        marginLeft: '40px'
                    }}>
                        {/* Layer Type Indicators */}
                        <div style={{
                            position: 'absolute',
                            top: '-25px',
                            left: 0,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${numColumns}, 60px)`,
                            width: '100%'
                        }}>
                            {Array.from({ length: numColumns }).map((_, colIndex) => (
                                <div
                                    key={`layer-indicator-${colIndex}`}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: layerTypes[colIndex] === 'error' ? '#ff4444' :
                                            layerTypes[colIndex] === 'normal' ? '#ffd700' :
                                                '#4CAF50'
                                    }}
                                >
                                    {layerTypes[colIndex] === 'error' ? 'Error' :
                                        layerTypes[colIndex] === 'normal' ? 'Gate' :
                                            'Empty'}
                                </div>
                            ))}
                        </div>

                        {/* Layer Separators */}
                        {Array.from({ length: numColumns - 1 }).map((_, index) => (
                            <div
                                key={`separator-${index}`}
                                style={{
                                    position: 'absolute',
                                    left: `${60 * (index + 1)}px`,
                                    top: 0,
                                    width: 0,
                                    height: '100%',
                                    borderLeft: '2px dashed #cccccc',
                                    zIndex: 0
                                }}
                            />
                        ))}

                        {/* Layer Controls */}
                        <div style={{
                            position: 'absolute',
                            right: '-80px',
                            top: '10px',
                            display: 'flex',
                            gap: '10px',
                            zIndex: 3
                        }}>
                            <button
                                onClick={removeLayer}
                                disabled={numColumns <= MIN_COLUMNS}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: numColumns <= MIN_COLUMNS ? '#cccccc' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: numColumns <= MIN_COLUMNS ? 'not-allowed' : 'pointer'
                                }}
                            >
                                ←
                            </button>
                            <button
                                onClick={addLayer}
                                disabled={numColumns >= MAX_COLUMNS}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: numColumns >= MAX_COLUMNS ? '#cccccc' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: numColumns >= MAX_COLUMNS ? 'not-allowed' : 'pointer'
                                }}
                            >
                                →
                            </button>
                        </div>

                        {/* Warning Messages */}
                        {(showWarning || errorWarning) && (
                            <div style={{
                                position: 'absolute',
                                right: '-250px',
                                top: '50px',
                                backgroundColor: '#ffeb3b',
                                padding: '10px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: 3,
                                maxWidth: '200px'
                            }}>
                                {showWarning ? 'Cannot remove layer containing gates' : errorWarning}
                            </div>
                        )}

                        {/* Horizontal wires with remove buttons */}
                        {Array.from({ length: numRows }).map((_, rowIndex) => (
                            <div key={`wire-container-${rowIndex}`} style={{ position: 'relative' }}>
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
                                <div
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
                            gridTemplateColumns: `repeat(${numColumns}, 60px)`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            gap: 0
                        }}>
                            {Array.from({ length: numRows }).map((_, rowIndex) =>
                                Array.from({ length: numColumns }).map((_, colIndex) => {
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
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        cursor: 'grab',
                                                                        position: snapshot.isDragging ? 'relative' : 'absolute',
                                                                        top: snapshot.isDragging ? 0 : '0',
                                                                        left: snapshot.isDragging ? 0 : '0',
                                                                        width: '70px',
                                                                        height: `${Math.abs(cellData.gate.wireIndices[1] - cellData.gate.wireIndices[0]) * 62 + 60}px`,
                                                                        zIndex: snapshot.isDragging ? 9999 : 1,
                                                                        transformOrigin: 'center center',
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={getCNOTImage(
                                                                            cellData.gate.wireIndices[0],
                                                                            cellData.gate.wireIndices[1]
                                                                        )}
                                                                        layout="fixed"
                                                                        width={70}
                                                                        height={Math.abs(cellData.gate.wireIndices[1] - cellData.gate.wireIndices[0]) * 62 + 60}
                                                                        alt="CNOT gate"
                                                                        draggable={false}
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
                                                                        cursor: 'grab',
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={cellData.gate.content}
                                                                        width={50}
                                                                        height={50}
                                                                        alt={cellData.gate.type}
                                                                        draggable={false}
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

                {/* Action Buttons */}
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={handleSimulate}
                        style={{
                            padding: '10px 20px',
                            margin: '20px 10px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Generate Results
                    </button>
                    <button
                        onClick={handlePropagateErrors}
                        style={{
                            padding: '10px 20px',
                            margin: '20px 10px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Propagate Errors
                    </button>
                </div>

                {/* Results Display */}
                <DensityPlot plotImageData={simulationResults?.plotImage} />
                <LoadingOverlay isLoading={isSimulating} />
            </DragDropContext>
        </div >
    );
}
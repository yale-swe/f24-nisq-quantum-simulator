'use client'; // Next.js directive to render this component on the client side.

import { useState, useEffect } from 'react'; // React hooks for state management and lifecycle effects.
import {
    DragDropContext, // Context for drag-and-drop operations.
    Droppable,       // Container where draggable items can be dropped.
    Draggable        // Item that can be dragged.
} from '@hello-pangea/dnd';
import Image from 'next/image'; // Optimized image component from Next.js.
import { v4 as uuidv4 } from 'uuid'; // Library to generate unique IDs for gates.

import DensityPlot from './DensityPlot'; // Component for displaying simulation results.
import LoadingOverlay from './LoadingOverlay'; // Overlay component to indicate loading state.

// Define possible style variants for gates.
export const STYLE_VARIANTS = {
    DEFAULT: 'default',
    BLACK_WHITE: '_bw',
    INVERTED: '_invert'
};

// Function to create the initial set of quantum gate icons based on style.
export const createInitialIcons = (styleVariant) => [
    // Standard quantum gates with optional style suffix.
    { id: 'hadamard-gate', content: `/icons/H_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'H_Gate', value: 8 },
    { id: 'pauli-x-gate', content: `/icons/X_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'X_Gate', value: 4 },
    { id: 'pauli-y-gate', content: `/icons/Y_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Y_Gate', value: 5 },
    { id: 'pauli-z-gate', content: `/icons/Z_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Z_Gate', value: 3 },
    { id: 'phase-s-gate', content: `/icons/S_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'S_Gate', value: 6 },
    { id: 'phase-t-gate', content: `/icons/T_Gate${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'T_Gate', value: 7 },
    // CNOT gates don't vary by style.
    { id: 'cnot-down', content: '/icons/CNOT.svg', type: 'CNOT', value: 10, controlUp: true },
    { id: 'cnot-up', content: '/icons/CNOT_down.svg', type: 'CNOT', value: 9, controlUp: false },
    // Error gates with optional style suffix.
    { id: 'pauli-x-gate-err', content: `/icons/X_Err${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'X_Err', value: 11 },
    { id: 'pauli-y-gate-err', content: `/icons/Y_Err${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Y_Err', value: 12 },
    { id: 'pauli-z-gate-err', content: `/icons/Z_Err${styleVariant === 'default' ? '' : styleVariant}.svg`, type: 'Z_Err', value: 13 },
];

// Define constraints for the grid dimensions.
export const INITIAL_COLUMNS = 10;
export const MAX_ROWS = 8;
export const MIN_COLUMNS = 1;
export const MAX_COLUMNS = 20;

export default function DragAndDropGrid() {
    // State for managing grid style, gate icons, dimensions, and warnings.
    const [selectedStyle, setSelectedStyle] = useState(''); // Active style variant.
    const [icons, setIcons] = useState([]); // Available gate icons.
    const [numRows, setNumRows] = useState(2); // Number of wires (rows) in the grid.
    const [errorWarning, setErrorWarning] = useState(""); // Warning messages.
    const [numColumns, setNumColumns] = useState(INITIAL_COLUMNS); // Number of columns (layers).
    const [dragAttempts, setDragAttempts] = useState(0); // Drag operation count for analytics.
    const [grid, setGrid] = useState(
        // Initialize the grid with empty cells.
        Array(numRows)
            .fill(null)
            .map(() =>
                Array(numColumns).fill(null).map(() => ({
                    gate: null,        // The gate placed in the cell.
                    occupiedBy: null, // ID of the gate occupying the cell.
                }))
            )
    );
    const [layerTypes, setLayerTypes] = useState(Array(INITIAL_COLUMNS).fill('empty')); // Layer types for visualization.
    const [simulationResults, setSimulationResults] = useState(null); // Simulation results.
    const [isSimulating, setIsSimulating] = useState(false); // Simulating state.
    const [showWarning, setShowWarning] = useState(false); // Warning for invalid operations.
    const [status, setStatus] = useState(null);
    const [fileContent, setFileContent] = useState(null);

    // Fetch style selection on initial render and set gate icons accordingly.
    useEffect(() => {
        const fetchStyle = async () => {
            try {
                const response = await fetch('/api/style-select');
                if (!response.ok) {
                    throw new Error('Style API response was not ok');
                }
                const data = await response.json();
                const style = data.selectedStyle === '' ? 'default' : data.selectedStyle;
                setSelectedStyle(style);
                setIcons(createInitialIcons(style === 'default' ? '' : style));
            } catch (error) {
                console.error('Failed to get style:', error);
                // Fall back to default style
                setSelectedStyle('default');
                setIcons(createInitialIcons(''));
            }
        };
        fetchStyle();
    }, []);

    const showError = (message) => {
        setErrorWarning({ message, type: 'error' });
        setTimeout(() => setErrorWarning(null), 3000);
    };

    const showTemporaryWarning = (message) => {
        setErrorWarning({ message, type: 'warning' });
        setTimeout(() => setErrorWarning(null), 3000);
    };

    const showTemporaryMsg = (message) => {
        setErrorWarning({ message, type: 'success' });
        setTimeout(() => setErrorWarning(null), 3000);
    };

    // Logic to determine the type of a layer based on the gates placed.
    const determineLayerType = (column) => {
        let hasErrorGate = false; // Track presence of error gates.
        let hasNormalGate = false; // Track presence of standard gates.
        let hasAnyGate = false; // Track presence of any gates.

        for (let row = 0; row < numRows; row++) {
            const cell = grid[row][column];
            // Check for gates or CNOT occupancy.
            if (cell.gate || (cell.occupiedBy && grid.some(r => r[column]?.gate?.id === cell.occupiedBy))) {
                hasAnyGate = true;
                if (cell.gate?.type?.endsWith('_Err')) {
                    hasErrorGate = true;
                } else if (cell.gate) {
                    hasNormalGate = true;
                }
            }
        }

        // Determine layer type based on gate presence.
        if (!hasAnyGate) return 'empty';
        if (hasErrorGate && hasNormalGate) return 'mixed';
        if (hasErrorGate) return 'error';
        if (hasNormalGate) return 'normal';
        return 'empty';
    };

    // Verify if a gate can be placed in a column based on its compatibility.
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

                if (cellData.gate?.type === 'CNOT') {
                    const newGrid = grid.map(row => {
                        return row.map((cell, colIndex) => {
                            if (colIndex === sourceCol && cell.occupiedBy === cellData.gate.id) {
                                return { gate: null, occupiedBy: null };
                            }
                            return cell;
                        });
                    });
                    setGrid(newGrid);

                    // Use the newGrid to determine the layer type
                    const hasAnyGate = newGrid.some(row =>
                        row[sourceCol].gate !== null || row[sourceCol].occupiedBy !== null
                    );
                    const newLayerTypes = [...layerTypes];
                    newLayerTypes[sourceCol] = hasAnyGate ? determineLayerType(sourceCol) : 'empty';
                    setLayerTypes(newLayerTypes);
                } else {
                    const newGrid = [...grid];
                    newGrid[sourceRow][sourceCol] = { gate: null, occupiedBy: null };
                    setGrid(newGrid);

                    // Use the newGrid to determine the layer type
                    const hasAnyGate = newGrid.some(row =>
                        row[sourceCol].gate !== null || row[sourceCol].occupiedBy !== null
                    );
                    const newLayerTypes = [...layerTypes];
                    newLayerTypes[sourceCol] = hasAnyGate ? determineLayerType(sourceCol) : 'empty';
                    setLayerTypes(newLayerTypes);
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

            if (cellData.gate.type === 'CNOT') {
                const topWire = destRow;
                const bottomWire = destRow + 1;

                if (bottomWire >= numRows) {
                    showTemporaryWarning('Need two adjacent wires for CNOT gate.');
                    return;
                }

                // Check both wires for any gates or CNOT occupancy that isn't from this CNOT
                if ((grid[topWire][destCol].gate !== null || grid[topWire][destCol].occupiedBy !== null) &&
                    grid[topWire][destCol].occupiedBy !== cellData.gate.id) {
                    showTemporaryWarning('Cannot place CNOT gate here - wires occupied.');
                    return;
                }
                if ((grid[bottomWire][destCol].gate !== null || grid[bottomWire][destCol].occupiedBy !== null) &&
                    grid[bottomWire][destCol].occupiedBy !== cellData.gate.id) {
                    showTemporaryWarning('Cannot place CNOT gate here - wires occupied.');
                    return;
                }

                const isControlUp = cellData.gate.controlUp;
                const [controlWire, targetWire] = isControlUp ? [topWire, bottomWire] : [bottomWire, topWire];

                const newGrid = grid.map(row => {
                    return row.map((cell, colIndex) => {
                        if (colIndex === sourceCol && cell.occupiedBy === cellData.gate.id) {
                            return { gate: null, occupiedBy: null };
                        }
                        return cell;
                    });
                });

                newGrid[controlWire][destCol] = {
                    gate: {
                        ...cellData.gate,
                        wireIndices: [controlWire, targetWire]
                    },
                    occupiedBy: cellData.gate.id,
                };
                newGrid[targetWire][destCol] = {
                    gate: null,
                    occupiedBy: cellData.gate.id,
                };

                setGrid(newGrid);
            } else {
                if (grid[destRow][destCol].gate !== null || grid[destRow][destCol].occupiedBy !== null) {
                    showTemporaryWarning('Cannot place gate here - wire occupied.');
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
                            dragCount: dragAttempts + 1
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
                const topWire = destRow;
                const bottomWire = destRow + 1;

                if (bottomWire >= numRows) {
                    showTemporaryWarning('Need two adjacent wires for CNOT gate.');
                    return;
                }

                // Check both wires for any existing gates or CNOT occupancy
                if (grid[topWire][destCol].gate !== null ||
                    grid[bottomWire][destCol].gate !== null ||
                    grid[topWire][destCol].occupiedBy !== null ||
                    grid[bottomWire][destCol].occupiedBy !== null) {
                    showTemporaryWarning('Cannot place CNOT gate here - wires occupied.');
                    return;
                }

                const isControlUp = newGate.controlUp;
                const [controlWire, targetWire] = isControlUp ? [topWire, bottomWire] : [bottomWire, topWire];

                const newGrid = [...grid];
                newGrid[controlWire][destCol] = {
                    gate: {
                        ...newGate,
                        wireIndices: [controlWire, targetWire]
                    },
                    occupiedBy: newGate.id,
                };
                newGrid[targetWire][destCol] = {
                    gate: null,
                    occupiedBy: newGate.id,
                };
                setGrid(newGrid);
            } else {
                if (grid[destRow][destCol].gate !== null || grid[destRow][destCol].occupiedBy !== null) {
                    showTemporaryWarning('Cannot place gate here - wire occupied.');
                    return;
                }

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
            const formData = new FormData();

            formData.append('circuit_ir', JSON.stringify(ir));

            if (fileContent) {
                formData.append('noise_model', fileContent);
            }

            const response = await fetch('/api/simulate', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Simulation result:', result); // Debug log

            if (result.success) {
                if (result.plot_image) {
                    setSimulationResults({
                        plotImage: result.plot_image
                    });
                } else {
                    showError('No plot data received from simulation');
                }
            } else {
                showError(result.error || 'Simulation failed');
            }
        } catch (error) {
            showError(error.message || 'Error: Generating Circuit');
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

                // Process each layer/column
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

                // Calculate layer types based on gate presence and type
                const newLayerTypes = result.data.map((layer, colIndex) => {
                    let hasErrorGate = false;
                    let hasNormalGate = false;
                    let hasAnyGate = false;

                    // Check each cell in this column
                    for (let row = 0; row < numRows; row++) {
                        const cell = newGrid[row][colIndex];
                        // Check for regular gates or if this is a CNOT control point
                        if (cell.gate || cell.occupiedBy) {
                            hasAnyGate = true;
                            if (cell.gate?.type?.endsWith('_Err')) {
                                hasErrorGate = true;
                            } else if (cell.gate?.type === 'CNOT' || cell.gate) {
                                hasNormalGate = true;
                            }
                        }
                    }

                    if (!hasAnyGate) return 'empty';
                    if (hasErrorGate) return 'error';
                    if (hasNormalGate) return 'normal';
                    return 'empty';
                });

                setLayerTypes(newLayerTypes);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error propagating errors: ' + error.message);
        }
    };

    const updateStatus = (message, isError) => {
        setStatus({ message, isError });
    };

    const saveModel = async (matrix) => {
        try {
            const response = await fetch('http://localhost:3000/api/saveOutputs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ outputs: matrix }),
            });

            const data = await response.json();

            if (response.ok) {
                updateStatus(data.message, false);
            } else {
                updateStatus('Failed to save outputs.', true);
            }
        } catch (error) {
            updateStatus(`Error posting matrix data: ${error.message}`, true);
        }
    };

    // In the readBlob function:
    const readBlob = () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        if (!file) {
            showError('No file selected.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setFileContent(new Uint8Array(e.target.result));
            showTemporaryMsg('Noise Model Uploaded');  // Show success message after file is loaded
        };
        reader.onerror = () => {
            showError('Error reading file.');
        };
        reader.readAsArrayBuffer(file);
    };


    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: 'black' }}>
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                borderBottom: '2px solid #eaeaea',
                background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'relative'  // Added to enable absolute positioning of logo
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
                <div style={{
                    position: 'absolute',
                    left: '20px',
                    bottom: '20px',
                }}>
                    <Image
                        src="/icons/logo.svg"
                        alt="NISQ Quantum Simulator Logo"
                        width={100}
                        height={100}
                        priority
                    />
                </div>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                {/* Icons section */}
                <div style={{
                    padding: '20px',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px',
                    marginBottom: '10px'
                }}>
                    <h2 style={{ color: 'black' }}>Available Gates</h2>
                    <Droppable droppableId="icons" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    marginBottom: '5px',
                                    border: '1px solid #ddd',
                                    padding: '10px',
                                    borderRadius: '4px'
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

                    {/* Status Messages */}
                    {status && (
                        <div style={{ marginTop: '10px', color: status.isError ? 'red' : 'green' }}>
                            <p>{status.message}</p>
                        </div>
                    )}

                </div>

                {/* Wire Controls */}
                <div style={{ padding: '20px', marginBottom: '10px' }}>
                    <button
                        onClick={addWire}
                        disabled={numRows >= MAX_ROWS}
                        style={{
                            padding: '10px 10px',
                            backgroundColor: numRows >= MAX_ROWS ? '#cccccc' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: numRows >= MAX_ROWS ? 'not-allowed' : 'pointer',
                            marginRight: '15px'
                        }}
                    >
                        Add Wire
                    </button>
                    <button
                        onClick={resetCircuit}
                        style={{
                            padding: '10px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '15px'
                        }}
                    >
                        Reset Circuit
                    </button>

                    <input
                        type="file"
                        id="fileInput"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.name.endsWith('.npy')) {
                                readBlob();
                            } else {
                                showTemporaryWarning('Please select a .npy file.', true);
                            }
                        }}
                        accept=".npy"
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => {
                            document.getElementById('fileInput').click();
                        }
                        }
                        style={{
                            padding: '10px 10px',
                            backgroundColor: '#9370DB', // Light purple
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '15px'
                        }}
                    >
                        Load Noise Model
                    </button>
                    <button
                        onClick={() => {
                            setFileContent(null);
                            showTemporaryMsg('Noise Model Reset', false);
                        }}
                        style={{
                            padding: '10px 10px',
                            backgroundColor: '#663399', // Darker purple (Rebecca Purple)
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reset Noise Model
                    </button>

                </div>

                {/* Circuit section */}
                <div style={{
                    padding: '20px',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px'
                }}>
                    <h2 style={{
                        color: 'black',
                        marginBottom: '60px'
                    }}>
                        Quantum Circuit
                    </h2>
                    <div style={{
                        position: 'relative',
                        width: `${numColumns * 60}px`,
                        height: `${numRows * 60}px`,
                        marginLeft: '40px'
                    }}>
                        {/* Layer Type Indicators */}
                        <div style={{
                            position: 'absolute',
                            top: '-35px', // Keeping the increased spacing for indicators
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
                                backgroundColor: showWarning ? '#ffeb3b' :
                                    errorWarning?.type === 'error' ? '#ff4444' :
                                        errorWarning?.type === 'warning' ? '#ffeb3b' : '#4CAF50',
                                color: errorWarning?.type === 'warning' ? 'black' : 'white',
                                padding: '10px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: 3,
                                maxWidth: '200px'
                            }}>
                                {showWarning ? 'Cannot remove layer containing gates' : errorWarning?.message}
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
                                                            {(provided, snapshot) => {
                                                                const [controlWire, targetWire] = cellData.gate.wireIndices;
                                                                const isControlUp = controlWire < targetWire;
                                                                const verticalOffset = isControlUp ? 0 : '-60px';

                                                                return (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            cursor: 'grab',
                                                                            position: snapshot.isDragging ? 'relative' : 'absolute',
                                                                            top: snapshot.isDragging ? 0 : verticalOffset,
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
                                                                );
                                                            }}
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
            </DragDropContext >
        </div >
    );
}
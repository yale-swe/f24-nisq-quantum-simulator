from qiskit import QuantumCircuit
from qiskit.dagcircuit import DAGCircuit
from qiskit.converters import circuit_to_dag
from typing import Dict, List, Tuple, Set
from copy import deepcopy

def get_circuit_layers(circuit: QuantumCircuit) -> List[List[Tuple]]:
    """
    Converts a circuit into a list of layers, where each layer contains
    gates that can be executed in parallel.
    
    Args:
        circuit: The quantum circuit to analyze
        
    Returns:
        List of layers, where each layer is a list of (gate_name, qubit_indices) tuples
    """
    dag = circuit_to_dag(circuit)
    layers = []
    current_layer = []

    # Get all gates in the layer
    for layer in dag.layers():
        current_layer = []
        for node in layer['graph'].op_nodes():
            gate_name = node.name
            # Use _index instead of index for newer Qiskit versions
            qubit_indices = [q._index for q in node.qargs]
            current_layer.append((gate_name, qubit_indices))
        if current_layer:  # Only append non-empty layers
            layers.append(current_layer)
            
    return layers

def get_commutation_result(gate: str, error_type: str, qubit_indices: List[int], error_index: int) -> Tuple[List[Tuple[int, str]], bool]:
    """
    Determines how a Pauli error commutes through a gate.
    
    Args:
        gate: The gate name ('i', 'x', 'y', 'z', 'cx')
        error_type: The Pauli error type ('X', 'Y', 'Z')
        qubit_indices: The indices of qubits the gate acts on
        error_index: The index of the qubit where the error occurs
    
    Returns:
        Tuple containing:
        - List of (qubit_index, new_error_type) pairs
        - Boolean indicating if the phase changes (True if -1 phase acquired)
    """
    # If error is on a qubit not involved in this gate, it passes through unchanged
    if error_index not in qubit_indices:
        return [(error_index, error_type)], False

    # Single qubit gates
    if gate.lower() in {'i', 'x', 'y', 'z'}:            
        # Identity gate
        if gate.lower() == 'i':
            return [(error_index, error_type)], False
            
        # Pauli gates commutation relations
        commutation_rules = {
            # Format: (gate, error) -> (new_error, phase_change)
            ('x', 'X'): ('X', False),
            ('x', 'Y'): ('Y', True),
            ('x', 'Z'): ('Z', True),
            ('y', 'X'): ('X', True),
            ('y', 'Y'): ('Y', False),
            ('y', 'Z'): ('Z', True),
            ('z', 'X'): ('X', True),
            ('z', 'Y'): ('Y', True),
            ('z', 'Z'): ('Z', False)
        }
        
        new_error, phase = commutation_rules[(gate.lower(), error_type)]
        return [(error_index, new_error)], phase

    # CNOT gate
    elif gate.lower() == 'cx':
        control, target = qubit_indices

        # Error on control qubit
        if error_index == control:
            if error_type == 'X':
                return [(control, 'X'), (target, 'X')], False  # X error propagates to both qubits
            elif error_type == 'Y':
                return [(control, 'Y'), (target, 'X')], False
            else:  # Z error
                return [(control, 'Z')], False  # Z error stays on control
                
        # Error on target qubit
        elif error_index == target:
            if error_type == 'X':
                return [(control, 'X'), (target, 'X')], False
            elif error_type == 'Y':
                return [(control, 'X'), (target, 'Y')], False
            else:  # Z error
                return [(target, 'Z')], False
            
    raise ValueError(f"Unsupported gate: {gate}")

def commute_to_end(circuit: QuantumCircuit, error_row: int, error_col: int, error_type: str) -> QuantumCircuit:
    """
    Commutes a Pauli error through a quantum circuit to the end.
    
    Args:
        circuit: The original quantum circuit
        error_row: The qubit index where the error occurs
        error_col: The layer index where the error occurs
        error_type: The type of Pauli error ('X', 'Y', or 'Z')
        
    Returns:
        A new circuit with the propagated error gates added at the end
    """
    if error_type not in {'X', 'Y', 'Z'}:
        raise ValueError("Error type must be 'X', 'Y', or 'Z'")

    # Check that the circuit only contains allowed gates
    allowed_gates = {'i', 'x', 'y', 'z', 'cx'}
    for inst in circuit.data:
        if inst[0].name.lower() not in allowed_gates:
            raise ValueError(f"Unsupported gate {inst[0].name} in circuit. Only I, X, Y, Z, and CX gates are supported.")

    # Get the layer structure
    layers = get_circuit_layers(circuit)

    if error_col >= len(layers):
        raise ValueError(f"Error column {error_col} is beyond the circuit depth {len(layers)}")

    if error_row >= circuit.num_qubits:
        raise ValueError(f"Error row {error_row} is beyond the number of qubits {circuit.num_qubits}")

    # Create a new circuit
    new_circuit = circuit.copy()

    # Current errors to track
    current_errors = [(error_row, error_type)]
    accumulated_phase = False  # Track if we've accumulated a -1 phase

    # Process each layer after the error
    for layer_idx in range(error_col, len(layers)):
        layer = layers[layer_idx]

        # Track how each current error propagates through this layer
        new_errors = []
        for error_qubit, curr_error_type in current_errors:
            # Check if the error qubit is involved in any gate in this layer
            affected = False
            for gate_name, qubits in layer:
                if error_qubit in qubits:
                    affected = True
                    # Compute the commutation
                    propagated_errors, phase_change = get_commutation_result(
                        gate_name, curr_error_type, qubits, error_qubit
                    )
                    new_errors.extend(propagated_errors)
                    accumulated_phase = accumulated_phase != phase_change  # XOR to track phase
                    break
                    
            # If error qubit not involved in any gate in this layer,
            # it passes through unchanged
            if not affected:
                new_errors.append((error_qubit, curr_error_type))

        # Update current errors, combining identical errors
        error_dict = {}
        for qubit, error in new_errors:
            if qubit in error_dict:
                # Multiply Pauli operators
                pauli_multiplication = {
                    ('X', 'X'): ('I', False),
                    ('X', 'Y'): ('Z', False),
                    ('X', 'Z'): ('Y', True),
                    ('Y', 'X'): ('Z', True),
                    ('Y', 'Y'): ('I', False),
                    ('Y', 'Z'): ('X', False),
                    ('Z', 'X'): ('Y', False),
                    ('Z', 'Y'): ('X', True),
                    ('Z', 'Z'): ('I', False)
                }
                current, phase = pauli_multiplication[(error_dict[qubit], error)]
                if current == 'I':
                    del error_dict[qubit]
                else:
                    error_dict[qubit] = current
                accumulated_phase = accumulated_phase != phase
            else:
                error_dict[qubit] = error

        current_errors = [(q, e) for q, e in error_dict.items()]

    # Add the final error gates to the end of the circuit
    if accumulated_phase:
        # In a real implementation, you might want to handle the global phase
        print("Warning: Accumulated -1 phase in error propagation")

    for qubit, error in current_errors:
        if error == 'X':
            new_circuit.x(qubit)
        elif error == 'Y':
            new_circuit.y(qubit)
        elif error == 'Z':
            new_circuit.z(qubit)

    return new_circuit
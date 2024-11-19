from typing import List, Tuple
from collections import defaultdict

def get_commutation_result(gate: tuple, error_type: str, error_index: int) -> List[Tuple[int, str]]:
    """Determines how a Pauli error commutes through a gate."""
    gate_name = gate[0].upper()
    
    # For CNOT gate
    if gate_name == 'CX':
        control, target = gate[1], gate[2]
        
        # Error on control qubit
        if error_index == control:
            if error_type == 'X':
                return [(control, 'X'), (target, 'X')]  # X_c -> X_c X_t
            elif error_type == 'Y':
                return [(control, 'Y'), (target, 'X')]  # Y_c -> Y_c X_t
            elif error_type == 'Z':
                return [(control, 'Z')]  # Z_c -> Z_c
                
        # Error on target qubit
        elif error_index == target:
            if error_type == 'X':
                return [(target, 'X')]  # X_t -> X_t
            elif error_type == 'Y':
                return [(control, 'Z'), (target, 'Y')]  # Y_t -> Z_c Y_t
            elif error_type == 'Z':
                return [(control, 'Z'), (target, 'Z')]  # Z_t -> Z_c Z_t
    
    # If gate not recognized or error not on affected qubit, error passes through unchanged
    return [(error_index, error_type)]

def simplify_errors(errors: List[Tuple[int, str]]) -> List[Tuple[str, int]]:
    """
    Simplifies a list of errors by combining Pauli operators according to multiplication rules.
    Returns list of (error_type, qubit) tuples.
    """
    # Dictionary to store the cumulative error on each qubit
    qubit_errors = defaultdict(lambda: 'I')  # Identity by default
    
    # Pauli operator multiplication table (excluding phases)
    multiply_table = {
        ('I', 'X'): 'X', ('I', 'Y'): 'Y', ('I', 'Z'): 'Z',
        ('X', 'X'): 'I', ('X', 'Y'): 'Z', ('X', 'Z'): 'Y',
        ('Y', 'Y'): 'I', ('Y', 'Z'): 'X', ('Y', 'X'): 'Z',
        ('Z', 'Z'): 'I', ('Z', 'X'): 'Y', ('Z', 'Y'): 'X',
        # Add identity cases in reverse order
        ('X', 'I'): 'X', ('Y', 'I'): 'Y', ('Z', 'I'): 'Z'
    }
    
    # Process each error
    for qubit, error_type in errors:
        current = qubit_errors[qubit]
        key = (current, error_type)
        if key in multiply_table:
            qubit_errors[qubit] = multiply_table[key]
        else:  # Handle reverse order if needed
            key = (error_type, current)
            if key in multiply_table:
                qubit_errors[qubit] = multiply_table[key]
    
    # Convert back to list format, excluding identity operations
    result = []
    for qubit, error_type in qubit_errors.items():
        if error_type != 'I':  # Only include non-identity errors
            result.append((error_type, qubit))
    
    return sorted(result)  # Sort for consistent ordering

def commute_to_end(circuit: List[List[tuple]], error_row: int, error_col: int, error_type: str) -> List[Tuple[str, int]]:
    """Commutes a Pauli error through a circuit to the end."""
    current_errors = [(error_row, error_type)]
    
    for layer in circuit[error_col:]:
        new_errors = []
        for error_qubit, curr_error_type in current_errors:
            # Find if this error qubit is involved in any gate
            affected = False
            for gate in layer:
                if error_qubit in gate[1:]:
                    affected = True
                    new_errors.extend(get_commutation_result(gate, curr_error_type, error_qubit))
                    break
            if not affected:
                new_errors.append((error_qubit, curr_error_type))
        current_errors = new_errors
    return simplify_errors(current_errors)
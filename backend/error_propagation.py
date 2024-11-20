# backend/error_propagation.py


def commutation_rules(error_gate, gate):
    """
    Encodes commutation rules between errors ('X', 'Y', 'Z') and gates ('X', 'Y', 'Z', 'H', 'S', 'CX').
    """
    error_name, error_qubit = error_gate
    gate_name = gate[0]
    gate_qubits = gate[1:]

    # Handle single-qubit gates
    if gate_name in {"X", "Y", "Z"}:
        return [error_gate]

    elif gate_name == "H":
        if error_qubit != gate_qubits[0]:
            return [error_gate]
        if error_name == "X":
            return [("Z", error_qubit)]
        elif error_name == "Z":
            return [("X", error_qubit)]
        elif error_name == "Y":
            return [("Y", error_qubit)]

    elif gate_name == "S":
        if error_qubit != gate_qubits[0]:
            return [error_gate]
        if error_name == "X":
            return [("Y", error_qubit)]
        elif error_name == "Y":
            return [("X", error_qubit)]
        elif error_name == "Z":
            return [("Z", error_qubit)]

    elif gate_name == "CX":
        control, target = gate_qubits
        if error_qubit == control:
            if error_name == "X":
                return [("X", control), ("X", target)]
            elif error_name == "Z":
                return [("Z", control)]
            elif error_name == "Y":
                return [("Y", control), ("X", target)]
        elif error_qubit == target:
            if error_name == "X":
                return [("X", target)]
            elif error_name == "Z":
                return [("Z", target), ("Z", control)]
            elif error_name == "Y":
                return [("Y", target), ("Z", control)]

    return [error_gate]


def simplify_propagated_errors(errors):
    """
    Simplifies a list of propagated error gates by combining and canceling Pauli errors.
    """
    pauli_map = {"I": 0, "X": 1, "Y": 2, "Z": 3}
    inverse_pauli_map = {0: "I", 1: "X", 2: "Y", 3: "Z"}
    qubit_errors = {}

    for error_name, qubit in errors:
        if qubit not in qubit_errors:
            qubit_errors[qubit] = pauli_map[error_name]
        else:
            current_pauli = qubit_errors[qubit]
            combined_pauli = current_pauli ^ pauli_map[error_name]
            qubit_errors[qubit] = combined_pauli

    simplified_errors = [
        (inverse_pauli_map[value], qubit)
        for qubit, value in qubit_errors.items()
        if value != 0
    ]
    return simplified_errors


class Layer:
    def __init__(self, gates, num_qubits):
        self.gates = gates
        self.num_qubits = num_qubits


class ErrorLayer:
    def __init__(self, gates, num_qubits):
        self.gates = gates
        self.num_qubits = num_qubits


def propagate_error_layer_through_layer(error_layer, layer):
    """
    Propagates an ErrorLayer through a Layer by computing the commutator and updating the errors.
    """
    if error_layer.num_qubits > layer.num_qubits:
        raise ValueError(
            "ErrorLayer contains qubit indices beyond the allowed range of the Layer."
        )

    propagated_errors = []
    for error_gate in error_layer.gates:
        new_errors = [error_gate]
        for gate in layer.gates:
            new_propagated_errors = []
            for err in new_errors:
                new_propagated_errors.extend(commutation_rules(err, gate))
            new_errors = new_propagated_errors
        propagated_errors.extend(new_errors)

    simplified_errors = simplify_propagated_errors(propagated_errors)
    return ErrorLayer(simplified_errors, layer.num_qubits)

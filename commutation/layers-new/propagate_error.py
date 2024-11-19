from utils import *

def commutation_rules(error_gate, gate):
		"""
		Encodes commutation rules between errors ('X', 'Y', 'Z') and gates ('X', 'Y', 'Z', 'H', 'CX').

		Parameters:
		error_gate (tuple): An error gate from the ErrorLayer (e.g., ('X', 0)).
		gate (tuple): A gate from the Layer (e.g., ('CX', 0, 1)).

		Returns:
		list of tuples: A list of new error gates produced by propagating the error through the gate.
		"""
		error_name, error_qubit = error_gate
		gate_name = gate[0]
		gate_qubits = gate[1:]

		# Handle single-qubit gates
		if gate_name in {'X', 'Y', 'Z'}:
			return [error_gate]

		elif gate_name == 'H':
			# H maps X <-> Z and Y -> -Y
			if error_qubit != gate_qubits[0]:
				return [error_gate]  # No change if error acts on a different qubit
			if error_name == 'X':
				return [('Z', error_qubit)]
			elif error_name == 'Z':
				return [('X', error_qubit)]
			elif error_name == 'Y':
				return [('Y', error_qubit)]  # Neglecting global phase changes

		# Handle CNOT (CX) gates
		elif gate_name == 'CX':
			control, target = gate_qubits
			if error_qubit == control:
				if error_name == 'X':
					return [('X', control), ('X', target)]  # Propagates to both control and target
				elif error_name == 'Z':
					return [('Z', control)]  # Only affects control
				elif error_name == 'Y':
					return [('Y', control), ('X', target)]  # Y on control propagates X to target
			elif error_qubit == target:
				if error_name == 'X':
					return [('X', target)]  # No effect
				elif error_name == 'Z':
					return [('Z', target), ('Z', control)]  # Z on target propagates to control
				elif error_name == 'Y':
					return [('Y', target), ('Z', control)]  # Y on target propagates Z to control

		# If no specific rules apply, return the original error
		return [error_gate]

def simplify_propagated_errors(errors):
	"""
	Simplifies a list of propagated error gates by combining and canceling Pauli errors
	on the same qubit.

	Parameters:
	errors (list of tuples): A list of propagated errors (e.g., [('X', 0), ('Z', 0), ('X', 1)]).

	Returns:
	list of tuples: A simplified list of error gates.
	"""
	pauli_map = {'I': 0, 'X': 1, 'Y': 2, 'Z': 3}  # Mapping for Pauli algebra modulo 2 arithmetic
	inverse_pauli_map = {0: 'I', 1: 'X', 2: 'Y', 3: 'Z'}
	qubit_errors = {}

	for error_name, qubit in errors:
		if qubit not in qubit_errors:
			qubit_errors[qubit] = pauli_map[error_name]
		else:
			# Combine errors using modulo-2 arithmetic rules for Pauli matrices
			current_pauli = qubit_errors[qubit]
			combined_pauli = current_pauli ^ pauli_map[error_name]
			qubit_errors[qubit] = combined_pauli

	# Construct the simplified error list, omitting identity errors ('I')
	simplified_errors = [(inverse_pauli_map[value], qubit) for qubit, value in qubit_errors.items() if value != 0]
	return simplified_errors

def propagate_error_layer_through_layer(error_layer, layer):
	"""
	Propagates an ErrorLayer through a Layer by computing the commutator and updating the errors.

	Parameters:
	error_layer (ErrorLayer): The input ErrorLayer object.
	layer (Layer): The Layer object through which the error is propagated.

	Returns:
	ErrorLayer: A new ErrorLayer representing the errors after propagation.

	Raises:
	ValueError: If any gate in the ErrorLayer acts on a qubit index not allowed by the Layer.
	"""
	# Validate that the qubit indices in the error layer do not exceed those in the layer
	if error_layer.num_qubits > layer.num_qubits:
		raise ValueError("ErrorLayer contains qubit indices beyond the allowed range of the Layer.")

	# Propagate each error in the ErrorLayer through the Layer
	propagated_errors = []
	for error_gate in error_layer.gates:
		new_errors = [error_gate]  # Start with the original error gate
		for gate in layer.gates:
			# Propagate errors through each gate in the layer
			new_propagated_errors = []
			for err in new_errors:
				new_propagated_errors.extend(commutation_rules(err, gate))
			new_errors = new_propagated_errors  # Update the errors after this gate
		propagated_errors.extend(new_errors)

	# Simplify the propagated errors
	simplified_errors = simplify_propagated_errors(propagated_errors)

	return ErrorLayer(simplified_errors, layer.num_qubits)

def propagate_errors_through_circuit(error_layers, indices, circuit):
    """
    Propagates error layers through a circuit, applying the specified error layers at the given positions.

    Parameters:
    error_layers (list of ErrorLayer): A list of ErrorLayer objects to be applied.
    indices (list of int): The respective positions where the error layers should be applied.
                           An index of 0 means it is applied before the 0th layer, 1 means before the 1st layer, etc.
    circuit (list of Layer): A list representing the circuit layers.

    Returns:
    list of ErrorLayer: A list of ErrorLayer objects representing the propagated error states after each layer.
    """
    if len(error_layers) != len(indices):
        raise ValueError("The length of error_layers and indices must be the same.")

    # Sort the error layers and indices together based on indices to ensure correct order of application
    sorted_error_layers_and_indices = sorted(zip(indices, error_layers), key=lambda x: x[0])

    propagated_error_states = []  # List to store the propagated error layers at each step
    current_error_layer = ErrorLayer([], circuit.num_qubits)  # Start with an empty error layer

    next_error_index = 0  # Index to track the next error layer to apply

    # Iterate through each layer of the circuit
    for i, layer in enumerate(circuit.circuit_layers):
        # Apply any error layers that are inserted before the current layer
        while next_error_index < len(sorted_error_layers_and_indices) and sorted_error_layers_and_indices[next_error_index][0] == i:
            new_error_layer = sorted_error_layers_and_indices[next_error_index][1]
            # Combine the current error layer with the new one
            current_error_layer = ErrorLayer(
                simplify_propagated_errors(current_error_layer.gates + new_error_layer.gates),
                layer.num_qubits
            )
            next_error_index += 1

        # Store the current error state before propagating through the layer
        propagated_error_states.append(current_error_layer)

        # Propagate the current error layer through the current circuit layer
        current_error_layer = propagate_error_layer_through_layer(current_error_layer, layer)

    # Handle any remaining error layers that should be applied after the last layer
    while next_error_index < len(sorted_error_layers_and_indices):
        new_error_layer = sorted_error_layers_and_indices[next_error_index][1]
        current_error_layer = ErrorLayer(
            simplify_propagated_errors(current_error_layer.gates + new_error_layer.gates),
            circuit.num_qubits
        )
        propagated_error_states.append(current_error_layer)
        next_error_index += 1

    # Add the final error state after the last layer
    propagated_error_states.append(current_error_layer)

    return propagated_error_states

def get_propagated_errors(error_layers, indices, circuit):
	return propagate_errors_through_circuit(error_layers, indices, circuit)[-1]
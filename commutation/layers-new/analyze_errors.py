from propagate_error import *

def are_layers_equal(layer1, layer2):
	"""
	Checks whether two ErrorLayers are equal, considering the commutative property
	of Pauli errors. Two layers are considered equal if they contain the same gates,
	regardless of order.

	Parameters:
	layer1 (ErrorLayer): The first ErrorLayer to compare.
	layer2 (ErrorLayer): The second ErrorLayer to compare.

	Returns:
	bool: True if the layers are equal, False otherwise.
	"""
	if len(layer1.gates) != len(layer2.gates):
		return False
	# Create sets of gates for comparison to account for commutative order
	return set(layer1.gates) == set(layer2.gates)

def get_possible_sq_errors(circuit):
	"""
	Generates a list of every possible final error signature resulting from a single-qubit gate
	error in any of the possible positions in the circuit, including after the final layer.

	Parameters:
	circuit (LayeredQuantumCircuit): The input quantum circuit to analyze.

	Returns:
	list of tuples: Each tuple contains:
		- ErrorLayer: A unique final ErrorLayer after propagation.
		- (ErrorLayer, int): The original error layer and the position where it was applied.
	"""
	num_qubits = circuit.num_qubits
	unique_final_errors = []

	# List to store the final unique errors along with their originating error information
	results = []

	# Iterate over each position in the circuit, including after the final layer
	for layer_index in range(circuit.total_layers() + 1):  # +1 to consider errors applied after the last layer
		# Generate all possible single-qubit error layers
		for qubit_index in range(num_qubits):
			for error_type in ['X', 'Y', 'Z']:
				# Create an error layer with a single error
				single_error_layer = ErrorLayer([(error_type, qubit_index)], num_qubits)

				# Propagate the error through the circuit
				final_error_state = get_propagated_errors([single_error_layer], [layer_index], circuit)

				# Check if this final error state is already in the unique list
				if not any(are_layers_equal(final_error_state, unique_error) for unique_error, _ in unique_final_errors):
					# Store the unique error and its originating information
					unique_final_errors.append((final_error_state, (single_error_layer, layer_index)))
					results.append((final_error_state, (single_error_layer, layer_index)))

	return results

def ancilla_checks(results, ancilla_indices, ancilla_types):
	"""
	Applies ancilla checks to the results of propagated errors and filters out errors
	that can be detected by the specified ancilla measurements.

	Parameters:
	results (list of tuples): The results from `get_possible_sq_errors`. Each element is a tuple:
							  (final_error_layer, (originating_error_layer, position_index)).
	ancilla_indices (list of int): The indices of qubits being checked by ancillas.
	ancilla_types (list of str): The types of ancilla checks ('X', 'Y', 'Z') for each corresponding qubit.

	Returns:
	list of tuples: The filtered list of results after applying the ancilla checks.
	"""
	if len(ancilla_indices) != len(ancilla_types):
		raise ValueError("The length of ancilla_indices and ancilla_types must be the same.")

	filtered_results = []

	for final_error_layer, origin_info in results:
		# Assume the error is valid initially (not detected by ancilla)
		error_detected = False

		# Check each gate (error) in the final error layer
		for error_gate, error_qubit in final_error_layer.gates:
			# Check if this qubit is monitored by an ancilla
			if error_qubit in ancilla_indices:
				# Get the index of the ancilla and corresponding type
				ancilla_index = ancilla_indices.index(error_qubit)
				ancilla_type = ancilla_types[ancilla_index]

				# Determine if the error is detectable by the ancilla
				# Ancilla type 'X' detects 'Z' and 'Y' errors, etc.
				if (ancilla_type == 'X' and error_gate in ['Z', 'Y']) or \
				   (ancilla_type == 'Z' and error_gate in ['X', 'Y']) or \
				   (ancilla_type == 'Y' and error_gate in ['X', 'Z']):
					error_detected = True
					break  # No need to check further if the error is detected

		# If no error is detected by any ancilla, keep it in the filtered results
		if not error_detected:
			filtered_results.append((final_error_layer, origin_info))

	return filtered_results


def error_detection(results, stabilizers):
    """
    Filters out errors that do not commute with the given stabilizers.

    Parameters:
    results (list of tuples): The results from `get_possible_sq_errors`. Each element is a tuple:
                              (final_error_layer, (originating_error_layer, position_index)).
    stabilizers (list of str): A list of stabilizers represented as strings (e.g., 'XXXX', 'ZZZZ').

    Returns:
    list of tuples: The filtered list of results where errors commute with all stabilizers.
    """
    def commutes_with_stabilizer(error_layer, stabilizer):
        """
        Checks if the given error layer commutes with the specified stabilizer.

        Parameters:
        error_layer (Layer): The error layer to check.
        stabilizer (str): The stabilizer represented as a string (e.g., 'XXXX').

        Returns:
        bool: True if the error layer commutes with the stabilizer, False otherwise.
        """
        # Initialize a commutation parity (0 means commute, 1 means anticommute)
        commutation_parity = 0

        for error_gate, error_qubit in error_layer.gates:
            stabilizer_gate = stabilizer[error_qubit]

            # Determine commutation behavior based on Pauli algebra
            if (error_gate == 'X' and stabilizer_gate in ['Z', 'Y']) or \
               (error_gate == 'Z' and stabilizer_gate in ['X', 'Y']) or \
               (error_gate == 'Y' and stabilizer_gate in ['X', 'Z']):
                commutation_parity ^= 1  # Toggle commutation parity (anticommute)

        # If commutation_parity is 0, the error commutes with the stabilizer
        return commutation_parity == 0

    filtered_results = []

    for final_error_layer, origin_info in results:
        # Check if the error commutes with all stabilizers
        if all(commutes_with_stabilizer(final_error_layer, stabilizer) for stabilizer in stabilizers):
            filtered_results.append((final_error_layer, origin_info))

    return filtered_results
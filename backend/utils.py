class Layer:
    def __init__(self, gates, num_qubits):
        """
        Initializes a Layer instance.

        Parameters:
        gates (list of tuples): A list of gates, where each gate is a tuple of the form
                                ('gate_name', index_1, index_2, ..., index_n).
        num_qubits (int): The total number of qubits in the circuit.

        Raises:
        ValueError: If any qubit is used in more than one gate, if gate constraints are violated,
                    or if qubit indices are out of bounds.
        """
        self.gates = gates
        self.num_qubits = num_qubits
        self._validate_layer()

    def _validate_layer(self):
        """
        Validates that no qubit is used in more than one gate within the layer and checks gate constraints.

        Raises:
        ValueError: If a qubit is used in more than one gate, if gate constraints are violated,
                    or if qubit indices are out of bounds.
        """
        used_qubits = set()
        valid_single_qubit_gates = {'X', 'Y', 'Z', 'H', 'I'}
        for gate in self.gates:
            gate_name = gate[0]
            qubits = gate[1:]

            # Check qubit index bounds
            if any(q < 0 or q >= self.num_qubits for q in qubits):
                raise ValueError(f"Gate {gate} contains qubit index out of bounds (0 to {self.num_qubits - 1}).")

            # Check for overlapping qubits
            if any(q in used_qubits for q in qubits):
                raise ValueError(f"Layer contains overlapping gates for qubit(s) in gate {gate}.")
            used_qubits.update(qubits)

            # Validate specific gate constraints
            if gate_name == 'CX':
                if len(qubits) != 2 or qubits[0] == qubits[1]:
                    raise ValueError(f"'CX' gate must have two distinct indices in gate {gate}.")
            elif gate_name in valid_single_qubit_gates:
                if len(qubits) != 1:
                    raise ValueError(f"'{gate_name}' gate must have exactly one index in gate {gate}.")
            else:
                # Additional custom validation for other gate types can be added here if needed
                pass

    def __getitem__(self, index):
        """
        Allows for indexing into the list of gates.

        Parameters:
        index (int): Index of the gate to retrieve.

        Returns:
        tuple: The gate at the specified index.
        """
        return self.gates[index]

    def __len__(self):
        """
        Returns the number of gates in the layer.

        Returns:
        int: Number of gates.
        """
        return len(self.gates)

    def __repr__(self):
        """
        Returns a string representation of the Layer instance.

        Returns:
        str: String representation of the layer.
        """
        return f"Layer({self.gates})"

class ErrorLayer(Layer):
    def __init__(self, gates, num_qubits):
        """
        Initializes an ErrorLayer instance.

        Parameters:
        gates (list of tuples): A list of gates, where each gate is a tuple of the form
                                ('gate_name', index_1).
                                Only 'X', 'Y', and 'Z' gates are allowed.
        num_qubits (int): The total number of qubits in the circuit.

        Raises:
        ValueError: If any gate other than 'X', 'Y', or 'Z' is included, or if other Layer constraints are violated.
        """
        self.allowed_gates = {'X', 'Y', 'Z'}
        self._validate_error_gates(gates)
        super().__init__(gates, num_qubits)

    def _validate_error_gates(self, gates):
        """
        Validates that all gates in the ErrorLayer are 'X', 'Y', or 'Z'.

        Parameters:
        gates (list of tuples): The gates to validate.

        Raises:
        ValueError: If any gate is not 'X', 'Y', or 'Z'.
        """
        for gate in gates:
            if gate[0] not in self.allowed_gates:
                raise ValueError(f"Invalid gate '{gate[0]}' in ErrorLayer. Only 'X', 'Y', and 'Z' gates are allowed.")

class LayeredQuantumCircuit:
    def __init__(self, circuit, num_qubits):
        """
        Initializes the LayeredQuantumCircuit instance.

        Parameters:
        circuit (list of Layer): A list of Layer objects representing the quantum circuit.
        num_qubits (int): The total number of qubits in the circuit.

        Raises:
        ValueError: If any layer in the circuit has invalid gates or qubits out of range.
        """
        self.num_qubits = num_qubits
        self.circuit_layers = [Layer(layer.gates, num_qubits) if isinstance(layer, Layer) else Layer(layer, num_qubits) for layer in circuit]
        self._validate_circuit()

    def _validate_circuit(self):
        """
        Validates that each Layer in the circuit adheres to the constraints and is an instance of Layer.
        """
        for i, layer in enumerate(self.circuit_layers):
            if not isinstance(layer, Layer):
                raise ValueError(f"Element {i} in the circuit is not a Layer instance.")

    def get_layer(self, p):
        """
        Retrieves the p-th layer of the circuit.

        Parameters:
        p (int): The index of the layer to retrieve (0-based index).

        Returns:
        Layer: The p-th layer of the circuit.

        Raises:
        IndexError: If the layer index is out of range.
        """
        if p < 0 or p >= len(self.circuit_layers):
            raise IndexError("Layer index out of range.")
        return self.circuit_layers[p]

    def add_layer(self, layer):
        """
        Adds a new layer to the circuit after validating it.

        Parameters:
        layer (Layer): A new Layer to be added.

        Raises:
        ValueError: If the input is not a valid Layer instance.
        """
        if not isinstance(layer, Layer):
            raise ValueError("Input must be an instance of Layer.")
        self.circuit_layers.append(Layer(layer.gates, self.num_qubits))

    def total_layers(self):
        """
        Returns the total number of layers in the circuit.

        Returns:
        int: Total number of layers.
        """
        return len(self.circuit_layers)

    def __repr__(self):
        """
        Returns a string representation of the LayeredQuantumCircuit instance.

        Returns:
        str: String representation of the circuit.
        """
        return f"LayeredQuantumCircuit({self.circuit_layers}) with {self.num_qubits} qubits"

    @classmethod
    def from_list(cls, basic_list, num_qubits):
        """
        Creates a LayeredQuantumCircuit instance from a basic list representation.

        Parameters:
        basic_list (list of list of tuples): A list where each element is a list of tuples
                                             representing gates in a layer.
        num_qubits (int): The total number of qubits in the circuit.

        Returns:
        LayeredQuantumCircuit: An instance of the LayeredQuantumCircuit.
        """
        layers = [Layer(layer, num_qubits) for layer in basic_list]
        return cls(layers, num_qubits)
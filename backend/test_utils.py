import unittest
from utils import Layer, ErrorLayer, LayeredQuantumCircuit

class TestLayer(unittest.TestCase):
    def test_valid_single_qubit_gates(self):
        layer = Layer([('H', 0), ('X', 1), ('Y', 2)], 3)
        self.assertEqual(len(layer), 3)
        self.assertEqual(layer[0], ('H', 0))

    def test_valid_cnot_gate(self):
        layer = Layer([('CX', 0, 1)], 2)
        self.assertEqual(len(layer), 1)
        self.assertEqual(layer[0], ('CX', 0, 1))

    def test_overlapping_qubits(self):
        with self.assertRaises(ValueError) as context:
            Layer([('H', 0), ('X', 0)], 2)
        self.assertTrue("Layer contains overlapping gates" in str(context.exception))

    def test_qubit_index_out_of_bounds(self):
        with self.assertRaises(ValueError) as context:
            Layer([('H', 3)], 3)
        self.assertTrue("contains qubit index out of bounds" in str(context.exception))

    def test_invalid_cnot_same_qubit(self):
        with self.assertRaises(ValueError) as context:
            Layer([('CX', 1, 1)], 2)
        self.assertTrue("must have two distinct indices" in str(context.exception))

    def test_invalid_single_qubit_gate_indices(self):
        with self.assertRaises(ValueError) as context:
            Layer([('H', 0, 1)], 2)
        self.assertTrue("must have exactly one index" in str(context.exception))

    def test_layer_representation(self):
        layer = Layer([('H', 0), ('X', 1)], 2)
        self.assertEqual(str(layer), "Layer([('H', 0), ('X', 1)])")

class TestErrorLayer(unittest.TestCase):
    def test_valid_error_gates(self):
        error_layer = ErrorLayer([('X', 0), ('Y', 1), ('Z', 2)], 3)
        self.assertEqual(len(error_layer), 3)
        self.assertEqual(error_layer[0], ('X', 0))

    def test_invalid_error_gate_type(self):
        with self.assertRaises(ValueError) as context:
            ErrorLayer([('H', 0)], 2)
        self.assertTrue("Only 'X', 'Y', and 'Z' gates are allowed" in str(context.exception))

    def test_error_layer_overlapping_qubits(self):
        with self.assertRaises(ValueError) as context:
            ErrorLayer([('X', 0), ('Y', 0)], 2)
        self.assertTrue("Layer contains overlapping gates" in str(context.exception))

    def test_error_layer_out_of_bounds(self):
        with self.assertRaises(ValueError) as context:
            ErrorLayer([('X', 2)], 2)
        self.assertTrue("contains qubit index out of bounds" in str(context.exception))

class TestLayeredQuantumCircuit(unittest.TestCase):
    def test_valid_circuit_creation(self):
        layers = [
            Layer([('H', 0), ('X', 1)], 2),
            Layer([('CX', 0, 1)], 2)
        ]
        circuit = LayeredQuantumCircuit(layers, 2)
        self.assertEqual(circuit.total_layers(), 2)

    def test_circuit_from_list(self):
        basic_list = [
            [('H', 0), ('X', 1)],
            [('CX', 0, 1)]
        ]
        circuit = LayeredQuantumCircuit.from_list(basic_list, 2)
        self.assertEqual(circuit.total_layers(), 2)
        self.assertIsInstance(circuit.get_layer(0), Layer)

    def test_add_layer(self):
        circuit = LayeredQuantumCircuit([], 2)
        new_layer = Layer([('H', 0)], 2)
        circuit.add_layer(new_layer)
        self.assertEqual(circuit.total_layers(), 1)
        self.assertEqual(circuit.get_layer(0)[0], ('H', 0))

    def test_invalid_layer_addition(self):
        circuit = LayeredQuantumCircuit([], 2)
        with self.assertRaises(ValueError) as context:
            circuit.add_layer([('H', 0)])
        self.assertTrue("Input must be an instance of Layer" in str(context.exception))

    def test_get_layer_out_of_range(self):
        circuit = LayeredQuantumCircuit([], 2)
        with self.assertRaises(IndexError) as context:
            circuit.get_layer(0)
        self.assertTrue("Layer index out of range" in str(context.exception))

    def test_circuit_representation(self):
        layers = [Layer([('H', 0)], 2)]
        circuit = LayeredQuantumCircuit(layers, 2)
        repr_str = str(circuit)
        self.assertIn("LayeredQuantumCircuit", repr_str)
        self.assertIn("2 qubits", repr_str)

if __name__ == '__main__':
    unittest.main()
import unittest
from error_propagation import (
    commutation_rules,
    simplify_propagated_errors,
    Layer,
    ErrorLayer,
    propagate_error_layer_through_layer
)

class TestErrorPropagation(unittest.TestCase):
    def test_commutation_rules_single_qubit_gates(self):
        # Test X, Y, Z gates commutation
        self.assertEqual(commutation_rules(("X", 0), ("X", 0)), [("X", 0)])
        self.assertEqual(commutation_rules(("Y", 0), ("Y", 0)), [("Y", 0)])
        self.assertEqual(commutation_rules(("Z", 0), ("Z", 0)), [("Z", 0)])
        
        # Test Hadamard gate commutation
        self.assertEqual(commutation_rules(("X", 0), ("H", 0)), [("Z", 0)])
        self.assertEqual(commutation_rules(("Z", 0), ("H", 0)), [("X", 0)])
        self.assertEqual(commutation_rules(("Y", 0), ("H", 0)), [("Y", 0)])
        
        # Test S gate commutation
        self.assertEqual(commutation_rules(("X", 0), ("S", 0)), [("Y", 0)])
        self.assertEqual(commutation_rules(("Y", 0), ("S", 0)), [("X", 0)])
        self.assertEqual(commutation_rules(("Z", 0), ("S", 0)), [("Z", 0)])
        
        # Test different qubit indices
        self.assertEqual(commutation_rules(("X", 1), ("H", 0)), [("X", 1)])
        self.assertEqual(commutation_rules(("Y", 1), ("S", 0)), [("Y", 1)])

    def test_commutation_rules_cnot_gate(self):
        # Test CNOT control qubit commutation
        self.assertEqual(
            commutation_rules(("X", 0), ("CX", 0, 1)), 
            [("X", 0), ("X", 1)]
        )
        self.assertEqual(
            commutation_rules(("Z", 0), ("CX", 0, 1)), 
            [("Z", 0)]
        )
        self.assertEqual(
            commutation_rules(("Y", 0), ("CX", 0, 1)), 
            [("Y", 0), ("X", 1)]
        )
        
        # Test CNOT target qubit commutation
        self.assertEqual(
            commutation_rules(("X", 1), ("CX", 0, 1)), 
            [("X", 1)]
        )
        self.assertEqual(
            commutation_rules(("Z", 1), ("CX", 0, 1)), 
            [("Z", 1), ("Z", 0)]
        )
        self.assertEqual(
            commutation_rules(("Y", 1), ("CX", 0, 1)), 
            [("Y", 1), ("Z", 0)]
        )
        
        # Test CNOT with uninvolved qubit
        self.assertEqual(
            commutation_rules(("X", 2), ("CX", 0, 1)), 
            [("X", 2)]
        )

    def test_simplify_propagated_errors(self):
        # Test cancellation of identical errors
        self.assertEqual(
            simplify_propagated_errors([("X", 0), ("X", 0)]), 
            []
        )
        
        # Test combining different errors on same qubit
        self.assertEqual(
            simplify_propagated_errors([("X", 0), ("Z", 0)]), 
            [("Y", 0)]
        )
        self.assertEqual(
            simplify_propagated_errors([("X", 0), ("Y", 0)]), 
            [("Z", 0)]
        )
        
        # Test multiple qubits
        result = simplify_propagated_errors([
            ("X", 0), ("Z", 1), ("X", 0), ("Y", 2)
        ])
        self.assertEqual(len(result), 2)
        self.assertIn(("Z", 1), result)
        self.assertIn(("Y", 2), result)
        
        # Test empty list
        self.assertEqual(simplify_propagated_errors([]), [])

    def test_layer_classes(self):
        # Test Layer class
        layer = Layer([("H", 0), ("X", 1)], 2)
        self.assertEqual(layer.gates, [("H", 0), ("X", 1)])
        self.assertEqual(layer.num_qubits, 2)
        
        # Test ErrorLayer class
        error_layer = ErrorLayer([("X", 0), ("Z", 1)], 2)
        self.assertEqual(error_layer.gates, [("X", 0), ("Z", 1)])
        self.assertEqual(error_layer.num_qubits, 2)

    def test_propagate_error_layer_through_layer(self):
        # Test simple propagation
        error_layer = ErrorLayer([("X", 0)], 2)
        circuit_layer = Layer([("H", 0)], 2)
        result = propagate_error_layer_through_layer(error_layer, circuit_layer)
        self.assertEqual(result.gates, [("Z", 0)])
        
        # Test multiple errors through multiple gates
        error_layer = ErrorLayer([("X", 0), ("Z", 1)], 2)
        circuit_layer = Layer([("H", 0), ("S", 1)], 2)
        result = propagate_error_layer_through_layer(error_layer, circuit_layer)
        self.assertEqual(len(result.gates), 2)
        self.assertIn(("Z", 0), result.gates)
        self.assertIn(("Z", 1), result.gates)
        
        # Test CNOT propagation
        error_layer = ErrorLayer([("X", 0)], 2)
        circuit_layer = Layer([("CX", 0, 1)], 2)
        result = propagate_error_layer_through_layer(error_layer, circuit_layer)
        self.assertEqual(len(result.gates), 2)
        self.assertIn(("X", 0), result.gates)
        self.assertIn(("X", 1), result.gates)
        
        # Test error handling for invalid qubit indices
        error_layer = ErrorLayer([("X", 2)], 3)
        circuit_layer = Layer([("H", 0)], 2)
        with self.assertRaises(ValueError):
            propagate_error_layer_through_layer(error_layer, circuit_layer)

if __name__ == '__main__':
    unittest.main()
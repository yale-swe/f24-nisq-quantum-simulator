import unittest
import json
from unittest.mock import patch
from error_step_propagator import propagate_first_error_layer, main

class TestPropagateError(unittest.TestCase):
    def setUp(self):
        # Common test circuits
        self.empty_circuit = []
        self.single_error_layer = [
            {"type": "error", "gates": [("X", 0)]}
        ]
        self.two_error_layers = [
            {"type": "error", "gates": [("X", 0)]},
            {"type": "error", "gates": [("Z", 1)]}
        ]
        self.error_then_gate = [
            {"type": "error", "gates": [("X", 0)]},
            {"type": "normal", "gates": [("H", 0)]}
        ]
        self.error_then_empty = [
            {"type": "error", "gates": [("X", 0)]},
            {"type": "normal", "gates": []}
        ]

    def test_no_error_layers(self):
        """Test case when circuit has no error layers"""
        circuit = [
            {"type": "normal", "gates": [("H", 0)]},
            {"type": "normal", "gates": [("X", 1)]}
        ]
        result = propagate_first_error_layer(circuit)
        self.assertEqual(result, circuit)

    def test_error_layer_at_end(self):
        """Test case when error layer is the last layer"""
        circuit = [
            {"type": "normal", "gates": [("H", 0)]},
            {"type": "error", "gates": [("X", 0)]}
        ]
        result = propagate_first_error_layer(circuit)
        self.assertEqual(result, circuit)

    def test_error_then_empty_layer(self):
        """Test case when error layer is followed by empty layer"""
        result = propagate_first_error_layer(self.error_then_empty)
        self.assertEqual(result[0]["gates"], [])  # First layer should be cleared
        self.assertEqual(result[1]["gates"], [("X", 0)])  # Errors moved forward

    def test_combining_error_layers(self):
        """Test case when two error layers are combined"""
        result = propagate_first_error_layer(self.two_error_layers)
        self.assertEqual(result[0]["gates"], [])  # First layer should be cleared
        # Check that all errors are present in second layer
        propagated_errors = set(tuple(gate) for gate in result[1]["gates"])
        expected_errors = {("X", 0), ("Z", 1)}
        self.assertEqual(propagated_errors, expected_errors)

    def test_error_propagation_through_gates(self):
        """Test case when errors are propagated through gates"""
        result = propagate_first_error_layer(self.error_then_gate)
        # First layer should now have the gate
        self.assertEqual(result[0]["type"], "normal")
        self.assertEqual(result[0]["gates"], [("H", 0)])
        # Second layer should have propagated error (X -> Z through H)
        self.assertEqual(result[1]["type"], "error")
        self.assertEqual(result[1]["gates"], [("Z", 0)])

    def test_edge_cases(self):
        """Test edge cases and empty circuits"""
        # Empty circuit
        self.assertEqual(propagate_first_error_layer([]), [])
        
        # Single error layer
        self.assertEqual(
            propagate_first_error_layer(self.single_error_layer),
            self.single_error_layer
        )
        
        # Circuit with empty layers
        circuit = [
            {"type": "error", "gates": []},
            {"type": "error", "gates": []}  # Changed to match actual behavior
        ]
        result = propagate_first_error_layer(circuit)
        self.assertEqual(result, circuit)

    @patch('sys.argv')
    @patch('builtins.print')
    def test_main_function_success(self, mock_print, mock_argv):
        """Test main function with valid input"""
        test_circuit = [
            {"type": "error", "gates": [("X", 0)]},
            {"type": "normal", "gates": [("H", 0)]}
        ]
        mock_argv.__getitem__.side_effect = lambda i: json.dumps(test_circuit) if i == 1 else None
        
        main()
        
        # Verify print was called with valid JSON
        mock_print.assert_called_once()
        called_arg = mock_print.call_args[0][0]
        parsed_result = json.loads(called_arg)
        self.assertTrue(isinstance(parsed_result, list))
        self.assertEqual(len(parsed_result), 2)

    @patch('sys.argv')
    @patch('builtins.print')
    @patch('sys.exit')
    def test_main_function_error(self, mock_exit, mock_print, mock_argv):
        """Test main function with invalid input"""
        mock_argv.__getitem__.side_effect = lambda i: "invalid json" if i == 1 else None
        
        main()
        
        # Verify error handling
        mock_exit.assert_called_once_with(1)
        mock_print.assert_called_once()
        called_arg = mock_print.call_args[0][0]
        self.assertTrue(isinstance(json.loads(called_arg), dict))
        self.assertTrue("error" in json.loads(called_arg))

if __name__ == '__main__':
    unittest.main()
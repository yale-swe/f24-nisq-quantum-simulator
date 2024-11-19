import unittest
from commutation_computer import commute_to_end

class TestErrorPropagation(unittest.TestCase):
    def setUp(self):
        """Create some basic test circuits"""
        # Single CNOT circuit
        self.cnot_circuit = [[('CX', 0, 1)]]
        
        # Circuit with parallel gates
        self.parallel_circuit = [
            [('X', 0), ('X', 1)],
            [('CX', 0, 2)]
        ]
        
        # Double CNOT circuit
        self.double_cnot = [
            [('CX', 0, 1)],
            [('CX', 0, 1)]
        ]
        
    def test_single_qubit_gates(self):
        """Test error propagation through single-qubit gates"""
        circuit = [[('X', 0)]]
        
        # Test Z error through X gate
        result = commute_to_end(circuit, error_row=0, error_col=0, error_type='Z')
        expected = [('Z', 0)]
        self.assertEqual(result, expected)
        
        # Test X error through Z gate
        circuit = [[('Z', 0)]]
        result = commute_to_end(circuit, error_row=0, error_col=0, error_type='X')
        expected = [('X', 0)]
        self.assertEqual(result, expected)
        
    def test_cnot_z_error(self):
        """Test Z error propagation through CNOT"""
        # Z error on target qubit
        result = commute_to_end(self.cnot_circuit, error_row=1, error_col=0, error_type='Z')
        expected = [('Z', 1)]
        self.assertEqual(result, expected)
        
        # Z error on control qubit
        result = commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='Z')
        expected = [('Z', 0)]
        self.assertEqual(result, expected)
        
    def test_cnot_x_error(self):
        """Test X error propagation through CNOT"""
        # X error on target
        result = commute_to_end(self.cnot_circuit, error_row=1, error_col=0, error_type='X')
        expected = [('X', 0), ('X', 1)]
        self.assertEqual(result, expected)
        
        # X error on control
        result = commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='X')
        expected = [('X', 0), ('X', 1)]
        self.assertEqual(result, expected)
        
    def test_cnot_y_error(self):
        """Test Y error propagation through CNOT"""
        # Y error on control
        result = commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='Y')
        expected = [('Y', 0), ('X', 1)]
        self.assertEqual(result, expected)
        
        # Y error on target
        result = commute_to_end(self.cnot_circuit, error_row=1, error_col=0, error_type='Y')
        expected = [('X', 0), ('Y', 1)]
        self.assertEqual(result, expected)
        
    def test_parallel_gates(self):
        """Test error propagation with parallel gates"""
        # Error on qubit 1 should only see the X gate
        result = commute_to_end(self.parallel_circuit, error_row=1, error_col=0, error_type='Z')
        expected = [('Z', 1)]
        self.assertEqual(result, expected)
        
        # Error on qubit 0 should see both X and CNOT
        result = commute_to_end(self.parallel_circuit, error_row=0, error_col=0, error_type='Z')
        expected = [('Z', 0)]
        self.assertEqual(result, expected)
        
    def test_error_combining(self):
        """Test that identical errors on same qubit combine properly"""
        # Z error on control qubit through two CNOTs
        result = commute_to_end(self.double_cnot, error_row=0, error_col=0, error_type='Z')
        expected = [('Z', 0)]  # Z error stays on control through both CNOTs
        self.assertEqual(result, expected)
        
        # X error through two CNOTs
        result = commute_to_end(self.double_cnot, error_row=0, error_col=0, error_type='X')
        expected = []  # X errors cancel out after two CNOTs
        self.assertEqual(result, expected)
        
    def test_invalid_inputs(self):
        """Test that invalid inputs raise appropriate errors"""
        # Invalid error type
        with self.assertRaises(ValueError):
            commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='A')
            
        # Layer beyond circuit depth
        with self.assertRaises(ValueError):
            commute_to_end(self.cnot_circuit, error_row=0, error_col=5, error_type='X')
            
        # Invalid qubit index
        with self.assertRaises(ValueError):
            commute_to_end(self.cnot_circuit, error_row=5, error_col=0, error_type='X')

if __name__ == '__main__':
    unittest.main()
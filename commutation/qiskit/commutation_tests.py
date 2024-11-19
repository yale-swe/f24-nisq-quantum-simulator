import unittest
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator
from commutation_computer import *
import numpy as np

class TestErrorPropagation(unittest.TestCase):
    def setUp(self):
        """Create some basic circuits for testing"""
        # Single CNOT circuit
        self.cnot_circuit = QuantumCircuit(2)
        self.cnot_circuit.cx(0, 1)
        
        # Circuit with parallel gates
        self.parallel_circuit = QuantumCircuit(3)
        self.parallel_circuit.x(0)
        self.parallel_circuit.x(1)
        self.parallel_circuit.cx(0, 2)
        
        # More complex circuit
        self.complex_circuit = QuantumCircuit(2)
        self.complex_circuit.h(0)  # Not in our gate set, should raise error
        self.complex_circuit.cx(0, 1)
        self.complex_circuit.x(0)
        
    def verify_equivalent_circuits(self, circuit1, circuit2):
        """
        Verify that two circuits are equivalent up to global phase
        by comparing their unitary matrices
        """
        op1 = Operator(circuit1)
        op2 = Operator(circuit2)
        
        # Compare unitaries up to global phase
        mat1 = op1.data
        mat2 = op2.data
        
        # Normalize first elements to handle global phase
        if abs(mat1[0,0]) > 1e-10:
            mat1 = mat1 * (abs(mat1[0,0])/mat1[0,0])
        if abs(mat2[0,0]) > 1e-10:
            mat2 = mat2 * (abs(mat2[0,0])/mat2[0,0])
            
        np.testing.assert_array_almost_equal(mat1, mat2)

    def test_single_qubit_gates(self):
        """Test error propagation through single-qubit gates"""
        # Create circuit with single X gate
        qc = QuantumCircuit(1)
        qc.x(0)
        
        # Test Z error through X gate
        result = commute_to_end(qc, error_row=0, error_col=0, error_type='Z')
        expected = qc.copy()
        expected.z(0)  # Z error through X gate remains Z with phase
        self.verify_equivalent_circuits(result, expected)
        
    def test_cnot_z_error(self):
        """Test Z error propagation through CNOT"""
        # Z error on target qubit should remain Z on target
        result = commute_to_end(self.cnot_circuit, error_row=1, error_col=0, error_type='Z')
        
        expected = self.cnot_circuit.copy()
        expected.z(1)
        
        self.verify_equivalent_circuits(result, expected)
        
        # Z error on control qubit should remain only on control
        result = commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='Z')
        
        expected = self.cnot_circuit.copy()
        expected.z(0)  # Z error only on control
        
        self.verify_equivalent_circuits(result, expected)
        
    def test_cnot_x_error(self):
        """Test X error propagation through CNOT"""
        # X error on target should propagate to both qubits
        result = commute_to_end(self.cnot_circuit, error_row=1, error_col=0, error_type='X')
        
        expected = self.cnot_circuit.copy()
        expected.x(0)
        expected.x(1)
        
        self.verify_equivalent_circuits(result, expected)
        
        # X error on control should propagate to both qubits
        result = commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='X')
        
        expected = self.cnot_circuit.copy()
        expected.x(0)
        expected.x(1)  # X error propagates to both qubits
        
        self.verify_equivalent_circuits(result, expected)
        
    def test_cnot_y_error(self):
        """Test Y error propagation through CNOT"""
        # Y error on control
        result = commute_to_end(self.cnot_circuit, error_row=0, error_col=0, error_type='Y')
        
        expected = self.cnot_circuit.copy()
        expected.y(0)
        expected.x(1)
        
        self.verify_equivalent_circuits(result, expected)
        
        # Y error on target
        result = commute_to_end(self.cnot_circuit, error_row=1, error_col=0, error_type='Y')
        
        expected = self.cnot_circuit.copy()
        expected.x(0)
        expected.y(1)
        
        self.verify_equivalent_circuits(result, expected)
        
    def test_parallel_gates(self):
        """Test error propagation with parallel gates"""
        # Error on qubit 1 should only see the X gate
        result = commute_to_end(self.parallel_circuit, error_row=1, error_col=0, error_type='Z')
        
        expected = self.parallel_circuit.copy()
        expected.z(1)  # Z and X anticommute, so Z remains Z with a phase
        
        self.verify_equivalent_circuits(result, expected)
        
        # Error on qubit 0 should see both X and CNOT
        result = commute_to_end(self.parallel_circuit, error_row=0, error_col=0, error_type='Z')
        
        expected = self.parallel_circuit.copy()
        expected.z(0)  # Z error only affects control qubit through CNOT
        
        self.verify_equivalent_circuits(result, expected)
        
    def test_error_combining(self):
        """Test that identical errors on same qubit combine properly"""
        # Create circuit that would result in two Z errors on same qubit
        qc = QuantumCircuit(2)
        qc.cx(0, 1)
        qc.cx(0, 1)
        
        # Z error on control qubit through two CNOTs
        result = commute_to_end(qc, error_row=0, error_col=0, error_type='Z')
        
        # Z error on control stays on control through both CNOTs
        expected = qc.copy()
import unittest
import numpy as np
import qutip as qt
import base64
from quantum_simulator import *

"""
Quantum Circuit Evolution Unit Tests

These unit tests verify the correct implementation of quantum circuit evolution
using the intermediate representation format. The tests cover:

1. Single-qubit gates:
   - X (NOT) gate: Tested on |0>, |1>, |+>, and |-> states
   - Z gate: Tested on |0>, |1>, |+>, and |-> states
   - H (Hadamard) gate: Tested on |0>, |1>, |+>, and |-> states
   - Y gate: Tested on |0>, |1>, |+>, and |-> states

2. Two-qubit parallel operations:
   - XZ circuit: Applies X to qubit 0 and Z to qubit 1 simultaneously
   - HH circuit: Applies H to both qubits simultaneously

3. CNOT (Controlled-NOT) gate:
   - Tested on all four basis states: |00>, |01>, |10>, and |11>

Tests include both precise quantum state verification and full pipeline testing
through the simulate_quantum_circuit function.
"""


class TestQuantumCircuitEvolution(unittest.TestCase):
    def setUp(self):
        self.no_ops = [qt.tensor(I, I)]
        self.atol = 5e-4
        self.rtol = 5e-4

        def is_valid_base64_png(b64str):
            try:
                decoded = base64.b64decode(b64str)
                return decoded.startswith(b"\x89PNG")
            except:
                return False

        self.is_valid_base64_png = is_valid_base64_png

    def assertStateAlmostEqual(self, state1, state2):
        np.testing.assert_allclose(
            state1.full(), state2.full(), atol=self.atol, rtol=self.rtol
        )

    def create_layer(self, gates, num_qubits=2):
        return {"numRows": num_qubits, "gates": gates}

    def test_single_qubit_gates_state_verification(self):
        # Test X gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("X", 0)])],
                qt.ket2dm(qt.tensor(zero, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(one, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("X", 0)])],
                qt.ket2dm(qt.tensor(one, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("X", 0)])],
                qt.ket2dm(qt.tensor(plus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(plus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("X", 0)])],
                qt.ket2dm(qt.tensor(minus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(-minus, zero)),
        )

        # Test Z gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Z", 0)])],
                qt.ket2dm(qt.tensor(zero, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Z", 0)])],
                qt.ket2dm(qt.tensor(one, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(-one, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Z", 0)])],
                qt.ket2dm(qt.tensor(plus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(minus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Z", 0)])],
                qt.ket2dm(qt.tensor(minus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(plus, zero)),
        )

        # Test H gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("H", 0)])],
                qt.ket2dm(qt.tensor(zero, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(plus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("H", 0)])],
                qt.ket2dm(qt.tensor(one, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(minus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("H", 0)])],
                qt.ket2dm(qt.tensor(plus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("H", 0)])],
                qt.ket2dm(qt.tensor(minus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(one, zero)),
        )

        # Test Y gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Y", 0)])],
                qt.ket2dm(qt.tensor(zero, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(1j * one, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Y", 0)])],
                qt.ket2dm(qt.tensor(one, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(-1j * zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Y", 0)])],
                qt.ket2dm(qt.tensor(plus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(1j * minus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("Y", 0)])],
                qt.ket2dm(qt.tensor(minus, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(-1j * plus, zero)),
        )

        # Test gates on second qubit
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("X", 1)])],
                qt.ket2dm(qt.tensor(zero, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(zero, one)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [self.create_layer([("H", 1)])],
                qt.ket2dm(qt.tensor(zero, zero)),
                self.no_ops,
            ),
            qt.ket2dm(qt.tensor(zero, plus)),
        )

    def test_two_qubit_gates_state_verification(self):
        # Test XZ on |01>
        xz_circuit = [self.create_layer([("X", 0), ("Z", 1)])]
        input_state = qt.ket2dm(qt.tensor(zero, one))
        expected_output = qt.ket2dm(qt.tensor(one, -one))
        self.assertStateAlmostEqual(
            rep_to_evolution(xz_circuit, input_state, self.no_ops), expected_output
        )

        # Test HH on |00>
        hh_circuit = [self.create_layer([("H", 0), ("H", 1)])]
        input_state = qt.ket2dm(qt.tensor(zero, zero))
        expected_output = qt.ket2dm(qt.tensor(plus, plus))
        self.assertStateAlmostEqual(
            rep_to_evolution(hh_circuit, input_state, self.no_ops), expected_output
        )

    def test_cnot_gate_state_verification(self):
        cnot_circuit = [self.create_layer([("CX", 0, 1)])]

        # Test CNOT on |00>
        input_state = qt.ket2dm(qt.tensor(zero, zero))
        expected_output = qt.ket2dm(qt.tensor(zero, zero))
        self.assertStateAlmostEqual(
            rep_to_evolution(cnot_circuit, input_state, self.no_ops), expected_output
        )

        # Test CNOT on |01>
        input_state = qt.ket2dm(qt.tensor(zero, one))
        expected_output = qt.ket2dm(qt.tensor(zero, one))
        self.assertStateAlmostEqual(
            rep_to_evolution(cnot_circuit, input_state, self.no_ops), expected_output
        )

        # Test CNOT on |10>
        input_state = qt.ket2dm(qt.tensor(one, zero))
        expected_output = qt.ket2dm(qt.tensor(one, one))
        self.assertStateAlmostEqual(
            rep_to_evolution(cnot_circuit, input_state, self.no_ops), expected_output
        )

        # Test CNOT on |11>
        input_state = qt.ket2dm(qt.tensor(one, one))
        expected_output = qt.ket2dm(qt.tensor(one, zero))
        self.assertStateAlmostEqual(
            rep_to_evolution(cnot_circuit, input_state, self.no_ops), expected_output
        )

    def test_simulate_quantum_circuit_coverage(self):
        # Test single-qubit gates
        result = simulate_quantum_circuit([self.create_layer([("X", 0)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

        result = simulate_quantum_circuit([self.create_layer([("Z", 0)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

        result = simulate_quantum_circuit([self.create_layer([("H", 0)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

        result = simulate_quantum_circuit([self.create_layer([("Y", 0)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

        # Test two-qubit circuits
        result = simulate_quantum_circuit([self.create_layer([("X", 0), ("Z", 1)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

        result = simulate_quantum_circuit([self.create_layer([("H", 0), ("H", 1)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

        # Test CNOT circuit
        result = simulate_quantum_circuit([self.create_layer([("CX", 0, 1)])])
        self.assertTrue(self.is_valid_base64_png(result["plot_image"]))

    def test_error_cases(self):
        # Test invalid single-qubit gate
        result = simulate_quantum_circuit([self.create_layer([("INVALID", 0)])])
        self.assertFalse(result["success"])
        self.assertTrue("Invalid gate format" in result["error"] or 
                       "Unsupported single-qubit gate" in result["error"])

        # Test invalid two-qubit gate
        result = simulate_quantum_circuit([self.create_layer([("INVALID", 0, 1)])])
        self.assertFalse(result["success"])
        self.assertTrue("Invalid gate format" in result["error"] or 
                       "Unsupported two-qubit gate" in result["error"])

        # Test invalid gate format
        result = simulate_quantum_circuit([self.create_layer([("X", 0, 1, 2)])])
        self.assertFalse(result["success"])
        self.assertTrue("Invalid gate format" in result["error"])

        # Test invalid input state - this one still raises TypeError because it's in rep_to_evolution
        with self.assertRaises(TypeError):
            rep_to_evolution([self.create_layer([("X", 0)])], qt.basis(2, 0), self.no_ops)

    def test_complex_serialization(self):
        # Test complex number serialization
        complex_num = 1 + 2j
        serialized = complex_to_serializable(complex_num)
        self.assertEqual(serialized["real"], 1.0)
        self.assertEqual(serialized["imag"], 2.0)

        # Test matrix serialization
        matrix = np.array([[1 + 1j, 2 + 2j], [3 + 3j, 4 + 4j]])
        serialized = matrix_to_serializable(matrix)
        self.assertEqual(len(serialized), 2)
        self.assertEqual(len(serialized[0]), 2)
        self.assertEqual(serialized[0][0]["real"], 1.0)
        self.assertEqual(serialized[0][0]["imag"], 1.0)


if __name__ == "__main__":
    unittest.main()

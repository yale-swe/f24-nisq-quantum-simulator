import unittest
from evolution import *

"""
Quantum Circuit Evolution Unit Tests

These unit tests verify the correct implementation of quantum circuit evolution
using the intermediate representation format. The tests cover:

1. Single-qubit gates:
   - X (NOT) gate: Tested on |0>, |1>, |+>, and |-> states
   - Z gate: Tested on |0>, |1>, |+>, and |-> states
   - H (Hadamard) gate: Tested on |0>, |1>, |+>, and |-> states
   - Y gate: Tested on |0>, |1>, |+>, and |-> states

   All single-qubit gates are tested on the 0-indexed qubit, with the 1-indexed qubit
   remaining in the |0> state.

2. Two-qubit parallel operations:
   - XZ circuit: Applies X to qubit 0 and Z to qubit 1 simultaneously
   - HH circuit: Applies H to both qubits simultaneously

3. CNOT (Controlled-NOT) gate:
   - Tested on all four basis states: |00>, |01>, |10>, and |11>

The tests use the `assertStateAlmostEqual` method to compare the output states
with the expected states, allowing for small numerical discrepancies due to
floating-point arithmetic.
"""


class TestQuantumCircuitEvolution(unittest.TestCase):
    def setUp(self):
        self.no_ops = [qt.tensor(I, I)]
        self.atol = 5e-4
        self.rtol = 5e-4

    def assertStateAlmostEqual(self, state1, state2):
        np.testing.assert_allclose(
            state1.full(), state2.full(), atol=self.atol, rtol=self.rtol
        )

    def test_single_qubit_gates(self):
        # Test X gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("X", 0)]], qt.ket2dm(qt.tensor(zero, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(one, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("X", 0)]], qt.ket2dm(qt.tensor(one, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("X", 0)]], qt.ket2dm(qt.tensor(plus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(plus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("X", 0)]], qt.ket2dm(qt.tensor(minus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(-minus, zero)),
        )

        # Test Z gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Z", 0)]], qt.ket2dm(qt.tensor(zero, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Z", 0)]], qt.ket2dm(qt.tensor(one, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(-one, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Z", 0)]], qt.ket2dm(qt.tensor(plus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(minus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Z", 0)]], qt.ket2dm(qt.tensor(minus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(plus, zero)),
        )

        # Test H gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("H", 0)]], qt.ket2dm(qt.tensor(zero, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(plus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("H", 0)]], qt.ket2dm(qt.tensor(one, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(minus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("H", 0)]], qt.ket2dm(qt.tensor(plus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("H", 0)]], qt.ket2dm(qt.tensor(minus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(one, zero)),
        )

        # Test Y gate on all basis states
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Y", 0)]], qt.ket2dm(qt.tensor(zero, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(1j * one, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Y", 0)]], qt.ket2dm(qt.tensor(one, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(-1j * zero, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Y", 0)]], qt.ket2dm(qt.tensor(plus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(1j * minus, zero)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("Y", 0)]], qt.ket2dm(qt.tensor(minus, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(-1j * plus, zero)),
        )

        # Test gates on second qubit
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("X", 1)]], qt.ket2dm(qt.tensor(zero, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(zero, one)),
        )
        self.assertStateAlmostEqual(
            rep_to_evolution(
                [[("H", 1)]], qt.ket2dm(qt.tensor(zero, zero)), self.no_ops
            ),
            qt.ket2dm(qt.tensor(zero, plus)),
        )

    def test_two_qubit_gates(self):
        # Test XZ on |01>
        xz_circuit = [[("X", 0), ("Z", 1)]]
        input_state = qt.ket2dm(qt.tensor(zero, one))
        expected_output = qt.ket2dm(qt.tensor(one, -one))
        self.assertStateAlmostEqual(
            rep_to_evolution(xz_circuit, input_state, self.no_ops), expected_output
        )

        # Test HH on |00>
        hh_circuit = [[("H", 0), ("H", 1)]]
        input_state = qt.ket2dm(qt.tensor(zero, zero))
        expected_output = qt.ket2dm(qt.tensor(plus, plus))
        self.assertStateAlmostEqual(
            rep_to_evolution(hh_circuit, input_state, self.no_ops), expected_output
        )

    def test_cnot_gate(self):
        cnot_circuit = [[("CX", 0, 1)]]

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


if __name__ == "__main__":
    unittest.main()

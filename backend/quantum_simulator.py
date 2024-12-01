import sys
import json
import numpy as np
from io import BytesIO
import base64
import matplotlib.pyplot as plt
import qutip as qt
import numpy as np
import json
import os
import itertools

from visualizations.Density_Plot import create_density_matrix_plot

"""
Quantum Circuit Evolution with Intermediate Representation

This code implements quantum circuit evolution using an intermediate representation
of quantum circuits. The intermediate representation is a list of layers, where each
layer is a list of tuples representing quantum gates.

1. Intermediate Representation Format:
   The circuit is represented as a list of layers: [[layer1], [layer2], ...]
   Each layer is a list of tuples: [(gate1), (gate2), ...]
   Each tuple represents a gate: (gate_name, qubit_index) for 1-qubit gates
                                 (gate_name, control_qubit, target_qubit) for 2-qubit gates

   Supported gates: 'I' (Identity), 'X', 'Y', 'Z', 'H' (Hadamard), 'CX' (CNOT), 'S', 'T'
"""

# Basic gate set
I = qt.qeye(2)
X = qt.sigmax()
Y = qt.sigmay()
Z = qt.sigmaz()
H = qt.Qobj([[1, 1], [1, -1]]) / np.sqrt(2)
# S gate (phase gate): |0⟩ → |0⟩, |1⟩ → i|1⟩
S = qt.Qobj([[1, 0], [0, 1j]])
# T gate (π/8 gate): |0⟩ → |0⟩, |1⟩ → exp(iπ/4)|1⟩
T = qt.Qobj([[1, 0], [0, np.exp(1j * np.pi / 4)]])

zero, one = qt.basis(2, 0), qt.basis(2, 1)
plus = (zero + one).unit()
minus = (zero - one).unit()


def f_H(t, delta_t, start_time):
    """
    Time-dependent coefficient function for Hamiltonian evolution.

    Args:
        t (float): Current time
        delta_t (float): Duration of the gate
        start_time (float): Time at which the gate starts

    Returns:
        float: 1 if within the gate duration window, 0 otherwise
    """
    t0, t1 = start_time, start_time + delta_t
    return 1 if t0 <= t < t1 else 0


def physical_one_qubit_evolution(input_state, qubit_indices, gate_names, c_ops):
    """
    Applies specified single-qubit gates to selected qubits in a multi-qubit circuit.
    Modified to handle S and T gates with proper phase evolution.
    """
    num_qubits = int(np.log2(input_state.shape[0]))

    if isinstance(qubit_indices, int):
        qubit_indices = [qubit_indices]
        gate_names = [gate_names]

    if len(qubit_indices) != len(gate_names):
        raise ValueError(
            "The number of qubit indices must match the number of gate names."
        )

    # Define gate map with proper scaling factors
    gate_map = {
        "I": (I, 1.0),
        "X": (X, np.pi / 2),
        "Y": (Y, np.pi / 2),
        "Z": (Z, np.pi / 2),
        "H": (H, np.pi / 2),
        "S": (Z, np.pi / 4),  # S = √Z
        "T": (Z, np.pi / 8),  # T = √S = fourth_root(Z)
    }

    for gate_name in gate_names:
        if gate_name not in gate_map:
            raise ValueError(
                f"Invalid gate name. Supported gates are: {', '.join(gate_map.keys())}"
            )

    qubit_ops = []
    scaling_factor = 1.0

    for i in range(num_qubits):
        if i in qubit_indices:
            gate_index = qubit_indices.index(i)
            gate_name = gate_names[gate_index]
            gate_op, gate_scaling = gate_map[gate_name]
            qubit_ops.append(gate_op)
            scaling_factor = gate_scaling  # Use the scaling factor of the last gate
        else:
            qubit_ops.append(I)

    gate_op = scaling_factor * qt.tensor(*qubit_ops)

    td_list = [[gate_op, lambda t, args: f_H(t, 1, 0)]]

    times = np.linspace(0, 1)
    output_state = qt.mesolve(td_list, input_state, times, c_ops=c_ops).states[-1]

    return output_state


def physical_cnot_evolution(input_state, ctrl_idx, tgt_idx, c_ops):
    """
    Applies a physical CNOT gate between two qubits and returns the resulting density matrix,
    evolving the state gate-by-gate.

    This is IBM's ansatz to implement a CNOT gate.

    Args:
    input_state (qutip.Qobj): The input quantum state (density matrix)
    ctrl_idx (int): Index of the control qubit
    tgt_idx (int): Index of the target qubit
    c_ops (list): Error model/Kraus Operators

    Returns:
    qutip.Qobj: The resulting density matrix after applying the CNOT gate
    """
    num_qubits = int(np.log2(input_state.shape[0]))

    sq_z_gate_duration = 1
    sq_x_gate_duration = 1
    sq_zx_gate_duration = 10
    theta = np.pi / 4

    # Initialize the current state
    current_state = input_state
    current_t = 0

    # 1. dagger sqrt{Z} gate on control qubit
    op_list = [I if i != ctrl_idx else Z for i in range(num_qubits)]
    H_CX_G1 = qt.tensor(*op_list)
    H_CX_G1 = H_CX_G1 * theta / sq_z_gate_duration
    H_CX_td1 = [-H_CX_G1, lambda t, args: f_H(t, 1, 0)]
    times = np.linspace(0, 1)
    result1 = qt.mesolve([H_CX_td1], current_state, times, c_ops=c_ops)
    current_state = result1.states[-1]
    current_t += sq_z_gate_duration

    # 2. sqrt{ZX} gate
    op_list = [
        I if i not in [ctrl_idx, tgt_idx] else Z if i == ctrl_idx else X
        for i in range(num_qubits)
    ]
    H_CX_G2 = qt.tensor(*op_list)
    H_CX_G2 = H_CX_G2 * theta / sq_zx_gate_duration
    H_CX_td2 = [H_CX_G2, lambda t, args: f_H(t, 10, 0)]
    times2 = np.linspace(0, 10)
    result2 = qt.mesolve([H_CX_td2], current_state, times2, c_ops=c_ops)
    current_state = result2.states[-1]
    current_t += sq_zx_gate_duration

    # 3. dagger sqrt{X} gate on target qubit
    op_list = [I if i != tgt_idx else X for i in range(num_qubits)]
    H_CX_G3 = qt.tensor(*op_list)
    H_CX_G3 = H_CX_G3 * theta / sq_x_gate_duration
    H_CX_td3 = [-H_CX_G3, lambda t, args: f_H(t, 1, 0)]
    result3 = qt.mesolve([H_CX_td3], current_state, times, c_ops=c_ops)
    final_state = result3.states[-1]

    return final_state


def rep_to_evolution(circuit_rep, input_state, c_ops):
    """
    Evolves an input state through a quantum circuit.
    Now properly handles S and T gates with correct phases.
    """
    if not input_state.isoper:
        raise TypeError(
            "input_state must be a density matrix (Qobj operator), not a ket."
        )

    current_state = input_state
    layers = [x["gates"] for x in circuit_rep]
    for layer in layers:
        one_qubit_gates = []
        one_qubit_indices = []

        for gate in layer:
            if len(gate) == 2:  # Single-qubit gate
                gate_name, qubit_index = gate
                if gate_name in ["I", "X", "Y", "Z", "H", "S", "T"]:
                    one_qubit_gates.append(gate_name)
                    one_qubit_indices.append(qubit_index)
                else:
                    raise ValueError(f"Unsupported single-qubit gate: {gate_name}")
            elif len(gate) == 3:  # Two-qubit gate (CNOT)
                gate_name, control, target = gate
                if gate_name == "CX":
                    if one_qubit_gates:
                        current_state = physical_one_qubit_evolution(
                            current_state, one_qubit_indices, one_qubit_gates, c_ops
                        )
                        one_qubit_gates = []
                        one_qubit_indices = []
                    current_state = physical_cnot_evolution(
                        current_state, control, target, c_ops
                    )
                else:
                    raise ValueError(f"Unsupported two-qubit gate: {gate_name}")
            else:
                raise ValueError(f"Invalid gate format: {gate}")

        if one_qubit_gates:
            current_state = physical_one_qubit_evolution(
                current_state, one_qubit_indices, one_qubit_gates, c_ops
            )

    return current_state


def get_depolarizing_ops(p, n):
    """
    Generate depolarizing operators for the error model.
    """
    single_qubit_ops = [
        np.sqrt(1 - p) * I,
        np.sqrt(p / 3) * X,
        np.sqrt(p / 3) * Y,
        np.sqrt(p / 3) * Z,
    ]

    c_ops = [qt.tensor(*ops) for ops in itertools.product(single_qubit_ops, repeat=n)]
    return c_ops


def complex_to_serializable(z):
    """Convert a complex number to a serializable dictionary."""
    return {"real": float(np.real(z)), "imag": float(np.imag(z))}


def matrix_to_serializable(matrix):
    """Convert a matrix with complex entries to serializable format."""
    return [[complex_to_serializable(x) for x in row] for row in matrix]


def validate_circuit_layers(circuit_rep):
    """
    Validates that each layer in the circuit representation has no overlapping qubits.

    Args:
        circuit_rep (list): List of layers, where each layer is a list of gate tuples.
            Gate tuples can be either:
            - Single qubit gates: (gate_name, qubit_index)
            - Two qubit gates: (gate_name, control_qubit, target_qubit)

    Raises:
        ValueError: If any layer contains gates that operate on the same qubit.

    Returns:
        None if the circuit is valid.
    """
    layers = [x["gates"] for x in circuit_rep]

    for layer_idx, layer in enumerate(layers):
        # Keep track of which qubits are used in this layer
        used_qubits = set()

        for gate in layer:
            # Extract qubit indices based on gate type
            if len(gate) == 2:  # Single qubit gate
                gate_qubits = {gate[1]}
            elif len(gate) == 3:  # Two qubit gate
                gate_qubits = {gate[1], gate[2]}
            else:
                raise ValueError(f"Invalid gate format in layer {layer_idx}: {layer}")

            # Check for overlap with previously used qubits
            overlap = gate_qubits.intersection(used_qubits)
            if overlap:
                raise ValueError(
                    f"Invalid layer {layer_idx}: Qubit(s) {overlap} used in multiple gates.\n"
                    f"Layer contents: {layer}"
                )

            # Add these qubits to the used set
            used_qubits.update(gate_qubits)


def simulate_quantum_circuit(circuit_ir, c_ops=None):
    """
    Main simulation function that takes a circuit IR and returns the simulation results.
    """
    try:
        # Quick validation checks first
        num_qubits = max([x["numRows"] for x in circuit_ir])

        # Early c_ops dimension check
        if c_ops is not None:
            expected_dim = 2**num_qubits
            for i, op in enumerate(c_ops):
                if not isinstance(op, qt.Qobj):
                    return {
                        "success": False,
                        "error": f"Invalid Kraus operator format at index {i}",
                    }
                if op.dims != [[expected_dim], [expected_dim]]:
                    return {
                        "success": False,
                        "error": f"Kraus operator dimensions mismatch. Expected {expected_dim}x{expected_dim} for {num_qubits} qubits, but got {op.dims[0][0]}x{op.dims[1][0]}",
                    }

        try:
            validate_circuit_layers(circuit_ir)
        except ValueError as e:
            raise ValueError(f"Invalid circuit configuration: {str(e)}")

        # Initialize quantum state with correct dimensions
        dim = 2**num_qubits
        initial_state = qt.basis(dim, 0) * qt.basis(dim, 0).dag()
        initial_state.dims = [[2] * num_qubits, [2] * num_qubits]

        if c_ops == None:
            c_ops = get_depolarizing_ops(1e-2, num_qubits)

        try:
            final_state = rep_to_evolution(circuit_ir, initial_state, c_ops)
        except (TypeError, ValueError) as e:
            raise ValueError(f"Error during quantum evolution: {str(e)}")
        except qt.QobjError:
            raise ValueError(
                "Quantum operator mismatch. This may be due to incompatible gate operations."
            )

        final_state_array = final_state.full()

        fig = create_density_matrix_plot(final_state_array)
        buffer = BytesIO()
        fig.savefig(buffer, format="png")
        buffer.seek(0)
        plot_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        plt.close(fig)

        return {"success": True, "plot_image": plot_base64}

    except ValueError as e:
        return {"success": False, "error": str(e)}
    except TypeError as e:
        return {"success": False, "error": f"Type error: {str(e)}"}
    except MemoryError:
        return {
            "success": False,
            "error": "Circuit is too large for available memory. Try reducing the number of qubits or gates.",
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error during simulation: {str(e)}",
        }


# If running as main script (from API)
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("circuit_ir", type=str)
    parser.add_argument(
        "--noise-model", type=str, help="Path to .npy file containing noise model"
    )
    args = parser.parse_args()

    # Get circuit IR from command line argument
    circuit_ir = json.loads(args.circuit_ir)

    # Load noise model if provided
    c_ops = None
    if args.noise_model:
        # Load the numpy array and convert to qutip operators
        c_ops = np.load(args.noise_model)
        c_ops = [qt.Qobj(op) for op in c_ops]

    # Run simulation with custom noise model if provided, otherwise uses default
    result = simulate_quantum_circuit(circuit_ir, c_ops)

    # Print result as JSON for API to capture
    print(json.dumps(result))

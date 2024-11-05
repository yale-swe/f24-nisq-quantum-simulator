import qiskit
import qutip as qt
import numpy as np
import json
import os

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

   Supported gates: 'I' (Identity), 'X', 'Y', 'Z', 'H' (Hadamard), 'CX' (CNOT)

   Examples:
   a) Bell Circuit:
      [[('H', 0)], [('CX', 0, 1)]]

   b) All Hadamards followed by all X gates on a 4-qubit system:
      [[('H', 0), ('H', 1), ('H', 2), ('H', 3)], [('X', 0), ('X', 1), ('X', 2), ('X', 3)]]

   c) Parallel 1-qubit and 2-qubit gates:
      [[('H', 0), ('CX', 1, 2)]]

2. Current Limitations:
   The current implementation has a limitation when parallelizing 2-qubit gates with
   1-qubit gates. It correctly handles such parallelization only for 2-qubit circuits.
   For circuits with more than 2 qubits, parallelizing 2-qubit gates (like CNOT) with
   1-qubit gates in the same layer may not produce correct results.

   This limitation will be addressed in future versions to support arbitrary 
   parallelization of 1-qubit and 2-qubit gates for any number of qubits.

   For now, to ensure correct results for circuits with more than 2 qubits, 
   it's recommended to place 2-qubit gates in separate layers from 1-qubit gates.

Future improvements will focus on expanding the capabilities to handle more complex
parallel operations in circuits of any size.
"""

# start of fetch json file code
def fetch_outputs():
    # path to the root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(script_dir, '..'))
    # outputs.json is now in the root directory
    file_path = os.path.join(root_dir, 'outputs.json')
    try:
        with open(file_path, 'r') as f:
            outputs = json.load(f)
        return outputs
    except FileNotFoundError:
        print('outputs.json file not found.')
        return []
    except json.JSONDecodeError:
        print('Error decoding JSON from outputs.json.')
        return []

def main():
    outputs = fetch_outputs()
    if not outputs:
        print('No outputs to process.')
        return

    for item in outputs:
        row_index = item['row_index']
        values = item['values']
        print(f"Row {row_index} Output: {values}")
        # Add your processing logic here

if __name__ == '__main__':
    main()
#end of fetch json file code

I = qt.qeye(2)
X = qt.sigmax()
Y = qt.sigmay()
Z = qt.sigmaz()
H = qt.Qobj([[1, 1], [1, -1]]) / np.sqrt(2)
zero, one = qt.basis(2,0), qt.basis(2,1)
plus = (zero+one).unit()
minus = (zero-one).unit()

def f_H(t, delta_t, start_time):
		t0, t1 = start_time, start_time + delta_t
		return 1 if t0 <= t < t1 else 0

def physical_one_qubit_evolution(input_state, qubit_indices, gate_names, c_ops):
	"""
	Applies specified single-qubit gates to selected qubits in a multi-qubit circuit.

	Args:
	input_state (qutip.Qobj): The input quantum state as a density matrix.
	qubit_indices (int or list of int): Index or indices of the qubits to apply the gates.
	gate_names (str or list of str): Names of gates
	c_ops (list): Error model/Kraus Operators

	Returns:
	qutip.Qobj: The resulting density matrix

	"""

	num_qubits = int(np.log2(input_state.shape[0]))

	if isinstance(qubit_indices, int):
		qubit_indices = [qubit_indices]
		gate_names = [gate_names]
	
	if len(qubit_indices) != len(gate_names):
		raise ValueError("The number of qubit indices must match the number of gate names.")
	
	gate_map = {'I': I, 'X': X, 'Y': Y, 'Z': Z, 'H': H}
	
	for gate_name in gate_names:
		if gate_name not in gate_map:
			raise ValueError(f"Invalid gate name. Supported gates are: {', '.join(gate_map.keys())}")
	
	qubit_ops = []

	for i in range(num_qubits):
		if i in qubit_indices:
			gate_index = qubit_indices.index(i)
			gate_name = gate_names[gate_index]
			qubit_op = gate_map[gate_name]
		else:
			# If qubit is not operated on, apply identity
			qubit_op = I
		
		qubit_ops.append(qubit_op)
		
	gate_op = np.pi/2 * qt.tensor(*qubit_ops)
	
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
	theta = np.pi/4

	# Initialize the current state
	current_state = input_state
	current_t = 0

	# 1. dagger sqrt{Z} gate on control qubit
	op_list = [I if i != ctrl_idx else Z for i in range(num_qubits)]
	H_CX_G1 = qt.tensor(*op_list)
	H_CX_G1 = H_CX_G1 * theta / sq_z_gate_duration
	H_CX_td1 = [-H_CX_G1, lambda t, args: f_H(t, 1, 0)]
	times = np.linspace(0,1)
	result1 = qt.mesolve([H_CX_td1], current_state, times, c_ops=c_ops)
	current_state = result1.states[-1]
	current_t += sq_z_gate_duration

	# 2. sqrt{ZX} gate
	op_list = [I if i not in [ctrl_idx, tgt_idx] else Z if i == ctrl_idx else X for i in range(num_qubits)]
	H_CX_G2 = qt.tensor(*op_list)
	H_CX_G2 = H_CX_G2 * theta / sq_zx_gate_duration
	H_CX_td2 = [H_CX_G2, lambda t, args: f_H(t, 10, 0)]
	times2 = np.linspace(0,10)
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
    Evolves an input state through a quantum circuit represented by our intermediate representation.

    Args:
    circuit_rep (list): An intermediate representation in our format
    input_state (qutip.Qobj): The input quantum state as a density matrix
    c_ops (list): List of collapse operators for the quantum system.

    Returns:
    qutip.Qobj: The final density matrix after applying the circuit

    """

    if not input_state.isoper:
        raise TypeError("input_state must be a density matrix (Qobj operator), not a ket.")

    current_state = input_state

    for layer in circuit_rep:
        one_qubit_gates = []
        one_qubit_indices = []
        
        for gate in layer:
            if len(gate) == 2:  # Single-qubit gate
                gate_name, qubit_index = gate
                if gate_name in ['I', 'X', 'Y', 'Z', 'H']:
                    one_qubit_gates.append(gate_name)
                    one_qubit_indices.append(qubit_index)
                else:
                    raise ValueError(f"Unsupported single-qubit gate: {gate_name}")
            elif len(gate) == 3:  # Two-qubit gate (for now, just CNOT)
                gate_name, control, target = gate
                if gate_name == 'CX':
                    if one_qubit_gates:
                        current_state = physical_one_qubit_evolution(current_state, one_qubit_indices, one_qubit_gates, c_ops)
                        one_qubit_gates = []
                        one_qubit_indices = []
                    current_state = physical_cnot_evolution(current_state, control, target, c_ops)
                else:
                    raise ValueError(f"Unsupported two-qubit gate: {gate_name}")
            else:
                raise ValueError(f"Invalid gate format: {gate}")
        
        if one_qubit_gates:
            current_state = physical_one_qubit_evolution(current_state, one_qubit_indices, one_qubit_gates, c_ops)

    return current_state


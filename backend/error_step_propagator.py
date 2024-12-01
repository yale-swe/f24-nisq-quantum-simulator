# backend/propagate_error.py
import sys
import json
import os

# Add the project root directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from backend.utils import *
from backend.error_propagation import (
    simplify_propagated_errors,
    propagate_error_layer_through_layer,
    Layer,
    ErrorLayer,
)


def propagate_first_error_layer(circuit_ir):
    """
    Propagates the first error layer in the circuit according to specific rules.

    Rules:
    1. If no error layers or error layer is last, do nothing
    2. If next layer is empty, move errors forward and clear original layer
    3. If next layer is error layer, combine errors and clear original layer
    4. If next layer has gates, swap and propagate
    """
    # Find first error layer and its index
    error_index = next(
        (i for i, layer in enumerate(circuit_ir) if layer["type"] == "error"), -1
    )

    # Case 1: No error layers or error layer is last
    if error_index == -1 or error_index == len(circuit_ir) - 1:
        return circuit_ir

    # Get current error layer and next layer
    error_layer = circuit_ir[error_index]
    next_layer = circuit_ir[error_index + 1]

    # Create deep copy of circuit_ir to avoid modifying original
    result = [layer.copy() for layer in circuit_ir]

    # Case 2: Next layer is empty
    if not next_layer["gates"]:
        # Move all errors forward and clear original layer
        result[error_index] = {"type": "error", "gates": []}  # Clear first layer
        result[error_index + 1] = {
            "type": "error",
            "gates": error_layer["gates"].copy(),  # Move errors forward
        }
        return result

    # Case 3: Next layer is also an error layer
    if next_layer["type"] == "error":
        # Combine errors using Pauli algebra
        combined_errors = simplify_propagated_errors(
            error_layer["gates"] + next_layer["gates"]
        )
        result[error_index] = {"type": "error", "gates": []}  # Clear first layer
        result[error_index + 1] = {
            "type": "error",
            "gates": combined_errors,  # Combined errors in second layer
        }
        return result

    # Case 4: Next layer has gates
    if next_layer["gates"]:
        # Convert layers to Layer/ErrorLayer objects for propagation
        num_qubits = max(
            max(gate[1] for gate in layer["gates"]) + 1 if layer["gates"] else 0
            for layer in [error_layer, next_layer]
        )

        error_layer_obj = ErrorLayer(error_layer["gates"], num_qubits)
        gate_layer_obj = Layer(next_layer["gates"], num_qubits)

        # Propagate errors through gates
        propagated_errors = propagate_error_layer_through_layer(
            error_layer_obj, gate_layer_obj
        )

        # Create result with swapped layers
        result[error_index] = {
            "type": "normal",
            "gates": next_layer["gates"].copy(),  # Original gates move back
        }
        result[error_index + 1] = {
            "type": "error",
            "gates": propagated_errors.gates,  # Propagated errors move forward
        }
        return result

    return result


def main():
    try:
        # Read IR from command line argument
        circuit_ir = json.loads(sys.argv[1])

        # Propagate the first error layer
        propagated_ir = propagate_first_error_layer(circuit_ir)

        # Output the result
        print(json.dumps(propagated_ir))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

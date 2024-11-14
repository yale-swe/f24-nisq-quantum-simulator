import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.colors import LinearSegmentedColormap


def create_density_matrix_plot(quantum_matrix):
    """
    Create a 3D bar plot visualization of a density matrix with enhanced phase visualization
    using a rainbow colormap from red through violet.

    Args:
        quantum_matrix: numpy array of shape (2^n, 2^n) representing the density matrix
                       for n qubits

    Returns:
        matplotlib figure object containing the 3D visualization
    """
    # Verify matrix is square and dimensions are powers of 2
    n = quantum_matrix.shape[0]
    if quantum_matrix.shape != (n, n):
        raise ValueError("Matrix must be square")
    if not (n & (n - 1) == 0):
        raise ValueError("Matrix dimensions must be powers of 2")

    # Calculate number of qubits
    num_qubits = int(np.log2(n))

    # Calculate magnitude and phase of each element
    magnitudes = np.abs(quantum_matrix)
    phases = np.angle(quantum_matrix)

    # Create rainbow colormap
    colors = [
        (1.0, 0.0, 0.0),  # Red
        (1.0, 0.5, 0.0),  # Orange
        (1.0, 1.0, 0.0),  # Yellow
        (0.0, 1.0, 0.0),  # Green
        (0.0, 1.0, 1.0),  # Cyan
        (0.0, 0.0, 1.0),  # Blue
        (0.5, 0.0, 0.5),  # Purple
        (1.0, 0.0, 0.0),  # Back to Red
    ]

    # Create custom colormap with more interpolation points for smoother transitions
    nodes = np.linspace(0, 1, len(colors))
    custom_cmap = LinearSegmentedColormap.from_list(
        "rainbow_phase", list(zip(nodes, colors)), N=256
    )

    # Normalize phases to [0, 1] interval for colormap
    normalized_phases = (phases + np.pi) / (2 * np.pi)

    # Apply colormap to get colors for each bar
    colors = custom_cmap(normalized_phases.flatten())

    # Set up 3D plot with larger figure size
    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(111, projection="3d")

    # Define grid positions
    x_pos, y_pos = np.meshgrid(range(n), range(n), indexing="ij")
    x_pos = x_pos.ravel()
    y_pos = y_pos.ravel()
    z_pos = np.zeros_like(x_pos)

    # Define bar sizes
    dx = dy = 0.8  # Make bars slightly wider
    dz = magnitudes.flatten()

    # Plot 3D bars
    bars = ax.bar3d(x_pos, y_pos, z_pos, dx, dy, dz, color=colors, shade=True)

    # Generate basis state labels
    def generate_basis_labels(num_qubits):
        return [f"|{format(i, f'0{num_qubits}b')}⟩" for i in range(2**num_qubits)]

    basis_labels = generate_basis_labels(num_qubits)

    # Set axis labels and limits
    ax.set_xticks(range(n))
    ax.set_yticks(range(n))
    ax.set_xticklabels(basis_labels, rotation=45)
    ax.set_yticklabels(basis_labels, rotation=-45)
    ax.set_zlabel("Magnitude")

    # Adjust the viewing angle for better visibility
    ax.view_init(elev=25, azim=45)

    # Add colorbar for phase mapping with rainbow colors
    norm = plt.Normalize(-np.pi, np.pi)
    sm = plt.cm.ScalarMappable(cmap=custom_cmap, norm=norm)
    sm.set_array([])
    cbar = plt.colorbar(sm, ax=ax, orientation="vertical", label="Phase (radians)")

    # Set colorbar ticks to show π values
    cbar.set_ticks(
        [
            -np.pi,
            -3 * np.pi / 4,
            -np.pi / 2,
            -np.pi / 4,
            0,
            np.pi / 4,
            np.pi / 2,
            3 * np.pi / 4,
            np.pi,
        ]
    )
    cbar.set_ticklabels(["-π", "-3π/4", "-π/2", "-π/4", "0", "π/4", "π/2", "3π/4", "π"])

    # Add title
    plt.title(
        f"Density Matrix for {num_qubits}-Qubit State\nMagnitude (Height) and Phase (Color)",
        pad=20,
    )

    # Adjust layout to prevent label clipping
    plt.tight_layout()

    # Add grid lines for better visibility
    ax.grid(True, alpha=0.3)

    # Ensure the phase colors are always visible by setting minimum opacity
    for collection in ax.collections:
        collection.set_alpha(0.9)

    return fig

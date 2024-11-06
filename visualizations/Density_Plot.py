import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.colors import LinearSegmentedColormap

def create_density_matrix_plot(quantum_matrix):
    # Calculate magnitude and phase of each element in the density matrix
    magnitudes = np.abs(quantum_matrix)
    phases = np.angle(quantum_matrix)

    # Create a custom colormap: blue for positive phases, red for negative
    colors = [(0, 0, 1), (1, 1, 1), (1, 0, 0)]  # Blue to white to red
    nodes = [0.0, 0.5, 1.0]  # Mapping for -π, 0, π, adjusted to the [0, 1] interval
    custom_cmap = LinearSegmentedColormap.from_list("blue_white_red", list(zip(nodes, colors)))

    # Flatten data for easy handling in the plot
    magnitudes_flat = magnitudes.ravel()
    phases_flat = phases.ravel()
    normalized_phases = (phases_flat + np.pi) / (2 * np.pi)  # Normalize phases to [0, 1]
    colors = custom_cmap(normalized_phases)  # Apply colormap to normalized phases

    # Set up the 3D bar plot
    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    # Define grid positions for each bar
    x_pos, y_pos = np.meshgrid(
        range(quantum_matrix.shape[0]), range(quantum_matrix.shape[1]), indexing="ij"
    )
    x_pos = x_pos.ravel()
    y_pos = y_pos.ravel()
    z_pos = np.zeros_like(x_pos)

    # Define bar sizes
    dx = dy = 0.5  # Width and depth of each bar
    dz = magnitudes_flat  # Height corresponds to magnitude of each element

    # Plot 3D bars with colors based on phase
    ax.bar3d(x_pos, y_pos, z_pos, dx, dy, dz, color=colors, shade=True)

    # Set axis labels and limits
    ax.set_xticks([0, 1, 2, 3])
    ax.set_yticks([0, 1, 2, 3])
    ax.set_xticklabels(["|00⟩", "|01⟩", "|10⟩", "|11⟩"])
    ax.set_yticklabels(["|00⟩", "|01⟩", "|10⟩", "|11⟩"])
    ax.set_zlabel("Magnitude")

    # Display the color bar to show phase mapping
    mappable = plt.cm.ScalarMappable(cmap=custom_cmap)
    mappable.set_array(phases)
    plt.colorbar(mappable, ax=ax, orientation='vertical', label="Phase (radians)")

    return fig
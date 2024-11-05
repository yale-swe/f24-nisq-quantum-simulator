#!/usr/bin/env python
# coding: utf-8

# In[ ]:


import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.colors import LinearSegmentedColormap

def save_density_plot(quantum_matrix, filename="density_plot.png"):
    # Calculate probability densities (modulus squared)
    prob_densities = np.abs(quantum_matrix) ** 2

    # Map the probabilities to the range 0, π, 2π
    max_density = prob_densities.max()  # Find max density for normalization
    normalized_heights = np.interp(prob_densities, (0, max_density), (0, 2 * np.pi))

    # Set up the custom colormap
    colors = [(1, 0, 0), (0, 0, 1), (1, 0, 0)]  # Red to blue to red
    nodes = [0.0, 0.5, 1.0]  # Positions for 0, π, and 2π
    custom_cmap = LinearSegmentedColormap.from_list("red_blue_red", list(zip(nodes, colors)))

    # Normalize the height values for color mapping
    norm_heights = normalized_heights.ravel() / (2 * np.pi)  # Scale heights to [0, 1] for colormap

    # Set up the 3D bar plot
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    # Define grid positions for each bar
    shape = quantum_matrix.shape
    grid = np.meshgrid(range(shape[0]), range(shape[1]), indexing="ij")
    x_pos = grid[0].ravel()
    y_pos = grid[1].ravel()
    z_pos = np.zeros_like(x_pos)

    # Define bar sizes
    dx = dy = 0.5  # Width and depth of each bar
    dz = normalized_heights.ravel()  # Height of each bar

    # Plot 3D bars with custom colors
    colors = custom_cmap(norm_heights)
    ax.bar3d(x_pos, y_pos, z_pos, dx, dy, dz, color=colors, shade=True)

    # Set axis labels and limits
    ax.set_xticks(range(shape[1]))
    ax.set_yticks(range(shape[0]))
    ax.set_xticklabels([f'Col {i+1}' for i in range(shape[1])])
    ax.set_yticklabels([f'Row {i+1}' for i in range(shape[0])])
    ax.set_zlim(0, 2 * np.pi)
    ax.set_zlabel("Probability Density (0 to 2π)")

    # Save the plot as a PNG file
    plt.savefig(filename)
    plt.close(fig)
#   print(f"Density plot saved as {filename}")

# Example usage for multiple qubits
# quantum_matrix = np.array([[2 + 1j, 7, -1j, 0], [4, 3 + 1j, 2, -5j], [0, 1 - 1j, 5, 3], [-4j, 0, 7, 2]])
# save_density_plot(quantum_matrix, "multi_qubit_density_plot.png")


#!/usr/bin/env python
# coding: utf-8

# In[ ]:


import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Define the quantum matrix with complex elements
quantum_matrix = np.array([[2 + 1j, 7], [-4j, 5]])

# Calculate the eigenvectors (using one of them for the Bloch sphere representation)
_, eigenvectors = np.linalg.eig(quantum_matrix)
state_vector = eigenvectors[:, 0]  # Choose the first eigenvector as an example

# Normalize the state vector
state_vector = state_vector / np.linalg.norm(state_vector)

# Calculate theta and phi for the Bloch sphere
alpha = state_vector[0]
beta = state_vector[1]

# theta = 2 * arccos(|alpha|) and phi = arg(beta) - arg(alpha)
theta = 2 * np.arccos(np.abs(alpha))
phi = np.angle(beta) - np.angle(alpha)

# Bloch sphere coordinates
x = np.sin(theta) * np.cos(phi)
y = np.sin(theta) * np.sin(phi)
z = np.cos(theta)

# Plotting the Bloch sphere
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# Draw the sphere
u, v = np.mgrid[0:2 * np.pi:100j, 0:np.pi:50j]
x_sphere = np.sin(v) * np.cos(u)
y_sphere = np.sin(v) * np.sin(u)
z_sphere = np.cos(v)
ax.plot_wireframe(x_sphere, y_sphere, z_sphere, color="gray", alpha=0.3)

# Draw axes
ax.plot([-1, 1], [0, 0], [0, 0], color='black')
ax.plot([0, 0], [-1, 1], [0, 0], color='black')
ax.plot([0, 0], [0, 0], [-1, 1], color='black')
ax.plot([0, x], [0, y], [0, z], color='red')

# Plot the quantum state as a point on the Bloch sphere
ax.scatter([x], [y], [z], color="red", s=100)
ax.text(x, y, z, '  |ψ⟩', color='red', fontsize=12)

# Set plot limits and labels
ax.set_xlim([-1, 1])
ax.set_ylim([-1, 1])
ax.set_zlim([-1, 1])
ax.set_xlabel("X")
ax.set_ylabel("Y")
ax.set_zlabel("Z")

plt.show()


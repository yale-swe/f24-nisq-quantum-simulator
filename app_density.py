#!/usr/bin/env python
# coding: utf-8

# In[ ]:


from flask import Flask, request, render_template
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.colors import LinearSegmentedColormap
import io
import base64

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/plot', methods=['POST'])
def plot():
    state_input = request.form['stateInput']
    try:
        # Convert the input string to a Python list
        quantum_matrix = eval(state_input)
        quantum_matrix = np.array(quantum_matrix, dtype=complex)

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
        x_pos, y_pos = np.meshgrid(range(quantum_matrix.shape[0]), range(quantum_matrix.shape[1]), indexing="ij")
        x_pos = x_pos.ravel()
        y_pos = y_pos.ravel()
        z_pos = np.zeros_like(x_pos)

        # Define bar sizes
        dx = dy = 0.5  # Width and depth of each bar
        dz = normalized_heights.ravel()  # Height of each bar

        # Plot 3D bars with custom colors
        colors = custom_cmap(norm_heights)
        ax.bar3d(x_pos, y_pos, z_pos, dx, dy, dz, color=colors, shade=True)

        # Set axis labels and limits
        ax.set_xticks([0, 1])
        ax.set_yticks([0, 1])
        ax.set_xticklabels(['Column 1', 'Column 2'])
        ax.set_yticklabels(['Row 1', 'Row 2'])
        ax.set_zlim(0, 2 * np.pi)
        ax.set_zlabel("Probability Density (0 to 2π)")

        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()

        # Encode the image to base64 for embedding in HTML
        plot_url = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()

        return render_template('index.html', plot_url=f'data:image/png;base64,{plot_url}', input_state=state_input)

    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    app.run(debug=True)


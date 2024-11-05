#!/usr/bin/env python
# coding: utf-8

# In[ ]:


from flask import Flask, request, render_template, send_file
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/plot', methods=['POST'])
def plot():
    # Get the user input
    state_input = request.form['stateInput']
    
    # Convert the input string to a Python list
    try:
        quantum_state = eval(state_input)
        matrix = np.array(quantum_state, dtype=complex)
        
        # Plot the matrix
        plt.imshow(np.abs(matrix), cmap='viridis')
        plt.colorbar(label='Amplitude')
        plt.title('Quantum State Matrix Visualization')
        plt.xlabel('Columns')
        plt.ylabel('Rows')
        
        # Save plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()

        # Encode the image to base64 for embedding in HTML
        plot_url = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()

        return render_template('index.html', plot_url=f'data:image/png;base64,{plot_url}')
    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    app.run(debug=True)


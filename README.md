# DecoherenceLab - Quantum Circuit Simulator

A sophisticated web-based quantum circuit simulator designed for experimenting with noisy intermediate-scale quantum (NISQ) environments. This project combines a Next.js frontend with a Python backend to provide an interactive platform for quantum circuit design, simulation, and visualization.

## Features
- **Circuit Design & Simulation**:
  - Interactive Circuit Designer: Drag-and-drop interface for building quantum circuits.
  - Real-time Simulation: Instant visualization of quantum states.
  - Gate Support:
    - Single-qubit gates: `I (Identity)`, `X`, `Y`, `Z`, `H (Hadamard)`, `S`, `T`
    - Two-qubit gates: `CNOT (Controlled-NOT)`
- **Visualization Tools**:
  - Density Matrix Visualization:
    - 3D bar plots with:
      - Magnitude representation through bar height.
      - Phase representation using a rainbow colormap.
    - Interactive viewing angles.
  - Bloch Sphere Representation:
    - Real-time state vector visualization.
    - Interactive 3D sphere with quantum state mapping.
    - Axis labels and state vector annotations.
- **Error Analysis**:
  - Noise Model Integration:
    - Custom noise model support.
    - Depolarizing channel simulation.
  - Error Propagation:
    - Automated error gate propagation through quantum layers.
    - Error simplification using Pauli operator algebra.
    - Visual representation of error effects.

## Installation

### Prerequisites
- Python 3.x
- Node.js (Latest LTS version)
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/rohansk1/nisq_private.git
   cd nisq_private```

2.	Install Python dependencies:
```pip install -r requirements.txt```

3.	Install JavaScript dependencies:

```cd frontend-interface
npm install```

# Usage

## Local Development

1. Start the development server:

```npm run dev:website```

2.	Access the application at:

```http://localhost:3000```

## Production Deployment

The application is deployed on Render.com. Access the live version at [deployment-url].

# Project Structure

```nisq_private/
├── frontend-interface/     # Next.js frontend
│   ├── app/               # Application routes
│   ├── components/        # React components
│   └── public/            # Static assets
├── backend/               # Python backend
│   ├── quantum_simulator.py   # Core simulation engine
│   ├── error_propagation.py  # Error handling
│   └── test_evolution.py     # Test suite
├── visualizations/        # Visualization tools
│   ├── Density_Plot.py   # Density matrix plotting
│   └── Bloch_Sphere.py   # Bloch sphere visualization
└── requirements.txt      # Python dependencies```

# Technical Details

•	Quantum Simulation:
	•	Density matrix evolution using QuTiP.
	•	Custom intermediate representation for quantum circuits.
	•	Support for noise models and error propagation.
	•	High-fidelity quantum gate implementations.

•	Visualization Engine:
	•	3D visualization using Matplotlib.
	•	Interactive plots with customizable views.
	•	Real-time state updates.
	•	Phase and magnitude representation.

•	Error Handling:
	•	Pauli error propagation.
	•	Error gate simplification.
	•	Automated validation of circuit layers.
	•	Comprehensive error reporting.

# Testing

This project maintains high test coverage (94%) with comprehensive unit tests:

```# Run tests
python -m unittest backend/test_evolution.py

# View coverage report
coverage run -m unittest discover
coverage report```

# Technologies Used

•	Frontend:
	•	Next.js 14
	•	React 18
	•	mathjs
	•	@hello-pangea/dnd
•	Backend:
	•	NumPy
	•	QuTiP
	•	Matplotlib
	•	Plotly
	•	Qiskit

# Contributing

1.	Fork the repository.

2.	Create a feature branch:

```git checkout -b feature/YourFeature```

3.	Commit your changes:

```git commit -m 'Add YourFeature'```

4.	Push to your branch:

```git push origin feature/YourFeature```

5.	Submit a Pull Request.

# License

This project is maintained as a private repository. Contact the repository owners for usage permissions.

# Support

For issues and feature requests, please use the GitHub issue tracker or contact the development team.

# Acknowledgments

•	Built with Next.js and Python.
•	Quantum computing libraries: Qiskit, QuTiP.
•	Visualization tools: Matplotlib, Plotly.

# Contact

Project Link: https://github.com/rohansk1/nisq_private

For additional documentation and examples, please refer to the Wiki section.

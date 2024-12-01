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
- **Error Analysis**:
  - Noise Model Integration:
    - Custom noise model support.
    - Depolarizing channel simulation.
  - Error Propagation:
    - Automated error gate propagation through quantum layers.
    - Error simplification using Pauli operator algebra.
    - Visual representation of error effects.

## Button Functions

### Circuit Manipulation
- **Add Wire**: Adds a new qubit wire to the circuit (up to maximum 8 qubits). Each wire represents a quantum bit that can be manipulated using quantum gates.

- **Reset Circuit**: Clears all gates from the current circuit, returning it to an empty state while maintaining the current number of qubits. This is useful when you want to start a new circuit design from scratch.

### Noise Model Controls
- **Load Noise Model**: Opens a file upload dialog to import a custom noise model in .txt format. The noise model should contain Kraus operators that define the quantum channel's noise characteristics. The uploaded model must satisfy:
  - Valid JSON syntax
  - Square matrices with matching dimensions
  - Sum of E_i * E_i^† equals identity matrix (completeness relation)

- **Reset Noise Model**: Removes the currently loaded noise model, returning the simulator to ideal (noiseless) operation mode.

### Simulation Controls
- **Generate Results**: Executes the quantum circuit simulation and displays the results through:
  - 3D density matrix visualization
  - Magnitude representation through bar heights
  - Phase information encoded in color
  The simulation takes into account any loaded noise models.

- **Propagate Error**: Analyzes how errors propagate through the circuit by:
  - Converting error gates into equivalent Pauli operations
  - Simplifying error combinations using Pauli operator algebra
  - Displaying the resulting error-propagated circuit
  This helps in understanding how noise affects the quantum computation at each stage.

## Installation

### Prerequisites

- Python 3.x
- Node.js (Latest LTS version)
- npm or yarn

### Setup

1. Clone the repository:

```
bash
git clone https://github.com/yale-swe/f24-nisq-quantum-simulator/
cd f24-nisq-quantum-simulator
```

2. Install Python dependencies:
```pip install -r requirements.txt```

3. Install JavaScript dependencies:

```
cd frontend-interface
npm install
```

# Usage

## Local Development

1. Start the development server:

```npm run dev:website```

2. Access the application at:

```http://localhost:3000```

### Live Deployment

The application is deployed and accessible at:
[https://nisq-simulator-a24607e46084.herokuapp.com/](https://nisq-simulator-a24607e46084.herokuapp.com/)

This live version provides all features of the quantum circuit simulator without requiring local installation.

# Project Structure

```
f24-nisq-quantum-simulator/
├── .github/                    # GitHub specific configurations
│   └── workflows/             # CI/CD workflow configurations
│       ├── coverage_workflow.yml
│       └── test_workflow.yml
│
├── frontend-interface/        # Next.js frontend application
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API endpoints
│   │   ├── globals.css      # Global styles
│   │   ├── layout.js        # App layout
│   │   └── page.js         # Homepage
│   ├── components/          # React components
│   │   ├── DensityPlot.js
│   │   ├── DragAndDropGrid.js
│   │   ├── LoadingOverlay.js
│   │   └── NoiseModel.js
│   ├── data/                # Data files
│   │   └── stats.txt
│   ├── public/             # Static assets
│   │   └── icons/
│   ├── .env.local          # Local environment variables
│   ├── jest.config.js      # Jest testing configuration
│   ├── jest.setup.js       # Jest setup file
│   ├── jsconfig.json       # JavaScript configuration
│   └── next.config.mjs     # Next.js configuration
│
├── backend/                 # Python backend
│   ├── __init__.py
│   ├── error_propagation.py
│   ├── error_step_propagator.py
│   ├── quantum_simulator.py
│   ├── utils.py
│   ├── test_error_propagation.py
│   ├── test_error_step_propagator.py
│   ├── test_evolution.py
│   └── test_utils.py
│
├── visualizations/          # Visualization tools
│   ├── __init__.py
│   └── Density_Plot.py
│
├── .gitignore
├── babel.config.js         # Babel configuration
├── package.json           # Node.js dependencies and scripts
├── render.yaml            # Render deployment configuration
└── requirements.txt       # Python dependencies
```

# Technical Details

- Quantum Simulation:
  - Density matrix evolution using QuTiP.
  - Custom intermediate representation for quantum circuits.
  - Support for noise models and error propagation.
- Visualization Engine:
  - 3D visualization using Matplotlib.
  - Interactive plots with customizable views.
  - Phase and magnitude representation.
- Error Handling:
  - Pauli error propagation.
  - Error gate simplification.
  - Comprehensive error reporting.

# Testing

This project maintains high test coverage (94%) with comprehensive unit tests:

```
# Run tests
python -m unittest backend/test_evolution.py

# View coverage report
coverage run -m unittest discover
coverage report
```

# Guide to Add Tests

## Backend Testing (Python)

The backend uses Python's `unittest` framework. Tests are located in the `backend/` directory with files prefixed by `test_`.

### Adding Python Tests

1. Create a new test file in the `backend/` directory with prefix `test_`:

```python
# test_your_module.py
import unittest

class TestYourModule(unittest.TestCase):
    def setUp(self):
        # Setup code runs before each test
        pass
        
    def test_your_feature(self):
        # Your test code here
        expected = ...
        actual = ...
        self.assertEqual(expected, actual)
```

### Common Testing Patterns

For quantum state verification:

```python
def assertStateAlmostEqual(self, state1, state2):
    np.testing.assert_allclose(
        state1.full(), 
        state2.full(), 
        atol=5e-4,  # Absolute tolerance
        rtol=5e-4   # Relative tolerance
    )
```

For error handling:

```python
def test_error_case(self):
    with self.assertRaises(ExpectedError):
        # Code that should raise error
        pass
```

### Running Backend Tests

```bash
# Run all tests
python -m unittest discover backend/

# Run specific test file
python -m unittest backend/test_your_module.py

# Run with coverage
coverage run -m unittest discover
coverage report
```

## Frontend Testing (JavaScript/Jest)

The frontend uses Jest with jsdom environment. Tests are located alongside components with .test.js or .spec.js extensions.

### Adding Frontend Tests

Create a test file next to your component:

```javascript
// YourComponent.test.js
import { render, screen, fireEvent } from '@testing-library/react'
import YourComponent from './YourComponent'

describe('YourComponent', () => {
    beforeEach(() => {
        // Setup code
    })

    it('should render correctly', () => {
        render(<YourComponent />)
        expect(screen.getByText('expected text')).toBeInTheDocument()
    })

    it('should handle user interactions', () => {
        render(<YourComponent />)
        fireEvent.click(screen.getByRole('button'))
        // Assert expected behavior
    })
})
```

### Common Testing Patterns

Testing API calls:

```javascript
it('handles API calls', async () => {
    global.fetch = jest.fn(() => 
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: 'test' })
        })
    )
    
    // Test component with mocked fetch
})
```

Testing drag and drop:

```javascript
it('handles drag and drop', () => {
    const { container } = render(<YourComponent />)
    fireEvent.dragStart(screen.getByTestId('draggable'))
    fireEvent.drop(screen.getByTestId('droppable'))
    // Assert expected state changes
})
```

### Running Frontend Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- YourComponent.test.js

# Run tests in watch mode
npm test -- --watch
```

## Test Configuration Files

- Backend: No specific configuration needed for unittest
- Frontend: Configuration in frontend-interface/jest.config.js:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)']
}
```

## Best Practices

### Test file naming

- Backend: test_*.py
- Frontend: *.test.js or*.spec.js

### Test organization

- Group related tests using descriptive names
- Use setup/teardown methods for common operations
- Test both success and error cases
- Mock external dependencies

### Coverage goals

- Maintain minimum 90% coverage
- Focus on critical paths and error handling
- Include edge cases and boundary conditions

# Technologies Used

- Frontend:
  - Next.js 14
  - React 18
  - mathjs
  - @hello-pangea/dnd
- Backend:
  - NumPy
  - QuTiP
  - Matplotlib
  - Plotly
  - Qiskit

# Contributing

1. Fork the repository.
2. Create a feature branch:

```
git checkout -b feature/YourFeature
```

3. Commit your changes:

```
git commit -m 'Add YourFeature'
```

4. Push to your branch:

```
git push origin feature/YourFeature
```

5. Submit a Pull Request.

# License

This project is maintained as a private repository. Contact the repository owners for usage permissions.

# Support

For issues and feature requests, please use the GitHub issue tracker or contact the development team.

# Acknowledgments

- Built with Next.js and Python.
- Quantum computing libraries: Qiskit, QuTiP.
- Visualization tools: Matplotlib, Plotly.

# Contact

Project Link: <https://github.com/yale-swe/f24-nisq-quantum-simulator>

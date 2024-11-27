// frontend-interface/components/__tests__/App.test.js 
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../testApp.js';

describe('App Component', () => {
    it('renders Hello, World!', () => {
        render(<App />);
        expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    });
});

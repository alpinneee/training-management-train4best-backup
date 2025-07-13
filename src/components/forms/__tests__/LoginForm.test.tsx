import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../LoginForm';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('renders login form', () => {
    render(<LoginForm />);
    
    // Use getAllByText since there are multiple "Welcome to Train4best" elements
    const welcomeElements = screen.getAllByText('Welcome to Train4best');
    expect(welcomeElements.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('handles form submission with valid credentials', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockSignIn.mockResolvedValueOnce({
      ok: true,
      error: null
    });
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          email: 'test@example.com',
          name: 'Test User',
          userType: 'participant'
        }
      })
    } as any);

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      });
    });
  });

  it('handles form submission with invalid credentials', async () => {
    mockSignIn.mockResolvedValueOnce({
      ok: false,
      error: 'Invalid credentials'
    });

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(button => button.textContent === '');

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    if (toggleButton) {
      // Click toggle button
      fireEvent.click(toggleButton);

      // Password should be visible
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle button again
      fireEvent.click(toggleButton);

      // Password should be hidden again
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('shows loading state during form submission', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
  });

  it('renders forgot password link', () => {
    render(<LoginForm />);
    
    const forgotPasswordLink = screen.getByText('Forgot Password?');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute('href', '/reset-password');
  });

  it('renders sign up link', () => {
    render(<LoginForm />);
    
    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });
}); 
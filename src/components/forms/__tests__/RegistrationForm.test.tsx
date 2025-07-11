import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegistrationForm from '../RegistrationForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock window.location for the test suite
let originalLocation: Location;
let mockFetch: jest.Mock;

beforeAll(() => {
  originalLocation = window.location;
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { href: '', assign: jest.fn(), replace: jest.fn() };
  
  // Mock global fetch
  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

afterAll(() => {
  // @ts-ignore
  window.location = originalLocation;
});

describe('RegistrationForm Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    window.location.href = '';
    mockFetch.mockClear();
  });
  afterEach(() => {
    // hrefSpy.mockRestore(); // This line is removed as per the new_code
  });

  it('renders registration form', () => {
    render(<RegistrationForm />);
    
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password Confirmation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('shows validation error for empty full name', async () => {
    render(<RegistrationForm />);
    // Fill in valid values for all fields except full name
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password Confirmation'), {
      target: { value: 'password123' },
    });
    // Check the privacy policy checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Wait for the checkbox to be checked
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
    
    const form = screen.getByRole('form');
    await act(async () => {
      fireEvent.submit(form);
      await new Promise(res => setTimeout(res, 10));
    });
    // Wait for re-render
    await waitFor(() => {
      expect(screen.queryAllByRole('listitem').length).toBeGreaterThan(0);
    });
    // Await the error message directly
    await screen.findByText('Nama lengkap harus diisi');
  });

  it('shows validation error for invalid email format', async () => {
    render(<RegistrationForm />);
    // Fill in valid values for all fields except email
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password Confirmation'), {
      target: { value: 'password123' },
    });
    // Check the privacy policy checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Wait for the checkbox to be checked
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
    
    const form = screen.getByRole('form');
    await act(async () => {
      fireEvent.submit(form);
      await new Promise(res => setTimeout(res, 10));
    });
    // Wait for re-render
    await waitFor(() => {
      expect(screen.queryAllByRole('listitem').length).toBeGreaterThan(0);
    });
    // Await the error message directly
    await screen.findByText('Format email tidak valid');
  });

  it('shows validation error for password mismatch', async () => {
    render(<RegistrationForm />);
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password Confirmation'), {
      target: { value: 'password456' },
    });
    
    const submitButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password tidak cocok')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<RegistrationForm />);
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password Confirmation'), {
      target: { value: '123' },
    });
    
    const submitButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password minimal 6 karakter')).toBeInTheDocument();
    });
  });

  it('handles successful registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<RegistrationForm />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password Confirmation'), {
      target: { value: 'password123' },
    });
    
    // Check the privacy policy checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    const submitButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });
  });

  it('handles registration error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Registration failed' }),
    });

    render(<RegistrationForm />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password Confirmation'), {
      target: { value: 'password123' },
    });
    
    // Check the privacy policy checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    const submitButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });
}); 
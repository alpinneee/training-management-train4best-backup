import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../button';

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByText('Default Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    const button = screen.getByText('Clickable Button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Button size="large">Large</Button>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('renders full width when specified', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByText('Full Width');
    expect(button).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button).toBeInTheDocument();
  });

  it('renders submit type', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });
}); 
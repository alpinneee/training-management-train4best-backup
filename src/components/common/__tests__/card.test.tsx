import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../card';

describe('Card Component', () => {
  it('renders with children', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(
      <Card className="custom-card">
        <div>Card Content</div>
      </Card>
    );
    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('custom-card');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('shadow-md');
    expect(card).toHaveClass('p-4');
  });

  it('renders with default className when no className provided', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('shadow-md');
    expect(card).toHaveClass('p-4');
  });

  it('renders multiple children', () => {
    render(
      <Card>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </Card>
    );
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });
}); 
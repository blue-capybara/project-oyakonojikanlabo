import { render, screen } from '@testing-library/react';

function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

describe('Test setup verification', () => {
  it('renders a component and finds text', () => {
    render(<Greeting name="Vitest" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Hello, Vitest!');
  });

  it('jest-dom matchers work', () => {
    render(<Greeting name="World" />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});

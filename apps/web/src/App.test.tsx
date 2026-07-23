import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the JoJo Flora heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /jojo flora/i })).toBeInTheDocument();
  });
});

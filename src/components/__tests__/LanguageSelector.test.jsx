import React from 'react';
import { render, screen } from '@testing-library/react';
import { LanguageSelector } from '../LanguageSelector';

test('renders English option', () => {
  render(<LanguageSelector language="en" setLanguage={() => {}} />);
  expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument();
});

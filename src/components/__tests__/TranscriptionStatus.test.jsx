import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranscriptionStatus } from '../TranscriptionStatus';

test('shows processing text when processing', () => {
  render(<TranscriptionStatus isProcessing={true} recording={false} status="ready" />);
  expect(screen.getByText(/processing audio/i)).toBeInTheDocument();
});


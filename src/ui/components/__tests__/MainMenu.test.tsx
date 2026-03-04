import React from 'react';
import { render } from 'ink-testing-library';
import { MainMenu } from '../MainMenu.js';

// We are not mocking figlet/gradient-string because getting ESM mocks to work
// with ts-jest can be flaky. Instead, we verify the output contains the
// structure of the ASCII art we expect from the 'Standard' font.

describe('MainMenu', () => {
  test('renders menu items and logo', () => {
    const { lastFrame } = render(<MainMenu onSelect={() => {}} />);
    const output = lastFrame();

    // Verify Figlet output (Standard font distinctive chars)
    // "Coherence" in Standard font has roughly this shape:
    //    ____      _
    //   / ___|___ | |__
    expect(output).toContain('____');
    // The literal string 'Coherence' is not present because it's converted to ASCII art.

    // Check for a distinctive part of the ASCII art derived from "Coherence"
    expect(output).toContain('/ ___|___ | |__');

    expect(output).toContain('Load Export Data (Start Here)');
    expect(output).toContain('Exit');
  });

  test('renders brain ASCII by default (assuming >85 width)', () => {
     // Note: Default width in ink-testing-library might be small, but usually
     // it defaults to a reasonable size or we can rely on what useStdout returns.
     // If this fails, we might need to mock useStdout to force a width.
     const { lastFrame } = render(<MainMenu onSelect={() => {}} />);
     const output = lastFrame();

     // Check for distinctive part of the new "dramatic" brain
     // "      _---~~(~~-._"
     expect(output).toContain("_---~~(~~-._");
  });
});

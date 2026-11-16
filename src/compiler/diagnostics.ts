import { Diagnostic } from './types';

const DIAGNOSTIC_REGEX = /^(.*?):(\d+):(\d+):\s+(error|warning|note):\s+(.*)$/;

export function parseDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.trim().match(DIAGNOSTIC_REGEX);
    if (match) {
      diagnostics.push({
        file: match[1],
        line: parseInt(match[2], 10),
        col: parseInt(match[3], 10),
        severity: match[4] as 'error' | 'warning' | 'note',
        message: match[5],
        raw: line.trim(),
      });
    }
  }

  return diagnostics;
}

import { describe, it, expect } from 'vitest';
import { toCSV, buildTableHTML } from './export';

describe('toCSV', () => {
  it('builds header + rows', () => {
    const csv = toCSV(['name', 'qty'], [{ name: 'A', qty: 5 }, { name: 'B', qty: 10 }]);
    expect(csv).toBe('name,qty\nA,5\nB,10');
  });

  it('escapes quotes and commas', () => {
    const csv = toCSV(['x'], [{ x: 'a,b' }, { x: 'he said "hi"' }]);
    expect(csv).toBe('x\n"a,b"\n"he said ""hi"""');
  });

  it('handles null/undefined', () => {
    const csv = toCSV(['a', 'b'], [{ a: null, b: undefined }]);
    expect(csv).toBe('a,b\n,');
  });
});

describe('buildTableHTML', () => {
  it('contains title and rows', () => {
    const html = buildTableHTML('Report', ['col'], [{ col: 'val' }]);
    expect(html).toContain('<h1>Report</h1>');
    expect(html).toContain('<th>col</th>');
    expect(html).toContain('<td>val</td>');
  });
});

import { phaseFor, sectionProgress } from './day-cycle';

describe('phaseFor', () => {
  it('starts at sunrise and ends at night', () => {
    expect(phaseFor(0)).toBe('sunrise');
    expect(phaseFor(1)).toBe('night');
  });

  it('changes phase exactly at each limit', () => {
    expect(phaseFor(0.149)).toBe('sunrise');
    expect(phaseFor(0.15)).toBe('morning');
    expect(phaseFor(0.55)).toBe('afternoon');
    expect(phaseFor(0.91)).toBe('sunset');
    expect(phaseFor(0.92)).toBe('night');
  });
});

describe('sectionProgress', () => {
  it('is 0 while the section is below the middle of the screen', () => {
    expect(sectionProgress(600, 1000, 800)).toBe(0);
  });

  it('grows as the section passes the middle of the screen', () => {
    expect(sectionProgress(-100, 1000, 800)).toBeCloseTo(0.5);
  });

  it('is 1 once the section has fully passed', () => {
    expect(sectionProgress(-2000, 1000, 800)).toBe(1);
  });

  it('is 0 for a section without height', () => {
    expect(sectionProgress(0, 0, 800)).toBe(0);
  });
});

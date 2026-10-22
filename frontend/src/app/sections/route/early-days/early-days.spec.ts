import { TestBed } from '@angular/core/testing';
import { EarlyDays } from './early-days';

describe('EarlyDays', () => {
  async function setup() {
    const fixture = TestBed.createComponent(EarlyDays);
    fixture.componentRef.setInput('intro', 'Antes de especializarme');
    fixture.componentRef.setInput('stops', [
      { name: 'Envision', role: 'Rol', period: 'Periodo', summary: 'Resumen' },
      { name: 'Emerix', role: 'Rol', period: 'Periodo', summary: 'Resumen' },
    ]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button')!;
    return { fixture, element, button };
  }

  it('starts collapsed', async () => {
    const { element, button } = await setup();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('app-route-stop').length).toBe(0);
    expect(element.textContent).not.toContain('Antes de especializarme');
  });

  it('shows the intro and the stops when expanded', async () => {
    const { fixture, element, button } = await setup();
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(element.textContent).toContain('Antes de especializarme');
    expect(element.querySelectorAll('app-route-stop').length).toBe(2);
  });

  it('emits the new state on each toggle', async () => {
    const { fixture, button } = await setup();
    const emitted: boolean[] = [];
    fixture.componentInstance.expandedChange.subscribe((value) => emitted.push(value));
    button.click();
    button.click();
    expect(emitted).toEqual([true, false]);
  });
});

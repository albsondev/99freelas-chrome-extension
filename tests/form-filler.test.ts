import { describe, expect, it } from 'vitest';
import { setNativeInputValue } from '../src/content/native-input-setter';

describe('native-input-setter', () => {
  it('preenche input e dispara eventos', () => {
    document.body.innerHTML = '<input id="price" value="" />';
    const input = document.getElementById('price') as HTMLInputElement;
    const events: string[] = [];
    input.addEventListener('input', () => events.push('input'));
    input.addEventListener('change', () => events.push('change'));
    input.addEventListener('blur', () => events.push('blur'));

    setNativeInputValue(input, '650');
    expect(input.value).toBe('650');
    expect(events).toEqual(['input', 'change', 'blur']);
  });
});

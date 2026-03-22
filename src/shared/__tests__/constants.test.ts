import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_ID, AGENTS_DIR, CONFIG_DIR, EXTENSIONS_DIR, REGISTRY_URL } from '../constants';

describe('Constants', () => {
  it('should export correct app name', () => {
    expect(APP_NAME).toBe('Lyra');
  });

  it('should export correct app ID', () => {
    expect(APP_ID).toBe('com.lyra.ide');
  });

  it('should export correct directory paths under .lyra', () => {
    expect(CONFIG_DIR).toBe('.lyra');
    expect(AGENTS_DIR).toBe('.lyra/agents');
    expect(EXTENSIONS_DIR).toBe('.lyra/extensions');
  });

  it('should export a valid registry URL', () => {
    expect(REGISTRY_URL).toMatch(/^https:\/\//);
    expect(REGISTRY_URL).toContain('registry.json');
  });
});

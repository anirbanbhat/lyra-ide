import type { LyraAPI } from '../preload/index';

declare global {
  interface Window {
    lyra: LyraAPI;
  }
}

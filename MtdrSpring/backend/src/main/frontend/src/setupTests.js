import '@testing-library/jest-dom';

// MUI TextareaAutosize and Recharts both call `new ResizeObserver(...).observe(...)`.
// jsdom does not provide ResizeObserver, so we stub it with a minimal class.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub;
window.ResizeObserver = ResizeObserverStub;

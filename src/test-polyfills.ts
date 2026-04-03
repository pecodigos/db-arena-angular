// Karma/browser-only polyfills for CommonJS libs expecting Node-like globals.
(window as any).global = window;

// index.js - FINAL VERSION
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ================================================
// ⚠️ BARCHA CONSOLE CHIQISHLARINI TO'LIQ O'CHIRISH
// ================================================
(() => {
  // 1. Barcha console metodlarini noop function bilan almashtirish
  const noop = () => {};
  
  const consoleMethods = [
    'log', 'error', 'warn', 'info', 'debug', 'trace', 
    'table', 'dir', 'dirxml', 'group', 'groupCollapsed', 
    'groupEnd', 'time', 'timeEnd', 'timeLog', 'count', 
    'countReset', 'assert', 'profile', 'profileEnd', 
    'timeStamp', 'clear'
  ];
  
  consoleMethods.forEach(method => {
    console[method] = noop;
  });
  
  // 2. Console object'ini to'liq override qilish
  window.console = new Proxy(console, {
    get: (target, prop) => {
      if (consoleMethods.includes(prop)) {
        return noop;
      }
      return target[prop];
    }
  });
  
  // 3. Global error event'larini o'chirish
  const originalOnerror = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Hech narsa chiqarmaslik
    return true; // Xatoni to'xtatish
  };
  
  // 4. addEventListener bilan error'larni o'chirish
  window.addEventListener('error', function(event) {
    event.preventDefault();
    return false;
  }, true);
  
  // 5. Promise rejection'larni o'chirish
  window.addEventListener('unhandledrejection', function(event) {
    event.preventDefault();
    return false;
  }, true);
  
  // 6. React DevTools konsol chiqishlarini o'chirish
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const devToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    devToolsHook.emit = noop;
    devToolsHook.on = noop;
    devToolsHook.off = noop;
    devToolsHook.inject = noop;
    devToolsHook.onCommitFiberRoot = noop;
    devToolsHook.onCommitFiberUnmount = noop;
  }
  
  // 7. Mavjud konsol chiqishlarini tozalash
  try {
    console.clear();
  } catch (e) {}
  
  // 8. Console'ga hech qachon qaytmaslik uchun final override
  Object.defineProperty(window, 'console', {
    value: new Proxy({}, {
      get: () => noop,
      set: () => true
    }),
    writable: false,
    configurable: false
  });
})();

// ================================================
// REACT APP RENDER
// ================================================
const root = ReactDOM.createRoot(document.getElementById('root'))

// Silent render - hech qanday error chiqarmaslik
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} catch (error) {
  // Hech narsa chiqarmaslik
}
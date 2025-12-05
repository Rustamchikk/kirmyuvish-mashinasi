// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ================================================
// 1. ENG MUHIM: Console'ni Dastlabki o'chirish
// ================================================
(function() {
  // window.console ni butunlay almashtirish
  const emptyConsole = {};
  const noop = () => {};
  
  // Barcha console metodlari
  const methods = [
    'log', 'error', 'warn', 'info', 'debug', 'trace',
    'table', 'dir', 'dirxml', 'group', 'groupCollapsed',
    'groupEnd', 'time', 'timeEnd', 'timeLog', 'count',
    'countReset', 'assert', 'profile', 'profileEnd',
    'timeStamp', 'clear'
  ];
  
  // Har bir method uchun noop function yaratish
  methods.forEach(method => {
    emptyConsole[method] = noop;
  });
  
  // window.console ni qat'iy almashtirish
  Object.defineProperty(window, 'console', {
    value: emptyConsole,
    writable: false,
    configurable: false,
    enumerable: true
  });
})();

// ================================================
// 2. Global Error Handler'lar
// ================================================
(function() {
  // Global error'lar
  window.onerror = function() {
    return true; // Error'ni to'xtatish
  };
  
  // Promise rejection'lar
  window.onunhandledrejection = function() {
    return true;
  };
  
  // Event listener'lar
  const silentHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  };
  
  window.addEventListener('error', silentHandler, true);
  window.addEventListener('unhandledrejection', silentHandler, true);
})();

// ================================================
// 3. React DevTools'ni o'chirish
// ================================================
(function() {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      // React DevTools hook'larini noop qilish
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      Object.keys(hook).forEach(key => {
        if (typeof hook[key] === 'function') {
          hook[key] = function() {};
        }
      });
      
      // Render hook'larini o'chirish
      hook.renderers = new Map();
      hook.inject = function() {};
      hook.onCommitFiberRoot = function() {};
      hook.onCommitFiberUnmount = function() {};
    } catch (e) {
      // Hech narsa
    }
  }
})();

// ================================================
// 4. Qo'shimcha himoyalar
// ================================================
(function() {
  // Console'ga qayta kirishni oldini olish
  const originalWindow = window;
  
  // Proxy orqali himoya
  try {
    window.console = new Proxy({}, {
      get: function() {
        return function() {};
      },
      set: function() {
        return true;
      }
    });
  } catch (e) {}
  
  // Frame va iframe'larda ham himoya
  if (window.frameElement) {
    try {
      parent.console = window.console;
    } catch (e) {}
  }
})();

// ================================================
// 5. Silent Error Boundary
// ================================================
class SilentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch() {
    // Hech narsa qilmaymiz
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', {
        style: { display: 'none' }
      });
    }
    return this.props.children;
  }
}

// ================================================
// 6. Silent Render Funksiyasi
// ================================================
function silentRender() {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    
    // Root elementni tekshirish
    if (!rootElement._reactRootContainer) {
      const root = ReactDOM.createRoot(rootElement);
      
      // App'ni ErrorBoundary bilan o'rab olish
      const AppWithBoundary = React.createElement(
        SilentErrorBoundary,
        { fallback: null },
        React.createElement(App)
      );
      
      // Silent render
      root.render(AppWithBoundary);
    }
  } catch (error) {
    // Hech narsa chiqarmaslik
  }
}

// ================================================
// 7. DOM Ready bo'lganda render qilish
// ================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', silentRender);
} else {
  setTimeout(silentRender, 0);
}

// ================================================
// 8. So'nggi himoya: MutationObserver
// ================================================
(function() {
  // Console'ga qayta yozilishni kuzatish
  const observer = new MutationObserver(function() {
    try {
      if (window.console && window.console.log !== (function() {})) {
        Object.defineProperty(window, 'console', {
          value: new Proxy({}, {
            get: () => () => {},
            set: () => true
          }),
          writable: false,
          configurable: false
        });
      }
    } catch (e) {}
  });
  
  // window object'ini kuzatish
  observer.observe(window, {
    attributes: true,
    attributeFilter: ['console']
  });
})();
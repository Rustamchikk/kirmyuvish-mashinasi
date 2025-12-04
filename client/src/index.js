import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
if (!console.__patched) {
  const originalConsoleError = console.error;

  console.error = function (...args) {
    const msg = args.join(' ') || '';

    if (
      msg.includes('Network Error') ||
      msg.includes('400') ||
      msg.includes('401') ||
      msg.includes('404') ||
      msg.includes('500') ||
      msg.includes('Bad Request') ||
      msg.includes('Failed to load resource')
    ) {
      return; // ❌ suppress
    }

    originalConsoleError(...args); // original ishlasin
  };

  console.__patched = true; // qayta patch bo‘lmasligi uchun
}


const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)

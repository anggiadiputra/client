import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// NeonAuthUIProvider dipindahkan ke App.tsx untuk mendukung navigasi otomatis
createRoot(document.getElementById('root')!).render(
  <App />
);

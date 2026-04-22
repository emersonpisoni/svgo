import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import { App2 } from './App-2.tsx';

// const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App svg={svg} svgoConfig={{}} /> */}
    <App2 />
  </StrictMode>,
)

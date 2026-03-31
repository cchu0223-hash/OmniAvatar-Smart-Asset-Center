import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ProfessionalEditPage from './ProfessionalEditPage.tsx'
import MyWorksPage from './MyWorksPage.tsx'
import LipSyncPage from './LipSyncPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/lipsync" element={<LipSyncPage />} />
        <Route path="/professional-edit" element={<ProfessionalEditPage />} />
        <Route path="/my-works" element={<MyWorksPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)


import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GamePage from './pages/GamePage.tsx'
import Dashboard from './pages/Dashboard.tsx'
import { ClerkProvider } from '@clerk/clerk-react'
import Protected from "./Protected.tsx"

const publishablekey = "pk_test_bmljZS1ob3JuZXQtOTYuY2xlcmsuYWNjb3VudHMuZGV2JA"

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ClerkProvider publishableKey={publishablekey} afterSignOutUrl="/">
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />}></Route>
      <Route path='/game/:roomslug' element={<Protected><GamePage /></Protected>}></Route>
      <Route path='/dashboard' element={<Dashboard />}></Route>
    </Routes>
  </BrowserRouter>
  </ClerkProvider>
  // </StrictMode>,
)

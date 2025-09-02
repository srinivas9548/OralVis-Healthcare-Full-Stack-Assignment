import { BrowserRouter, Route, Routes } from 'react-router-dom'

import LoginPage from './components/LoginPage'
import TechnicianDashboard from './components/TechnicianDashboard'
import DentistDashboard from './components/DentistDashboard'
import NotFound from './components/NotFound'

import './App.css'

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
            <Route path="/dentist-dashboard" element={<DentistDashboard />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    </BrowserRouter>
)

export default App
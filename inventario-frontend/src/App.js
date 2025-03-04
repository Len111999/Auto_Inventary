import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Inventario from './components/Inventario';
import Informes from './components/Informes';
import AjustesAutomaticos from './components/Ajustes';
import Pedidos from './components/Pedidos';
import {VentasProvider} from './Context/VentasContext';
import Productos from './components/Productos';

function App() {
    return (
        <VentasProvider>
                <Router>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventario" element={<div className="page inventario-page"><Inventario /></div>} />
                        <Route path="/informes" element={<div className="page informes-page"><Informes /></div>} />
                        <Route path="/ajustes-automaticos" element={<AjustesAutomaticos />} />
                        <Route path="/pedidos" element={<Pedidos />} />
                        <Route path="/productos" element ={<Productos/>}/>
                    </Routes>
                </Router>
        </VentasProvider>
    );
}

export default App;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../CSS/Navbar.css';

export const Navbar = () => {
    const [hoverColor, setHoverColor] = useState('gold');

  useEffect(() => {
    const colors = [
      '#08FF00', '#00FFF0', '#003EFF', '#DC00FF',
      '#FF008F', '#FF0000', '#FFA600', '#ECFF00'
    ];
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % colors.length;
      setHoverColor(colors[currentIndex]);
    }, 300);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div 
      className='Navbar' 
      style={{ '--hover-color': hoverColor }}
    >
        <ul className='llinks'>
            <li><Link to="/" className="mlink">📊Dashboard</Link></li>
            <li><Link to="/inventario" className="mlink">📦 Inventario</Link></li>
            <li><Link to="/informes" className="mlink">📑 Informes</Link></li>
            <li><Link to="/ajustes-automaticos" className="mlink">🔄 Ajustes</Link></li>
            <li><Link to="/pedidos" className="mlink">🛒 Pedidos</Link></li>
        </ul>
    </div>
  );
};

export default Navbar;

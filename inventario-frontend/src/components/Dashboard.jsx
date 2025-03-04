import React, { useContext, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { VentasContext } from '../Context/VentasContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../CSS/Dashboard.css';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const { inventarioInicial, obtenerInventarioInicial } = useContext(VentasContext);

    useEffect(() => {
        obtenerInventarioInicial();
    }, [obtenerInventarioInicial]);

    const cantidadMaxima = 10000;

    const labels = inventarioInicial.map(item => item.ingrediente);
    const porcentajesRestantes = inventarioInicial.map(
        item => ((item.cantidad_inicial || 0) / cantidadMaxima) * 100
    );

    const productosBajoInventario = inventarioInicial.filter(
        item => ((item.cantidad_inicial || 0) / cantidadMaxima) * 100 < 20
    );

    const doughnutData = {
        labels,
        datasets: [
            {
                label: 'Inventario Restante (%)',
                data: porcentajesRestantes,
                backgroundColor: [
                    '#36A2EB', '#FFCE56', '#FF6384', '#4BC0C0', '#9966FF', '#FFA07A',
                ],
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (tooltipItem) {
                        const value = tooltipItem.raw;
                        return `${Math.round(value)}% Restante`;
                    },
                },
            },
            legend: {
              position: 'bottom',
          },
        },
    };

    return (
        <div className="dashboard">
            <h1 className="dashboard-title">📊 Dashboard</h1>
            <div className="dashboard-cards">
                <div className="card">
                    <div className="card-content-horizontal">
                        {/* Gráfico de Inventario */}
                        <div className="chart-container">
                            <h2>Inventario</h2>
                            <p>Porcentaje de inventario disponible.</p>
                            {inventarioInicial.length > 0 ? (
                                <Doughnut data={doughnutData} options={options} />
                            ) : (
                                <p>Cargando datos...</p>
                            )}
                        </div>

                        {/* Contenedor de productos bajo inventario */}
                        <div className="low-inventory-container">
                        {productosBajoInventario.length > 0 ? (
                          <ul className="low-inventory-list">
                          <h3>⚠️ Bajo Inventario</h3>
                            {productosBajoInventario.map((producto, index) => (
                              <li key={index} style={{ color: 'red' }}>
                                {producto.ingrediente}: {producto.cantidad_inicial} unidades restantes
                                </li>
                              ))}
                            </ul>
                              ) : (
                              <div>
                                <h3>✅ Inventario Completo</h3> 
                                <ul className="good-inventory-list">
                                  {inventarioInicial.map((producto, index) =>(
                                    <li key={index} style={{color: 'green'}}>
                                      {producto.ingrediente}:{((producto.cantidad_inicial /cantidadMaxima) * 100).toFixed(0)} % disponible
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              )}
                            {/* Botón para realizar pedido */}
                            {productosBajoInventario.length > 0 && (
                                <Link to="pedidos" className="order-button">
                                    Realizar Pedido
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Link to = "productos" className='button-productos'>
            Productos
            </Link>
        </div>
    );
};

export default Dashboard;
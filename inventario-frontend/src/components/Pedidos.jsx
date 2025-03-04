import React, { useContext, useEffect, useState } from 'react';
import { VentasContext } from '../Context/VentasContext';
import '../CSS/Pedidos.css';
import axios from 'axios';

const Pedidos = () => {
    const { inventarioInicial, reponerInventario, obtenerHistorialPedidos } = useContext(VentasContext);
    const [historialPedidos, setHistorialPedidos] = useState([]);
    const [mostrarTodos, setMostrarTodos] = useState(false);

    const productosParaMostrar = mostrarTodos
        ? inventarioInicial // Mostrar todos los productos si mostrarTodos es true
        : inventarioInicial.filter(
              item => ((item.cantidad_inicial || 0) / 10000) * 100 < 30
          );
    useEffect(() =>{
        const cargarHistorial = async() =>{
            const historial = await obtenerHistorialPedidos();
            setHistorialPedidos(historial);
        };
        cargarHistorial();
    }, [obtenerHistorialPedidos]);
    const eliminarHistorial = async () =>{
        try{
            if(historialPedidos.length === 0){
                alert('El historial ya esta vacío o no hay historial para eliminar.');
                return;
            }
            const response = await axios.delete('http://localhost:3001/api/historial-pedidos');
            alert(response.data.message);
            setHistorialPedidos([]);
        } catch(error){
            console.error('Error al eliminar el historial de pedidos.', error.message);
            alert('Error al eliminar el historial de pedidos.');
        }
    };

    return (
        <div className="pedidos-container">
            <h1>📦 Pedidos</h1>
            <button
                className="mostrar-todos-button"
                onClick={() => setMostrarTodos(!mostrarTodos)}
            >
                {mostrarTodos
                    ? 'Mostrar productos con menos del 30%'
                    : 'Mostrar todos los productos'}
            </button>
            {productosParaMostrar.length > 0 ? (
                <table className="pedidos-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>% Disponible</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosParaMostrar.map((producto, index) => (
                            <tr key={index}>
                                <td>{producto.ingrediente}</td>
                                <td>{producto.cantidad_inicial}</td>
                                <td>{((producto.cantidad_inicial / 10000) * 100).toFixed(0)}%</td>
                                <td>
                                    <button
                                        className="reponer-button"
                                        onClick={() =>reponerInventario(producto.ingrediente)}
                                    >
                                        Reponer Producto
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ color: 'green' }}>Todos los productos están en buen estado.</p>
            )}
            {/*Tabla de historial de pedidos*/}
            <h2>Historial de Pedidos</h2>
            <button className="eliminar-historial-button" onClick={eliminarHistorial}>
                Eliminar todo el historial
            </button>
            <table className='pedidos-table'>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Fecha y Hora</th>
                    </tr>
                </thead>
                <tbody>
                    {historialPedidos.map((pedido, index)=>(
                        <tr key={index}>
                            <td>{pedido.ingrediente}</td>
                            <td>{pedido.cantidad}</td>
                            <td>{new Date(pedido.fecha_hora).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Pedidos;
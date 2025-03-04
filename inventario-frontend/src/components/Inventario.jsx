import React, { useContext, useState, useEffect } from 'react';
import { VentasContext } from '../Context/VentasContext';
import * as XLSX from 'xlsx';
import '../CSS/Inventario.css';

const Inventario = () => {
    const { ventasPDF, inventario, actualizarDiaSiguiente } = useContext(VentasContext);
 // Incluye la función del contexto
    const [inventarioInicial, setInventarioInicial] = useState([]);
    const [inventarioFinal, setInventarioFinal] = useState([]);

    const exportarExcel = () =>{
        if(inventarioFinal.length === 0){
            alert('No hay datos en el inventario final para exportar.');
            return;
        }
        const datosExcel = inventarioFinal.map(item =>{
            const gramos = item.cantidad_final;
            const kilogramos = (gramos/1000).toFixed(3);
            const cajas = Math.floor(gramos / 2000);
            const restante = (gramos % 2000) / 1000;
            return{
                Ingrediente: item.ingrediente,
                'Cajas (2KG)': cajas,
                'Kilogramos (restante)': restante > 0 ? restante.toFixed(3) : '0.000',
                'Kilogramos (Total)': kilogramos,
            };
        });

        const hoja = XLSX.utils.json_to_sheet(datosExcel);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Inventario Final');
        XLSX.writeFile(libro, 'Inventario_del_dia.xlsx');
    }

    // Función para obtener el inventario desde el backend
    const fetchInventario = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/inventario'); // Llama al endpoint
            const data = await response.json();

            // Configura el inventario inicial y final con los datos recibidos
            setInventarioInicial(
                data.map(item => ({
                    id: item.id,
                    ingrediente: item.ingrediente,
                    cantidad_inicial: item.cantidad_inicial,
                }))
            );

            setInventarioFinal(
                data.map(item => ({
                    id: item.id,
                    ingrediente: item.ingrediente,
                    cantidad_final: item.cantidad_final,
                }))
            );
        } catch (error) {
            console.error('Error al obtener el inventario:', error);
        }
    };
    // Llama a fetchInventario al montar el componente
    useEffect(() => {
        fetchInventario();
    }, [inventario]);
    useEffect(() => {
        document.body.classList.add('inventario-page');
        return () => document.body.classList.remove('inventario-page');
    }, []);    
    return (
        <div className='inventario-container'>
            <div className="inventario">
                <h1 className="inventario-title">📦 Inventario Real</h1>

                {/* Botón para actualizar inventario para el día siguiente */}
                <button onClick={actualizarDiaSiguiente} className="reset-button">
                    Actualizar Inventario para el Día Siguiente
                </button>

                {/* Inventario Inicial */}
                <div className="inventario-section">
                    <h2>Inventario Actual</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Ingrediente</th>
                                <th>Cantidad Inicial</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventarioInicial.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.ingrediente}</td>
                                    <td>{item.cantidad_inicial}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Ventas desde PDF */}
                <div className="inventario-section">
                    <h2>Ventas desde PDF</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad Vendida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasPDF.length === 0 ? (
                                <tr>
                                    <td colSpan="2">No hay datos disponibles</td>
                                </tr>
                            ) : (
                                ventasPDF.map((venta, index) => (
                                    <tr key={index}>
                                        <td>{venta.producto}</td>
                                        <td>{venta.cantidad}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Inventario Final */}
                <div className="inventario-section">
                    <h2>Inventario Final</h2>
                    <button className="exportar-excel-button" onClick={exportarExcel}>
                        Descargar Inventario en Excel
                    </button>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Ingrediente</th>
                                <th>Cantidad Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventarioFinal.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.ingrediente}</td>
                                    <td>{item.cantidad_final}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventario;

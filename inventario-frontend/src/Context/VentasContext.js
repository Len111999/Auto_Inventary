import React, { createContext, useEffect, useState } from 'react';
import axios from 'axios';

export const VentasContext = createContext();

export const VentasProvider = ({ children }) => {
    const [ventasPDF, setVentasPDF] = useState([]); // Inicializa como un arreglo vacío
    const [inventario, setInventario] = useState([]);
    const [inventarioInicial, setInventarioInicial] = useState([]);

    // Función para actualizar el inventario desde el backend
    const actualizarInventario = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/inventario');
            const data = await response.json();
            setInventario(data);
        } catch (error) {
            console.error('Error al obtener el inventario:', error);
        }
    };
    const obtenerInventarioInicial = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/inventario-inicial');
            const data = await response.json();
            setInventarioInicial(data);
        } catch (error) {
            console.error('Error al obtener el inventario inicial:', error);
        }
    };
    const reponerInventario = async (ingrediente) => {
        try {
            const response = await axios.post('http://localhost:3001/api/reponer-inventario', {
                ingrediente,
            });
            alert(response.data.message);
            obtenerInventarioInicial(); // Refrescar datos tras la reposición
        } catch (error) {
            if (error.response && error.response.status === 400) {
                alert(error.response.data.message);
            } else {
                console.error('Error al reponer el inventario:', error.message);
                alert('Error al reponer el inventario.');
            }
        }
    };    
    // Llamamos a ambas funciones al montar el componente
    useEffect(() => {
        actualizarInventario();
        obtenerInventarioInicial();
    }, []);
    // Función para subir un archivo PDF y procesar las ventas
    const subirVentas = async (archivo) => {
        const formData = new FormData();
        formData.append('file', archivo);
    
        try {
            const response = await fetch('http://localhost:3001/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });
    
            if (!response.ok) {
                // Si el backend devuelve un error, lo propagamos al frontend
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar el archivo.');
            }
    
            const data = await response.json();
            setVentasPDF(data.ventas || []); // Actualiza las ventas globales
            await actualizarInventario(); // Refresca el inventario
    
            return { success: true, data }; // Retorna éxito al frontend
        } catch (error) {
            console.error('Error en subirVentas:', error.message);
            return { success: false, error: error.message }; // Retorna el error al frontend
        }
    };
    const obtenerHistorialPedidos = async() =>{
        try{
            const response = await axios.get('http://localhost:3001/api/historial-pedidos');
            return response.data;
        } catch (error){
            console.error('Error al obtener el historial de pedidos.', error.message);
            return [];
        }
    };
    const modificarInventario = async (inventarioModificado) => {
        try {
            const response = await fetch('http://localhost:3001/api/modificar-inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inventario: inventarioModificado }),
            });

            const data = await response.json();
            if (data.success) {
                await actualizarInventario(); // Refrescar inventario tras guardar cambios
                return { success: true, message: 'Inventario actualizado correctamente' };
            } else {
                return { success: false, message: 'Error al actualizar el inventario' };
            }
        } catch (error) {
            console.error('Error al modificar el inventario:', error);
            return { success: false, message: 'Error en la actualización del inventario' };
        }
    };
    // Función para actualizar el inventario al día siguiente
    const actualizarDiaSiguiente = async () => {
        if (ventasPDF.length === 0) {
            alert('Debes subir el archivo de ventas antes de actualizar el día siguiente.');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:3001/api/actualizar-dia', {
                method: 'POST',
            });
    
            const data = await response.json();
            console.log(data.message);
    
            // Refrescar el inventario desde el backend
            await actualizarInventario();
    
            // Reiniciar ventas desde PDF
            setVentasPDF([]);
        } catch (error) {
            console.error('Error al actualizar inventario para el día siguiente:', error);
        }
    };
    return (
        <VentasContext.Provider value={{ ventasPDF, setVentasPDF, inventario, inventarioInicial, reponerInventario, actualizarInventario, subirVentas, actualizarDiaSiguiente, modificarInventario, obtenerInventarioInicial, obtenerHistorialPedidos }}>
            {children}
        </VentasContext.Provider>
    );
};

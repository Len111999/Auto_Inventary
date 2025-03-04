import React, { useContext, useEffect, useState } from 'react';
import { VentasContext } from '../Context/VentasContext';
import '../CSS/Ajustes.css';

const Ajustes = () => {
    const { ventasPDF, actualizarInventario } = useContext(VentasContext);
    const [edicion, setEdicion] = useState(false);
    const [ventasEditadas, setVentasEditadas] = useState([]);

    useEffect(() => {
        document.body.classList.add('ajustes-page');
        return () => document.body.classList.remove('ajustes-page');
    }, []);
    useEffect(() =>{
        setVentasEditadas(ventasPDF);
    }, [ventasPDF]);

    const handleChange = (index,campo, valor) => {
        const nuevasVentas = [...ventasEditadas];
        nuevasVentas[index][campo] = valor;
        setVentasEditadas(nuevasVentas);
    }
    
    const guardarCambios = async() =>{
        try{
            const response = await fetch('http://localhost:3001/api/ajustes-ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ventas: ventasEditadas }),
            });
            const data = await response.json();
            if(data.success){
                actualizarInventario();
                alert('Inventario actualizado correctamente');
                setEdicion(false);
            } else{
                alert('Error al actualizar el inventario');
            }
        } catch(error){
            console.error('Error al guardar los cambios: ', error);
            alert('Error a la actualización');
        }
    }
    return (
        <div className="ajustes-container">
            <h1 className="ajustes-title">⚙️ Ajustes de Inventario</h1>

            <div className="ajustes-section">
                <h2>Datos del Informe PDF</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad Vendida</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventasEditadas.length === 0 ? (
                            <tr>
                                <td colSpan="3">No hay datos disponibles</td>
                            </tr>
                        ) : (
                            ventasEditadas.map((venta, index) => (
                                <tr key={index}>
                                    <td>{venta.producto}</td>
                                    <td>
                                        {edicion ? (
                                            <input
                                                type="number"
                                                value={venta.cantidad}
                                                onChange={(e) => handleChange(index, 'cantidad', parseInt(e.target.value, 10))}
                                            />
                                        ) : (
                                            venta.cantidad
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="edit-button"
                                            onClick={() => setEdicion(!edicion)}
                                        >
                                            {edicion ? 'Cancelar' : 'Editar'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {edicion && (
                <button className="save-button" onClick={guardarCambios}>
                    Guardar Cambios
                </button>
            )}
        </div>
    );
};

export default Ajustes;
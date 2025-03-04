import React, { useContext, useState, useEffect } from 'react';
import { VentasContext } from '../Context/VentasContext';
import '../CSS/Informes.css';

const Informe = () => {
    const { subirVentas } = useContext(VentasContext);
    const [archivo, setArchivo] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [informes, setInformes] = useState([]);
    const [mostrarBoton, setMostrarBoton] = useState(false); // Estado para mostrar el botón adicional

    const fetchInformes = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/informes');
            const data = await response.json();
            const informesFormateados = data.map((informe) => ({
                ...informe,
                fecha: new Date(informe.fecha).toISOString().split('T')[0],
            }));
            setInformes(informesFormateados);
        } catch (error) {
            console.error('Error al obtener los informes:', error);
        }
    };

    const eliminarInforme = async (id) => {
        try {
            await fetch(`http://localhost:3001/api/informes/${id}`, { method: 'DELETE' });
            setInformes((prev) => prev.filter((informe) => informe.id !== id));
        } catch (error) {
            console.error('Error al eliminar el informe:', error);
        }
    };

    useEffect(() => {
        fetchInformes();
    }, []);
    useEffect(() => {
        document.body.classList.add('informe-page');
        return () => document.body.classList.remove('informe-page');
    }, []);

    const handleArchivoChange = (e) => {
        setArchivo(e.target.files[0]);
        setMensaje('');
        setMostrarBoton(false); // Resetear el botón al seleccionar un nuevo archivo
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!archivo) {
            setMensaje('Por favor, selecciona un archivo PDF.');
            return;
        }

        try {
            const response = await subirVentas(archivo);

            if (!response.success) {
                setMensaje(`Error: ${response.error}`);
                if (response.error.includes('faltantes')) {
                    setMostrarBoton(true); // Mostrar el botón si hay productos faltantes
                }
                return;
            }

            setMensaje('El archivo ha sido procesado correctamente.');
            setMostrarBoton(false); // Ocultar el botón si el archivo se procesa correctamente
            fetchInformes();
        } catch (error) {
            console.error('Error al subir el archivo:', error.message);
            setMensaje('Hubo un error al procesar el archivo. Intenta nuevamente.');
        }
    };

    const getMessageClass = (message) => {
        if (message.toLowerCase().includes('error')) return 'error';
        return 'success';
    };

    return (
        <div className="informe-container">
            <h1 className="informe-title">📑 Subir Informe de Ventas</h1>
            <form onSubmit={handleSubmit} className="informe-form">
                <label htmlFor="archivo" className="informe-label">Seleccionar archivo:</label>
                <input type="file" id="archivo" accept=".pdf" onChange={handleArchivoChange} className="informe-input" />
                <button type="submit" className="informe-button">Procesar PDF</button>
            </form>
            {mensaje && <p className={`informe-message ${getMessageClass(mensaje)}`}>{mensaje}</p>}

            {/* Botón adicional para procesar con productos faltantes */}
            {mostrarBoton && (
                <button className="process-missing-button" onClick={handleSubmit}>
                    Procesar con Productos Faltantes
                </button>
            )}

            <div className="informe-info">
                <h2>📋 Instrucciones</h2>
                <ul>
                    <li>El archivo debe estar en formato PDF.</li>
                    <li>Verifica que el informe contiene la cantidad de ventas diarias.</li>
                    <li>El inventario se actualizará automáticamente después de procesar el archivo.</li>
                </ul>
            </div>
            <div className="informe-list">
                <h2>📋 Informes Subidos</h2>
                <ul>
                    {informes.length === 0 ? <p>No hay informes subidos aún.</p> : informes.map((informe) => (
                        <li key={informe.id}>
                            <strong>Fecha:</strong> {informe.fecha} | <strong>Archivo:</strong> {informe.nombre_archivo} |
                            <strong>Descripción:</strong> {informe.descripcion}{' '}
                            <button className="delete-button" onClick={() => eliminarInforme(informe.id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Informe;
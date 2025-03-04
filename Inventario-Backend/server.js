const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3001;

// Configurar middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de Multer
const upload = multer({ dest: 'uploads/' });
const recetas = {
    Hamburguesas: {
        Carne: 1,
        Pan: 1,
        Queso: 1,
    },
    Patatas: {
        Papas: 1, // Cada unidad de "Patatas" requiere 1 unidad de "Papas"
    },
    Refresco: {
        Saborizante: 1, // Cada unidad de "Refresco" requiere 1 unidad de "Saborizante"
        Agua: 1,        // Cada unidad de "Refresco" requiere 1 unidad de "Agua"
    },
    // Agrega más productos si es necesario
};
// Ruta para obtener el inventario desde la base de datos
app.get('/api/inventario', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM inventario');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener el inventario:', error.message);
        res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});
app.post('/api/ajustes-ventas', async (req, res) => {
    const { ventas } = req.body;

    try {
        for (const venta of ventas) {
            const receta = recetas[venta.producto];
            if (!receta) continue;

            for (const [ingrediente, cantidadPorUnidad] of Object.entries(receta)) {
                const cantidadTotal = cantidadPorUnidad * venta.cantidad;

                // Actualizar solo ventas_del_dia y cantidad_final
                await db.query(
                    `UPDATE inventario
                     SET ventas_del_dia = ?, 
                         cantidad_final = GREATEST(cantidad_inicial - ?, 0)
                     WHERE ingrediente = ?`,
                    [cantidadTotal, cantidadTotal, ingrediente]
                );
            }
        }

        res.json({ success: true, message: 'Ventas ajustadas correctamente. Ventas del día actualizadas.' });
    } catch (error) {
        console.error('Error al ajustar las ventas:', error.message);
        res.status(500).json({ success: false, error: 'Error al ajustar las ventas.' });
    }
});
// Ruta para procesar el PDF y actualizar el inventario
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
    const filePath = path.join(__dirname, req.file.path);

    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        fs.unlinkSync(filePath);

        const { ventas, error } = await extraerVentas(pdfData.text);

        // Generar descripción dinámica
        const descripcion = error
            ? `Informe procesado con productos faltantes: ${error}`
            : 'Informe procesado correctamente. Todos los productos están completos.';

        // Registrar el informe
        await db.query(
            `INSERT INTO informes (fecha, nombre_archivo, descripcion) VALUES (CURDATE(), ?, ?)`,
            [req.file.originalname || 'Informe sin nombre', descripcion]
        );

        // Procesar las ventas y actualizar el inventario
        for (const venta of ventas) {
            const receta = recetas[venta.producto];
            if (!receta) continue;

            for (const [ingrediente, cantidadPorUnidad] of Object.entries(receta)) {
                const cantidadTotal = cantidadPorUnidad * venta.cantidad;

                // Actualizar ventas_del_dia y recalcular cantidad_final
                await db.query(
                    `UPDATE inventario
                     SET cantidad_final = GREATEST(cantidad_inicial - ?, 0),
                         ventas_del_dia = ?
                     WHERE ingrediente = ?`,
                    [cantidadTotal, cantidadTotal, ingrediente]
                );
            }
        }

        res.json({
            success: true,
            ventas,
            message: error
                ? `Archivo procesado con productos faltantes: ${error}`
                : 'Archivo procesado correctamente.',
        });
    } catch (error) {
        console.error('Error al procesar el archivo PDF:', error.message);
        res.status(500).json({ success: false, error: 'Error al procesar el archivo PDF.' });
    }
});
// Función para extraer la cantidad vendida desde el texto del PDF
async function extraerVentas(pdfText) {
    const regex = /(\w+):\s*(\d+)/g;
    const ventas = [];
    let match;

    // Extraer productos presentes en el PDF
    while ((match = regex.exec(pdfText)) !== null) {
        const producto = match[1].trim();
        const cantidad = parseInt(match[2], 10);
        ventas.push({ producto, cantidad });
    }
    if (ventas.length === 0) {
        console.error('No se encontraron productos válidos en el archivo PDF.');
        return { ventas: [], error: 'No se encontraron productos válidos en el archivo PDF.' };
    }
    // Identificar productos faltantes
    const productosEnPDF = ventas.map((venta) => venta.producto);
    const productosFaltantes = Object.keys(recetas).filter(
        (producto) => !productosEnPDF.includes(producto)
    );

    // Agregar productos faltantes con cantidad 0
    productosFaltantes.forEach((productoFaltante) => {
        ventas.push({ producto: productoFaltante, cantidad: 0 });
    });
    if (productosFaltantes.length > 0) {
        return { ventas, error: `Faltan los siguientes productos en el archivo PDF: ${productosFaltantes.join(', ')}` };
    }
    return { ventas, error: null };
}
app.get('/api/inventario-inicial', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, ingrediente, cantidad_inicial FROM inventario');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener el inventario inicial:', error.message);
        res.status(500).json({ error: 'Error al obtener el inventario inicial.' });
    }
});
app.post('/api/reponer-inventario', async (req, res) => {
    const { ingrediente } = req.body;
    try {
        const [result] = await db.query(
            `SELECT cantidad_inicial FROM inventario WHERE ingrediente = ?`,
            [ingrediente]
        );
        if(result.length > 0 && result[0].cantidad_inicial >= 10000){
            return res
            .status(400)
            .json({ success: false, message: 'No se puede reponer el producto porque esta al 100% de su capacidad.'});
        }
        
        //Actualizar inventario
        await db.query(
            `UPDATE inventario
             SET cantidad_inicial = 10000
             WHERE ingrediente = ?`,
             [ingrediente]
        );
        //Registrar en el historial de pedidos
        await db.query(
            `INSERT into historial_pedidos (ingrediente, cantidad, fecha_hora) VALUES (?, 10000, NOW())`,
            [ingrediente]
        );
        res.status(200).json({ success: true, message: `Producto ${ingrediente} repuesto correctamente.` });
    } catch (error) {
        console.error('Error al reponer el inventario:', error.message);
        res.status(500).json({ success: false, error: 'Error al reponer el inventario.' });
    }
});
//Ruta para eliminar el hitorial de pedidos
app.delete('/api/historial-pedidos', async(req,res) =>{
    try{
        await db.query(`DELETE FROM historial_pedidos`);
        res.status(200).json({ success: true, message: 'Historial de pedidos eliminado correctamente. '});
    } catch(error){
        console.error('Error al eliminar el historial de pedidos: ', error.message);
        res.status(500).json({success: false, error:'Error al eliminar el historial de pedidos.'});
    }
});
//Ruta para historial de pedidos
app.get('/api/historial-pedidos', async(req, res) =>{
    try{
        const [result] = await db.query('SELECT * FROM historial_pedidos ORDER BY fecha_hora DESC');
        res.status(200).json(result);
    } catch (error){
        console.error('Error al obtener el historial de pedidos:', error.message);
        res.status(500).json({ error: 'Error al obtener el historial de pedidos.'});
    }
});
// Ruta para actualizar inventario para el día siguiente
app.post('/api/actualizar-dia', async (req, res) => {
    try {
        await db.query(`
            UPDATE inventario
            SET cantidad_inicial = cantidad_final,
                cantidad_final = 0,
                ventas_acumuladas = ventas_acumuladas + ventas_del_dia,
                ventas_del_dia = 0
        `);

        res.json({ message: 'Inventario actualizado para el día siguiente' });
    } catch (error) {
        console.error('Error al actualizar inventario para el día siguiente:', error);
        res.status(500).json({ error: 'Error al actualizar el inventario' });
    }
});
app.get('/api/informes', async (req, res) => {
    try {
        const [informes] = await db.query('SELECT * FROM informes ORDER BY fecha DESC');
        res.json(informes);
    } catch (error) {
        console.error('Error al obtener los informes:', error.message);
        res.status(500).json({ error: 'Error al obtener los informes' });
    }
});
app.delete('/api/informes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(`DELETE FROM informes WHERE id = ?`, [id]);
        res.json({ message: 'Informe eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el informe:', error.message);
        res.status(500).json({ error: 'Error al eliminar el informe' });
    }
});
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
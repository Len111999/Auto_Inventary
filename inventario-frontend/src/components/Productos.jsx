import React, { useState } from 'react';
import '../CSS/Productos.css';

function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function Productos() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseSalesReport(text);
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
    };
    reader.readAsText(file);
  };

  const parseSalesReport = (text) => {
    const lines = text.split('\n');
    const data = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 1. Separar columnas por 2+ espacios
      const cols = trimmed.split(/\s{2,}/);

      // 2. Verificar que la primera col sea numérica (ranking)
      if (cols.length < 2 || !isNumeric(cols[0])) {
        continue;
      }

      // 3. Identificar la categoría (2ª columna) o ver si está vacía
      //    Convertimos a mayúsculas para comparar con "COMIDA", "BEBIDA", etc.
      const possibleCategory = (cols[1] || '').toUpperCase();
      // Podrías ajustar este arreglo para incluir "OTROS", "COMBO", etc.
      const knownCategories = ['COMIDA', 'BEBIDA', 'OTROS', 'COMBO'];
      const isCategory = knownCategories.includes(possibleCategory);

      // 4. El "Num Vendido" normalmente está al final de la línea.
      //    Buscamos desde la derecha la primera columna que sea numérica.
      let indexNumVendido = -1;
      for (let i = cols.length - 1; i >= 0; i--) {
        if (isNumeric(cols[i])) {
          indexNumVendido = i;
          break;
        }
      }
      if (indexNumVendido === -1) {
        // No encontramos un número al final, saltamos esta línea
        continue;
      }

      const numVendido = cols[indexNumVendido].trim();

      // 5. Ahora, según sea el caso (categoría o no),
      //    localizamos el número de artículo y el nombre del artículo.
      let articleNumber = '';
      let articleName = '';

      if (isCategory) {
        // Estructura: rank, category, ... -> next numeric = articleNumber
        // Lo que quede entre articleNumber y numVendido es el nombre
        // Ej: [0]rank, [1]category, [2]?, [3]?, ..., [indexNumVendido] -> numVendido
        // Buscamos la primera col numérica a partir de cols[2]
        let indexArticleNumber = -1;
        for (let i = 2; i < indexNumVendido; i++) {
          if (isNumeric(cols[i])) {
            indexArticleNumber = i;
            break;
          }
        }
        if (indexArticleNumber === -1) {
          // No se encontró el número de artículo
          continue;
        }
        articleNumber = cols[indexArticleNumber].trim();

        // El nombre del artículo son todas las columnas entre
        // indexArticleNumber + 1 y indexNumVendido - 1
        const nameParts = [];
        for (let i = indexArticleNumber + 1; i < indexNumVendido; i++) {
          nameParts.push(cols[i]);
        }
        articleName = nameParts.join(' ').trim();
      } else {
        // Caso "shift": la segunda columna no es categoría, sino parte del nº artículo
        // Ej: [0]rank, [1] -> possible articleNumber, [2..] -> name? y al final -> numVendido
        // 1) Localizar la primera col numérica a partir de [1].
        let indexArticleNumber = -1;
        for (let i = 1; i < indexNumVendido; i++) {
          if (isNumeric(cols[i])) {
            indexArticleNumber = i;
            break;
          }
        }
        if (indexArticleNumber === -1) {
          continue;
        }
        articleNumber = cols[indexArticleNumber].trim();

        // El nombre del artículo son las columnas entre
        // indexArticleNumber + 1 y indexNumVendido - 1
        const nameParts = [];
        for (let i = indexArticleNumber + 1; i < indexNumVendido; i++) {
          nameParts.push(cols[i]);
        }
        articleName = nameParts.join(' ').trim();
      }

      // Si por alguna razón no tenemos nombre o número, descartamos
      if (!articleNumber || !articleName) {
        continue;
      }

      // 6. Guardamos el resultado
      data.push({ articleNumber, articleName, numVendido });
    }

    setProducts(data);
    setError('');
  };

  return (
    <div style={{ marginTop: '80px', padding: '20px' }}>
      <h1>Subir Informe de Ventas Consolidado</h1>

      <input
        type="file"
        accept=".txt"
        onChange={handleFileUpload}
        style={{ marginBottom: '10px' }}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {products.length > 0 && (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Número de Artículo</th>
                <th>Nombre del Artículo</th>
                <th>Num Vendido</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.articleNumber}</td>
                  <td>{p.articleName}</td>
                  <td>{p.numVendido}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Nº Elementos:
                </td>
                <td style={{ fontWeight: 'bold' }}>{products.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default Productos;
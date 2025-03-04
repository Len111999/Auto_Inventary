const fs = require('fs');

function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function parsePmixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Usamos un objeto para evitar duplicados: { [articleNumber]: articleName }
  const articlesMap = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Separar por 2+ espacios
    const cols = trimmed.split(/\s{2,}/);

    // Verificamos que la primera col sea un ranking numérico
    // y que tengamos al menos 4 columnas para (Rango, Cat?, Num, Nombre)
    if (cols.length < 4 || !isNumeric(cols[0])) {
      continue;
    }

    // Caso: col[1] puede ser la categoría (COMIDA, BEBIDA, OTROS, COMBO) o estar vacío
    // Buscamos la siguiente columna numérica que será "articleNumber"
    let indexArticleNumber = -1;
    for (let i = 1; i < cols.length; i++) {
      if (isNumeric(cols[i])) {
        indexArticleNumber = i;
        break;
      }
    }
    if (indexArticleNumber === -1) continue; // No se encontró número de artículo

    const articleNumber = cols[indexArticleNumber].trim();

    // El nombre del artículo suele estar en col[indexArticleNumber + 1]
    // a veces puede extenderse si el nombre tiene espacios,
    // pero normalmente, en el PMIX, el nombre se ve en la columna 3 o 4.
    // Asumamos que está en la siguiente columna:
    const indexName = indexArticleNumber + 1;
    if (indexName >= cols.length) continue; // No hay nombre

    const articleName = cols[indexName].trim();
    if (!articleName) continue;

    // Guardamos en el map (evitamos duplicados)
    articlesMap[articleNumber] = articleName;
  }

  // Convertimos a un arreglo de objetos
  const articlesArray = Object.keys(articlesMap).map(num => ({
    articleNumber: num,
    articleName: articlesMap[num]
  }));

  return articlesArray;
}

// Ejemplo de uso:
const filePath = 'Pmix Consolidado.pmx.txt';
const result = parsePmixFile(filePath);

// Imprimir en consola los pares (número, nombre)
console.log(result);

// Generar un SQL de ejemplo:
const sqlStatements = [];
sqlStatements.push('CREATE TABLE IF NOT EXISTS productos (\n' +
  '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
  '  codigo VARCHAR(20) NOT NULL,\n' +
  '  nombre VARCHAR(255) NOT NULL\n' +
  ');\n'
);

result.forEach(item => {
  // Escapar comillas simples en el nombre, por si acaso
  const safeName = item.articleName.replace(/'/g, "''");
  sqlStatements.push(
    `INSERT INTO productos (codigo, nombre) VALUES ('${item.articleNumber}', '${safeName}');`
  );
});

fs.writeFileSync('import_productos.sql', sqlStatements.join('\n'), 'utf-8');
console.log('Se generó import_productos.sql con los INSERT.'); 

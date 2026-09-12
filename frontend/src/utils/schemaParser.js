/**
 * Parses SQL CREATE TABLE statements into structured table/column definitions.
 * Works seamlessly with SQLite, PostgreSQL, and MySQL outputs.
 */
export function parseSchema(schemaString) {
  if (!schemaString || typeof schemaString !== 'string') return [];

  const tables = [];
  // Split on CREATE TABLE (case-insensitive)
  const statements = schemaString.split(/(?=CREATE\s+TABLE)/i);

  for (const rawStmt of statements) {
    const trimmed = rawStmt.trim();
    if (!trimmed || !/^CREATE\s+TABLE/i.test(trimmed)) continue;

    // Extract table name and body inside outer parentheses
    const match = trimmed.match(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["'`]?([a-zA-Z0-9_]+)["'`]?\.)?["'`]?([a-zA-Z0-9_]+)["'`]?\s*\(([\s\S]+)\)/i
    );

    if (!match) continue;

    const tableName = match[2] || match[1];
    const columnBody = match[3];

    // Split columns by comma outside parentheses
    const rawCols = [];
    let parenDepth = 0;
    let currentChunk = '';

    for (let i = 0; i < columnBody.length; i++) {
      const char = columnBody[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        if (currentChunk.trim()) rawCols.push(currentChunk.trim());
        currentChunk = '';
      } else {
        currentChunk += char;
      }
    }
    if (currentChunk.trim()) rawCols.push(currentChunk.trim());

    const columns = [];

    for (const rawCol of rawCols) {
      const colLine = rawCol.trim();
      // Skip table-level constraints
      if (
        /^(?:CONSTRAINT|PRIMARY\s+KEY\s*\(|FOREIGN\s+KEY\s*\(|UNIQUE\s*\(|CHECK\s*\()/i.test(
          colLine
        )
      ) {
        continue;
      }

      // Extract col name and type: "id INTEGER PRIMARY KEY" -> name: "id", type: "INTEGER"
      const parts = colLine.replace(/["'`]/g, '').split(/\s+/);
      if (parts.length > 0 && parts[0]) {
        const colName = parts[0];
        const colType = parts[1] ? parts[1].replace(/,$/, '').toUpperCase() : 'TEXT';
        columns.push({ name: colName, type: colType });
      }
    }

    tables.push({
      name: tableName,
      columns,
    });
  }

  return tables;
}

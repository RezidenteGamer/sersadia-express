import ExcelJS from 'exceljs';

// Matches the layout of the HR-provided "Lista de Sócios" spreadsheet exactly:
// same headers, column widths, font and fill colors, so files can round-trip
// between this system and the HR team's own spreadsheet tooling.
const SHEET_NAME = 'Planilha1';
const HEADERS = ['Nº pess.', 'Nº pessoal', 'Plano de benefícios complement'] as const;
const COLUMN_WIDTHS = [9, 39, 30.43];
const FONT = { name: 'Aptos Narrow', size: 11 };
const HEADER_FILL = 'FF808000';
const DATA_FILL = 'FFFFFF99';
const PLAN_LABEL = 'SERP - Fco Beltrão/PR';

export interface MemberSheetRow {
  mbrf_id: string;
  name: string;
}

function styleCell(cell: ExcelJS.Cell, fill: string) {
  cell.font = { ...FONT };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.numFmt = '@';
}

export async function exportMembersXlsx(rows: MemberSheetRow[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  const headerRow = sheet.addRow(HEADERS);
  headerRow.eachCell((cell) => styleCell(cell, HEADER_FILL));

  for (const row of rows) {
    const excelRow = sheet.addRow([row.mbrf_id, row.name, PLAN_LABEL]);
    excelRow.eachCell((cell) => styleCell(cell, DATA_FILL));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Lista de Sócios SER SADIA ${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseMembersXlsx(file: File): Promise<MemberSheetRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('A planilha está vazia ou em um formato inválido.');

  const rows: MemberSheetRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header

    const mbrfId = String(row.getCell(1).value ?? '').trim();
    const name = String(row.getCell(2).value ?? '').trim();
    if (!mbrfId || !name) return;

    rows.push({ mbrf_id: mbrfId, name });
  });

  if (rows.length === 0) {
    throw new Error('Nenhuma linha válida encontrada. Confira se as colunas são Nº pess. e Nº pessoal.');
  }

  return rows;
}

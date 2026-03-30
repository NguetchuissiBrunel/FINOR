import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Auto-fit column widths based on content */
function autoFitColumns(
  ws: XLSX.WorkSheet,
  data: Record<string, unknown>[],
  headers: string[]
) {
  const colWidths = headers.map((h, i) => {
    const maxData = data.reduce((max, row) => {
      const val = Object.values(row)[i];
      return Math.max(max, val !== undefined ? String(val).length : 0);
    }, 0);
    return { wch: Math.max(h.length + 2, maxData + 2, 12) };
  });
  ws['!cols'] = colWidths;
}

/** Add a merged title row at the top (row 0) of the sheet */
function addSheetTitle(ws: XLSX.WorkSheet, title: string, colCount: number) {
  XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
  ws['!merges'] = ws['!merges'] || [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Récapitulatif global
// ─────────────────────────────────────────────────
export interface GlobalSummaryData {
  totalInvested: number;
  totalSpent: number;
  balance: number;
  executionRate: number;
  exportDate: string;
}

export function exportGlobalSummary(data: GlobalSummaryData) {
  const rows = [
    ['Récapitulatif Financier Global — FINOR', ''],
    ['', ''],
    ['Indicateur', 'Valeur'],
    ['Total Investi (FCFA)', data.totalInvested],
    ['Total Dépensé (FCFA)', data.totalSpent],
    ['Solde Disponible (FCFA)', data.balance],
    ["Taux d'Exécution (%)", data.executionRate],
    ["Date d'export", data.exportDate],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 25 }];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  XLSX.utils.book_append_sheet(wb, ws, 'Récapitulatif');
  XLSX.writeFile(wb, `FINOR_Recap_Global_${today()}.xlsx`);
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Liste des Investisseurs & Codes
// ─────────────────────────────────────────────────
export interface InvestorRow {
  name: string;
  total: number;
  code: string;
}

export function exportInvestorsList(investors: InvestorRow[]) {
  const headers = ['Investisseur', 'Total Investi (FCFA)', 'Code Personnel'];
  const rows = investors.map(inv => ({
    'Investisseur': inv.name,
    'Total Investi (FCFA)': inv.total,
    'Code Personnel': inv.code,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  autoFitColumns(ws, rows, headers);
  addSheetTitle(ws, 'Liste des Investisseurs — FINOR', headers.length);

  XLSX.utils.book_append_sheet(wb, ws, 'Investisseurs');
  XLSX.writeFile(wb, `FINOR_Investisseurs_${today()}.xlsx`);
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Dépôts validés
// ─────────────────────────────────────────────────
export interface DepositRow {
  date: string;
  investor: string;
  rubric: string;
  amount: number;
  code: string;
}

export function exportValidatedDeposits(deposits: DepositRow[]) {
  const headers = ['Date', 'Investisseur', 'Rubrique', 'Montant (FCFA)', 'Code Reçu'];
  const rows = deposits.map(d => ({
    'Date': d.date,
    'Investisseur': d.investor,
    'Rubrique': d.rubric,
    'Montant (FCFA)': d.amount,
    'Code Reçu': d.code,
  }));

  const total = deposits.reduce((s, d) => s + d.amount, 0);
  rows.push({
    'Date': '',
    'Investisseur': '',
    'Rubrique': 'TOTAL',
    'Montant (FCFA)': total,
    'Code Reçu': '',
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  autoFitColumns(ws, rows, headers);
  addSheetTitle(ws, 'Relevé des Dépôts Validés — FINOR', headers.length);

  XLSX.utils.book_append_sheet(wb, ws, 'Dépôts Validés');
  XLSX.writeFile(wb, `FINOR_Depots_Valides_${today()}.xlsx`);
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Dépenses
// ─────────────────────────────────────────────────
export interface ExpenseRow {
  date: string;
  description: string;
  rubric: string;
  amount: number;
  receipt?: string;
}

export function exportExpenses(expenses: ExpenseRow[]) {
  const headers = ['Date', 'Objet', 'Rubrique', 'Montant (FCFA)', 'N° Justificatif'];
  const rows = expenses.map(e => ({
    'Date': e.date,
    'Objet': e.description,
    'Rubrique': e.rubric,
    'Montant (FCFA)': e.amount,
    'N° Justificatif': e.receipt || '—',
  }));

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  rows.push({
    'Date': '',
    'Objet': '',
    'Rubrique': 'TOTAL',
    'Montant (FCFA)': total,
    'N° Justificatif': '',
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  autoFitColumns(ws, rows, headers);
  addSheetTitle(ws, 'Journal des Dépenses — FINOR', headers.length);

  XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');
  XLSX.writeFile(wb, `FINOR_Depenses_${today()}.xlsx`);
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Transferts / Prêts inter-rubriques
// ─────────────────────────────────────────────────
export interface TransferRow {
  date: string;
  source: string;
  destination: string;
  amount: number;
  reason: string;
}

export function exportTransfers(transfers: TransferRow[]) {
  const headers = ['Date', 'Rubrique Prêteuse', 'Rubrique Emprunteuse', 'Montant (FCFA)', 'Motif'];
  const rows = transfers.map(t => ({
    'Date': t.date,
    'Rubrique Prêteuse': t.source,
    'Rubrique Emprunteuse': t.destination,
    'Montant (FCFA)': t.amount,
    'Motif': t.reason,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  autoFitColumns(ws, rows, headers);
  addSheetTitle(ws, 'Relevé des Prêts Inter-Rubriques — FINOR', headers.length);

  XLSX.utils.book_append_sheet(wb, ws, 'Prêts');
  XLSX.writeFile(wb, `FINOR_Prets_${today()}.xlsx`);
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Audit d'une rubrique spécifique
// ─────────────────────────────────────────────────
export interface AuditRow {
  displayDate: string;
  type: string;
  label: string;
  amount: number;
  prefix: string;
}

export function exportRubricAudit(
  rubricName: string,
  history: AuditRow[],
  currentBalance: number
) {
  const headers = ['Date', 'Type', 'Libellé', 'Montant (FCFA)'];
  const rows = history.map(h => ({
    'Date': h.displayDate,
    'Type': h.type,
    'Libellé': h.label,
    'Montant (FCFA)': h.prefix === '-' ? -h.amount : h.amount,
  }));
  rows.push({
    'Date': '',
    'Type': '',
    'Libellé': 'SOLDE ACTUEL',
    'Montant (FCFA)': currentBalance,
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  autoFitColumns(ws, rows, headers);
  addSheetTitle(ws, `Journal d'Audit : ${rubricName} — FINOR`, headers.length);

  XLSX.utils.book_append_sheet(wb, ws, 'Audit Rubrique');
  XLSX.writeFile(
    wb,
    `FINOR_Audit_${rubricName.replace(/\s+/g, '_')}_${today()}.xlsx`
  );
}

// ─────────────────────────────────────────────────
// TRÉSORIER – Rapport complet multi-feuilles
// ─────────────────────────────────────────────────
export interface FullReportData {
  globalStats: { total_invested: number; total_spent: number; execution_rate: number };
  investors: InvestorRow[];
  deposits: DepositRow[];
  expenses: ExpenseRow[];
  transfers: TransferRow[];
  rubricBalances: { name: string; invested: number; spent: number; balance: number }[];
}

export function exportMasterReport(data: FullReportData) {
  const t = today();
  
  // Create an array of arrays representing the rows of our single master sheet.
  // We will stack all sections vertically.
  const rows: any[][] = [];

  // --- SECTION 1: GLOBAL SUMMARY ---
  rows.push(['RAPPORT FINANCIER GLOBAL ET DÉTAILLÉ — FINOR', '']);
  rows.push(['Date d\'exportation:', t]);
  rows.push([]);
  rows.push(['--- 1. RÉSUMÉ EXÉCUTIF ---', '']);
  rows.push(['Total Investi (FCFA)', data.globalStats.total_invested]);
  rows.push(['Total Dépensé (FCFA)', data.globalStats.total_spent]);
  rows.push(['Solde Global (FCFA)', data.globalStats.total_invested - data.globalStats.total_spent]);
  rows.push(['Taux d\'Exécution (%)', `${data.globalStats.execution_rate.toFixed(1)}%`]);
  rows.push([]);

  // --- SECTION 2: RUBRIQUES (SOLDES) ---
  rows.push(['--- 2. ÉTAT DES RUBRIQUES (SOLDES) ---', '', '', '']);
  rows.push(['Nom de la Rubrique', 'Total Investi (FCFA)', 'Total Dépensé (FCFA)', 'Solde Actuel (FCFA)']);
  data.rubricBalances.forEach(r => {
    rows.push([r.name, r.invested, r.spent, r.balance]);
  });
  rows.push([]);

  // --- SECTION 3: INVESTISSEURS ---
  rows.push(['--- 3. INVESTISSEURS & CONTRIBUTIONS ---', '', '']);
  rows.push(['Nom de l\'Investisseur', 'Code Personnel', 'Total Investi Validé (FCFA)']);
  data.investors.forEach(inv => {
    rows.push([inv.name, inv.code, inv.total]);
  });
  rows.push([]);

  // --- SECTION 4: ENTRÉES (DÉPÔTS VALIDÉS) ---
  rows.push(['--- 4. JOURNAL DES ENTRÉES (INVESTISSEMENTS) ---', '', '', '', '']);
  rows.push(['Date', 'Investisseur', 'Rubrique', 'Code Reçu', 'Montant (FCFA)']);
  data.deposits.forEach(d => {
    rows.push([d.date, d.investor, d.rubric, d.code, d.amount]);
  });
  rows.push([]);

  // --- SECTION 5: SORTIES (DÉPENSES) ---
  rows.push(['--- 5. JOURNAL DES SORTIES (DÉPENSES) ---', '', '', '', '']);
  rows.push(['Date', 'Description de la Dépense', 'Rubrique', 'Justificatif', 'Montant (FCFA)']);
  data.expenses.forEach(e => {
    rows.push([e.date, e.description, e.rubric, e.receipt || '—', e.amount]);
  });
  rows.push([]);

  // --- SECTION 6: TRANSFERTS ---
  rows.push(['--- 6. TRANSFERTS (PRÊTS INTER-RUBRIQUES) ---', '', '', '', '']);
  rows.push(['Date', 'Rubrique Prêteuse', 'Rubrique Emprunteuse', 'Motif', 'Montant (FCFA)']);
  data.transfers.forEach(tr => {
    rows.push([tr.date, tr.source, tr.destination, tr.reason, tr.amount]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Approximate column widths for the master sheet
  ws['!cols'] = [
    { wch: 30 }, // Col A
    { wch: 25 }, // Col B
    { wch: 25 }, // Col C
    { wch: 25 }, // Col D
    { wch: 20 }, // Col E
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rapport Complet');
  XLSX.writeFile(wb, `FINOR_Grand_Livre_${t}.xlsx`);
}

// ─────────────────────────────────────────────────
// INVESTISSEUR – Relevé personnel
// ─────────────────────────────────────────────────
export interface PersonalStatementRow {
  date: string;
  rubric: string;
  amount: number;
  status: string;
}

export function exportPersonalStatement(
  investorName: string,
  investorCode: string,
  investments: PersonalStatementRow[],
  totalValidated: number
) {
  const wb = XLSX.utils.book_new();

  const infoRows = [
    ['Relevé Personnel — FINOR', ''],
    ['Investisseur', investorName],
    ['Code Personnel', investorCode],
    ["Date d'export", today()],
    ['Total Validé (FCFA)', totalValidated],
    ['', ''],
  ];

  const headers = ['Date', 'Rubrique', 'Montant (FCFA)', 'Statut'];
  const dataRows = investments.map(inv => ({
    'Date': inv.date,
    'Rubrique': inv.rubric,
    'Montant (FCFA)': inv.amount,
    'Statut': inv.status,
  }));

  const ws = XLSX.utils.aoa_to_sheet(infoRows);
  XLSX.utils.sheet_add_json(ws, dataRows, { header: headers, origin: -1, skipHeader: false });
  ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Mon Relevé');
  XLSX.writeFile(
    wb,
    `FINOR_Releve_${investorName.replace(/\s+/g, '_')}_${today()}.xlsx`
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import {
  ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { useNotification } from '../context/NotificationContext';
import {
  StatisticsService,
  RubricsService,
  InvestmentsService,
  ExpensesService,
  InvestorsService,
  TransfersService,
  InvestmentStatusEnum,
  type RubricBalance
} from '../lib';
import { LoadingOverlay } from '../components/UI/LoadingOverlay';

export const TreasurerDashboard = () => {
  const { showNotification } = useNotification();
  const formatAmount = (val: number | string) => {
    return Number(val).toLocaleString('fr-FR');
  };

  // Security Check
  useEffect(() => {
    const isAuth = sessionStorage.getItem('isTreasurerAuthenticated');
    if (isAuth !== 'true') {
      window.location.href = '/tresorier/login';
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'expenses' | 'transfers' | 'rubrics' | 'investors'>('overview');
  const [showNewRubricForm, setShowNewRubricForm] = useState(false);
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [showNewTransferForm, setShowNewTransferForm] = useState(false);
  const [selectedRubricForHistory, setSelectedRubricForHistory] = useState<string | null>(null);
  const [visibleCodeId, setVisibleCodeId] = useState<string | null>(null);

  // Data States
  const [globalStats, setGlobalStats] = useState({ total_invested: 0, total_spent: 0, execution_rate: 0 });
  const [rubricsList, setRubricsList] = useState<{ id: string, name: string }[]>([]);
  const [rubricData, setRubricData] = useState<{ name: string, value: number, invested: number, spent: number }[]>([]);
  const [investorsList, setInvestorsList] = useState<{ id: string, name: string, total: number, code: string }[]>([]);
  const [loanExposureData, setLoanExposureData] = useState<{ name: string, lent: number, self: number }[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<{ id: string, user: string, amount: number, project: string, code: string, date: string, rubric_id: string }[]>([]);
  const [validatedDeposits, setValidatedDeposits] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  // flowData will be added back when backend provides monthly stats
  const [loading, setLoading] = useState(true);

  // Form States
  const [newRubricName, setNewRubricName] = useState('');
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', rubric_id: '', receipt_number: '' });
  const [newTransfer, setNewTransfer] = useState({ source_rubric_id: '', destination_rubric_id: '', amount: '', reason: '' });

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Parallel fetch of all independent resources
      const [
        statsRes,
        validDepRes,
        invRes,
        rRes,
        pendingDepRes,
        expRes,
        tRes
      ] = await Promise.all([
        StatisticsService.getGlobalStatsStatsGlobalGet(),
        InvestmentsService.listInvestmentsInvestmentsGet('VALIDATED' as InvestmentStatusEnum),
        InvestorsService.listInvestorsInvestorsGet(),
        RubricsService.listRubricsRubricsGet(),
        InvestmentsService.listInvestmentsInvestmentsGet('PENDING' as InvestmentStatusEnum),
        ExpensesService.listExpensesExpensesGet(),
        TransfersService.listTransfersTransfersGet()
      ]);

      // Global Stats
      if (statsRes.data) {
        setGlobalStats(statsRes.data);
      }

      // Validated deposits to compute totals
      const validDeposits = validDepRes.data || [];
      setValidatedDeposits(validDeposits);
      const investorTotals = validDeposits.reduce((acc, dep) => {
        acc[dep.investor_id] = (acc[dep.investor_id] || 0) + dep.amount;
        return acc;
      }, {} as Record<string, number>);

      // Investors list
      const users = invRes.data || [];
      setInvestorsList(users.filter(u => u.role === 'INVESTOR').map(u => ({
        id: u.id,
        name: u.name,
        total: investorTotals[u.id] || 0,
        code: u.access_code || 'N/A'
      })));

      // Rubrics & Balances
      const rList = rRes.data || [];
      setRubricsList(rList.map(r => ({ id: r.id, name: r.name })));

      // 2. Secondary parallel fetch for balances dependent on Rubrics list
      const balancesList = await Promise.all(
        rList.map(async r => {
          const bal = await RubricsService.getRubricBalanceRubricsRubricIdBalanceGet(r.id);
          return bal.data;
        })
      );
      const validBalances = balancesList.filter((b): b is RubricBalance => b != null);

      setRubricData(validBalances.map(b => ({
        name: b.rubric_name,
        value: b.current_balance,
        invested: b.total_invested,
        spent: b.total_expenses
      })));

      setLoanExposureData(validBalances.map(b => ({
        name: b.rubric_name,
        lent: b.total_transferred_out,
        self: b.current_balance
      })));

      // Pending Deposits
      const pending = pendingDepRes.data || [];
      // Map rubric IDs to names temporarily
      const rMap = rList.reduce((acc, r) => ({ ...acc, [r.id]: r.name }), {} as Record<string, string>);

      setPendingDeposits(pending.map(p => ({
        id: p.id,
        user: users.find(u => u.id === p.investor_id)?.name || 'Inconnu',
        amount: p.amount,
        project: rMap[p.rubric_id] || 'Inconnu',
        code: p.bank_receipt_code,
        date: new Date(p.created_at).toLocaleDateString(),
        rubric_id: p.rubric_id
      })));

      // Expenses & Transfers
      setExpenses(expRes.data || []);
      setTransfers(tRes.data || []);

    } catch (e) {
      showNotification("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleValidateDeposit = async (id: string) => {
    try {
      await InvestmentsService.validateInvestmentInvestmentsInvestmentIdValidatePatch(id);
      showNotification('Dépôt validé avec succès !');
      await fetchData();
    } catch {
      showNotification('Erreur lors de la validation');
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      await InvestmentsService.rejectInvestmentInvestmentsInvestmentIdRejectPatch(id, { rejection_reason: 'Rejet manuel' });
      showNotification('Dépôt rejeté');
      await fetchData();
    } catch {
      showNotification('Erreur lors du rejet');
    }
  };

  const handleCreateRubric = async () => {
    if (!newRubricName) return showNotification('Nom de la rubrique requis');
    try {
      await RubricsService.createRubricRubricsPost({ name: newRubricName, initial_balance: 0 });
      showNotification('Rubrique créée !');
      setShowNewRubricForm(false);
      setNewRubricName('');
      await fetchData();
    } catch (e) {
      showNotification('Erreur création rubrique');
    }
  };

  const handleCreateExpense = async () => {
    const rid = newExpense.rubric_id || rubricsList[0]?.id;
    if (!newExpense.description || !newExpense.amount || !rid) return showNotification('Champs requis manquants');

    try {
      await ExpensesService.createExpenseExpensesPost({
        rubric_id: rid,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        receipt_number: newExpense.receipt_number || null,
        date: new Date().toISOString()
      });
      showNotification('Dépense enregistrée !');
      setShowNewExpenseForm(false);
      setNewExpense({ description: '', amount: '', rubric_id: '', receipt_number: '' });
      await fetchData();
    } catch (e) {
      showNotification('Erreur enregistrement dépense');
    }
  };

  const handleCreateTransfer = async () => {
    const srcId = newTransfer.source_rubric_id || rubricsList[0]?.id;
    const destId = newTransfer.destination_rubric_id || rubricsList[0]?.id;

    if (!newTransfer.reason || !newTransfer.amount || !srcId || !destId) return showNotification('Champs requis manquants');
    if (srcId === destId) return showNotification('Les rubriques doivent être différentes');

    try {
      await TransfersService.createTransferTransfersPost({
        source_rubric_id: srcId,
        destination_rubric_id: destId,
        amount: Number(newTransfer.amount),
        reason: newTransfer.reason,
        date: new Date().toISOString()
      });
      showNotification('Transfert enregistré !');
      setShowNewTransferForm(false);
      setNewTransfer({ source_rubric_id: '', destination_rubric_id: '', amount: '', reason: '' });
      await fetchData();
    } catch (e) {
      showNotification('Erreur enregistrement transfert');
    }
  };

  if (loading) {
    return <LoadingOverlay message="Synchronisation des données" />;
  }

  const getAllActivities = () => {
    const items: Array<{ id: string, date: string, displayDate: string, type: string, label: string, amount: number, color: string, prefix: string }> = [];

    validatedDeposits.forEach(d => {
      const investor = investorsList.find(i => i.id === d.investor_id)?.name || 'Investisseur';
      const rName = rubricsList.find(r => r.id === d.rubric_id)?.name || 'Rubrique';
      items.push({
        id: `dep-${d.id}`,
        date: new Date(d.created_at).toISOString(),
        displayDate: new Date(d.created_at).toLocaleDateString(),
        type: 'Entrée',
        label: `Investissement (${investor}) → ${rName}`,
        amount: d.amount,
        color: '#2ecc71',
        prefix: '+'
      });
    });

    expenses.forEach(e => {
      const rName = rubricsList.find(r => r.id === e.rubric_id)?.name || 'Rubrique';
      items.push({
        id: `exp-${e.id}`,
        date: new Date(e.date || e.created_at).toISOString(),
        displayDate: new Date(e.date || e.created_at).toLocaleDateString(),
        type: 'Sortie',
        label: `Dépense (${rName}): ${e.description}`,
        amount: e.amount,
        color: '#e74c3c',
        prefix: '-'
      });
    });

    transfers.forEach(t => {
      const srcName = rubricsList.find(x => x.id === t.source_rubric_id)?.name || 'Inconnue';
      const destName = rubricsList.find(x => x.id === t.destination_rubric_id)?.name || 'Inconnue';
      items.push({
        id: `tr-${t.id}`,
        date: new Date(t.date || t.created_at).toISOString(),
        displayDate: new Date(t.date || t.created_at).toLocaleDateString(),
        type: 'Transfert',
        label: `Prêt : ${srcName} → ${destName}`,
        amount: t.amount,
        color: '#e67e22',
        prefix: '↔'
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  };

  const getMonthlyFlows = () => {
    const months: { monthKey: string, name: string, entrees: number, sorties: number }[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d);
      m.setMonth(d.getMonth() - i);
      const monthStr = m.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      months.push({
        monthKey: `${m.getFullYear()}-${m.getMonth()}`,
        name: monthStr,
        entrees: 0,
        sorties: 0
      });
    }

    const getMonthKey = (dateStr: string) => {
      const m = new Date(dateStr);
      return `${m.getFullYear()}-${m.getMonth()}`;
    };

    validatedDeposits.forEach(d => {
      const key = getMonthKey(d.created_at);
      const m = months.find(x => x.monthKey === key);
      if (m) m.entrees += d.amount;
    });

    expenses.forEach(e => {
      const key = getMonthKey(e.date || e.created_at);
      const m = months.find(x => x.monthKey === key);
      if (m) m.sorties += e.amount;
    });

    return months;
  };

  const getRubricHistory = (rubricName: string) => {
    const r = rubricsList.find(r => r.name === rubricName);
    if (!r) return [];

    const items: Array<{ date: string, displayDate: string, type: string, label: string, amount: number, color: string, prefix: string }> = [];

    validatedDeposits.forEach(d => {
      if (d.rubric_id === r.id) {
        const investor = investorsList.find(i => i.id === d.investor_id)?.name || 'Investisseur';
        items.push({
          date: new Date(d.created_at).toISOString(),
          displayDate: new Date(d.created_at).toLocaleDateString(),
          type: 'Entrée',
          label: `Investissement (${investor})`,
          amount: d.amount,
          color: '#2ecc71',
          prefix: '+'
        });
      }
    });

    expenses.forEach(e => {
      if (e.rubric_id === r.id) {
        items.push({
          date: new Date(e.date || e.created_at).toISOString(),
          displayDate: new Date(e.date || e.created_at).toLocaleDateString(),
          type: 'Sortie',
          label: `Dépense: ${e.description}`,
          amount: e.amount,
          color: '#e74c3c',
          prefix: '-'
        });
      }
    });

    transfers.forEach(t => {
      if (t.source_rubric_id === r.id) {
        const destName = rubricsList.find(x => x.id === t.destination_rubric_id)?.name || 'Inconnue';
        items.push({
          date: new Date(t.date || t.created_at).toISOString(),
          displayDate: new Date(t.date || t.created_at).toLocaleDateString(),
          type: 'Transfert Sortant',
          label: `Prêt vers ${destName} - ${t.reason}`,
          amount: t.amount,
          color: '#e67e22',
          prefix: '-'
        });
      }
      if (t.destination_rubric_id === r.id) {
        const srcName = rubricsList.find(x => x.id === t.source_rubric_id)?.name || 'Inconnue';
        items.push({
          date: new Date(t.date || t.created_at).toISOString(),
          displayDate: new Date(t.date || t.created_at).toLocaleDateString(),
          type: 'Transfert Entrant',
          label: `Prêt de ${srcName} - ${t.reason}`,
          amount: t.amount,
          color: '#3498db',
          prefix: '+'
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getRunningBalance = (rubricName: string) => {
    const history = getRubricHistory(rubricName);
    const reversed = [...history].reverse();
    let balance = 0;
    return reversed.map((item, idx) => {
      if (item.type === 'Entrée' || item.type === 'Transfert Entrant') {
        balance += item.amount;
      } else {
        balance -= item.amount;
      }
      return {
        // use idx to ensure uniqueness if multiple transactions on same day
        id: idx,
        date: item.displayDate,
        Solde: balance
      };
    });
  };

  const renderTabs = () => (
    <div className="flex gap-4 mb-10 border-b border-gold-light pb-4 overflow-x-auto">
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Vue d'ensemble
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'investors' ? 'active' : ''}`}
        onClick={() => setActiveTab('investors')}
      >
        Investisseurs (Codes)
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'deposits' ? 'active' : ''}`}
        onClick={() => setActiveTab('deposits')}
      >
        Vérification Dépôts
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'expenses' ? 'active' : ''}`}
        onClick={() => setActiveTab('expenses')}
      >
        Dépenses
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'transfers' ? 'active' : ''}`}
        onClick={() => setActiveTab('transfers')}
      >
        Prêts (Transferts)
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'rubrics' ? 'active' : ''}`}
        onClick={() => setActiveTab('rubrics')}
      >
        Gestion Rubriques
      </button>
    </div>
  );

  return (
    <div className="treasurer-dashboard pt-32 pb-12">
      <h1 className="mb-8">Espace <span className="text-gold">Trésorier</span></h1>

      {renderTabs()}

      {activeTab === 'overview' && (
        <div className="animation-fade-in">
          <h2 className="mb-10 text-gold-glow">Analyse Financière Globale</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-30">
            <Card className="border-gold">
              <p className="text-muted text-sm mb-3">Solde Total</p>
              <h2 className="text-gold m-0">{(globalStats.total_invested - globalStats.total_spent).toLocaleString()} FCFA</h2>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">Total Investissements</p>
              <h3 className="m-0">{globalStats.total_invested.toLocaleString()} FCFA</h3>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">Total Dépenses</p>
              <h3 className="m-0">{globalStats.total_spent.toLocaleString()} FCFA</h3>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">Taux d'Exécution</p>
              <h3 className="m-0 text-gold">{globalStats.execution_rate.toFixed(1)}%</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <Card title="Comparaison Investi vs Dépensé">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={rubricData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis 
                      type="number" 
                      stroke="#888" 
                      fontSize={11}
                      tickFormatter={(val) => val >= 1000 ? `${(val/1000)}k` : val}
                    />
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(212, 175, 55, 0.5)', borderRadius: '8px' }}
                      formatter={(val: any) => [`${formatAmount(val)} FCFA`, '']}
                    />
                    <Legend />
                    <Bar dataKey="invested" name="Total Investi" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name="Total Dépensé" fill="#FFF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Suivi Mensuel des Flux">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={getMonthlyFlows()} margin={{ left: 40, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#888" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => Math.abs(val) >= 1000 ? `${(val/1000)}k` : val}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(212, 175, 55, 0.5)', borderRadius: '8px' }}
                      formatter={(val: any) => [`${formatAmount(val)} FCFA`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="entrees" name="Entrées (Dépôts)" stroke="#2ecc71" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="sorties" name="Sorties (Dépenses)" stroke="#e74c3c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Dernières Activités Centrales">
            <div className="mt-4">
              {getAllActivities().map((act) => (
                <div key={act.id} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-4 rounded-xl transition-all duration-300 group">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: `${act.color}15`,
                        border: `1px solid ${act.color}30`
                      }}
                    >
                      {act.type === 'Entrée' && (
                        <svg className="w-6 h-6" style={{ color: act.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {act.type === 'Sortie' && (
                        <svg className="w-6 h-6" style={{ color: act.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                      {act.type === 'Transfert' && (
                        <svg className="w-6 h-6" style={{ color: act.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-medium m-0 text-white/90 group-hover:text-gold transition-colors">{act.label}</p>
                      <p className="text-sm text-white/40 m-0 mt-1">{act.displayDate} • <span style={{ color: act.color }} className="font-medium">{act.type}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-lg font-bold tracking-wide block transition-transform group-hover:scale-105"
                      style={{ color: act.color }}
                    >
                      {act.prefix} {formatAmount(act.amount)} FCFA
                    </span>
                  </div>
                </div>
              ))}
              {getAllActivities().length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center text-white/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-muted text-sm">Aucune activité récente recensée.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">Validations Dépôts Bancaires</h2>
          </div>
          <Card className="p-0 overflow-hidden">
            {pendingDeposits.length === 0 ? (
              <div className="py-16 text-center border-t border-white/5">
                <div className="w-16 h-16 rounded-full bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gold">✓</span>
                </div>
                <p className="text-[#D4AF37] text-lg mb-2">Aucun dépôt en attente</p>
                <p className="text-muted text-sm">Toutes les soumissions de vos investisseurs ont été traitées.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Date</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Code Reçu</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Investisseur</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Projet</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Montant (FCFA)</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.map(dep => (
                      <tr key={dep.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>{dep.date}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-gold)' }}>{dep.code}</td>
                        <td style={{ padding: '1rem' }}>{dep.user}</td>
                        <td style={{ padding: '1rem' }}>{dep.project}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatAmount(dep.amount)}</td>
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <Button size="sm" onClick={() => handleValidateDeposit(dep.id)}>Valider</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleRejectDeposit(dep.id)}>Rejeter</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">Gestion des Dépenses</h2>
            {!showNewExpenseForm && (
              <Button onClick={() => setShowNewExpenseForm(true)}>+ Nouvelle Dépense</Button>
            )}
          </div>

          {showNewExpenseForm ? (
            <Card title="Enregistrer une Dépense" className="mb-8 border-gold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Objet de la dépense" placeholder="ex: Carburant" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                <Input label="Montant (FCFA)" placeholder="0" type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                <div className="form-group">
                  <label className="form-label">Rubrique Débitée</label>
                  <select className="form-input" value={newExpense.rubric_id || rubricsList[0]?.id} onChange={e => setNewExpense({ ...newExpense, rubric_id: e.target.value })}>
                    {rubricsList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <Input label="Justificatif / Facture" placeholder="N° de facture" value={newExpense.receipt_number} onChange={e => setNewExpense({ ...newExpense, receipt_number: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-6">
                <Button onClick={handleCreateExpense}>Enregistrer</Button>
                <Button variant="secondary" onClick={() => setShowNewExpenseForm(false)}>Annuler</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {expenses.length === 0 ? (
                <div className="py-16 text-center border-t border-white/5">
                  <div className="w-16 h-16 rounded-full bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gold">💰</span>
                  </div>
                  <p className="text-[#D4AF37] text-lg mb-2">Aucune dépense enregistrée</p>
                  <p className="text-muted text-sm">Vous n'avez effectué aucune sortie de caisse pour le moment.</p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '1rem' }}>Objet</th>
                        <th style={{ padding: '1rem' }}>Montant</th>
                        <th style={{ padding: '1rem' }}>Rubrique</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem' }}>{e.description}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatAmount(e.amount)} FCFA</td>
                          <td style={{ padding: '1rem' }}>{rubricsList.find(r => r.id === e.rubric_id)?.name || 'Inconnue'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">Transferts Entre Rubriques (Prêts)</h2>
            {!showNewTransferForm && (
              <Button onClick={() => setShowNewTransferForm(true)}>+ Nouveau Transfert</Button>
            )}
          </div>

          {showNewTransferForm ? (
            <Card title="Nouveau Prêt" className="mb-8 border-gold">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTransfer(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Rubrique Prêteuse</label>
                    <select className="form-input" value={newTransfer.source_rubric_id || rubricsList[0]?.id} onChange={e => setNewTransfer({ ...newTransfer, source_rubric_id: e.target.value })}>
                      {rubricsList.map(r => <option key={`out-${r.id}`} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rubrique Emprunteuse</label>
                    <select className="form-input" value={newTransfer.destination_rubric_id || rubricsList[0]?.id} onChange={e => setNewTransfer({ ...newTransfer, destination_rubric_id: e.target.value })}>
                      {rubricsList.map(r => <option key={`in-${r.id}`} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <Input label="Montant du prêt" type="number" placeholder="FCFA" value={newTransfer.amount} onChange={e => setNewTransfer({ ...newTransfer, amount: e.target.value })} />
                  <Input label="Motif / Justification" placeholder="Ex: Achat urgent de ciment" value={newTransfer.reason} onChange={e => setNewTransfer({ ...newTransfer, reason: e.target.value })} />
                </div>
                <div className="flex gap-4 mt-6">
                  <Button type="submit">Valider le Prêt</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowNewTransferForm(false)}>Annuler</Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card title="Exposition des Prêts par Rubrique">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={loanExposureData} stackOffset="expand">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }} />
                      <Legend />
                      <Bar dataKey="self" name="Fonds Disponibles" stackId="a" fill="#D4AF37" />
                      <Bar dataKey="lent" name="Fonds Prêtés" stackId="a" fill="#E67E22" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Détail des Flux Actuels">
                <div className="p-4 border border-dashed border-gold-light rounded-md">
                  <p className="text-muted text-sm text-center">Récapitulatif des transferts</p>
                  <div className="mt-4 py-4 min-h-[200px] flex flex-col justify-center">
                    {transfers.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center text-white/20 border border-white/10">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        <p className="text-muted text-sm">Aucun transfert inter-rubriques enregistré.</p>
                      </div>
                    ) : (transfers.map((t: any) => {
                      const srcName = rubricsList.find(r => r.id === t.source_rubric_id)?.name || 'Inconnue';
                      const destName = rubricsList.find(r => r.id === t.destination_rubric_id)?.name || 'Inconnue';
                      return (
                        <div key={t.id} className="flex justify-between items-center mb-4 pb-3 border-b border-white/5 last:border-0 group cursor-default">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/80 group-hover:text-gold transition-colors">{srcName} → {destName}</span>
                            <span className="text-[10px] text-muted tracking-wider uppercase mt-0.5">{t.reason || 'Transfert de fonds'}</span>
                          </div>
                          <span className="text-gold font-bold tabular-nums">{formatAmount(t.amount)} FCFA</span>
                        </div>
                      );
                    }))}
                  </div>
                  <Button variant="secondary" size="sm" fullWidth className="mt-2">Générer Rapport de Prêts</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'investors' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">Récupération des Codes Investisseurs</h2>
            <p className="text-sm text-muted">Aider un membre qui a égaré son code d'accès personnel.</p>
          </div>

          {investorsList.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center text-white/20 border border-white/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-gold text-lg mb-2">Aucun investisseur répertorié</p>
              <p className="text-muted text-sm">Les comptes investisseurs apparaîtront ici dès leur première déclaration.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Investisseur</th>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Total Investi</th>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Code Personnel</th>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investorsList.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/[0.02] transition-colors">
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{inv.name}</td>
                      <td style={{ padding: '1rem' }} className="tabular-nums">{formatAmount(inv.total)} <span className="text-[10px] opacity-50">FCFA</span></td>
                      <td style={{ padding: '1rem' }}>
                        {visibleCodeId === inv.id ? (
                          <span className="text-gold font-bold" style={{ letterSpacing: '2px', backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                            {inv.code}
                          </span>
                        ) : (
                          <span className="text-white/20 tracking-widest font-mono">••••••••</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div className="flex gap-6 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => setVisibleCodeId(visibleCodeId === inv.id ? null : inv.id)}
                          >
                            {visibleCodeId === inv.id ? 'Masquer' : 'Révéler'}
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(inv.code);
                              showNotification(`Code de ${inv.name} copié !`);
                            }}
                          >
                            Copier
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rubrics' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">
              {selectedRubricForHistory ? `Audit : ${selectedRubricForHistory}` : 'Gestion des Rubriques'}
            </h2>
            {!showNewRubricForm && !selectedRubricForHistory && (
              <Button onClick={() => setShowNewRubricForm(true)}>+ Nouvelle Rubrique</Button>
            )}
            {selectedRubricForHistory && (
              <Button variant="secondary" onClick={() => setSelectedRubricForHistory(null)}>← Retour</Button>
            )}
          </div>

          {selectedRubricForHistory ? (
            <div className="animation-fade-in">
              <Card className="border-gold/20 overflow-hidden mb-12">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20 text-gold shadow-lg shadow-gold/5">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                  </div>
                  <h3 className="m-0 text-xl font-bold tracking-tight">Courbe de Trésorerie : <span className="text-gold">{selectedRubricForHistory}</span></h3>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <AreaChart data={getRunningBalance(selectedRubricForHistory)}>
                      <defs>
                        <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#666" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value/1000)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                          borderRadius: '8px',
                          color: '#fff',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, 'Solde Disponible']}
                      />
                      <Area 
                        type="stepAfter" 
                        dataKey="Solde" 
                        stroke="#D4AF37" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSolde)" 
                        activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                        dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div style={{ marginTop: '100px' }}>
                <Card className=" border-white/10 overflow-hidden shadow-2xl mt-10">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20 text-gold shadow-lg shadow-gold/5">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>

                    <h3 className="m-0 text-xl font-bold tracking-tight">Journal des Opérations : <span className="text-gold">{selectedRubricForHistory}</span></h3>
                  </div>
                  <div className="table-wrapper" style={{ overflowX: 'auto', padding: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Date</th>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Type</th>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Libellé</th>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Montant (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRubricHistory(selectedRubricForHistory).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem' }}>{item.displayDate}</td>
                            <td style={{ padding: '1rem' }}><span style={{ color: item.color }}>{item.type}</span></td>
                            <td style={{ padding: '1rem' }}>{item.label}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.prefix} {formatAmount(item.amount)}</td>
                          </tr>
                        ))}
                        {getRubricHistory(selectedRubricForHistory).length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune transaction trouvée pour cette rubrique.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          ) : showNewRubricForm ? (
            <Card title="Créer une Rubrique" className="mb-8 border-gold">
              <div className="max-w-md">
                <Input label="Nom de la Rubrique" placeholder="ex: Santé / Dispensaie" value={newRubricName} onChange={e => setNewRubricName(e.target.value)} />
                <p className="text-xs text-muted mb-6 italic">Remarque : Toute nouvelle rubrique démarre avec un solde de **0 FCFA**. Le solde évolue uniquement via les investissements et les prélèvements.</p>
              </div>
              <div className="flex gap-4 mt-2">
                <Button onClick={handleCreateRubric}>Créer la rubrique</Button>
                <Button variant="secondary" onClick={() => setShowNewRubricForm(false)}>Annuler</Button>
              </div>
            </Card>
          ) : (
            <>
              {rubricData.length === 0 ? (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl animation-fade-in">
                  <div className="w-20 h-20 rounded-full bg-black/40 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-gold mb-2">Aucune rubrique configurée</h3>
                  <p className="text-muted max-w-sm mx-auto mb-8">
                    Commencez par créer des rubriques budgétaires (ex: Ecole, Santé, Projets) pour organiser vos investissements.
                  </p>
                  <Button onClick={() => setShowNewRubricForm(true)}>Créer ma première rubrique</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {rubricData.map((r, i) => (
                    <Card key={i} title={r.name} className="hover:border-gold/50 transition-all duration-300 group">
                      <div className="mb-6">
                        <p className="text-xs text-muted tracking-widest uppercase mb-1">Solde disponible</p>
                        <h2 className="text-gold group-hover:text-gold-light transition-colors tabular-nums">{formatAmount(r.value)} <small className="text-xs opacity-60">FCFA</small></h2>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">Investi</span>
                          <span className="font-medium text-white/70">{formatAmount(r.invested)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">Dépensé</span>
                          <span className="font-medium text-white/70">{formatAmount(r.spent)} FCFA</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => setSelectedRubricForHistory(r.name)}
                      >
                        Consulter l'historique d'audit
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

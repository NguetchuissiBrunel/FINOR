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
  AuthenticationService,
  ApiError,
  InvestmentStatusEnum,
  type RubricBalance
} from '../lib';
import {
  exportMasterReport,
  exportInvestorsList,
  exportValidatedDeposits,
  exportExpenses,
  exportTransfers,
  exportRubricAudit,
} from '../services/exportService';
import { LoadingOverlay } from '../components/UI/LoadingOverlay';
import { useTranslation } from 'react-i18next';

export const TreasurerDashboard = () => {
  const { t } = useTranslation();
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

  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'expenses' | 'transfers' | 'rubrics' | 'investors' | 'profile'>('overview');
  const [showNewRubricForm, setShowNewRubricForm] = useState(false);
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [showNewTransferForm, setShowNewTransferForm] = useState(false);
  const [selectedRubricForHistory, setSelectedRubricForHistory] = useState<string | null>(null);
  const [visibleCodeId, setVisibleCodeId] = useState<string | null>(null);
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);
  const [editRubricName, setEditRubricName] = useState('');

  // Data States
  const [globalStats, setGlobalStats] = useState({ total_invested: 0, total_spent: 0, execution_rate: 0 });
  const [rubricsList, setRubricsList] = useState<{ id: string, name: string }[]>([]);
  const [rubricData, setRubricData] = useState<{ id: string, name: string, value: number, invested: number, spent: number }[]>([]);
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

  // Password Update States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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
        id: b.rubric_id,
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
      showNotification(t('treasurerDashboard.overview.errData'));
    } finally {
      setLoading(false);
    }
  }, [showNotification, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleValidateDeposit = async (id: string) => {
    try {
      await InvestmentsService.validateInvestmentInvestmentsInvestmentIdValidatePatch(id);
      showNotification(t('treasurerDashboard.deposits.successValidate'));
      await fetchData();
    } catch {
      showNotification(t('treasurerDashboard.deposits.errValidate'));
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      await InvestmentsService.rejectInvestmentInvestmentsInvestmentIdRejectPatch(id, { rejection_reason: 'Rejet manuel' });
      showNotification(t('treasurerDashboard.deposits.successReject'));
      await fetchData();
    } catch {
      showNotification(t('treasurerDashboard.deposits.errReject'));
    }
  };

  const handleCreateRubric = async () => {
    if (!newRubricName) return showNotification(t('treasurerDashboard.rubrics.errRenameRequired'));
    try {
      await RubricsService.createRubricRubricsPost({ name: newRubricName, initial_balance: 0 });
      showNotification(t('treasurerDashboard.rubrics.successRename'));
      setShowNewRubricForm(false);
      setNewRubricName('');
      await fetchData();
    } catch (e) {
      showNotification(t('treasurerDashboard.rubrics.errUpdate'));
    }
  };

  const handleCreateExpense = async () => {
    const rid = newExpense.rubric_id || rubricsList[0]?.id;
    if (!newExpense.description || !newExpense.amount || !rid) return showNotification(t('treasurerDashboard.expenses.errSave'));

    try {
      await ExpensesService.createExpenseExpensesPost({
        rubric_id: rid,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        receipt_number: newExpense.receipt_number || null,
        date: new Date().toISOString()
      });
      showNotification(t('treasurerDashboard.expenses.successSave'));
      setShowNewExpenseForm(false);
      setNewExpense({ description: '', amount: '', rubric_id: '', receipt_number: '' });
      await fetchData();
    } catch (e) {
      showNotification(t('treasurerDashboard.expenses.errSave'));
    }
  };

  const handleUpdateRubric = async () => {
    if (!editingRubricId || !editRubricName.trim()) return;
    try {
      setLoading(true);
      await RubricsService.updateRubricRubricsRubricIdPatch(
        editingRubricId,
        { name: editRubricName }
      );
      showNotification(t('treasurerDashboard.rubrics.successRename'));
      setEditingRubricId(null);
      setEditRubricName('');
      await fetchData();
    } catch (err) {
      showNotification(t('treasurerDashboard.rubrics.errUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    const srcId = newTransfer.source_rubric_id || rubricsList[0]?.id;
    const destId = newTransfer.destination_rubric_id || rubricsList[0]?.id;

    if (!newTransfer.reason || !newTransfer.amount || !srcId || !destId) return showNotification(t('treasurerDashboard.expenses.errSave'));
    if (srcId === destId) return showNotification(t('treasurerDashboard.transfers.errSameRubric'));

    try {
      await TransfersService.createTransferTransfersPost({
        source_rubric_id: srcId,
        destination_rubric_id: destId,
        amount: Number(newTransfer.amount),
        reason: newTransfer.reason,
        date: new Date().toISOString()
      });
      showNotification(t('treasurerDashboard.transfers.successSave'));
      setShowNewTransferForm(false);
      setNewTransfer({ source_rubric_id: '', destination_rubric_id: '', amount: '', reason: '' });
      await fetchData();
    } catch (e) {
      showNotification(t('treasurerDashboard.transfers.errSave'));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showNotification(t('treasurerDashboard.profile.errMismatch'));
    }

    const email = sessionStorage.getItem('treasurerEmail');
    if (!email) {
      return showNotification(t('treasurerDashboard.profile.errSession'));
    }

    try {
      setPasswordLoading(true);
      // 1. Verify old password by attempting a login
      await AuthenticationService.treasurerLoginAuthTreasurerLoginPost({
        email,
        password: oldPassword
      });

      // 2. If login succeeds, the old password is correct. Now patch the new one.
      await AuthenticationService.updateMyProfileAuthMePatch({
        password: newPassword
      });

      showNotification(t('treasurerDashboard.profile.successPwd'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      if (err instanceof ApiError) {
        showNotification(t('treasurerDashboard.profile.errOldIncorrect'));
      } else {
        showNotification(t('treasurerDashboard.profile.errGeneral'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message={t('treasurerDashboard.sync')} />;
  }

  const getAllActivities = () => {
    const items: Array<{ id: string, date: string, displayDate: string, type: string, label: string, amount: number, color: string, prefix: string }> = [];

    validatedDeposits.forEach(d => {
      const investor = investorsList.find(i => i.id === d.investor_id)?.name || t('treasurerDashboard.overview.unknown');
      const rName = rubricsList.find(r => r.id === d.rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
      items.push({
        id: `dep-${d.id}`,
        date: new Date(d.created_at).toISOString(),
        displayDate: new Date(d.created_at).toLocaleDateString(),
        type: t('treasurerDashboard.overview.entry'),
        label: t('treasurerDashboard.overview.activityInvestment', { investor, rubric: rName }),
        amount: d.amount,
        color: '#2ecc71',
        prefix: '+'
      });
    });

    expenses.forEach(e => {
      const rName = rubricsList.find(r => r.id === e.rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
      items.push({
        id: `exp-${e.id}`,
        date: new Date(e.date || e.created_at).toISOString(),
        displayDate: new Date(e.date || e.created_at).toLocaleDateString(),
        type: t('treasurerDashboard.overview.expense'),
        label: t('treasurerDashboard.overview.activityExpense', { rubric: rName, description: e.description }),
        amount: e.amount,
        color: '#e74c3c',
        prefix: '-'
      });
    });

    transfers.forEach(tobj => {
      const srcName = rubricsList.find(x => x.id === tobj.source_rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
      const destName = rubricsList.find(x => x.id === tobj.destination_rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
      items.push({
        id: `tr-${tobj.id}`,
        date: new Date(tobj.date || tobj.created_at).toISOString(),
        displayDate: new Date(tobj.date || tobj.created_at).toLocaleDateString(),
        type: t('treasurerDashboard.overview.transfer'),
        label: t('treasurerDashboard.overview.activityLoan', { source: srcName, destination: destName }),
        amount: tobj.amount,
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

    const items: Array<{ date: string, displayDate: string, type: string, typeLabel: string, label: string, amount: number, color: string, prefix: string }> = [];

    validatedDeposits.forEach(d => {
      if (d.rubric_id === r.id) {
        const investor = investorsList.find(i => i.id === d.investor_id)?.name || t('treasurerDashboard.overview.unknown');
        items.push({
          date: new Date(d.created_at).toISOString(),
          displayDate: new Date(d.created_at).toLocaleDateString(),
          type: 'ENTRY',
          typeLabel: t('treasurerDashboard.overview.entry'),
          label: t('treasurerDashboard.overview.activityInvestmentSimple', { investor }),
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
          type: 'EXPENSE',
          typeLabel: t('treasurerDashboard.overview.expense'),
          label: t('treasurerDashboard.overview.activityExpenseSimple', { description: e.description }),
          amount: e.amount,
          color: '#e74c3c',
          prefix: '-'
        });
      }
    });

    transfers.forEach(tobj => {
      if (tobj.source_rubric_id === r.id) {
        const destName = rubricsList.find(x => x.id === tobj.destination_rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
        items.push({
          date: new Date(tobj.date || tobj.created_at).toISOString(),
          displayDate: new Date(tobj.date || tobj.created_at).toLocaleDateString(),
          type: 'TRANSFER_OUT',
          typeLabel: t('treasurerDashboard.overview.transferOut'),
          label: t('treasurerDashboard.overview.activityTransferOutSimple', { dest: destName, reason: tobj.reason }),
          amount: tobj.amount,
          color: '#e67e22',
          prefix: '-'
        });
      }
      if (tobj.destination_rubric_id === r.id) {
        const srcName = rubricsList.find(x => x.id === tobj.source_rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
        items.push({
          date: new Date(tobj.date || tobj.created_at).toISOString(),
          displayDate: new Date(tobj.date || tobj.created_at).toLocaleDateString(),
          type: 'TRANSFER_IN',
          typeLabel: t('treasurerDashboard.overview.transferIn'),
          label: t('treasurerDashboard.overview.activityTransferInSimple', { src: srcName, reason: tobj.reason }),
          amount: tobj.amount,
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
      if (item.type === 'ENTRY' || item.type === 'TRANSFER_IN') {
        balance += item.amount;
      } else {
        balance -= item.amount;
      }
      return {
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
        {t('treasurerDashboard.tabOverview')}
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'investors' ? 'active' : ''}`}
        onClick={() => setActiveTab('investors')}
      >
        {t('treasurerDashboard.tabInvestors')}
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'deposits' ? 'active' : ''}`}
        onClick={() => setActiveTab('deposits')}
      >
        {t('treasurerDashboard.tabDeposits')}
        {pendingDeposits.length > 0 && (
          <span className="tab-badge">{pendingDeposits.length}</span>
        )}
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'expenses' ? 'active' : ''}`}
        onClick={() => setActiveTab('expenses')}
      >
        {t('treasurerDashboard.tabExpenses')}
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'transfers' ? 'active' : ''}`}
        onClick={() => setActiveTab('transfers')}
      >
        {t('treasurerDashboard.tabTransfers')}
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'rubrics' ? 'active' : ''}`}
        onClick={() => setActiveTab('rubrics')}
      >
        {t('treasurerDashboard.tabRubrics')}
      </button>
      <button
        className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        {t('treasurerDashboard.tabProfile')}
      </button>
    </div>
  );

  return (
    <div className="treasurer-dashboard pt-32 pb-12">
      <h1 className="mb-8">{t('treasurerDashboard.titlePart1')}<span className="text-gold">{t('treasurerDashboard.titleGold')}</span></h1>

      {renderTabs()}

      {activeTab === 'overview' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-10">
            <h2 className="m-0 text-gold-glow">{t('treasurerDashboard.overview.title')}</h2>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportMasterReport({
                  globalStats,
                  investors: investorsList,
                  deposits: validatedDeposits.map(d => ({
                    date: new Date(d.created_at).toLocaleDateString('fr-FR'),
                    investor: investorsList.find(i => i.id === d.investor_id)?.name || t('treasurerDashboard.overview.unknown'),
                    rubric: rubricsList.find(r => r.id === d.rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                    amount: d.amount,
                    code: d.bank_receipt_code,
                  })),
                  expenses: expenses.map(e => ({
                    date: new Date(e.date || e.created_at).toLocaleDateString('fr-FR'),
                    description: e.description,
                    rubric: rubricsList.find(r => r.id === e.rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                    amount: e.amount,
                    receipt: e.receipt_number,
                  })),
                  transfers: transfers.map(tobj => ({
                    date: new Date(tobj.date || tobj.created_at).toLocaleDateString('fr-FR'),
                    source: rubricsList.find(r => r.id === tobj.source_rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                    destination: rubricsList.find(r => r.id === tobj.destination_rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                    amount: tobj.amount,
                    reason: tobj.reason,
                  })),
                  rubricBalances: rubricData.map(r => ({
                    name: r.name,
                    invested: r.invested,
                    spent: r.spent,
                    balance: r.value,
                  })),
                })}
              >
                {t('treasurerDashboard.overview.exportBtn')}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-30">
            <Card className="border-gold">
              <p className="text-muted text-sm mb-3">{t('treasurerDashboard.overview.totalBalance')}</p>
              <h2 className="text-gold m-0">{(globalStats.total_invested - globalStats.total_spent).toLocaleString()} FCFA</h2>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">{t('treasurerDashboard.overview.totalInvestments')}</p>
              <h3 className="m-0">{globalStats.total_invested.toLocaleString()} FCFA</h3>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">{t('treasurerDashboard.overview.totalExpenses')}</p>
              <h3 className="m-0">{globalStats.total_spent.toLocaleString()} FCFA</h3>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">{t('treasurerDashboard.overview.executionRate')}</p>
              <h3 className="m-0 text-gold">{globalStats.execution_rate.toFixed(1)}%</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <Card title={t('treasurerDashboard.overview.comparisonTitle')}>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={rubricData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#888"
                      fontSize={11}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000)}k` : val}
                    />
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(212, 175, 55, 0.5)', borderRadius: '8px' }}
                      formatter={(val: any) => [`${formatAmount(val)} FCFA`, '']}
                    />
                    <Legend />
                    <Bar dataKey="invested" name={t('treasurerDashboard.overview.totalInvestments')} fill="#D4AF37" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name={t('treasurerDashboard.overview.totalExpenses')} fill="#FFF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title={t('treasurerDashboard.overview.monthlyFlowsTitle')}>
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
                      tickFormatter={(val) => Math.abs(val) >= 1000 ? `${(val / 1000)}k` : val}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(212, 175, 55, 0.5)', borderRadius: '8px' }}
                      formatter={(val: any) => [`${formatAmount(val)} FCFA`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="entrees" name={t('treasurerDashboard.overview.entry')} stroke="#2ecc71" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="sorties" name={t('treasurerDashboard.overview.expense')} stroke="#e74c3c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title={t('treasurerDashboard.overview.latestActivities')}>
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
                      {act.type === t('treasurerDashboard.overview.entry') && (
                        <svg className="w-6 h-6" style={{ color: act.color }} fill="none" viewBox="0 0 24 26" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {act.type === t('treasurerDashboard.overview.expense') && (
                        <svg className="w-6 h-6" style={{ color: act.color }} fill="none" viewBox="0 0 24 26" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                      {act.type === t('treasurerDashboard.overview.transfer') && (
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
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-muted text-sm">{t('treasurerDashboard.overview.noRecentActivity')}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">{t('treasurerDashboard.deposits.title')}</h2>
            {validatedDeposits.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportValidatedDeposits(
                  validatedDeposits.map(d => ({
                    date: new Date(d.created_at).toLocaleDateString('fr-FR'),
                    investor: investorsList.find(i => i.id === d.investor_id)?.name || t('treasurerDashboard.overview.unknown'),
                    rubric: rubricsList.find(r => r.id === d.rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                    amount: d.amount,
                    code: d.bank_receipt_code,
                  }))
                )}
              >
                {t('treasurerDashboard.deposits.exportBtn')}
              </Button>
            )}
          </div>
          <Card className="p-0 overflow-hidden">
            {pendingDeposits.length === 0 ? (
              <div className="py-16 text-center border-t border-white/5">
                <div className="w-16 h-16 rounded-full bg-black/40 border border-gold-light flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gold">✓</span>
                </div>
                <p className="text-gold text-lg mb-2">{t('treasurerDashboard.deposits.noPending')}</p>
                <p className="text-muted text-sm">{t('treasurerDashboard.deposits.allProcessed')}</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{t('treasurerDashboard.deposits.colDate')}</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{t('treasurerDashboard.deposits.colCode')}</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{t('treasurerDashboard.deposits.colInvestor')}</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{t('treasurerDashboard.deposits.colProject')}</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{t('treasurerDashboard.deposits.colAmount')}</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{t('treasurerDashboard.deposits.colActions')}</th>
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
                          <Button size="sm" onClick={() => handleValidateDeposit(dep.id)}>{t('treasurerDashboard.deposits.btnValidate')}</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleRejectDeposit(dep.id)}>{t('treasurerDashboard.deposits.btnReject')}</Button>
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
            <h2 className="m-0">{t('treasurerDashboard.expenses.title')}</h2>
            <div className="flex gap-3">
              {expenses.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportExpenses(
                    expenses.map(e => ({
                      date: new Date(e.date || e.created_at).toLocaleDateString('fr-FR'),
                      description: e.description,
                      rubric: rubricsList.find(r => r.id === e.rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                      amount: e.amount,
                      receipt: e.receipt_number,
                    }))
                  )}
                >
                  {t('treasurerDashboard.expenses.exportBtn')}
                </Button>
              )}
              {!showNewExpenseForm && (
                <Button onClick={() => setShowNewExpenseForm(true)}>{t('treasurerDashboard.expenses.newBtn')}</Button>
              )}
            </div>
          </div>

          {showNewExpenseForm ? (
            <Card title={t('treasurerDashboard.expenses.formTitle')} className="mb-8 border-gold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('treasurerDashboard.expenses.labelPurpose')} placeholder={t('treasurerDashboard.expenses.placeholderPurpose')} value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                <Input label={t('treasurerDashboard.expenses.labelAmount')} placeholder="0" type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                <div className="form-group">
                  <label className="form-label">{t('treasurerDashboard.expenses.labelRubric')}</label>
                  <select className="form-input" value={newExpense.rubric_id || rubricsList[0]?.id} onChange={e => setNewExpense({ ...newExpense, rubric_id: e.target.value })}>
                    {rubricsList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <Input label={t('treasurerDashboard.expenses.labelReceipt')} placeholder={t('treasurerDashboard.expenses.placeholderReceipt')} value={newExpense.receipt_number} onChange={e => setNewExpense({ ...newExpense, receipt_number: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-6">
                <Button onClick={handleCreateExpense}>{t('treasurerDashboard.expenses.btnSave')}</Button>
                <Button variant="secondary" onClick={() => setShowNewExpenseForm(false)}>{t('treasurerDashboard.expenses.btnCancel')}</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {expenses.length === 0 ? (
                <div className="py-16 text-center border-t border-white/5">
                  <div className="w-16 h-16 rounded-full bg-black/40 border border-gold-light flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gold">💰</span>
                  </div>
                  <p className="text-gold text-lg mb-2">{t('treasurerDashboard.expenses.noExpenses')}</p>
                  <p className="text-muted text-sm">{t('treasurerDashboard.expenses.noCashOut')}</p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '1rem' }}>{t('treasurerDashboard.expenses.colPurpose')}</th>
                        <th style={{ padding: '1rem' }}>{t('treasurerDashboard.expenses.colAmount')}</th>
                        <th style={{ padding: '1rem' }}>{t('treasurerDashboard.expenses.colRubric')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem' }}>{e.description}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatAmount(e.amount)} FCFA</td>
                          <td style={{ padding: '1rem' }}>{rubricsList.find(r => r.id === e.rubric_id)?.name || t('treasurerDashboard.overview.unknownF')}</td>
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
            <h2 className="m-0">{t('treasurerDashboard.transfers.title')}</h2>
            <div className="flex gap-3">
              {transfers.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportTransfers(
                    transfers.map((tobj: any) => ({
                      date: new Date(tobj.date || tobj.created_at).toLocaleDateString('fr-FR'),
                      source: rubricsList.find(r => r.id === tobj.source_rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                      destination: rubricsList.find(r => r.id === tobj.destination_rubric_id)?.name || t('treasurerDashboard.overview.unknownF'),
                      amount: tobj.amount,
                      reason: tobj.reason,
                    }))
                  )}
                >
                  {t('treasurerDashboard.transfers.exportBtn')}
                </Button>
              )}
              {!showNewTransferForm && (
                <Button onClick={() => setShowNewTransferForm(true)}>{t('treasurerDashboard.transfers.newBtn')}</Button>
              )}
            </div>
          </div>

          {showNewTransferForm ? (
            <Card title={t('treasurerDashboard.transfers.formTitle')} className="mb-8 border-gold">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTransfer(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('treasurerDashboard.transfers.labelLender')}</label>
                    <select className="form-input" value={newTransfer.source_rubric_id || rubricsList[0]?.id} onChange={e => setNewTransfer({ ...newTransfer, source_rubric_id: e.target.value })}>
                      {rubricsList.map(r => <option key={`out-${r.id}`} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('treasurerDashboard.transfers.labelBorrower')}</label>
                    <select className="form-input" value={newTransfer.destination_rubric_id || rubricsList[0]?.id} onChange={e => setNewTransfer({ ...newTransfer, destination_rubric_id: e.target.value })}>
                      {rubricsList.map(r => <option key={`in-${r.id}`} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <Input label={t('treasurerDashboard.transfers.labelAmount')} type="number" placeholder="FCFA" value={newTransfer.amount} onChange={e => setNewTransfer({ ...newTransfer, amount: e.target.value })} />
                  <Input label={t('treasurerDashboard.transfers.labelReason')} placeholder={t('treasurerDashboard.transfers.placeholderReason')} value={newTransfer.reason} onChange={e => setNewTransfer({ ...newTransfer, reason: e.target.value })} />
                </div>
                <div className="flex gap-4 mt-6">
                  <Button type="submit">{t('treasurerDashboard.transfers.btnValidate')}</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowNewTransferForm(false)}>{t('treasurerDashboard.transfers.btnCancel')}</Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card title={t('treasurerDashboard.transfers.exposureTitle')}>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={loanExposureData} stackOffset="expand">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }} />
                      <Legend />
                      <Bar dataKey="self" name={t('treasurerDashboard.transfers.legendAvailable')} stackId="a" fill="#D4AF37" />
                      <Bar dataKey="lent" name={t('treasurerDashboard.transfers.legendLent')} stackId="a" fill="#E67E22" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title={t('treasurerDashboard.transfers.flowDetails')}>
                <div className="p-4 border border-dashed border-gold-light rounded-md">
                  <p className="text-muted text-sm text-center">{t('treasurerDashboard.transfers.summary')}</p>
                  <div className="mt-4 py-4 min-h-[200px] flex flex-col justify-center">
                    {transfers.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center text-white/20 border border-white/10">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        <p className="text-muted text-sm">{t('treasurerDashboard.transfers.noTransfers')}</p>
                      </div>
                    ) : (transfers.map((tobj: any) => {
                      const srcName = rubricsList.find(r => r.id === tobj.source_rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
                      const destName = rubricsList.find(r => r.id === tobj.destination_rubric_id)?.name || t('treasurerDashboard.overview.unknownF');
                      return (
                        <div key={tobj.id} className="flex justify-between items-center mb-4 pb-3 border-b border-white/5 last:border-0 group cursor-default">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/80 group-hover:text-gold transition-colors">{srcName} → {destName}</span>
                            <span className="text-[10px] text-muted tracking-wider uppercase mt-0.5">{tobj.reason || t('treasurerDashboard.transfers.reasonPlaceholder')}</span>
                          </div>
                          <span className="text-gold font-bold tabular-nums">{formatAmount(tobj.amount)} FCFA</span>
                        </div>
                      );
                    }))}
                  </div>
                  <Button variant="secondary" size="sm" fullWidth className="mt-2">{t('treasurerDashboard.transfers.btnReport')}</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'investors' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="m-0">{t('treasurerDashboard.investors.title')}</h2>
              <p className="text-sm text-muted mt-1">{t('treasurerDashboard.investors.desc')}</p>
            </div>
            {investorsList.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportInvestorsList(investorsList)}
              >
                {t('treasurerDashboard.investors.exportBtn')}
              </Button>
            )}
          </div>

          {investorsList.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center text-white/20 border border-white/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-gold text-lg mb-2">{t('treasurerDashboard.investors.noInvestors')}</p>
              <p className="text-muted text-sm">{t('treasurerDashboard.investors.noInvestorsDesc')}</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{t('treasurerDashboard.investors.colInvestor')}</th>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{t('treasurerDashboard.investors.colTotal')}</th>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{t('treasurerDashboard.investors.colCode')}</th>
                    <th style={{ padding: '1rem', color: 'var(--color-gold)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>{t('treasurerDashboard.investors.colActions')}</th>
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
                            {visibleCodeId === inv.id ? t('treasurerDashboard.investors.btnHide') : t('treasurerDashboard.investors.btnReveal')}
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(inv.code);
                              showNotification(t('treasurerDashboard.investors.successCopy', { name: inv.name }));
                            }}
                          >
                            {t('treasurerDashboard.investors.btnCopy')}
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
              {selectedRubricForHistory ? t('treasurerDashboard.rubrics.auditTitle', { name: selectedRubricForHistory }) : t('treasurerDashboard.rubrics.title')}
            </h2>
            <div className="flex gap-3">
              {selectedRubricForHistory && (() => {
                const history = getRubricHistory(selectedRubricForHistory);
                const rubricBal = rubricData.find(r => r.name === selectedRubricForHistory);
                return (
                  <Button
                    size="sm"
                    onClick={() => exportRubricAudit(
                      selectedRubricForHistory,
                      history,
                      rubricBal?.value ?? 0
                    )}
                  >
                    {t('treasurerDashboard.rubrics.exportAuditBtn')}
                  </Button>
                );
              })()}
              {!showNewRubricForm && !selectedRubricForHistory && (
                <Button onClick={() => setShowNewRubricForm(true)}>{t('treasurerDashboard.rubrics.newBtn')}</Button>
              )}
              {selectedRubricForHistory && (
                <Button variant="secondary" onClick={() => setSelectedRubricForHistory(null)}>{t('treasurerDashboard.rubrics.btnBack')}</Button>
              )}
            </div>
          </div>

          {selectedRubricForHistory ? (
            <div className="animation-fade-in">
              <Card className="border-gold/20 overflow-hidden mb-12">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20 text-gold shadow-lg shadow-gold/5">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                  </div>
                  <h3 className="m-0 text-xl font-bold tracking-tight">{t('treasurerDashboard.rubrics.chartTitle', { name: selectedRubricForHistory })}</h3>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <AreaChart data={getRunningBalance(selectedRubricForHistory)}>
                      <defs>
                        <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
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
                        tickFormatter={(value) => `${(value / 1000)}k`}
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
                        formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, t('treasurerDashboard.rubrics.legendSolde')]}
                      />
                      <Area
                        type="stepAfter"
                        dataKey="Solde"
                        name={t('treasurerDashboard.rubrics.legendSolde')}
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

                    <h3 className="m-0 text-xl font-bold tracking-tight">{t('treasurerDashboard.rubrics.historyTitle', { name: selectedRubricForHistory })}</h3>
                  </div>
                  <div className="table-wrapper" style={{ overflowX: 'auto', padding: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('treasurerDashboard.rubrics.colDate')}</th>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('treasurerDashboard.rubrics.colType')}</th>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('treasurerDashboard.rubrics.colLabel')}</th>
                          <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('treasurerDashboard.rubrics.colAmount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRubricHistory(selectedRubricForHistory).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem' }}>{item.displayDate}</td>
                            <td style={{ padding: '1rem' }}><span style={{ color: item.color }}>{item.typeLabel}</span></td>
                            <td style={{ padding: '1rem' }}>{item.label}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.prefix} {formatAmount(item.amount)}</td>
                          </tr>
                        ))}
                        {getRubricHistory(selectedRubricForHistory).length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('treasurerDashboard.rubrics.noTransactions')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          ) : showNewRubricForm ? (
            <Card title={t('treasurerDashboard.rubrics.formTitle')} className="mb-8 border-gold">
              <div className="max-w-md">
                <Input label={t('treasurerDashboard.rubrics.labelName')} placeholder={t('treasurerDashboard.rubrics.placeholderName')} value={newRubricName} onChange={e => setNewRubricName(e.target.value)} />
                <p className="text-xs text-muted mb-6 italic">{t('treasurerDashboard.rubrics.noteNewRubric')}</p>
              </div>
              <div className="flex gap-4 mt-2">
                <Button onClick={handleCreateRubric}>{t('treasurerDashboard.rubrics.btnCreate')}</Button>
                <Button variant="secondary" onClick={() => setShowNewRubricForm(false)}>{t('treasurerDashboard.rubrics.btnCancel')}</Button>
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
                  <h3 className="text-gold mb-2">{t('treasurerDashboard.rubrics.noRubrics')}</h3>
                  <p className="text-muted max-w-sm mx-auto mb-8">
                    {t('treasurerDashboard.rubrics.noRubricsDesc')}
                  </p>
                  <Button onClick={() => setShowNewRubricForm(true)}>{t('treasurerDashboard.rubrics.btnFirstRubric')}</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {rubricData.map((r, i) => (
                    <Card
                      key={i}
                      className="hover:border-gold/50 transition-all duration-300 group"
                      title={
                        editingRubricId === r.id ? (
                          <div className="flex flex-col gap-2">
                            <Input
                              value={editRubricName}
                              onChange={e => setEditRubricName(e.target.value)}
                              placeholder={t('treasurerDashboard.rubrics.placeholderName')}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateRubric}>{t('treasurerDashboard.rubrics.btnConfirm')}</Button>
                              <Button size="sm" variant="secondary" onClick={() => setEditingRubricId(null)}>{t('treasurerDashboard.rubrics.btnCancel')}</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center w-full">
                            <h3 className="card-title text-gold m-0">{r.name}</h3>
                            <button
                              className="w-10 h-10 rounded-full flex items-center justify-center text-gold bg-gold-light border border-gold-light transition-all shadow-gold-glow cursor-pointer"
                              style={{ flexShrink: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRubricId(r.id);
                                setEditRubricName(r.name);
                              }}
                              title={t('treasurerDashboard.rubrics.btnEditName')}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )
                      }
                    >
                      <div className="mb-6">
                        <p className="text-xs text-muted tracking-widest uppercase mb-1">{t('treasurerDashboard.rubrics.labelAvailable')}</p>
                        <h2 className="text-gold group-hover:text-gold-light transition-colors tabular-nums">{formatAmount(r.value)} <small className="text-xs opacity-60">FCFA</small></h2>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">{t('treasurerDashboard.rubrics.labelInvested')}</span>
                          <span className="font-medium text-white/70">{formatAmount(r.invested)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">{t('treasurerDashboard.rubrics.labelSpent')}</span>
                          <span className="font-medium text-white/70">{formatAmount(r.spent)} FCFA</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => setSelectedRubricForHistory(r.name)}
                      >
                        {t('treasurerDashboard.rubrics.btnConsultAudit')}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">{t('treasurerDashboard.profile.title')}</h2>
          </div>
          <Card className="max-w-md border-gold">
            <p className="text-muted text-sm mb-6">{t('treasurerDashboard.profile.desc')}</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label={t('treasurerDashboard.profile.labelOldPwd')}
                type="password"
                placeholder="••••••••••••"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <Input
                label={t('treasurerDashboard.profile.labelNewPwd')}
                type="password"
                placeholder="••••••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label={t('treasurerDashboard.profile.labelConfirmPwd')}
                type="password"
                placeholder="••••••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="pt-4">
                <Button type="submit" fullWidth disabled={passwordLoading}>
                  {passwordLoading ? t('treasurerDashboard.profile.verifying') : t('treasurerDashboard.profile.btnSave')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

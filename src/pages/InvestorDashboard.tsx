import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useNotification } from '../context/NotificationContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { InvestorsService, RubricsService, type RubricBalance } from '../lib';
import { LoadingOverlay } from '../components/UI/LoadingOverlay';
import { exportPersonalStatement } from '../services/exportService';
import { useTranslation } from 'react-i18next';

interface FormattedInvestment {
  id: string;
  date: string;
  rubric: string;
  amount: string;
  rawAmount: number;
  status: string;
}

export const InvestorDashboard = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'history' | 'impact' | 'trends'>('history');

  const investorCode = sessionStorage.getItem('investorCode') || 'INV-INVITÉ';
  const investorName = sessionStorage.getItem('investorName') || 'Investisseur';

  const [investments, setInvestments] = useState<FormattedInvestment[]>([]);
  const [impactData, setImpactData] = useState<{ name: string, value: number }[]>([]);
  const [globalRubricData, setGlobalRubricData] = useState<{ name: string, value: number, spent: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Security Check & Data Fetch
  useEffect(() => {
    const code = sessionStorage.getItem('investorCode');
    if (!code) {
      window.location.href = '/investisseur/login';
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Parallel fetch of all independent resources
        const [rubricsRes, historyRes, impactRes] = await Promise.all([
          RubricsService.listRubricsRubricsGet(),
          InvestorsService.getMyHistoryInvestorsMeHistoryGet(code),
          InvestorsService.getMyImpactInvestorsMeImpactGet(code)
        ]);

        const rubricsList = rubricsRes.data || [];
        const rubricsMap = rubricsList.reduce((acc, r) => {
          acc[r.id] = r.name;
          return acc;
        }, {} as Record<string, string>);

        // 2. Fetch balances (depends on rubricsList)
        const balances = await Promise.all(
          rubricsList.map(async (r) => {
            const balRes = await RubricsService.getRubricBalanceRubricsRubricIdBalanceGet(r.id);
            return balRes.data;
          })
        );
        const formattedTrends = balances
          .filter((b): b is RubricBalance => b != null)
          .map(b => ({
            name: b.rubric_name,
            value: b.current_balance,
            spent: b.total_expenses
          }));
        setGlobalRubricData(formattedTrends);

        // History
        const formattedHistory = (historyRes.data || []).map(inv => ({
          id: inv.id,
          date: new Date(inv.created_at).toLocaleDateString(),
          rubric: rubricsMap[inv.rubric_id] || t('investorDashboard.unknown'),
          amount: inv.amount.toLocaleString('fr-FR'),
          rawAmount: inv.amount,
          status: inv.status === 'VALIDATED' ? t('investorDashboard.validated') : (inv.status === 'REJECTED' ? t('investorDashboard.rejected') : t('investorDashboard.pending'))
        }));
        setInvestments(formattedHistory);

        // Impact
        const formattedImpact = (impactRes.data || []).map(item => ({
          name: item.rubric_name,
          value: item.amount_invested
        }));
        setImpactData(formattedImpact);
      } catch (err) {
        showNotification(t('investorDashboard.errData'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  const COLORS = ['#D4AF37', '#2ECC71', '#3498DB', '#E67E22', '#9B59B6'];

  if (loading) {
    return <LoadingOverlay message={t('investorDashboard.sync')} />;
  }

  const totalInvested = investments
    .filter(inv => inv.status === t('investorDashboard.validated'))
    .reduce((sum, inv) => sum + inv.rawAmount, 0);

  return (
    <div className="investor-dashboard pt-32 pb-12">
      <div className="flex justify-between items-center mb-10 px-4 md:px-0">
        <div>
          <h1 className="m-0 text-3xl md:text-4xl">{t('investorDashboard.titlePart1')}<span className="text-gold">{t('investorDashboard.titleGold')}</span></h1>
          <p className="text-muted mt-2 text-lg">{t('investorDashboard.welcome')}<span className="text-white font-bold">{investorName}</span></p>
          <p className="text-xs text-muted/50 mt-1">{t('investorDashboard.idLabel')}{investorCode}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted mb-1">{t('investorDashboard.totalValidated')}</p>
          <h2 className="text-gold m-0 text-2xl md:text-3xl font-black">{totalInvested.toLocaleString('fr-FR')} FCFA</h2>
        </div>
      </div>

      <div className="flex gap-4 mb-10 border-b border-gold-light pb-4 overflow-x-auto">
        <button
          className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('investorDashboard.tabHistory')}
        </button>
        <button
          className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          {t('investorDashboard.tabImpact')}
        </button>
        <button
          className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          {t('investorDashboard.tabTrends')}
        </button>
      </div>

      {activeTab === 'history' && (
        <Card title={t('investorDashboard.contributionsTitle')} className="animation-fade-in shadow-lg">
          <div className="flex justify-end mb-4">
            {investments.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportPersonalStatement(
                  investorName,
                  investorCode,
                  investments.map(inv => ({
                    date: inv.date,
                    rubric: inv.rubric,
                    amount: inv.rawAmount,
                    status: inv.status,
                  })),
                  totalInvested
                )}
              >
                {t('investorDashboard.btnDownload')}
              </Button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('investorDashboard.colDate')}</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('investorDashboard.colRubric')}</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('investorDashboard.colAmount')}</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{t('investorDashboard.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{inv.date}</td>
                    <td style={{ padding: '1rem' }}>{inv.rubric}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{inv.amount}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          backgroundColor: inv.status === t('investorDashboard.validated') ? 'rgba(46, 204, 113, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                          color: inv.status === t('investorDashboard.validated') ? '#2ecc71' : 'var(--color-gold)'
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'impact' && (
        <div className="animation-fade-in">
          <h3 className="mb-6">{t('investorDashboard.impactQuestion')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title={t('investorDashboard.impactPieTitle')}>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={impactData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {impactData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title={t('investorDashboard.impactRealizationsTitle')}>
              <div className="flex flex-col gap-4">
                {impactData.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">{t('investorDashboard.noInvestments')}</p>
                ) : (
                  impactData.map((item, idx) => (
                    <div key={idx} className="p-4 bg-surface-hover rounded border-l-4 border-gold">
                      <p className="text-sm font-bold m-0">{t('investorDashboard.participationIn')}{item.name}</p>
                      <p className="text-xs text-muted">{t('investorDashboard.thanksToTotal')}{item.value.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  ))
                )}
                <p className="text-center text-xs text-muted py-4">
                  {t('investorDashboard.moneyWorkDesc')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="animation-fade-in">
          <h3 className="mb-6">{t('investorDashboard.trendsTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title={t('investorDashboard.healthTitle')}>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={globalRubricData} margin={{ left: 40, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => Math.abs(val) > 1000 ? `${(val / 1000)}k` : val}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37', borderRadius: '8px' }}
                      formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} FCFA`, '']}
                    />
                    <Bar dataKey="value" name={t('investorDashboard.fundsTotal')} fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name={t('investorDashboard.spentTotal')} fill="#FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title={t('investorDashboard.fundsDistributionTitle')}>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={globalRubricData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {globalRubricData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <p className="text-center text-xs text-muted mt-8">
            {t('investorDashboard.publicDataDisclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

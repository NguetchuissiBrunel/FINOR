import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { useNotification } from '../context/NotificationContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export const InvestorDashboard = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'history' | 'impact' | 'trends'>('history');
  
  const investorCode = sessionStorage.getItem('investorCode') || 'INV-INVITÉ';

  // Security Check
  useEffect(() => {
    if (!sessionStorage.getItem('investorCode')) {
      window.location.href = '/investisseur/login';
    }
  }, []);

  const investments = [
    { id: 1, date: '2026-03-25', rubric: 'Route', amount: '100,000', status: 'Validé' },
    { id: 2, date: '2026-03-28', rubric: 'Eau', amount: '50,000', status: 'En Validation' },
  ];

  const impactData = [
    { name: 'Matériaux (Route)', value: 60000 },
    { name: 'Main d\'œuvre (Route)', value: 30000 },
    { name: 'Prêt à l\'École', value: 20000 },
    { name: 'Disponible', value: 40000 },
  ];

  // Shared trends data (village-wide)
  const globalRubricData = [
    { name: 'Route', value: 8200000, spent: 3800000 },
    { name: 'Eau', value: 4150000, spent: 1850000 },
    { name: 'École', value: 3100000, spent: 1900000 },
  ];

  const COLORS = ['#D4AF37', '#2ECC71', '#3498DB', '#E67E22', '#9B59B6'];

  return (
    <div className="investor-dashboard pt-32 pb-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="m-0">Mon Espace <span className="text-gold">Personnel</span></h1>
          <p className="text-muted mt-2">Bienvenue, Investisseur (Code: **{investorCode}**)</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted mb-1">Total Investi</p>
          <h2 className="text-gold m-0">150,000 FCFA</h2>
        </div>
      </div>

      <div className="flex gap-4 mb-10 border-b border-gold-light pb-4 overflow-x-auto">
        <button 
          className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Récapitulatif
        </button>
        <button 
          className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          Impact & Dépenses
        </button>
        <button 
          className={`tab-pill bg-transparent border-none cursor-pointer ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Tendances du village
        </button>
      </div>

      {activeTab === 'history' && (
        <Card title="Mes Contributions" className="animation-fade-in shadow-lg">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Date</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Rubrique</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Montant (FCFA)</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Statut</th>
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
                          backgroundColor: inv.status === 'Validé' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                          color: inv.status === 'Validé' ? '#2ecc71' : 'var(--color-gold)'
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
          <h3 className="mb-6">Où est utilisé votre argent ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Répartition d'Impact">
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
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Réalisations concrètes">
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-surface-hover rounded border-l-4 border-gold">
                  <p className="text-sm font-bold m-0">Achat Gravier - Rubrique Route</p>
                  <p className="text-xs text-muted">Grâce à votre contribution de 100,000 FCFA</p>
                </div>
                <div className="p-4 bg-surface-hover rounded border-l-4 border-gold">
                  <p className="text-sm font-bold m-0">Prêt temporaire à la Rubrique École</p>
                  <p className="text-xs text-muted">Pour l'achat de manuels scolaires urgents</p>
                </div>
                <p className="text-center text-xs text-muted py-4">
                  Votre argent travaille activement pour le développement du village.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="animation-fade-in">
          <h3 className="mb-6">Suivi Global du village</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Santé des Rubriques">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={globalRubricData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }} />
                    <Bar dataKey="value" name="Fonds Totaux" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Dépenses cumulées" fill="#FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Répartition des Fonds">
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
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <p className="text-center text-xs text-muted mt-8">
            Ces données sont publiques pour tous les membres de la coopérative afin de garantir une transparence totale.
          </p>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import {
  ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useNotification } from '../context/NotificationContext';

export const TreasurerDashboard = () => {
  const { showNotification } = useNotification();
  
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
  const [visibleCodeId, setVisibleCodeId] = useState<number | null>(null);

  // Mock data for Charts
  const rubricData = [
    { name: 'Route', value: 8200000, invested: 12000000, spent: 3800000 },
    { name: 'Eau', value: 4150000, invested: 6000000, spent: 1850000 },
    { name: 'Électricité', value: 2100000, invested: 3500000, spent: 1400000 },
    { name: 'École', value: 3100000, invested: 5000000, spent: 1900000 },
    { name: 'Développement', value: 1050000, invested: 2000000, spent: 950000 },
  ];

  // Investor list with recovery codes (Format INV-XXXX)
  const investorsList = [
    { id: 1, name: 'Kamga Jean', total: '2,450,000', code: 'INV-8854' },
    { id: 2, name: 'Manga Paul', total: '1,200,800', code: 'INV-2231' },
    { id: 3, name: 'Fosso Luc', total: '5,000,000', code: 'INV-9910' },
    { id: 4, name: 'Nana Elise', total: '750,000', code: 'INV-4412' },
  ];

  const loanExposureData = [
    { name: 'Route', lent: 450000, self: 8200000 },
    { name: 'Eau', lent: 0, self: 4150000 },
    { name: 'École', lent: 120000, self: 3100000 },
  ];

  const flowData = [
    { name: 'Jan', invest: 4000000, expense: 2400000 },
    { name: 'Fév', invest: 3000000, expense: 1398000 },
    { name: 'Mar', invest: 8450000, expense: 5800000 },
  ];

  // Mock data for tables
  const pendingDeposits = [
    { id: 1, user: 'Kamga Jean', amount: '500,000', project: 'Route', code: 'REC-5521', date: '2026-03-29' },
    { id: 2, user: 'Manga Paul', amount: '150,000', project: 'Eau', code: 'REC-7789', date: '2026-03-28' },
  ];

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
              <h2 className="text-gold m-0">15,450,000 FCFA</h2>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">Total Investissements</p>
              <h3 className="m-0">25,000,000 FCFA</h3>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">Total Dépenses</p>
              <h3 className="m-0">9,550,000 FCFA</h3>
            </Card>
            <Card>
              <p className="text-muted text-sm mb-3">Taux d'Exécution</p>
              <h3 className="m-0 text-gold">38%</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <Card title="Comparaison Investi vs Dépensé">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={rubricData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }} />
                    <Legend />
                    <Bar dataKey="invested" name="Total Investi" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name="Total Dépensé" fill="#FFF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Flux Mensuels Globaux">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={flowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37' }}
                    />
                    <Legend />
                    <Bar dataKey="invest" name="Investissements" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Dépenses" fill="#FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Dernières Activités">
            <p className="text-muted py-4 text-center">Toutes les rubriques sont à jour et le solde correspond aux relevés bancaires.</p>
          </Card>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="animation-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="m-0">Validations Dépôts Bancaires</h2>
          </div>
          <Card className="p-0 overflow-hidden">
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
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{dep.amount}</td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <Button size="sm">Valider</Button>
                        <Button size="sm" variant="secondary">Rejeter</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <Input label="Objet de la dépense" placeholder="ex: Carburant" />
                <Input label="Montant (FCFA)" placeholder="0" type="number" />
                <div className="form-group">
                  <label className="form-label">Rubrique Débitée</label>
                  <select className="form-input">
                    <option>Route</option>
                    <option>Eau</option>
                    <option>École</option>
                  </select>
                </div>
                <Input label="Justificatif / Facture" placeholder="N° de facture" />
              </div>
              <div className="flex gap-4 mt-6">
                <Button onClick={() => setShowNewExpenseForm(false)}>Enregistrer</Button>
                <Button variant="secondary" onClick={() => setShowNewExpenseForm(false)}>Annuler</Button>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-muted text-center py-8">Aucune dépense enregistrée ce mois-ci.</p>
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
              <form onSubmit={(e) => { e.preventDefault(); setShowNewTransferForm(false); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Rubrique Prêteuse</label>
                    <select className="form-input">
                      {rubricData.map(r => <option key={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rubrique Emprunteuse</label>
                    <select className="form-input">
                      {rubricData.map(r => <option key={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <Input label="Montant du prêt" type="number" placeholder="FCFA" />
                  <Input label="Motif / Justification" placeholder="Ex: Achat urgent de ciment" />
                </div>
                <div className="flex gap-4 mt-6">
                  <Button type="submit">Valider le Prêt</Button>
                  <Button variant="secondary" onClick={() => setShowNewTransferForm(false)}>Annuler</Button>
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
                  <div className="mt-4 py-4">
                    <div className="flex justify-between mb-4 pb-2 border-b border-white/5">
                      <span className="text-sm">Route → Eau</span>
                      <span className="text-gold font-bold">450,000 FCFA</span>
                    </div>
                    <div className="flex justify-between mb-4 pb-2 border-b border-white/5">
                      <span className="text-sm">École → Route</span>
                      <span className="text-gold font-bold">120,000 FCFA</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" fullWidth>Générer Rapport de Prêts</Button>
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

          <Card className="p-0 overflow-hidden">
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Investisseur</th>
                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Total Investi (FCFA)</th>
                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Code Personnel</th>
                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investorsList.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{inv.name}</td>
                      <td style={{ padding: '1rem' }}>{inv.total}</td>
                      <td style={{ padding: '1rem' }}>
                        {visibleCodeId === inv.id ? (
                          <span className="text-gold font-bold" style={{ letterSpacing: '2px', backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {inv.code}
                          </span>
                        ) : (
                          <span className="text-muted">••••••••</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div className="flex gap-4 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setVisibleCodeId(visibleCodeId === inv.id ? null : inv.id)}
                          >
                            {visibleCodeId === inv.id ? 'Masquer' : 'Afficher'}
                          </Button>
                          <Button
                            size="sm"
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
          </Card>
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
            <Card title={`Registre comptable - ${selectedRubricForHistory}`} className="p-0 overflow-hidden">
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
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>2026-03-29</td>
                      <td style={{ padding: '1rem' }}><span style={{ color: '#2ecc71' }}>Entrée</span></td>
                      <td style={{ padding: '1rem' }}>Investissement (Kamga J.)</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>+ 500,000</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>2026-03-28</td>
                      <td style={{ padding: '1rem' }}><span style={{ color: '#e74c3c' }}>Sortie</span></td>
                      <td style={{ padding: '1rem' }}>Achat matériel</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>- 120,000</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>2026-03-25</td>
                      <td style={{ padding: '1rem' }}><span style={{ color: '#3498db' }}>Transfert</span></td>
                      <td style={{ padding: '1rem' }}>Prêt vers Rubrique Eau</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>- 450,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          ) : showNewRubricForm ? (
            <Card title="Créer une Rubrique" className="mb-8 border-gold">
              <div className="max-w-md">
                <Input label="Nom de la Rubrique" placeholder="ex: Santé / Dispensaie" />
                <p className="text-xs text-muted mb-6 italic">Remarque : Toute nouvelle rubrique démarre avec un solde de **0 FCFA**. Le solde évolue uniquement via les investissements et les prélèvements.</p>
              </div>
              <div className="flex gap-4 mt-2">
                <Button onClick={() => setShowNewRubricForm(false)}>Créer la rubrique</Button>
                <Button variant="secondary" onClick={() => setShowNewRubricForm(false)}>Annuler</Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {rubricData.map((r, i) => (
                <Card key={i} title={r.name}>
                  <p className="text-sm text-muted mb-4">Solde actuel : <span className="text-gold font-bold">{r.value.toLocaleString()} FCFA</span></p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      fullWidth
                      onClick={() => setSelectedRubricForHistory(r.name)}
                    >
                      Consulter l'historique
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

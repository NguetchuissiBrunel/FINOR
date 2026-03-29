import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useNotification } from '../context/NotificationContext';
import {
  RubricsService,
  InvestmentsService,
  ApiError,
  type RubricRead,
} from '../lib';

export const Invest = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    receiptCode: '',
    rubricId: '',
  });
  const [personalCode, setPersonalCode] = useState('');
  const [rubrics, setRubrics] = useState<RubricRead[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showNotification } = useNotification();

  // Load rubrics from backend
  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const res = await RubricsService.listRubricsRubricsGet();
        setRubrics(res.data || []);
      } catch {
        showNotification('Impossible de charger les rubriques');
      } finally {
        setLoadingRubrics(false);
      }
    };
    fetchRubrics();
  }, []);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Normalize name to Title Case to prevent duplicates due to case sensitivity
    const normalizedName = formData.name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    try {
      const res = await InvestmentsService.declareInvestmentInvestmentsPost({
        investor_name: normalizedName,
        rubric_id: formData.rubricId,
        amount: Number(formData.amount),
        bank_receipt_code: formData.receiptCode,
      });
      const data = res.data;
      setPersonalCode(data?.access_code || '');
      setStep(4);
      showNotification('Déclaration transmise avec succès !');
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg = body?.detail || body?.message || 'Erreur lors de la soumission';
        showNotification(typeof msg === 'string' ? msg : 'Erreur lors de la soumission');
      } else {
        showNotification('Erreur de connexion au serveur');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRubricName = rubrics.find(r => r.id === formData.rubricId)?.name || '';

  return (
    <div className="invest-page">
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-center mb-10">Déclarer un <span className="text-gold">Investissement</span></h1>
        
        <Card>
          {step === 1 && (
            <div className="step-content animation-fade-in">
              <h3 className="mb-6">Étape 1 : Informations de base</h3>
              <Input 
                label="Votre Nom complet" 
                placeholder="Ex: Jean Kamga"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Input 
                label="Code du reçu bancaire" 
                placeholder="Ex: REC-987654"
                value={formData.receiptCode}
                onChange={(e) => setFormData({...formData, receiptCode: e.target.value})}
              />
              <div className="mt-8 flex justify-end">
                <Button onClick={handleNext} disabled={!formData.name || !formData.receiptCode}>Suivant</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animation-fade-in">
              <h3 className="mb-6">Étape 2 : Montant et Rubrique</h3>
              <Input 
                label="Montant du dépôt (FCFA)" 
                type="number" 
                placeholder="Ex: 100000"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
              <div className="form-group mb-6">
                <label className="form-label">Rubrique de destination</label>
                {loadingRubrics ? (
                  <p className="text-muted text-sm">Chargement des rubriques...</p>
                ) : (
                  <select 
                    className="form-input" 
                    value={formData.rubricId}
                    onChange={(e) => setFormData({...formData, rubricId: e.target.value})}
                  >
                    <option value="">Sélectionnez une rubrique...</option>
                    {rubrics.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="secondary" onClick={handlePrev}>Retour</Button>
                <Button onClick={handleNext} disabled={!formData.amount || !formData.rubricId}>Suivant</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="step-content animation-fade-in">
              <h3 className="mb-6">Étape 3 : Confirmation des données</h3>
              <div className="bg-surface-hover p-6 rounded-md border border-gold-light mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Investisseur :</span>
                  <span className="font-bold">{formData.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Code Reçu :</span>
                  <span className="text-gold">{formData.receiptCode}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Montant :</span>
                  <span className="font-bold">{Number(formData.amount).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Rubrique :</span>
                  <span>{selectedRubricName}</span>
                </div>
              </div>
              <p className="text-sm text-muted mb-8 italic">
                En cliquant sur confirmer, vous déclarez avoir effectué ce dépôt à la banque. 
                Le trésorier validera l'opération après vérification.
              </p>
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="secondary" onClick={handlePrev}>Retour</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Envoi en cours...' : 'Confirmer ma déclaration'}
                </Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="step-content text-center animation-fade-in py-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gold-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-gold mb-2">Déclaration Transmise !</h3>
              <p className="text-muted mb-8">
                Votre investissement est en cours de validation. 
                {personalCode && (
                  <>Voici votre <strong>Code Personnel</strong> secret pour consulter vos futurs relevés :</>
                )}
              </p>
              {personalCode && (
                <>
                  <div className="bg-black p-4 rounded border border-dashed border-gold mb-8 text-2xl font-bold tracking-widest text-gold">
                    {personalCode}
                  </div>
                  <p className="text-xs text-muted mb-10">
                    Notez précieusement ce code. Il ne vous sera communiqué qu'une seule fois.
                  </p>
                </>
              )}
              <Button onClick={() => window.location.href = '/investisseur/login'}>
                Accéder à mon espace
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

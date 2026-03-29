import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';

export const Invest = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    receiptCode: '',
    rubric: '',
  });
  const [personalCode, setPersonalCode] = useState('');

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call and personal code generation
    const generatedCode = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    setPersonalCode(generatedCode);
    setStep(4); // Success step
  };

  const rubrics = [
    { id: 'route', name: 'Route' },
    { id: 'eau', name: 'Eau' },
    { id: 'elec', name: 'Électricité' },
    { id: 'ecole', name: 'École' },
    { id: 'dev', name: 'Développement' },
  ];

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
                <select 
                  className="form-input" 
                  value={formData.rubric}
                  onChange={(e) => setFormData({...formData, rubric: e.target.value})}
                >
                  <option value="">Sélectionnez une rubrique...</option>
                  {rubrics.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="secondary" onClick={handlePrev}>Retour</Button>
                <Button onClick={handleNext} disabled={!formData.amount || !formData.rubric}>Suivant</Button>
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
                  <span className="font-bold">{formData.amount} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Rubrique :</span>
                  <span>{rubrics.find(r => r.id === formData.rubric)?.name}</span>
                </div>
              </div>
              <p className="text-sm text-muted mb-8 italic">
                En cliquant sur confirmer, vous déclarez avoir effectué ce dépôt à la banque. 
                Le trésorier validera l'opération après vérification.
              </p>
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="secondary" onClick={handlePrev}>Retour</Button>
                <Button type="submit">Confirmer ma déclaration</Button>
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
                Voici votre **Code Personnel** secret pour consulter vos futurs relevés :
              </p>
              <div className="bg-black p-4 rounded border border-dashed border-gold mb-8 text-2xl font-bold tracking-widest text-gold">
                {personalCode}
              </div>
              <p className="text-xs text-muted mb-10">
                Notez précieusement ce code. Il ne vous sera communiqué qu'une seule fois.
              </p>
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

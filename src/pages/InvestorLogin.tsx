import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';

export const InvestorLogin = () => {
  const [personalCode, setPersonalCode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Verification logic: any code starting with INV- is accepted for the mock
    if (personalCode.startsWith('INV-')) {
      sessionStorage.setItem('investorCode', personalCode);
      window.location.href = '/investisseur/dashboard';
    } else {
      alert('Veuillez saisir un code valide (Format INV-XXXX)');
    }
  };

  return (
    <div className="login-page pt-40 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-center mb-10">Mon Espace <span className="text-gold">Investisseur</span></h1>

        <Card>
          <form onSubmit={handleLogin}>
            <p className="text-muted text-sm mb-8 text-center">
              Saisissez votre code personnel pour accéder à votre suivi d'investissement.
            </p>

            <Input
              label="Votre Code Personnel"
              placeholder="Ex: INV-8854"
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              required
            />

            <div className="mt-10">
              <Button type="submit" fullWidth>Consulter mon Impact</Button>
            </div>

            <p className="mt-8 text-center text-xs text-muted">
              Le code **INV-XXXX** est celui qui vous a été remis lors de votre premier versement.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

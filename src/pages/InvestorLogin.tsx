import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useNotification } from '../context/NotificationContext';
import { AuthenticationService, ApiError } from '../lib';

export const InvestorLogin = () => {
  const [personalCode, setPersonalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthenticationService.investorLoginAuthInvestorLoginPost({
        access_code: personalCode,
      });
      const investor = res.data;
      if (investor) {
        sessionStorage.setItem('investorCode', investor.access_code);
        sessionStorage.setItem('investorName', investor.name);
        sessionStorage.setItem('investorId', investor.id);
        showNotification(`Bienvenue, ${investor.name} !`);
        window.location.href = '/investisseur/dashboard';
      } else {
        showNotification('Réponse inattendue du serveur');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg = body?.detail || body?.message || 'Code personnel invalide';
        showNotification(typeof msg === 'string' ? msg : 'Code personnel invalide');
      } else {
        showNotification('Erreur de connexion au serveur');
      }
    } finally {
      setLoading(false);
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
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Vérification...' : 'Consulter mon Impact'}
              </Button>
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

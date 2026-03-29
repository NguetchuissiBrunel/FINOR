import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useNotification } from '../context/NotificationContext';

export const TreasurerLogin = () => {
  const [code, setCode] = useState('');
  const { showNotification } = useNotification();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Modern authentication check (Mock)
    if (code === 'FINOR-TRESO-2026') {
      sessionStorage.setItem('isTreasurerAuthenticated', 'true');
      showNotification('Accès Trésorier Validé ');
      window.location.href = '/tresorier';
    } else {
      showNotification('Code d\'accès incorrect ');
    }
  };

  return (
    <div className="login-page pt-40 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-center mb-10">Accès <span className="text-gold">Trésorier</span></h1>

        <Card className="border-gold">
          <form onSubmit={handleLogin}>
            <p className="text-muted text-sm mb-8 text-center">
              Veuillez saisir le code d'accès sécurisé pour gérer la trésorerie du village.
            </p>

            <Input
              label="Code d'Accès Sécurisé"
              placeholder="••••••••••••"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <div className="mt-10">
              <Button type="submit" fullWidth>Déverrouiller l'Espace</Button>
            </div>

            <p className="mt-8 text-center text-xs text-muted italic">
              Réservé au trésorier officiel de l'association.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

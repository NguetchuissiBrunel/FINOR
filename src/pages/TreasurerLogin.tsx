import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useNotification } from '../context/NotificationContext';
import { AuthenticationService, ApiError } from '../lib';

export const TreasurerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthenticationService.treasurerLoginAuthTreasurerLoginPost({
        email,
        password,
      });
      const token = res.data?.access_token;
      if (token) {
        sessionStorage.setItem('treasurerToken', token);
        sessionStorage.setItem('isTreasurerAuthenticated', 'true');
        showNotification('Accès Trésorier Validé ✓');
        window.location.href = '/tresorier';
      } else {
        showNotification('Réponse inattendue du serveur');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg = body?.detail || body?.message || 'Identifiants incorrects';
        showNotification(typeof msg === 'string' ? msg : 'Identifiants incorrects');
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
        <h1 className="text-center mb-10">Accès <span className="text-gold">Trésorier</span></h1>

        <Card className="border-gold">
          <form onSubmit={handleLogin}>
            <p className="text-muted text-sm mb-8 text-center">
              Veuillez saisir vos identifiants pour accéder à la gestion de la trésorerie.
            </p>

            <Input
              label="Adresse Email"
              placeholder="tresorier@finor.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div style={{ marginTop: '1rem' }}>
              <Input
                label="Mot de passe"
                placeholder="••••••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mt-10">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Connexion...' : 'Déverrouiller l\'Espace'}
              </Button>
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

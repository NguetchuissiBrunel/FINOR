import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useNotification } from '../context/NotificationContext';
import { AuthenticationService, ApiError } from '../lib';
import { useTranslation } from 'react-i18next';

export const TreasurerLogin = () => {
  const { t } = useTranslation();
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
        sessionStorage.setItem('treasurerEmail', email);
        sessionStorage.setItem('isTreasurerAuthenticated', 'true');
        showNotification(t('treasurerLogin.success'));
        window.location.href = '/tresorier';
      } else {
        showNotification(t('treasurerLogin.unexpectedResponse'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg = body?.detail || body?.message || t('treasurerLogin.invalidCreds');
        showNotification(typeof msg === 'string' ? msg : t('treasurerLogin.invalidCreds'));
      } else {
        showNotification(t('treasurerLogin.connError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page pt-40 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-center mb-10">{t('treasurerLogin.titlePart1')}<span className="text-gold">{t('treasurerLogin.titleGold')}</span></h1>

        <Card className="border-gold">
          <form onSubmit={handleLogin}>
            <p className="text-muted text-sm mb-8 text-center">
              {t('treasurerLogin.desc')}
            </p>

            <Input
              label={t('treasurerLogin.emailLabel')}
              placeholder={t('treasurerLogin.emailPlaceholder')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div style={{ marginTop: '1rem' }}>
              <Input
                label={t('treasurerLogin.pwdLabel')}
                placeholder={t('treasurerLogin.pwdPlaceholder')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mt-10">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? t('treasurerLogin.connecting') : t('treasurerLogin.btnSubmit')}
              </Button>
            </div>

            <p className="mt-8 text-center text-xs text-muted italic">
              {t('treasurerLogin.note')}
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

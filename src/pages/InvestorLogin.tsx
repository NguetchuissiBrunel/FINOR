import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useNotification } from '../context/NotificationContext';
import { AuthenticationService, ApiError } from '../lib';
import { useTranslation } from 'react-i18next';

export const InvestorLogin = () => {
  const { t } = useTranslation();
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
        showNotification(t('investorLogin.welcome', { name: investor.name }));
        window.location.href = '/investisseur/dashboard';
      } else {
        showNotification(t('investorLogin.unexpectedResponse'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg = body?.detail || body?.message || t('investorLogin.invalidCode');
        showNotification(typeof msg === 'string' ? msg : t('investorLogin.invalidCode'));
      } else {
        showNotification(t('investorLogin.connError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page pt-40 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-center mb-10">{t('investorLogin.titlePart1')}<span className="text-gold">{t('investorLogin.titleGold')}</span></h1>

        <Card>
          <form onSubmit={handleLogin}>
            <p className="text-muted text-sm mb-8 text-center">
              {t('investorLogin.desc')}
            </p>

            <Input
              label={t('investorLogin.codeLabel')}
              placeholder={t('investorLogin.codePlaceholder')}
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              required
            />

            <div className="mt-10">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? t('investorLogin.verifying') : t('investorLogin.btnSubmit')}
              </Button>
            </div>

            <p className="mt-8 text-center text-xs text-muted">
              {t('investorLogin.note')}
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

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
import { LoadingOverlay } from '../components/UI/LoadingOverlay';
import { useTranslation } from 'react-i18next';

export const Invest = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    receiptCode: '',
    rubricId: '',
  });
  const [personalCode, setPersonalCode] = useState('');
  const [isNewInvestor, setIsNewInvestor] = useState(false);
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
        showNotification(t('invest.errLoadRubrics'));
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
      setIsNewInvestor(!!data?.is_new_investor);
      setStep(4);
      showNotification(t('invest.successDeclare'));
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg = body?.detail || body?.message || t('invest.errSubmit');
        showNotification(typeof msg === 'string' ? msg : t('invest.errSubmit'));
      } else {
        showNotification(t('invest.errConn'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRubricName = rubrics.find(r => r.id === formData.rubricId)?.name || '';

  return (
    <div className="invest-page">
      {(submitting || loadingRubrics) && (
        <LoadingOverlay message={t('invest.sync')} />
      )}
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-center mb-10">{t('invest.titlePart1')}<span className="text-gold">{t('invest.titleGold')}</span></h1>

        <Card>
          {step === 1 && (
            <div className="step-content animation-fade-in">
              <h3 className="mb-6">{t('invest.step1')}</h3>
              <Input
                label={t('invest.nameLabel')}
                placeholder={t('invest.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label={t('invest.receiptLabel')}
                placeholder={t('invest.receiptPlaceholder')}
                value={formData.receiptCode}
                onChange={(e) => setFormData({ ...formData, receiptCode: e.target.value })}
              />
              <div className="mt-8 flex justify-end">
                <Button onClick={handleNext} disabled={!formData.name || !formData.receiptCode}>{t('invest.nextBtn')}</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animation-fade-in">
              <h3 className="mb-6">{t('invest.step2')}</h3>
              <Input
                label={t('invest.amountLabel')}
                type="number"
                placeholder={t('invest.amountPlaceholder')}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <div className="form-group mb-6">
                <label className="form-label">{t('invest.rubricLabel')}</label>
                {loadingRubrics ? (
                  <p className="text-muted text-sm">{t('invest.rubricLoading')}</p>
                ) : (
                  <select
                    className="form-input"
                    value={formData.rubricId}
                    onChange={(e) => setFormData({ ...formData, rubricId: e.target.value })}
                  >
                    <option value="">{t('invest.rubricSelect')}</option>
                    {rubrics.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="secondary" onClick={handlePrev}>{t('invest.prevBtn')}</Button>
                <Button onClick={handleNext} disabled={!formData.amount || !formData.rubricId}>{t('invest.nextBtn')}</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="step-content animation-fade-in">
              <h3 className="mb-6">{t('invest.step3')}</h3>
              <div className="bg-surface-hover p-6 rounded-md border border-gold-light mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-muted">{t('invest.investorLabel')}</span>
                  <span className="font-bold">{formData.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">{t('invest.receiptKey')}</span>
                  <span className="text-gold">{formData.receiptCode}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">{t('invest.amountKey')}</span>
                  <span className="font-bold">{Number(formData.amount).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('invest.rubricKey')}</span>
                  <span>{selectedRubricName}</span>
                </div>
              </div>
              <p className="text-sm text-muted mb-8 italic">
                {t('invest.confirmWarning')}
              </p>
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="secondary" onClick={handlePrev}>{t('invest.prevBtn')}</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('invest.confirming') : t('invest.confirmBtn')}
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
              <h3 className="text-gold mb-2">{t('invest.successTitle')}</h3>
              <p className="text-muted mb-8">
                {t('invest.successSub')}
                {isNewInvestor ? (
                  <> {t('invest.newInvestorCode')}</>
                ) : (
                  <> {t('invest.returningInvestor')}</>
                )}
              </p>
              {isNewInvestor && personalCode && (
                <>
                  <div className="bg-black p-4 rounded border border-dashed border-gold mb-8 text-2xl font-bold tracking-widest text-gold">
                    {personalCode}
                  </div>
                  <p className="text-xs text-muted mb-10">
                    {t('invest.saveCodeWarn')}
                  </p>
                </>
              )}
              <Button onClick={() => window.location.href = '/investisseur/login'}>
                {t('invest.accessSpace')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

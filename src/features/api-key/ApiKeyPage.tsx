'use client';

import {useCallback, useEffect, useState} from 'react';
import {Key, Trash2, ExternalLink, CheckCircle, AlertCircle} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/shared/auth/AuthProvider';
import {useRequireAuth} from '@/shared/auth/useRequireAuth';

export function ApiKeyPage() {
  const t = useTranslations('apiKey');
  const {isAuthenticated, user} = useAuth();
  const {requireAuth} = useRequireAuth();
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKeyStatus = useCallback(() => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    user.getIdToken().then(token => {
      fetch('/api/user-api-key', {headers: {Authorization: `Bearer ${token}`}})
        .then(res => res.json())
        .then(data => {
          if (data.exists) {
            setHasKey(true);
            setMaskedKey(data.maskedKey);
          } else {
            setHasKey(false);
            setMaskedKey(null);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [isAuthenticated, user]);

  useEffect(() => { fetchKeyStatus(); }, [fetchKeyStatus]);

  const handleSave = async () => {
    if (!user || saving) return;
    const key = inputValue.trim();
    if (!key) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({apiKey: key}),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({type: 'success', text: t('saved')});
        setHasKey(true);
        setMaskedKey(data.maskedKey);
        setInputValue('');
      } else if (data.error === 'invalid_key') {
        setMessage({type: 'error', text: t('invalidKey')});
      } else if (data.error === 'validation_error') {
        setMessage({type: 'error', text: t('validationError')});
      } else {
        setMessage({type: 'error', text: data.error || t('error')});
      }
    } catch {
      setMessage({type: 'error', text: t('error')});
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || deleting) return;

    setDeleting(true);
    setMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user-api-key', {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${token}`},
      });

      if (res.ok) {
        setHasKey(false);
        setMaskedKey(null);
        setShowDeleteConfirm(false);
      } else {
        const data = await res.json();
        setMessage({type: 'error', text: data.error || t('error')});
      }
    } catch {
      setMessage({type: 'error', text: t('error')});
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) {
    requireAuth(() => {});
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Key className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-950">{t('title')}</h1>
        <p className="mt-2 text-gray-600">{t('subtitle')}</p>
      </div>

      {message ? (
        <div
          className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-800 ring-1 ring-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      ) : null}

      {hasKey ? (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <label className="mb-2 block text-sm font-semibold text-gray-700">{t('savedKey')}</label>
            <div className="rounded-md bg-gray-50 px-4 py-3 font-mono text-sm text-gray-600 ring-1 ring-gray-200">
              {maskedKey}
            </div>
            <p className="mt-2 text-xs text-gray-500">API</p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? t('deleting') : t('delete')}
          </button>

          {showDeleteConfirm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-950">{t('deleteConfirmTitle')}</h3>
                <p className="mt-2 text-sm text-gray-600">{t('deleteConfirm')}</p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? t('deleting') : t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">{t('noKey')}</p>
            </div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('title')}
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !inputValue.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              <Key className="h-4 w-4" />
              {saving ? t('saving') : t('save')}
            </button>
          </div>

          <a
            href={t('helpUrl')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {t('helpLink')}
          </a>
        </div>
      )}
    </div>
  );
}

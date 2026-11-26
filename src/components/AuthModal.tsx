import { useEffect, useState } from 'react';
import { LogIn, UserCheck, UserPlus, X } from 'lucide-react';
import { STORE_INFO } from '../data/seedData';
import { UserAccount } from '../types/store';
import { validateSignUpForm } from '../utils/storeLogic';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  accounts: UserAccount[];
  onClose: () => void;
  onSignInIdentifier: (identifier: string) => boolean;
  onSwitchAccount: (accountId: string) => void;
  onSignUp: (payload: {
    name: string;
    phone: string;
    email: string;
    neighborhood: string;
    address: string;
  }) => void;
  onContinueAsGuest: () => void;
}

export function AuthModal({
  isOpen,
  initialMode = 'signin',
  accounts,
  onClose,
  onSignInIdentifier,
  onSwitchAccount,
  onSignUp,
  onContinueAsGuest,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [signInError, setSignInError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [neighborhood, setNeighborhood] = useState('العين القليعة');
  const [address, setAddress] = useState('');
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setSignInError('');
    setSignUpErrors({});
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, initialMode, onClose]);

  if (!isOpen) return null;

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onSignInIdentifier(identifier);
    if (!ok) {
      setSignInError('لم يتم العثور على حساب بهذا الرقم أو البريد. جرب اختيار حساب محفوظ أو أنشئ حساباً جديداً.');
      return;
    }
    setSignInError('');
    setIdentifier('');
    onClose();
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSignUpForm({
      name,
      phone,
      email,
      neighborhood,
      address,
    });
    if (!validation.valid) {
      setSignUpErrors(validation.errors);
      return;
    }
    setSignUpErrors({});
    onSignUp({ name, phone, email, neighborhood, address });
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto flex flex-col">
        <div
          className="md:hidden w-10 h-1.5 bg-zinc-300 rounded-full mx-auto mt-3"
          aria-hidden="true"
        />

        <div className="p-5 md:p-6 flex items-center justify-between border-b border-zinc-100">
          <div>
            <h2 id="auth-modal-title" className="font-display text-lg font-bold text-zinc-950">
              {mode === 'signin' ? 'تسجيل الدخول إلى محل رشيد' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{STORE_INFO.creatorAttributionAr}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الحساب"
            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {/* Segmented Switch */}
          <div role="tablist" className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => setMode('signin')}
              className={`min-h-[42px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => setMode('signup')}
              className={`min-h-[42px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>إنشاء حساب</span>
            </button>
          </div>

          {mode === 'signin' ? (
            <div className="space-y-4">
              <form onSubmit={handleSignInSubmit} noValidate className="space-y-3">
                <div>
                  <label htmlFor="auth-identifier" className="block text-xs font-medium text-zinc-700 mb-1">
                    رقم الهاتف أو البريد الإلكتروني
                  </label>
                  <input
                    id="auth-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: 06XXXXXXXX أو name@example.ma"
                    className="w-full min-h-[44px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                  />
                  {signInError && <p className="text-xs text-rose-700 mt-1">{signInError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[46px] bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  دخول للحساب
                </button>
              </form>

              {/* Saved Accounts Quick Switch or New Account Note */}
              {accounts.length > 0 ? (
                <div className="border-t border-zinc-100 pt-4 space-y-2.5">
                  <p className="text-xs font-semibold text-zinc-600">
                    أو التبديل السريع لحساب محفوظ:
                  </p>
                  <div className="space-y-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          onSwitchAccount(acc.id);
                          onClose();
                        }}
                        className="w-full p-3 rounded-xl border border-zinc-200 hover:border-emerald-800 hover:bg-emerald-50/40 flex items-center justify-between gap-3 text-start transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">{acc.name}</p>
                          <p className="text-xs text-zinc-500 truncate tabular-nums">
                            {acc.neighborhood} · <span dir="ltr">{acc.phone}</span>
                          </p>
                        </div>
                        <UserCheck className="w-4 h-4 text-emerald-800 shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t border-zinc-100 pt-4 flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-600">
                    لا توجد حسابات محفوظة بعد. أنشئ حسابك لربح 5 نقاط وفاء ترحيبية.
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-emerald-900 font-bold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    إنشاء حساب
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSignUpSubmit} noValidate className="space-y-3">
              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-zinc-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم والنسب"
                  className="w-full min-h-[42px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                />
                {signUpErrors.name && (
                  <p className="text-xs text-rose-700 mt-1">{signUpErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="signup-phone" className="block text-xs font-medium text-zinc-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    id="signup-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="w-full min-h-[42px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm text-end tabular-nums outline-none"
                  />
                  {signUpErrors.phone && (
                    <p className="text-xs text-rose-700 mt-1">{signUpErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-xs font-medium text-zinc-700 mb-1">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.ma"
                    className="w-full min-h-[42px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm text-end outline-none"
                  />
                  {signUpErrors.email && (
                    <p className="text-xs text-rose-700 mt-1">{signUpErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="signup-neighborhood" className="block text-xs font-medium text-zinc-700 mb-1">
                    الحي
                  </label>
                  <input
                    id="signup-neighborhood"
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                  />
                  {signUpErrors.neighborhood && (
                    <p className="text-xs text-rose-700 mt-1">{signUpErrors.neighborhood}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-address" className="block text-xs font-medium text-zinc-700 mb-1">
                    العنوان الافتراضي
                  </label>
                  <input
                    id="signup-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الزنقة، رقم العمارة، الشقة..."
                    className="w-full min-h-[42px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                  />
                  {signUpErrors.address && (
                    <p className="text-xs text-rose-700 mt-1">{signUpErrors.address}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors"
              >
                إنشاء الحساب والمتابعة
              </button>
            </form>
          )}

          {/* Guest browsing option */}
          <div className="border-t border-zinc-100 pt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">يمكنك التصفح والطلب مباشرة بدون حساب</span>
            <button
              type="button"
              onClick={() => {
                onContinueAsGuest();
                onClose();
              }}
              className="min-h-[38px] px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
            >
              تصفح كزائر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

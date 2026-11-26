import { useEffect, useState } from 'react';
import {
  Award,
  Clock,
  Download,
  Heart,
  ListChecks,
  LogOut,
  MapPin,
  MessageSquarePlus,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Smartphone,
  Trash2,
  UserCheck,
  UserCog,
} from 'lucide-react';
import {
  ANDROID_APP_INFO,
  CATEGORY_LABELS,
  STORE_INFO,
  SUPPORT_TYPE_LABELS,
} from '../data/seedData';
import {
  AuthStatus,
  Order,
  Product,
  ProductCategory,
  RecurringListItem,
  SavedAddress,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
  UserAccount,
} from '../types/store';
import { formatMad, validateProfileForm } from '../utils/storeLogic';
import { LoyaltyCard } from './LoyaltyCard';
import { ScrollReveal } from './ScrollMotion';
import { StoreLocationCard } from './StoreLocationCard';

interface AccountSupportViewProps {
  products: Product[];
  favorites: string[];
  recurringList: RecurringListItem[];
  loyaltyPoints: number;
  loyaltyStamps: number;
  completedRewardsCount: number;
  orders: Order[];
  tickets: SupportTicket[];
  authStatus: AuthStatus;
  activeAccount: UserAccount | null;
  savedAddresses: SavedAddress[];
  defaultCustomerName: string;
  defaultPhone: string;
  defaultNeighborhood: string;
  defaultAddress: string;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onContinueAsGuest: () => void;
  onUpdateProfile: (payload: {
    name: string;
    phone: string;
    email: string;
    neighborhood: string;
    address: string;
  }) => void;
  onSaveAddress: (address: SavedAddress) => void;
  onDeleteAddress: (addressId: string) => void;
  onResetProgress: () => void;
  onOpenDownloadModal: () => void;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onAddToRecurringList: (productId: string, quantity?: number) => void;
  onUpdateRecurringQuantity: (productId: string, quantity: number) => void;
  onAddRecurringListToCart: () => { addedCount: number; skippedCount: number };
  onSubmitTicket: (payload: {
    type: SupportTicketType;
    orderId?: string;
    subject: string;
    message: string;
  }) => void;
}

export function AccountSupportView({
  products,
  favorites,
  recurringList,
  loyaltyPoints,
  loyaltyStamps,
  completedRewardsCount,
  orders,
  tickets,
  authStatus,
  activeAccount,
  savedAddresses,
  defaultCustomerName,
  defaultPhone,
  defaultNeighborhood,
  defaultAddress,
  onOpenAuthModal,
  onContinueAsGuest,
  onUpdateProfile,
  onSaveAddress,
  onDeleteAddress,
  onResetProgress,
  onOpenDownloadModal,
  onToggleFavorite,
  onAddToCart,
  onAddToRecurringList,
  onUpdateRecurringQuantity,
  onAddRecurringListToCart,
  onSubmitTicket,
}: AccountSupportViewProps) {
  const [selectedRecurringProductId, setSelectedRecurringProductId] = useState(
    products[0]?.id ?? ''
  );
  const [recurringBulkMessage, setRecurringBulkMessage] = useState('');
  const [recurringAddedConfirm, setRecurringAddedConfirm] = useState(false);
  const [addedFavId, setAddedFavId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetSuccessFeedback, setResetSuccessFeedback] = useState(false);

  // Profile editor state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(activeAccount?.name ?? defaultCustomerName);
  const [profilePhone, setProfilePhone] = useState(activeAccount?.phone ?? defaultPhone);
  const [profileEmail, setProfileEmail] = useState(activeAccount?.email ?? '');
  const [profileNeighborhood, setProfileNeighborhood] = useState(
    activeAccount?.neighborhood ?? defaultNeighborhood
  );
  const [profileAddress, setProfileAddress] = useState(
    activeAccount?.address ?? defaultAddress
  );
  const [profileError, setProfileError] = useState('');
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // New Saved Address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrNeighborhood, setAddrNeighborhood] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDefault, setAddrDefault] = useState(true);
  const [addrError, setAddrError] = useState('');

  // Support form state
  const [ticketType, setTicketType] = useState<SupportTicketType>(SupportTicketType.INQUIRY);
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    setProfileName(activeAccount?.name ?? defaultCustomerName);
    setProfilePhone(activeAccount?.phone ?? defaultPhone);
    setProfileEmail(activeAccount?.email ?? '');
    setProfileNeighborhood(activeAccount?.neighborhood ?? defaultNeighborhood);
    setProfileAddress(activeAccount?.address ?? defaultAddress);
    setProfileError('');
  }, [activeAccount, defaultCustomerName, defaultPhone, defaultNeighborhood, defaultAddress]);

  useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.id === selectedRecurringProductId)) {
      setSelectedRecurringProductId(products[0].id);
    }
  }, [products, selectedRecurringProductId]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const favoriteProducts = favorites
    .map((id) => productMap.get(id))
    .filter((p): p is Product => Boolean(p));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProfileForm({
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      neighborhood: profileNeighborhood,
      address: profileAddress,
    });
    if (!validation.valid) {
      setProfileError(validation.error);
      return;
    }
    setProfileError('');
    onUpdateProfile({
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      neighborhood: profileNeighborhood,
      address: profileAddress,
    });
    setIsEditingProfile(false);
    setProfileSavedFeedback(true);
    window.setTimeout(() => setProfileSavedFeedback(false), 2000);
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      addrLabel.trim().length < 2 ||
      addrNeighborhood.trim().length < 2 ||
      addrStreet.trim().length < 4
    ) {
      setAddrError('يرجى إدخال اسم العنوان والحي والعنوان التفصيلي.');
      return;
    }
    setAddrError('');
    onSaveAddress({
      id: `addr-${Date.now()}`,
      label: addrLabel.trim(),
      neighborhood: addrNeighborhood.trim(),
      streetAddress: addrStreet.trim(),
      isDefault: addrDefault,
    });
    setAddrLabel('');
    setAddrNeighborhood('');
    setAddrStreet('');
    setIsAddingAddress(false);
  };

  const handleBulkAddRecurring = () => {
    const result = onAddRecurringListToCart();
    if (result.addedCount === 0) {
      setRecurringBulkMessage('جميع أصناف القائمة غير متوفرة حالياً.');
    } else if (result.skippedCount > 0) {
      setRecurringBulkMessage(
        `أضيفت ${result.addedCount} أصناف (وتخطي ${result.skippedCount} غير متوفرة)`
      );
    } else {
      setRecurringBulkMessage(`تمت إضافة ${result.addedCount} أصناف للسلة`);
    }
    window.setTimeout(() => setRecurringBulkMessage(''), 2500);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSubject.trim().length < 3 || ticketMessage.trim().length < 6) {
      setTicketError('يرجى كتابة عنوان واضح وتفاصيل الرسالة.');
      return;
    }
    setTicketError('');
    onSubmitTicket({
      type: ticketType,
      orderId: ticketOrderId || undefined,
      subject: ticketSubject,
      message: ticketMessage,
    });
    setTicketSubject('');
    setTicketMessage('');
    setTicketOrderId('');
    setTicketSent(true);
    window.setTimeout(() => setTicketSent(false), 2500);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-950">حسابي والدعم</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            إدارة الحساب والعناوين المحفوظة، نقاط الوفاء، القائمة الدورية، وساعات العمل
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDownloadModal}
          className="min-h-[42px] px-4 bg-white border border-zinc-200 hover:border-emerald-800 text-emerald-950 text-xs font-semibold rounded-xl flex items-center gap-2 self-start cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-800" aria-hidden="true" />
          <span>تنزيل التطبيق (أندرويد)</span>
        </button>
      </div>

      {/* Account Auth & Profile Settings + Saved Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section
          aria-labelledby="account-profile-heading"
          className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 md:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs text-zinc-500">
                  {authStatus === AuthStatus.AUTHENTICATED && activeAccount
                    ? 'حساب مسجل'
                    : 'وضع التصفح كزائر'}
                </span>
                <h2 id="account-profile-heading" className="font-display text-lg font-bold text-zinc-950">
                  {authStatus === AuthStatus.AUTHENTICATED && activeAccount
                    ? activeAccount.name
                    : 'زائر محل رشيد'}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuthModal('signin')}
                className="min-h-[38px] px-3.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                {authStatus === AuthStatus.AUTHENTICATED ? 'تبديل الحساب' : 'تسجيل الدخول'}
              </button>

              {authStatus === AuthStatus.GUEST ? (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="min-h-[38px] px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  إنشاء حساب
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="min-h-[38px] px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>خروج للزائر</span>
                </button>
              )}
            </div>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} noValidate className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prof-name" className="block text-xs font-medium text-zinc-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="prof-phone" className="block text-xs font-medium text-zinc-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    id="prof-phone"
                    type="tel"
                    dir="ltr"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm text-end tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prof-email" className="block text-xs font-medium text-zinc-700 mb-1">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    dir="ltr"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm text-end outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="prof-neighborhood" className="block text-xs font-medium text-zinc-700 mb-1">
                    الحي الافتراضي
                  </label>
                  <input
                    id="prof-neighborhood"
                    type="text"
                    value={profileNeighborhood}
                    onChange={(e) => setProfileNeighborhood(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prof-address" className="block text-xs font-medium text-zinc-700 mb-1">
                  العنوان الافتراضي
                </label>
                <input
                  id="prof-address"
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="الزنقة، رقم العمارة، الشقة..."
                  className="w-full min-h-[40px] px-3 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
                />
              </div>

              {profileError && <p className="text-xs text-rose-700">{profileError}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="min-h-[40px] px-4 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileError('');
                  }}
                  className="min-h-[40px] px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 text-sm text-zinc-700">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
                <span>
                  الهاتف:{' '}
                  <strong className="text-zinc-900 tabular-nums" dir="ltr">
                    {(activeAccount?.phone ?? defaultPhone) || 'غير محدد'}
                  </strong>
                </span>
                {activeAccount?.email && (
                  <span>
                    البريد:{' '}
                    <strong className="text-zinc-900" dir="ltr">
                      {activeAccount.email}
                    </strong>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600">
                الحي الافتراضي:{' '}
                <strong className="text-zinc-900">
                  {activeAccount?.neighborhood ?? defaultNeighborhood}
                </strong>
                {(activeAccount?.address || defaultAddress) && (
                  <span className="text-zinc-500">
                    {' '}
                    · {activeAccount?.address || defaultAddress}
                  </span>
                )}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProfileError('');
                    setIsEditingProfile(true);
                  }}
                  className="min-h-[38px] px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCog className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>تعديل الملف الشخصي</span>
                </button>
                {profileSavedFeedback && (
                  <span className="text-xs text-emerald-800 font-semibold">تم تحديث البيانات</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Saved Addresses Manager */}
        <section
          aria-labelledby="saved-addresses-heading"
          className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-800" aria-hidden="true" />
              <h2 id="saved-addresses-heading" className="font-display text-lg font-bold text-zinc-950">
                العناوين المحفوظة ({savedAddresses.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingAddress((v) => !v)}
              className="min-h-[38px] px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {isAddingAddress ? 'إغلاق' : 'إضافة عنوان'}
            </button>
          </div>

          {isAddingAddress && (
            <form onSubmit={handleAddAddressSubmit} className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-label" className="block text-xs font-medium text-zinc-700 mb-1">
                    تسمية العنوان
                  </label>
                  <input
                    id="addr-label"
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="مثال: المنزل، العمل، منزل العائلة"
                    className="w-full min-h-[40px] px-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="addr-neighborhood" className="block text-xs font-medium text-zinc-700 mb-1">
                    الحي
                  </label>
                  <input
                    id="addr-neighborhood"
                    type="text"
                    value={addrNeighborhood}
                    onChange={(e) => setAddrNeighborhood(e.target.value)}
                    placeholder="مثال: العين القليعة"
                    className="w-full min-h-[40px] px-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="addr-street" className="block text-xs font-medium text-zinc-700 mb-1">
                  العنوان التفصيلي
                </label>
                <input
                  id="addr-street"
                  type="text"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="الزنقة، رقم العمارة، الطابق..."
                  className="w-full min-h-[40px] px-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                  className="w-4 h-4 accent-emerald-800"
                />
                <span>تعيين كعنوان افتراضي للتوصيل</span>
              </label>

              {addrError && <p className="text-xs text-rose-700">{addrError}</p>}

              <button
                type="submit"
                className="min-h-[40px] px-4 bg-emerald-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                حفظ العنوان
              </button>
            </form>
          )}

          {savedAddresses.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">
              لا توجد عناوين محفوظة حالياً. أضف عنواناً لتسريع طلباتك القادمة.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {savedAddresses.map((addr) => (
                <li
                  key={addr.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                    addr.isDefault
                      ? 'border-emerald-700 bg-emerald-50/40'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-zinc-950">{addr.label}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-zinc-600">{addr.neighborhood}</span>
                      {addr.isDefault && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-800 font-semibold">افتراضي</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{addr.streetAddress}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => onSaveAddress({ ...addr, isDefault: true })}
                        className="min-h-[34px] px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold rounded-lg cursor-pointer"
                      >
                        تعيين افتراضي
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteAddress(addr.id)}
                      aria-label={`حذف عنوان ${addr.label}`}
                      className="w-8 h-8 rounded-lg text-zinc-400 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Interactive Loyalty Card + Store Location & App About */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <LoyaltyCard
            memberName={activeAccount?.name ?? (defaultCustomerName || null)}
            loyaltyPoints={loyaltyPoints}
            loyaltyStamps={loyaltyStamps}
            completedRewardsCount={completedRewardsCount}
          />
        </div>

        <div className="lg:col-span-7 space-y-5">
          <StoreLocationCard />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <section
              aria-labelledby="about-app-heading"
              className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Smartphone className="w-5 h-5" aria-hidden="true" />
                  <h2 id="about-app-heading" className="font-display text-base font-bold text-zinc-950">
                    عن تطبيق محل رشيد
                  </h2>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  تطبيق أندرويد متكامل لخدمة زبناء العين القليعة بأسعار واضحة بالدرهم المغربي.
                </p>
                <p className="text-xs font-semibold text-emerald-900">
                  {STORE_INFO.creatorAttributionAr}
                </p>
                <p className="text-[11px] text-zinc-500 tabular-nums" dir="ltr">
                  v{ANDROID_APP_INFO.versionName} · {ANDROID_APP_INFO.apkSizeLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenDownloadModal}
                className="w-full min-h-[42px] px-4 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>تنزيل التطبيق لأندرويد</span>
              </button>
            </section>

            {/* Start Fresh / Reset Progress Card */}
            <section
              aria-labelledby="reset-progress-heading"
              className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-800">
                  <RotateCcw className="w-4 h-4 text-zinc-600" aria-hidden="true" />
                  <h2 id="reset-progress-heading" className="font-display text-base font-bold text-zinc-950">
                    البدء من جديد
                  </h2>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  يُحفظ تقدمك تلقائياً على جهازك. يمكنك تصفير السلة والنقاط وسجل الطلبات في أي وقت.
                </p>
                {resetSuccessFeedback && (
                  <p role="status" className="text-xs font-semibold text-emerald-800 pt-1">
                    تم تصفير جميع البيانات بنجاح والبدء من جديد.
                  </p>
                )}
              </div>

              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setIsEditingProfile(false);
                      setIsAddingAddress(false);
                      setProfileError('');
                      setAddrError('');
                      setConfirmReset(false);
                      setResetSuccessFeedback(true);
                      window.setTimeout(() => setResetSuccessFeedback(false), 3000);
                    }}
                    className="flex-1 min-h-[42px] px-3 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    تأكيد التصفير
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[42px] px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full min-h-[42px] px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>البدء من جديد (تصفير التقدم)</span>
                </button>
              )}
            </section>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Recurring Shopping List & Favorites */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section
          aria-labelledby="recurring-heading"
          className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-800" aria-hidden="true" />
              <h2 id="recurring-heading" className="font-display text-lg font-bold text-zinc-950">
                قائمة المشتريات الدورية
              </h2>
            </div>

            {recurringList.length > 0 && (
              <button
                type="button"
                onClick={handleBulkAddRecurring}
                className="min-h-[40px] px-4 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{recurringBulkMessage ? recurringBulkMessage : 'أضف القائمة للسلة'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="recurring-add-select" className="sr-only">
              اختر منتجاً لإضافته للقائمة الدورية
            </label>
            <select
              id="recurring-add-select"
              value={selectedRecurringProductId}
              onChange={(e) => setSelectedRecurringProductId(e.target.value)}
              className="flex-1 min-h-[42px] px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none"
            >
              {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => {
                const groupItems = products.filter((p) => p.category === cat);
                if (groupItems.length === 0) return null;
                return (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                    {groupItems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.unitLabel} ({formatMad(p.priceMad)})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedRecurringProductId) {
                  onAddToRecurringList(selectedRecurringProductId, 1);
                  setRecurringAddedConfirm(true);
                  window.setTimeout(() => setRecurringAddedConfirm(false), 1500);
                }
              }}
              className={`min-h-[42px] px-4 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                recurringAddedConfirm
                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
              }`}
            >
              {recurringAddedConfirm ? 'تمت الإضافة' : 'إضافة للقائمة'}
            </button>
          </div>

          {recurringList.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">
              قائمتك الدورية فارغة. أضف منتجاتك الأسبوعية لتسهيل طلبها لاحقاً.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recurringList.map((item) => {
                const product = productMap.get(item.productId);
                if (!product) return null;

                return (
                  <li key={item.productId} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{product.name}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        {product.unitLabel} · {formatMad(product.priceMad)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateRecurringQuantity(item.productId, item.quantity + 1)}
                        aria-label={`زيادة كمية ${product.name} في القائمة الدورية`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-[22px] text-center text-xs font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateRecurringQuantity(item.productId, item.quantity - 1)}
                        aria-label={`إنقاص كمية ${product.name} في القائمة الدورية`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="favorites-heading"
          className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Heart className="w-5 h-5 text-rose-600" aria-hidden="true" />
            <h2 id="favorites-heading" className="font-display text-lg font-bold text-zinc-950">
              المفضلة ({favoriteProducts.length})
            </h2>
          </div>

          {favoriteProducts.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">
              لم تقم بحفظ أي منتجات في المفضلة بعد.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {favoriteProducts.map((product) => (
                <li key={product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{product.name}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      {formatMad(product.priceMad)} ·{' '}
                      {product.inStock ? 'متوفر' : 'غير متوفر حالياً'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={!product.inStock}
                      onClick={() => {
                        onAddToCart(product.id);
                        setAddedFavId(product.id);
                        window.setTimeout(() => {
                          setAddedFavId((curr) => (curr === product.id ? null : curr));
                        }, 1500);
                      }}
                      className={`min-h-[38px] px-3 text-xs font-semibold rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors ${
                        addedFavId === product.id
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : 'bg-emerald-900 hover:bg-emerald-800 disabled:bg-zinc-200 disabled:text-zinc-500 text-white'
                      }`}
                    >
                      {addedFavId === product.id ? 'تمت الإضافة' : 'أضف للسلة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(product.id)}
                      aria-label={`إزالة ${product.name} من المفضلة`}
                      className="min-h-[38px] px-2.5 text-xs text-zinc-500 hover:text-rose-700 rounded-xl cursor-pointer"
                    >
                      إزالة
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </ScrollReveal>

      {/* Structured Inquiries, Complaints & Reports */}
      <ScrollReveal>
        <section
          aria-labelledby="support-heading"
          className="bg-white border border-zinc-200/80 rounded-2xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
        <form onSubmit={handleSupportSubmit} noValidate className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-emerald-800" aria-hidden="true" />
            <h2 id="support-heading" className="font-display text-lg font-bold text-zinc-950">
              الاستفسارات والشكاوى والبلاغات
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ticket-type" className="block text-xs font-medium text-zinc-700 mb-1">
                نوع الطلب
              </label>
              <select
                id="ticket-type"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as SupportTicketType)}
                className="w-full min-h-[42px] px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium outline-none"
              >
                {Object.values(SupportTicketType).map((type) => (
                  <option key={type} value={type}>
                    {SUPPORT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ticket-order" className="block text-xs font-medium text-zinc-700 mb-1">
                طلب مرتبط (اختياري)
              </label>
              <select
                id="ticket-order"
                value={ticketOrderId}
                onChange={(e) => setTicketOrderId(e.target.value)}
                className="w-full min-h-[42px] px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium outline-none"
              >
                <option value="">بدون طلب محدد</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    طلب رقم {o.id} ({formatMad(o.breakdown.totalMad)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ticket-subject" className="block text-xs font-medium text-zinc-700 mb-1">
              موضوع الرسالة
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="مثال: استفسار عن منتج أو تأخر في التوصيل"
              className="w-full min-h-[42px] px-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label htmlFor="ticket-message" className="block text-xs font-medium text-zinc-700 mb-1">
              التفاصيل
            </label>
            <textarea
              id="ticket-message"
              rows={3}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="اكتب تفاصيل الاستفسار أو الشكوى ليتم الرد عليك من صاحب المحل..."
              className="w-full p-3.5 bg-zinc-50 border border-zinc-200 focus:border-emerald-800 focus:bg-white rounded-xl text-sm outline-none resize-none"
            />
          </div>

          {ticketError && <p className="text-xs text-rose-700">{ticketError}</p>}
          {ticketSent && (
            <p className="text-xs text-emerald-800 font-semibold">
              تم إرسال رسالتك إلى إدارة محل رشيد بنجاح.
            </p>
          )}

          <button
            type="submit"
            className="min-h-[44px] px-6 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            إرسال الطلب
          </button>
        </form>

        <div className="lg:col-span-6 space-y-3 border-t lg:border-t-0 lg:border-s border-zinc-100 pt-5 lg:pt-0 lg:ps-6">
          <h3 className="font-display text-base font-bold text-zinc-950">
            سجل التذاكر والردود ({tickets.length})
          </h3>

          {tickets.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد تذاكر مسجلة بعد.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-500">
                      <span dir="ltr">{ticket.id}</span> · {SUPPORT_TYPE_LABELS[ticket.type]}
                      {ticket.orderId ? ` · طلب رقم ${ticket.orderId}` : ''}
                    </span>
                    <span
                      className={`font-semibold ${
                        ticket.status === SupportTicketStatus.RESOLVED
                          ? 'text-emerald-800'
                          : 'text-amber-700'
                      }`}
                    >
                      {ticket.status === SupportTicketStatus.RESOLVED ? 'تم الحل' : 'قيد المراجعة من محل رشيد'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">{ticket.subject}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{ticket.message}</p>
                  {ticket.ownerReply && (
                    <div className="mt-2 pt-2 border-t border-zinc-200/80 text-xs text-emerald-950">
                      <span className="font-semibold">رد محل رشيد: </span>
                      <span>{ticket.ownerReply}</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      </ScrollReveal>
    </div>
  );
}

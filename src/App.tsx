import { useState } from 'react';
import { AccountSupportView } from './components/AccountSupportView';
import { AppDownloadModal } from './components/AppDownloadModal';
import { AuthModal } from './components/AuthModal';
import { CartOrdersView } from './components/CartOrdersView';
import { CatalogView } from './components/CatalogView';
import { HomeView } from './components/HomeView';
import { NavigationShell } from './components/NavigationShell';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ScrollToTopButton } from './components/ScrollMotion';
import { STORE_INFO } from './data/seedData';
import { useScrollDirection } from './hooks/useScrollDirection';
import { useStorePersistence } from './state/useStorePersistence';
import {
  AppTab,
  FulfillmentType,
  Product,
  ProductCategory,
  SortOption,
  SubstitutionPreference,
} from './types/store';
import { calculateCartSummary } from './utils/storeLogic';

export default function App() {
  const {
    state,
    activeAccount,
    activeSavedAddresses,
    addToCart,
    addBundleToCart,
    updateCartQuantity,
    updateCartSubstitution,
    clearCart,
    removeOutOfStockFromCart,
    placeOrder,
    reorderFromOrder,
    toggleFavorite,
    addToRecurringList,
    updateRecurringQuantity,
    addRecurringListToCart,
    submitSupportTicket,
    signInWithIdentifier,
    switchAccountById,
    signUpAccount,
    continueAsGuest,
    updateActiveProfile,
    saveAddress,
    deleteSavedAddress,
    resetStoreState,
  } = useStorePersistence();

  const { direction: scrollDirection, isScrolled, showScrollTop } = useScrollDirection();

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [cartSubTab, setCartSubTab] = useState<'cart' | 'orders'>('cart');
  const [reorderNotice, setReorderNotice] = useState<{
    addedCount: number;
    skippedCount: number;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{
    open: boolean;
    mode: 'signin' | 'signup';
  }>({ open: false, mode: 'signin' });

  // Catalog filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [maxPriceMad, setMaxPriceMad] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSummary = calculateCartSummary(state.cart, state.products, {
    fulfillment: FulfillmentType.DELIVERY,
    redeemPoints: false,
    availablePoints: state.loyaltyPoints,
    storeInfo: STORE_INFO,
  });

  const navigateToCatalog = (category: ProductCategory | 'all' = 'all', onlyOffers = false) => {
    setSelectedCategory(category);
    setOffersOnly(onlyOffers);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSelectTab = (tab: AppTab, subTab: 'cart' | 'orders' = 'cart') => {
    if (tab === 'cart') {
      setCartSubTab(subTab);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const resetCatalogFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setInStockOnly(false);
    setOffersOnly(false);
    setMaxPriceMad(null);
    setSortBy('featured');
  };

  const handleQuickReorder = (orderId: string) => {
    const result = reorderFromOrder(orderId);
    setReorderNotice(result);
    setCartSubTab(result.addedCount > 0 ? 'cart' : 'orders');
    setActiveTab('cart');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const selectedProductCartSub =
    state.cart.find((c) => c.productId === selectedProduct?.id)?.substitution ??
    SubstitutionPreference.CALL_FIRST;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#F7F8F7] text-zinc-900">
      <NavigationShell
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        cartCount={cartCount}
        cartSubtotalMad={cartSummary.subtotalMad}
        scrollDirection={scrollDirection}
        isScrolled={isScrolled}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-7 pb-24 md:pb-12">
        <div key={activeTab} className="animate-view-enter">
          {activeTab === 'home' && (
            <HomeView
              products={state.products}
              bundles={state.bundles}
              cart={state.cart}
              orders={state.orders}
              favorites={state.favorites}
              activeUserName={activeAccount?.name ?? null}
              loyaltyPoints={state.loyaltyPoints}
              loyaltyStamps={state.loyaltyStamps}
              completedRewardsCount={state.completedRewardsCount}
              onNavigateToCatalog={navigateToCatalog}
              onNavigateToCart={(subTab = 'cart') => handleSelectTab('cart', subTab)}
              onNavigateToAccount={() => handleSelectTab('account')}
              onOpenProductDetail={setSelectedProduct}
              onAddToCart={(id) => addToCart(id, 1)}
              onUpdateCartQuantity={updateCartQuantity}
              onAddBundleToCart={addBundleToCart}
              onToggleFavorite={toggleFavorite}
              onQuickReorder={handleQuickReorder}
              onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
              onOpenAuthModal={() => setAuthModalState({ open: true, mode: 'signin' })}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              products={state.products}
              cart={state.cart}
              favorites={state.favorites}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              inStockOnly={inStockOnly}
              offersOnly={offersOnly}
              maxPriceMad={maxPriceMad}
              sortBy={sortBy}
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              onInStockChange={setInStockOnly}
              onOffersOnlyChange={setOffersOnly}
              onMaxPriceChange={setMaxPriceMad}
              onSortChange={setSortBy}
              onResetFilters={resetCatalogFilters}
              onOpenProductDetail={setSelectedProduct}
              onAddToCart={(id) => addToCart(id, 1)}
              onUpdateCartQuantity={updateCartQuantity}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {activeTab === 'cart' && (
            <CartOrdersView
              products={state.products}
              cart={state.cart}
              orders={state.orders}
              loyaltyPoints={state.loyaltyPoints}
              savedAddresses={activeSavedAddresses}
              defaultCustomerName={state.defaultCustomerName}
              defaultPhone={state.defaultPhone}
              defaultNeighborhood={state.defaultNeighborhood}
              defaultAddress={state.defaultAddress}
              initialSubTab={cartSubTab}
              reorderNotice={reorderNotice}
              onDismissReorderNotice={() => setReorderNotice(null)}
              onUpdateQuantity={updateCartQuantity}
              onUpdateSubstitution={updateCartSubstitution}
              onClearCart={clearCart}
              onRemoveOutOfStock={removeOutOfStockFromCart}
              onPlaceOrder={placeOrder}
              onReorder={reorderFromOrder}
              onBrowseCatalog={() => navigateToCatalog('all', false)}
            />
          )}

          {activeTab === 'account' && (
            <AccountSupportView
              products={state.products}
              favorites={state.favorites}
              recurringList={state.recurringList}
              loyaltyPoints={state.loyaltyPoints}
              loyaltyStamps={state.loyaltyStamps}
              completedRewardsCount={state.completedRewardsCount}
              orders={state.orders}
              tickets={state.tickets}
              authStatus={state.authStatus}
              activeAccount={activeAccount}
              savedAddresses={activeSavedAddresses}
              defaultCustomerName={state.defaultCustomerName}
              defaultPhone={state.defaultPhone}
              defaultNeighborhood={state.defaultNeighborhood}
              defaultAddress={state.defaultAddress}
              onOpenAuthModal={(mode = 'signin') =>
                setAuthModalState({ open: true, mode })
              }
              onContinueAsGuest={continueAsGuest}
              onUpdateProfile={updateActiveProfile}
              onSaveAddress={saveAddress}
              onDeleteAddress={deleteSavedAddress}
              onResetProgress={resetStoreState}
              onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
              onToggleFavorite={toggleFavorite}
              onAddToCart={(id) => addToCart(id, 1)}
              onAddToRecurringList={addToRecurringList}
              onUpdateRecurringQuantity={updateRecurringQuantity}
              onAddRecurringListToCart={addRecurringListToCart}
              onSubmitTicket={submitSupportTicket}
            />
          )}
        </div>
      </main>

      {/* Footer with Al-Qulai'ah Location, Spectrum Studio Attribution and Download Action */}
      <footer className="border-t border-zinc-200/80 bg-white mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-zinc-900">{STORE_INFO.nameAr}</span>
            <span aria-hidden="true">·</span>
            <span>{STORE_INFO.addressAr}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-900 font-semibold">
              {STORE_INFO.creatorAttributionAr}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden lg:inline text-zinc-500">{STORE_INFO.openHours}</span>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="text-emerald-900 font-semibold hover:underline cursor-pointer"
            >
              تنزيل التطبيق
            </button>
          </div>
        </div>
      </footer>

      <ProductDetailModal
        product={selectedProduct}
        initialSubstitution={selectedProductCartSub}
        isFavorite={selectedProduct ? state.favorites.includes(selectedProduct.id) : false}
        isInRecurringList={
          selectedProduct
            ? state.recurringList.some((r) => r.productId === selectedProduct.id)
            : false
        }
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onToggleFavorite={toggleFavorite}
        onAddToRecurringList={(id) => addToRecurringList(id, 1)}
      />

      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalState.open}
        initialMode={authModalState.mode}
        accounts={state.accounts}
        onClose={() => setAuthModalState((prev) => ({ ...prev, open: false }))}
        onSignInIdentifier={signInWithIdentifier}
        onSwitchAccount={switchAccountById}
        onSignUp={signUpAccount}
        onContinueAsGuest={continueAsGuest}
      />

      <ScrollToTopButton visible={showScrollTop} direction={scrollDirection} />
    </div>
  );
}

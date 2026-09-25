import { useEffect, useMemo, useState } from 'react';
import { api, API_BASE_URL, getToken, setToken } from './api.js';

const demoCategories = [
  { id: 'electronics', name: 'Electronics', slug: 'electronics' },
  { id: 'office', name: 'Office', slug: 'office' },
];

const demoProducts = [
  { id: 'demo-keyboard', name: 'Wireless Keyboard', slug: 'wireless-keyboard', description: 'Compact rechargeable keyboard with quiet low-profile keys.', price: 49.99, stock: 35, categoryId: 'electronics', category: demoCategories[0] },
  { id: 'demo-hub', name: 'USB-C Hub', slug: 'usb-c-hub', description: 'Seven-port productivity hub for a cleaner, faster workspace.', price: 39.99, stock: 50, categoryId: 'electronics', category: demoCategories[0] },
  { id: 'demo-organizer', name: 'Desk Organizer', slug: 'desk-organizer', description: 'Minimal modular organizer for everyday desk essentials.', price: 24.5, stock: 80, categoryId: 'office', category: demoCategories[1] },
];

const money = value => `$${Number(value || 0).toFixed(2)}`;
const initials = name => String(name || 'SP').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
const productTone = product => {
  const text = `${product.name} ${product.category?.name || ''}`.toLowerCase();
  if (text.includes('keyboard')) return 'keyboard';
  if (text.includes('hub') || text.includes('electronic')) return 'hub';
  if (text.includes('organizer') || text.includes('office')) return 'organizer';
  return ['mint', 'sand', 'blue'][String(product.id).length % 3];
};

function Brand() {
  return <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="StockPilot home"><span className="brand-mark">S</span><span>stock<b>pilot</b><small>COMMERCE</small></span></button>;
}

function ProductVisual({ product, large = false }) {
  return <div className={`product-visual ${productTone(product)} ${large ? 'large' : ''}`}>
    <div className="product-object"><span></span><i></i><b></b></div>
    <small>{product.category?.name || 'StockPilot collection'}</small>
  </div>;
}

function Modal({ children, onClose, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div className={`modal ${wide ? 'modal-wide' : ''}`}>{children}</div>
  </div>;
}

function AuthModal({ onClose, onAuthenticated, notify }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const payload = { email: form.get('email'), password: form.get('password'), ...(mode === 'register' ? { name: form.get('name') } : {}) };
      const data = mode === 'login' ? await api.login(payload) : await api.register(payload);
      setToken(data.token); onAuthenticated(data.user); notify(`Welcome${data.user?.name ? `, ${data.user.name.split(' ')[0]}` : ''}.`); onClose();
    } catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  };
  return <Modal onClose={onClose}>
    <div className="modal-head"><div><span className="kicker">YOUR STOCKPILOT ACCOUNT</span><h2>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2><p>{mode === 'login' ? 'Sign in to manage your cart and orders.' : 'Register to start shopping securely.'}</p></div><button className="close" onClick={onClose}>×</button></div>
    <div className="auth-switch"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Register</button></div>
    {error && <div className="form-error">{error}</div>}
    <form className="form" onSubmit={submit}>
      {mode === 'register' && <label>Full name<input name="name" required minLength="2" placeholder="Your name" /></label>}
      <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
      <label>Password<input name="password" type="password" required minLength={mode === 'register' ? 8 : 1} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
      <button className="primary full" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create account'}</button>
    </form>
    <div className="demo-logins"><strong>Demo accounts</strong><span>Customer: customer@stockpilot.dev</span><span>Admin: admin@stockpilot.dev</span><span>Password: DemoPass123!</span></div>
  </Modal>;
}

function CartDrawer({ cart, loading, onClose, onRemove, onQuantity, onCheckout, user }) {
  const items = cart?.items || [];
  return <><div className="drawer-shade" onClick={onClose}></div><aside className="cart-drawer">
    <div className="drawer-head"><div><span className="kicker">YOUR BAG</span><h2>Shopping cart</h2></div><button className="close" onClick={onClose}>×</button></div>
    {!user ? <div className="drawer-empty"><span>◎</span><h3>Sign in to use your cart</h3><p>Your live StockPilot cart is secured to your account.</p></div> : loading ? <div className="loading-block">Loading your cart…</div> : !items.length ? <div className="drawer-empty"><span>◌</span><h3>Your cart is empty</h3><p>Explore the collection and add something useful.</p><button className="secondary" onClick={onClose}>Continue shopping</button></div> : <>
      <div className="cart-items">{items.map(item => <div className="cart-item" key={item.id}><ProductVisual product={item.product} /><div className="cart-copy"><strong>{item.product.name}</strong><span>{money(item.product.price)}</span><div className="quantity"><button onClick={() => onQuantity(item, Math.max(1, item.quantity - 1))}>−</button><b>{item.quantity}</b><button onClick={() => onQuantity(item, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>+</button></div></div><button className="remove" onClick={() => onRemove(item.id)}>Remove</button></div>)}</div>
      <div className="cart-summary"><div><span>Subtotal</span><strong>{money(cart.total)}</strong></div><p>Inventory is checked again during checkout.</p><button className="primary full" onClick={onCheckout}>Complete secure checkout</button></div>
    </>}
  </aside></>;
}

function OrdersView({ orders, loading, user, onShop, onStatus }) {
  return <main className="page page-view"><div className="page-heading"><div><span className="kicker">ACCOUNT / ORDERS</span><h1>{user?.role === 'ADMIN' ? 'All customer orders' : 'Your order history'}</h1><p>Track purchases, products and fulfillment status.</p></div><button className="secondary" onClick={onShop}>← Back to shop</button></div>
    {!user ? <div className="empty-page"><h2>Sign in to see your orders</h2></div> : loading ? <div className="loading-block">Loading orders…</div> : !orders.length ? <div className="empty-page"><span>◇</span><h2>No orders yet</h2><p>Your completed checkouts will appear here.</p><button className="primary" onClick={onShop}>Browse products</button></div> : <div className="order-list">{orders.map(order => <article className="order-card" key={order.id}><div className="order-top"><div><span>ORDER</span><strong>#{order.id.slice(-8).toUpperCase()}</strong></div><div><span>PLACED</span><strong>{new Date(order.createdAt).toLocaleDateString()}</strong></div><div><span>TOTAL</span><strong>{money(order.total)}</strong></div><div>{user.role === 'ADMIN' ? <select value={order.status} onChange={event => onStatus(order.id, event.target.value)}>{['PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(status => <option key={status}>{status}</option>)}</select> : <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>}</div></div><div className="order-products">{order.items.map(item => <div key={item.id}><ProductVisual product={item.product} /><span><strong>{item.product.name}</strong><small>{item.quantity} × {money(item.unitPrice)}</small></span></div>)}</div>{user.role === 'ADMIN' && order.user && <footer>Customer: <strong>{order.user.name}</strong> · {order.user.email}</footer>}</article>)}</div>}
  </main>;
}

function ProductForm({ product, categories, onClose, onSaved, notify }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault(); setLoading(true); setError(''); const form = new FormData(event.currentTarget);
    const body = { name: form.get('name'), description: form.get('description'), price: Number(form.get('price')), stock: Number(form.get('stock')), categoryId: form.get('categoryId'), active: true };
    try { product ? await api.updateProduct(product.id, body) : await api.createProduct(body); notify(product ? 'Product updated.' : 'Product created.'); await onSaved(); onClose(); }
    catch (reason) { setError(reason.message); } finally { setLoading(false); }
  };
  const remove = async () => { if (!confirm(`Delete ${product.name}?`)) return; setLoading(true); try { await api.deleteProduct(product.id); notify('Product deleted.'); await onSaved(); onClose(); } catch (reason) { setError(reason.message); } finally { setLoading(false); } };
  return <Modal onClose={onClose} wide><div className="modal-head"><div><span className="kicker">ADMIN / CATALOG</span><h2>{product ? 'Edit product' : 'Add a product'}</h2><p>Changes are written directly to the StockPilot API.</p></div><button className="close" onClick={onClose}>×</button></div>{error && <div className="form-error">{error}</div>}<form className="form" onSubmit={submit}><div className="form-grid"><label>Product name<input name="name" defaultValue={product?.name || ''} required minLength="2" /></label><label>Category<select name="categoryId" defaultValue={product?.categoryId || categories[0]?.id || ''} required>{categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label></div><label>Description<textarea name="description" defaultValue={product?.description || ''} maxLength="1000" rows="4"></textarea></label><div className="form-grid"><label>Price ($)<input name="price" type="number" step="0.01" min="0.01" defaultValue={product?.price || ''} required /></label><label>Stock quantity<input name="stock" type="number" step="1" min="0" defaultValue={product?.stock ?? ''} required /></label></div><div className="form-actions">{product && <button type="button" className="danger" onClick={remove}>Delete product</button>}<span></span><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={loading}>{loading ? 'Saving…' : 'Save product'}</button></div></form></Modal>;
}

function AdminView({ products, categories, loading, onShop, onRefresh, notify }) {
  const [editing, setEditing] = useState(null); const low = products.filter(product => product.stock < 10);
  return <main className="page page-view"><div className="page-heading"><div><span className="kicker">STOCKPILOT / ADMIN</span><h1>Catalog control center</h1><p>Manage products, pricing and live inventory.</p></div><div className="heading-actions"><button className="secondary" onClick={onShop}>← Storefront</button><button className="primary" onClick={() => setEditing('new')}>＋ Add product</button></div></div>
    <div className="admin-stats"><div><span>Active products</span><strong>{products.length}</strong><small>Public catalog</small></div><div><span>Total units</span><strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong><small>Across inventory</small></div><div><span>Low stock</span><strong>{low.length}</strong><small>Below 10 units</small></div><div><span>Categories</span><strong>{categories.length}</strong><small>Catalog groups</small></div></div>
    <section className="admin-table"><div className="admin-table-head"><div><h2>Products</h2><p>Live catalog data from the API</p></div><button className="text-button" onClick={onRefresh}>Refresh ↻</button></div>{loading ? <div className="loading-block">Loading catalog…</div> : <div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th></th></tr></thead><tbody>{products.map(product => <tr key={product.id}><td><div className="table-product"><ProductVisual product={product} /><strong>{product.name}</strong></div></td><td>{product.category?.name || 'General'}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><span className={`stock ${product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : ''}`}>{product.stock === 0 ? 'Out of stock' : product.stock < 10 ? 'Low stock' : 'In stock'}</span></td><td><button className="edit" onClick={() => setEditing(product)}>Edit</button></td></tr>)}</tbody></table></div>}</section>
    {editing && <ProductForm product={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={onRefresh} notify={notify} />}
  </main>;
}

export default function App() {
  const [view, setView] = useState('shop');
  const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true); const [apiLive, setApiLive] = useState(true);
  const [user, setUser] = useState(null); const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); const [cart, setCart] = useState({ items: [], total: 0 }); const [cartLoading, setCartLoading] = useState(false);
  const [orders, setOrders] = useState([]); const [ordersLoading, setOrdersLoading] = useState(false);
  const [toast, setToast] = useState('');

  const notify = message => { setToast(message); window.clearTimeout(window.__stockpilotToast); window.__stockpilotToast = window.setTimeout(() => setToast(''), 3200); };
  const loadCatalog = async () => {
    setLoading(true);
    try { const [productData, categoryData] = await Promise.all([api.products({ search: query, category }), api.categories()]); setProducts(productData.items || []); setCategories(categoryData || []); setApiLive(true); }
    catch { setProducts(demoProducts.filter(product => (!query || product.name.toLowerCase().includes(query.toLowerCase())) && (!category || product.category.slug === category))); setCategories(demoCategories); setApiLive(false); }
    finally { setLoading(false); }
  };
  const loadCart = async () => { if (!getToken()) return; setCartLoading(true); try { setCart(await api.cart()); } catch (reason) { if (/401|token|auth/i.test(reason.message)) logout(false); else notify(reason.message); } finally { setCartLoading(false); } };
  const loadOrders = async () => { if (!user) return; setOrdersLoading(true); try { setOrders(await api.orders()); } catch (reason) { notify(reason.message); } finally { setOrdersLoading(false); } };
  const restoreUser = async () => { if (!getToken()) return; try { setUser(await api.me()); } catch { logout(false); } };
  const logout = (show = true) => { setToken(''); setUser(null); setCart({ items: [], total: 0 }); setOrders([]); setView('shop'); if (show) notify('Signed out.'); };

  useEffect(() => { restoreUser(); }, []);
  useEffect(() => { const timer = setTimeout(loadCatalog, 250); return () => clearTimeout(timer); }, [query, category]);
  useEffect(() => { if (user) { loadCart(); loadOrders(); } }, [user]);

  const addToCart = async product => {
    if (!user) { setAuthOpen(true); notify('Sign in before adding items.'); return; }
    try { await api.addCart({ productId: product.id, quantity: 1 }); await loadCart(); setCartOpen(true); notify(`${product.name} added to cart.`); }
    catch (reason) { notify(reason.message); }
  };
  const changeQuantity = async (item, quantity) => { try { await api.addCart({ productId: item.productId, quantity }); await loadCart(); } catch (reason) { notify(reason.message); } };
  const removeCart = async id => { try { await api.removeCart(id); await loadCart(); notify('Item removed.'); } catch (reason) { notify(reason.message); } };
  const checkout = async () => { try { const order = await api.checkout(); await Promise.all([loadCart(), loadOrders(), loadCatalog()]); setCartOpen(false); setView('orders'); notify(`Order #${order.id.slice(-8).toUpperCase()} placed successfully.`); } catch (reason) { notify(reason.message); } };
  const updateStatus = async (id, status) => { try { await api.updateOrderStatus(id, status); await loadOrders(); notify('Order status updated.'); } catch (reason) { notify(reason.message); } };
  const cartCount = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  if (view === 'orders') return <div className="app"><SiteHeader user={user} cartCount={cartCount} onAuth={() => setAuthOpen(true)} onCart={() => setCartOpen(true)} onView={setView} onLogout={logout} /><OrdersView orders={orders} loading={ordersLoading} user={user} onShop={() => setView('shop')} onStatus={updateStatus} />{authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={setUser} notify={notify} />}{cartOpen && <CartDrawer cart={cart} loading={cartLoading} user={user} onClose={() => setCartOpen(false)} onRemove={removeCart} onQuantity={changeQuantity} onCheckout={checkout} />}{toast && <div className="toast">✓ {toast}</div>}</div>;
  if (view === 'admin' && user?.role === 'ADMIN') return <div className="app"><SiteHeader user={user} cartCount={cartCount} onAuth={() => setAuthOpen(true)} onCart={() => setCartOpen(true)} onView={setView} onLogout={logout} /><AdminView products={products} categories={categories} loading={loading} onShop={() => setView('shop')} onRefresh={loadCatalog} notify={notify} />{toast && <div className="toast">✓ {toast}</div>}</div>;

  return <div className="app">
    <SiteHeader user={user} cartCount={cartCount} onAuth={() => setAuthOpen(true)} onCart={() => { setCartOpen(true); loadCart(); }} onView={setView} onLogout={logout} />
    <main>
      {!apiLive && <div className="demo-banner"><strong>Preview mode:</strong> the live API could not be reached. The storefront is showing safe demo products. <a href={`${API_BASE_URL}/api/health`} target="_blank" rel="noreferrer">Check API ↗</a></div>}
      <section className="hero page"><div className="hero-copy"><span className="kicker">SMARTER COMMERCE OPERATIONS</span><h1>Useful products.<br /><em>Inventory you can trust.</em></h1><p>StockPilot connects a polished shopping experience with live stock, secure accounts and transaction-safe checkout.</p><div className="hero-actions"><a className="primary" href="#collection">Shop the collection ↘</a><button className="secondary" onClick={() => user ? setView('orders') : setAuthOpen(true)}>{user ? 'View my orders' : 'Sign in to shop'}</button></div><div className="hero-points"><span><b>✓</b> Live inventory</span><span><b>✓</b> Secure checkout</span><span><b>✓</b> Order tracking</span></div></div><div className="hero-art"><div className="hero-card card-one"><span>LOW PROFILE</span><strong>Wireless Keyboard</strong><div className="keyboard-art"><i></i></div><small>$49.99</small></div><div className="hero-card card-two"><span>7-PORT</span><strong>USB-C Hub</strong><div className="hub-art"><i></i><i></i><i></i></div><small>$39.99</small></div><div className="inventory-chip"><i></i><div><strong>Inventory connected</strong><small>Stock updates at checkout</small></div></div></div></section>
      <section className="trust-strip"><span>TRANSACTION-SAFE CHECKOUT</span><span>JWT AUTHENTICATION</span><span>REAL-TIME STOCK</span><span>ROLE-BASED ADMIN</span></section>
      <section className="collection page" id="collection"><div className="section-heading"><div><span className="kicker">CURATED ESSENTIALS</span><h2>Shop the collection</h2><p>Clean, useful products selected for modern work and everyday life.</p></div><div className="catalog-tools"><label className="search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" /></label><select value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(item => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></div></div>
        {loading ? <div className="product-grid">{[1,2,3].map(item => <div className="product-card skeleton" key={item}></div>)}</div> : !products.length ? <div className="empty-page"><h3>No products found</h3><p>Try a different search or category.</p></div> : <div className="product-grid">{products.map(product => <article className="product-card" key={product.id}><ProductVisual product={product} large /><div className="product-info"><div><span>{product.category?.name || 'Collection'}</span><small className={product.stock < 10 ? 'low-stock' : ''}>{product.stock === 0 ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left` : 'In stock'}</small></div><h3>{product.name}</h3><p>{product.description || 'A practical product from the StockPilot collection.'}</p><footer><strong>{money(product.price)}</strong><button onClick={() => addToCart(product)} disabled={!apiLive || product.stock === 0}>{product.stock === 0 ? 'Unavailable' : 'Add to cart'} <span>＋</span></button></footer></div></article>)}</div>}
      </section>
      <section className="feature-band page"><div><span className="kicker">WHY STOCKPILOT</span><h2>A storefront powered by careful backend engineering.</h2></div><div className="feature-grid"><article><span>01</span><h3>Live inventory</h3><p>Customers see current availability while checkout prevents negative stock.</p></article><article><span>02</span><h3>Secure accounts</h3><p>JWT authentication protects carts, customer orders and admin actions.</p></article><article><span>03</span><h3>Atomic checkout</h3><p>Every order succeeds completely or rolls back safely when stock changes.</p></article></div></section>
      <section className="cta page"><div><span className="kicker">READY WHEN YOU ARE</span><h2>Build your cart.<br />Let StockPilot handle the rest.</h2></div><button className="light-button" onClick={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}>Explore products ↗</button></section>
    </main>
    <footer className="site-footer page"><Brand /><p>Full-stack commerce experience by Munazza Shan.</p><div><a href={`${API_BASE_URL}/api/docs/`} target="_blank" rel="noreferrer">API Docs</a><a href="https://github.com/munazza-shan-web/StockPilot-Commerce-API" target="_blank" rel="noreferrer">GitHub</a></div></footer>
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={setUser} notify={notify} />}
    {cartOpen && <CartDrawer cart={cart} loading={cartLoading} user={user} onClose={() => setCartOpen(false)} onRemove={removeCart} onQuantity={changeQuantity} onCheckout={checkout} />}
    {toast && <div className="toast">✓ {toast}</div>}
  </div>;
}

function SiteHeader({ user, cartCount, onAuth, onCart, onView, onLogout }) {
  const [menu, setMenu] = useState(false);
  return <header className="site-header"><div className="header-inner"><Brand /><button className="menu-button" onClick={() => setMenu(!menu)}>{menu ? '×' : '☰'}</button><nav className={menu ? 'open' : ''}><button onClick={() => { onView('shop'); setMenu(false); }}>Shop</button><a href="#collection" onClick={() => setMenu(false)}>Collection</a>{user && <button onClick={() => { onView('orders'); setMenu(false); }}>Orders</button>}{user?.role === 'ADMIN' && <button onClick={() => { onView('admin'); setMenu(false); }}>Admin</button>}<a href={`${API_BASE_URL}/api/docs/`} target="_blank" rel="noreferrer">API</a></nav><div className="header-actions">{user ? <div className="account-menu"><button className="avatar-button"><span>{initials(user.name)}</span><small>{user.name.split(' ')[0]}</small></button><div><strong>{user.name}</strong><small>{user.email}</small><button onClick={() => onView('orders')}>My orders</button>{user.role === 'ADMIN' && <button onClick={() => onView('admin')}>Admin dashboard</button>}<button onClick={onLogout}>Sign out</button></div></div> : <button className="sign-in" onClick={onAuth}>Sign in</button>}<button className="cart-button" onClick={onCart}>Bag <span>{cartCount}</span></button></div></div></header>;
}

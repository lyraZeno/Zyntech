/* ============================================================
   ZYNTECH - Shared Site Script
   Handles: session/auth, navbar state, cart, orders, modals
   Requires products.js to be loaded first on pages that need it.
   ============================================================ */

let cart = JSON.parse(localStorage.getItem('userCart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    refreshAuthUI();
    if (typeof productsData !== 'undefined') renderCart();
});

/* ---------------------------------------------------------
   AUTH / SESSION / NAVBAR STATE
--------------------------------------------------------- */

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true' && !!getCurrentUser();
}

// Toggles the navbar between "Guest" (Login button) and "Logged in" (user pill) states.
// Runs on every page that includes script.js.
function refreshAuthUI() {
    const currentUser = getCurrentUser();
    const guestBtn = document.getElementById('guestLoginBtn');
    const userMenu = document.getElementById('userMenu');

    if (isLoggedIn()) {
        if (guestBtn) guestBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';

        const navName = document.getElementById('navUserName');
        const userDisplayName = document.getElementById('userDisplayName');
        const userDisplayEmail = document.getElementById('userDisplayEmail');
        if (navName) navName.innerText = currentUser.name.split(' ')[0];
        if (userDisplayName) userDisplayName.innerText = currentUser.name;
        if (userDisplayEmail) userDisplayEmail.innerText = currentUser.email;
    } else {
        if (guestBtn) guestBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Call at the top of pages that require a logged-in user (profile, order history, etc.)
// Redirects to login.html (preserving where the user was headed) if not logged in.
function requireAuth() {
    if (!isLoggedIn()) {
        const here = window.location.pathname.split('/').pop() || 'index.html';
        window.location.href = `login.html?redirect=${encodeURIComponent(here)}`;
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.alert("You have been logged out successfully.");
    window.location.href = "index.html";
}

/* ---------------------------------------------------------
   LOGIN / REGISTER (used on login.html)
--------------------------------------------------------- */

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegBtn = document.getElementById('tabRegBtn');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        tabLoginBtn.classList.add('active');
        tabRegBtn.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        tabRegBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
    }
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const error = document.getElementById('regError');

    // Client-side validation
    const namePattern = /^[A-Za-z\s'-]{2,50}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9+\s-]{7,15}$/;

    if (!namePattern.test(name)) {
        error.innerText = "Please enter a valid full name (letters only, min 2 characters).";
        return false;
    }
    if (!emailPattern.test(email)) {
        error.innerText = "Please enter a valid email address.";
        return false;
    }
    if (!phonePattern.test(phone)) {
        error.innerText = "Please enter a valid phone number.";
        return false;
    }
    if (password.length < 6) {
        error.innerText = "Password must be at least 6 characters!";
        return false;
    }
    if (address.length < 5) {
        error.innerText = "Please enter a valid delivery address.";
        return false;
    }
    if (localStorage.getItem(email)) {
        error.innerText = "An account with this email already exists. Please login instead.";
        return false;
    }

    const userData = { name, email, password, phone, address, role: 'customer' };
    localStorage.setItem(email, JSON.stringify(userData));

    error.innerText = "";
    alert("Registration Successful! Please login.");
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;
    return false;
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const error = document.getElementById('loginError');

    if (!email || !password) {
        error.innerText = "Please fill in both fields.";
        return false;
    }

    const storedUser = localStorage.getItem(email);

    if (!storedUser) {
        error.innerText = "Account not found! Please register first.";
        return false;
    }

    const userData = JSON.parse(storedUser);

    if (userData.password === password) {
        error.innerText = "";
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(userData));

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        window.location.href = redirect ? redirect : "index.html";
        return false;
    } else {
        error.innerText = "Incorrect password! Try again.";
        return false;
    }
}

/* ---------------------------------------------------------
   PRODUCT CATALOG (index.html)
--------------------------------------------------------- */

function renderProducts(items, targetId = 'mainProductGrid', ribbonLabel = '') {
    const grid = document.getElementById(targetId);
    if (!grid) return;
    const badge = document.getElementById(targetId === 'categoryProductGrid' ? 'categoryLandingCount' : 'productCountBadge');
    if (badge) badge.innerText = `${items.length} Item${items.length === 1 ? '' : 's'}` + (targetId === 'mainProductGrid' ? ' Available' : '');

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#64748b; padding:40px 0;">No component found matching query.</p>';
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="product-card${ribbonLabel ? ' featured-card' : ''}">
            ${ribbonLabel ? `<span class="featured-ribbon ${ribbonLabel === 'Best Seller' ? 'ribbon-bestseller' : 'ribbon-new'}">${ribbonLabel}</span>` : ''}
            <a href="product-detail.html?id=${item.id}" class="product-img-link">
                <div class="product-img">
                    <img src="${item.image}" alt="${item.title}">
                </div>
            </a>
            <div class="product-details">
                <span class="category-tag">${item.category.toUpperCase()}</span>
                <a href="product-detail.html?id=${item.id}" class="product-title-link"><h4>${item.title}</h4></a>
                <div class="price-row">
                    <span class="price">LKR ${item.price.toLocaleString()}</span>
                    <button class="add-cart-btn" onclick="addToCart(${item.id})"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFeaturedSections() {
    const newArrivals = [18, 19, 16, 14].map(id => getProductById(id)).filter(Boolean);
    const bestSellers = [1, 2, 6, 8].map(id => getProductById(id)).filter(Boolean);
    renderProducts(newArrivals, 'newArrivalsGrid', 'New Arrival');
    renderProducts(bestSellers, 'bestSellersGrid', 'Best Seller');
}

function filterByCategory(cat) {
    const title = document.getElementById('productGridTitle');
    if (!title) return;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.category-filter').forEach(button => button.classList.toggle('active', button.dataset.category === cat));
    document.querySelectorAll('.category-switch').forEach(button => button.classList.toggle('active', button.dataset.category === cat));
    document.querySelectorAll('.nav-dropdown.category-open').forEach(menu => menu.classList.remove('category-open'));
    const labels = { all: 'All Items', cpu: 'Processors', gpu: 'Graphics Cards', motherboard: 'Motherboards', ram: 'Memory', psu: 'Power Supplies', case: 'PC Cases', storage: 'Storage' };
    const descriptions = { all: 'Browse all components for your next compatible PC build.', cpu: 'Shop processors for gaming, creation, and everyday performance.', gpu: 'Find graphics cards for smooth gaming and demanding visual workloads.', motherboard: 'Choose the foundation of your build with the right socket and memory standard.', ram: 'Upgrade your system with reliable memory kits in supported standards.', psu: 'Power your build safely with dependable wattage and efficiency.', case: 'Find a case with the airflow, form factor, and clearance your parts need.', storage: 'Add fast, reliable storage for your operating system, games, and files.' };
    const filteredItems = cat === 'all' ? productsData : productsData.filter(p => p.category === cat);
    title.innerText = labels[cat] || 'Hardware Catalog';
    const section = document.getElementById('products');
    const landing = document.getElementById('categoryLanding');
    if (section) section.classList.add('category-active');
    document.body.classList.add('category-view');
    if (landing) {
        landing.hidden = false;
        document.getElementById('categoryLandingTitle').innerText = labels[cat] || 'Hardware Catalog';
        document.getElementById('categoryLandingDescription').innerText = descriptions[cat] || descriptions.all;
        document.getElementById('categoryResultSummary').innerText = `${labels[cat] || 'Hardware'} available now`;
    }
    renderProducts(filteredItems, 'categoryProductGrid');
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleCategoryMenu(event) {
    if (event) event.preventDefault();
    const dropdown = event?.currentTarget?.closest('.nav-dropdown') || document.querySelector('.nav-dropdown');
    if (dropdown) dropdown.classList.toggle('category-open');
}

function closeCategoryMenus(event) {
    if (!event.target.closest('.nav-dropdown')) document.querySelectorAll('.nav-dropdown.category-open').forEach(menu => menu.classList.remove('category-open'));
}

document.addEventListener('click', closeCategoryMenus);

function filterBySearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.category-filter').forEach(button => button.classList.toggle('active', button.dataset.category === 'all' && !query));
    document.querySelectorAll('.category-switch').forEach(button => button.classList.toggle('active', button.dataset.category === 'all' && !query));
    const title = document.getElementById('productGridTitle');
    if (title) title.innerText = query ? `Search results for “${query}”` : 'Hardware Catalog';
    const section = document.getElementById('products');
    const landing = document.getElementById('categoryLanding');
    if (query) {
        if (section) section.classList.add('category-active');
        document.body.classList.add('category-view');
        if (landing) {
            landing.hidden = false;
            document.getElementById('categoryLandingTitle').innerText = 'Search Results';
            document.getElementById('categoryLandingDescription').innerText = `Showing products matching “${query}”.`;
            document.getElementById('categoryResultSummary').innerText = 'Search results';
        }
        renderProducts(productsData.filter(item => item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)), 'categoryProductGrid');
    } else {
        renderProducts([]);
    }
}

/* ---------------------------------------------------------
   CART (drawer used on multiple pages + cart.html)
--------------------------------------------------------- */

function addToCart(productId, qty) {
    qty = qty || 1;
    const item = getProductById(productId);
    if (!item) return;
    const existingIndex = cart.findIndex(c => c.id === productId);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ ...item, qty: qty });
    }
    saveAndRenderCart();
    if (document.getElementById('cartDrawer')) toggleCart(true);
}

function updateQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveAndRenderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveAndRenderCart();
}

function saveAndRenderCart() {
    localStorage.setItem('userCart', JSON.stringify(cart));
    renderCart();
}

function evaluateCompatibility(targetBoxId = 'compatibilityStatusBox', targetButtonId = 'btnCheckout') {
    const statusBox = document.getElementById(targetBoxId);
    const btnCheckout = document.getElementById(targetButtonId);
    if (!statusBox) return { compatible: true, issues: [], warnings: [], checks: [] };

    if (cart.length === 0) {
        statusBox.style.display = 'none';
        if (btnCheckout) { btnCheckout.disabled = false; btnCheckout.style.opacity = '1'; }
        return { compatible: true, issues: [], warnings: [], checks: [] };
    }

    const cpus = cart.filter(i => i.category === 'cpu');
    const motherboards = cart.filter(i => i.category === 'motherboard');
    const rams = cart.filter(i => i.category === 'ram');
    const gpus = cart.filter(i => i.category === 'gpu');
    const psus = cart.filter(i => i.category === 'psu');
    const cases = cart.filter(i => i.category === 'case');
    const issues = [];
    const warnings = [];
    const checks = [];

    const addIssue = (title, detail, fix, icon, recommendation = null) => issues.push({ title, detail, fix, icon, recommendation });
    const addCheck = (label, state, detail, icon) => checks.push({ label, state, detail, icon });

    if (cpus.length > 1) addIssue('Multiple CPUs selected', 'A build can only use one processor.', 'Remove the extra CPU.', 'fa-microchip');
    if (motherboards.length > 1) addIssue('Multiple motherboards selected', 'A build can only use one motherboard.', 'Keep the matching board.', 'fa-server');

    if (cpus.length && motherboards.length) {
        const cpu = cpus[0];
        const board = motherboards[0];
        const passed = cpu.socket === board.socket;
        addCheck('CPU / motherboard', passed ? 'passed' : 'failed', passed ? `${cpu.socket} matches` : `${cpu.socket} / ${board.socket}`, 'fa-microchip');
        if (!passed) {
            const recommendedBoard = productsData.find(product => product.category === 'motherboard' && product.socket === cpu.socket);
            addIssue('CPU socket mismatch', `${cpu.socket} CPU vs ${board.socket} motherboard.`, `Use a ${cpu.socket} board or a ${board.socket} CPU.`, 'fa-microchip', recommendedBoard);
        }
    } else {
        addCheck('CPU / motherboard', 'waiting', 'Add one of each to compare sockets.', 'fa-microchip');
    }

    if (rams.length && motherboards.length && motherboards[0].ramType) {
        const board = motherboards[0];
        const unsupportedRam = rams.find(ram => ram.ramType && ram.ramType !== board.ramType);
        const passed = !unsupportedRam;
        addCheck('Memory standard', passed ? 'passed' : 'failed', passed ? `${board.ramType} matches` : `${board.ramType} board / ${unsupportedRam.ramType} RAM`, 'fa-memory');
        if (!passed) {
            const recommendedRam = productsData.find(product => product.category === 'ram' && product.ramType === board.ramType);
            addIssue('RAM standard mismatch', `${board.ramType} board vs ${unsupportedRam.ramType} RAM.`, `Replace RAM with ${board.ramType}.`, 'fa-memory', recommendedRam);
        }
    } else {
        addCheck('Memory standard', 'waiting', 'Add a board and RAM kit.', 'fa-memory');
    }

    const componentDraw = cart.reduce((sum, item) => sum + ((Number(item.powerDraw) || Number(item.reqPower) || 0) * item.qty), 0);
    const minimumPsu = Math.ceil(componentDraw * 1.2);
    if (psus.length && componentDraw > 0) {
        const selectedPsu = psus[0];
        const passed = Number(selectedPsu.wattage) >= minimumPsu;
        addCheck('Power capacity', passed ? 'passed' : 'failed', passed ? `${selectedPsu.wattage}W / ${minimumPsu}W recommended` : `${selectedPsu.wattage}W / ${minimumPsu}W required`, 'fa-bolt');
        if (!passed) {
            const recommendedPsu = productsData.filter(product => product.category === 'psu' && Number(product.wattage) >= minimumPsu).sort((a, b) => Number(a.price) - Number(b.price))[0];
            addIssue('Power supply is undersized', `${minimumPsu}W needed, but this PSU provides ${selectedPsu.wattage}W.`, `Choose a PSU rated at least ${minimumPsu}W.`, 'fa-bolt', recommendedPsu);
        }
    } else {
        addCheck('Power capacity', 'waiting', componentDraw ? `Add a ${minimumPsu}W PSU.` : 'Add a PSU to calculate headroom.', 'fa-bolt');
    }

    if (gpus.length && cases.length) {
        const gpu = gpus[0];
        const pcCase = cases[0];
        const passed = !Number(gpu.lengthMm) || !Number(pcCase.gpuClearanceMm) || Number(gpu.lengthMm) <= Number(pcCase.gpuClearanceMm);
        addCheck('GPU / case clearance', passed ? 'passed' : 'failed', passed ? `${gpu.lengthMm}mm fits / ${pcCase.gpuClearanceMm}mm` : `${gpu.lengthMm}mm GPU / ${pcCase.gpuClearanceMm}mm`, 'fa-expand');
        if (!passed) {
            const recommendedCase = productsData.filter(product => product.category === 'case' && Number(product.gpuClearanceMm) >= Number(gpu.lengthMm)).sort((a, b) => Number(a.price) - Number(b.price))[0];
            addIssue('GPU will not fit the case', `${gpu.lengthMm}mm GPU vs ${pcCase.gpuClearanceMm}mm case clearance.`, `Choose a case with at least ${gpu.lengthMm}mm clearance.`, 'fa-expand', recommendedCase);
        }
    } else {
        addCheck('GPU / case clearance', 'waiting', 'Add a GPU and case to compare fit.', 'fa-expand');
    }

    const failedCount = checks.filter(check => check.state === 'failed').length;
    const passedCount = checks.filter(check => check.state === 'passed').length;
    const waitingCount = checks.filter(check => check.state === 'waiting').length;
    const compatible = issues.length === 0;
    const state = !compatible ? 'error' : waitingCount ? 'warning' : 'success';
    const heading = !compatible ? 'Compatibility issues found' : waitingCount ? 'Compatibility check in progress' : 'Build is compatible';
    const subheading = !compatible ? `${failedCount} check${failedCount === 1 ? '' : 's'} need attention.` : waitingCount ? 'Add missing parts to complete the check.' : 'All checked requirements are satisfied.';
    const titleIcon = !compatible ? 'fa-triangle-exclamation' : waitingCount ? 'fa-circle-info' : 'fa-circle-check';
    const detailsOpen = targetBoxId !== 'compatibilityStatusBox' ? ' open' : '';

    statusBox.style.display = 'block';
    statusBox.className = `compat-box compat-${state}`;
    statusBox.innerHTML = `
        <div class="compat-status-card">
            <div class="compat-status-head">
                <div class="compat-status-title"><span class="compat-status-icon"><i class="fa-solid ${titleIcon}"></i></span><span><strong>${heading}</strong><small>${subheading}</small></span></div>
                <span class="compat-status-badge">${compatible ? (waitingCount ? 'INCOMPLETE' : 'READY') : 'ACTION NEEDED'}</span>
            </div>
            <div class="compat-summary-row"><span><b>${passedCount}</b> passed</span><span><b>${failedCount}</b> issues</span><span><b>${waitingCount}</b> waiting</span></div>
            <div class="compat-check-list">${checks.map(check => `<div class="compat-check-row is-${check.state}"><span class="compat-check-state"><i class="fa-solid ${check.state === 'passed' ? 'fa-check' : check.state === 'failed' ? 'fa-xmark' : 'fa-minus'}"></i></span><span class="compat-check-copy"><b>${check.label}</b><small>${check.detail}</small></span><span class="compat-check-label">${check.state === 'passed' ? 'Passed' : check.state === 'failed' ? 'Fix needed' : 'Waiting'}</span></div>`).join('')}</div>
            ${issues.length ? `<details class="compat-details"${detailsOpen}><summary><i class="fa-solid fa-circle-exclamation"></i> View ${issues.length} issue${issues.length === 1 ? '' : 's'} and recommended fixes</summary><div class="compat-issue-list">${issues.map(issue => `<div class="compat-issue"><span class="compat-issue-icon"><i class="fa-solid ${issue.icon}"></i></span><span><b>${issue.title}</b><small>${issue.detail}</small><em>Fix: ${issue.fix}</em>${issue.recommendation ? `<a class="compat-recommendation" href="product-detail.html?id=${issue.recommendation.id}"><i class="fa-solid fa-arrow-up-right-from-square"></i> Recommended: ${issue.recommendation.title}</a>` : ''}</span></div>`).join('')}</div></details>` : ''}
            ${warnings.length ? `<div class="compat-waiting-note"><i class="fa-solid fa-circle-info"></i> ${warnings.length} additional check${warnings.length === 1 ? '' : 's'} waiting for more parts.</div>` : ''}
        </div>`;

    if (btnCheckout) { btnCheckout.disabled = !compatible; btnCheckout.style.opacity = compatible ? '1' : '0.5'; }
    return { compatible, issues, warnings, checks };
}
function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const countBadge = document.getElementById('cartCount');
    const totalElem = document.getElementById('cartTotal');
    if (!container && !countBadge) return;

    let totalQty = 0;
    let totalPrice = 0;

    if (container) {
        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-cart-msg">Your build cart is empty.</p>';
        } else {
            container.innerHTML = cart.map((item, index) => {
                totalQty += item.qty;
                totalPrice += item.price * item.qty;
                return `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.title}">
                        <div class="cart-item-info">
                            <h5>${item.title}</h5>
                            <span class="price">LKR ${(item.price * item.qty).toLocaleString()}</span>
                            <div class="qty-controls">
                                <button onclick="updateQty(${index}, -1)">-</button>
                                <span>${item.qty}</span>
                                <button onclick="updateQty(${index}, 1)">+</button>
                            </div>
                        </div>
                        <button class="delete-btn" onclick="removeItem(${index})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
            }).join('');
        }
    } else {
        cart.forEach(item => { totalQty += item.qty; totalPrice += item.price * item.qty; });
    }

    if (countBadge) countBadge.innerText = totalQty;
    if (totalElem) totalElem.innerText = `LKR ${totalPrice.toLocaleString()}`;
    evaluateCompatibility();
}

function toggleCart(forceOpen) {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
        if (forceOpen === true) {
            overlay.classList.add('active');
            drawer.classList.add('active');
        } else {
            overlay.classList.toggle('active');
            drawer.classList.toggle('active');
        }
    }
}

function goToCheckout() {
    if (cart.length === 0) return alert("Cart empty!");
    if (!isLoggedIn()) {
        window.location.href = "login.html?redirect=checkout.html";
        return;
    }
    window.location.href = "checkout.html";
}

/* ---------------------------------------------------------
   ORDER TRACKING MODAL (index.html / other pages)
--------------------------------------------------------- */

function toggleTrackModal() {
    const overlay = document.getElementById('trackModalOverlay');
    const modal = document.getElementById('trackModal');
    if (overlay && modal) {
        overlay.classList.toggle('active');
        modal.classList.toggle('active');
    }
}

function checkOrderStatus(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('trackInput');
    const res = document.getElementById('trackResult');
    if (!input || !res) return;
    const val = input.value.trim();
    if (!val) {
        input.focus();
        res.className = 'track-result is-error';
        res.innerHTML = '<strong>Please enter an order reference ID.</strong>';
        res.style.display = 'block';
        return false;
    }

    const order = findOrderById(val);
    res.style.display = "block";

    if (order) {
        res.className = 'track-result is-success';
        res.innerHTML = `
            <strong>Status:</strong> ${order.status}<br>
            <small>Ref ID: ${order.id} &middot; Placed ${new Date(order.date).toLocaleDateString()}</small><br>
            <small>Total: LKR ${order.total.toLocaleString()}</small>
        `;
    } else {
        res.className = 'track-result is-pending';
        res.innerHTML = `<strong>Status:</strong> Processing Compatibility &amp; Delivery!<br><small>Ref ID: ${val}</small>`;
    }
}

/* ---------------------------------------------------------
   ORDER HISTORY (checkout.html writes, profile.html reads)
--------------------------------------------------------- */

function getAllOrders() {
    return JSON.parse(localStorage.getItem('orderHistory')) || [];
}

function getOrdersForCurrentUser() {
    const user = getCurrentUser();
    if (!user) return [];
    return getAllOrders().filter(o => o.userEmail === user.email);
}

function findOrderById(orderId) {
    return getAllOrders().find(o => o.id.toLowerCase() === orderId.toLowerCase());
}

function saveOrder(order) {
    const orders = getAllOrders();
    orders.unshift(order);
    localStorage.setItem('orderHistory', JSON.stringify(orders));
}

function generateOrderId() {
    return 'ZYN-' + Math.floor(1000 + Math.random() * 9000);
}

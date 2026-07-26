// =================== USER DATA MANAGER (FIXED) ===================
class UserDataManager {
    constructor() {
        this.currentUser = localStorage.getItem("abutoys_current_user");
        this.userLocation = JSON.parse(localStorage.getItem("abutoys_user_location") || "null");
        this.locationStatus = localStorage.getItem("abutoys_location_status") || "unknown";
        this.deliveryCharge = parseFloat(localStorage.getItem("abutoys_delivery_charge") || "0");
        this.userDistance = parseFloat(localStorage.getItem("abutoys_user_distance") || "0");
        this.likedProducts = JSON.parse(localStorage.getItem("abutoys_liked_products") || "[]");
        this.isShowingLiked = false;
        this.allProducts = [];
        this.visibleProductsCount = 10;
        this.cart = JSON.parse(localStorage.getItem("abutoys_cart") || "[]");
        this.init();
    }

    init() {
        this.updateUserDisplay();
        this.syncWithHomePage();
        this.showDistanceMessage();
        // ✅ PAGE LOAD PE LIKED COUNT UPDATE KARO
        this.updateLikedCount();
    }

    // ✅ LIKED COUNT UPDATE FUNCTION
    updateLikedCount() {
        const likedBox = document.getElementById("likedCountBox");
        if (likedBox) {
            likedBox.textContent = `❤️ Liked Products: ${this.likedProducts.length}`;
        }
    }

    showDistanceMessage() {
        if (this.locationStatus === "in_range" && this.userDistance > 0) {
            const userName = this.getCurrentUserName();
        }
    }

    getUser(email) {
        try {
            return JSON.parse(localStorage.getItem(`abutoys_user_${email}`) || "null");
        } catch (e) {
            return null;
        }
    }

    isLoggedIn() {
        return this.currentUser && this.currentUser !== "visitor" && this.currentUser !== "null";
    }

    isVisitorMode() {
        return this.currentUser === "visitor";
    }

    isLocationVerified() {
        return this.locationStatus === "in_range";
    }

    isTooClose() {
        return this.userDistance <= 0.5;
    }

    getCurrentUserName() {
        if (this.currentUser && this.currentUser !== "visitor") {
            const user = this.getUser(this.currentUser);
            return user ? user.fullName : "User";
        }
        return "Visitor";
    }

    updateUserDisplay() {
        const userNameDisplay = document.getElementById("userNameDisplay");
        const userIcon = document.getElementById("userIcon");

        if (userNameDisplay) {
            if (this.currentUser && (this.isLoggedIn() || this.isVisitorMode())) {
                const name = this.getCurrentUserName();
                userNameDisplay.textContent = `Hello ${name}!`;
                userNameDisplay.style.display = "block";
            } else {
                userNameDisplay.style.display = "none";
            }
        }

        if (userIcon) {
            if (this.isLoggedIn()) {
                userIcon.classList.add("active");
                userIcon.title = `Logged in as ${this.getCurrentUserName()}`;
            } else if (this.isVisitorMode()) {
                userIcon.classList.remove("active");
                userIcon.title = "Visitor Mode";
            } else {
                userIcon.classList.remove("active");
                userIcon.title = "Account";
            }
        }
    }

    syncWithHomePage() {
        setInterval(() => {
            const newUser = localStorage.getItem("abutoys_current_user");
            const newLocationStatus = localStorage.getItem("abutoys_location_status");
            const newDeliveryCharge = parseFloat(localStorage.getItem("abutoys_delivery_charge") || "0");
            const newUserDistance = parseFloat(localStorage.getItem("abutoys_user_distance") || "0");

            if (newUser !== this.currentUser || newLocationStatus !== this.locationStatus ||
                newDeliveryCharge !== this.deliveryCharge || newUserDistance !== this.userDistance) {
                this.currentUser = newUser;
                this.locationStatus = newLocationStatus;
                this.deliveryCharge = newDeliveryCharge;
                this.userDistance = newUserDistance;
                this.updateUserDisplay();
                this.updateProductCards();
                updateWhatsAppButtonVisibility();
            }

            // ✅ LIKED PRODUCTS SYNC
            const newLikedProducts = JSON.parse(localStorage.getItem("abutoys_liked_products") || "[]");
            if (JSON.stringify(newLikedProducts) !== JSON.stringify(this.likedProducts)) {
                this.likedProducts = newLikedProducts;
                this.updateLikedCount();
            }
        }, 1000); // ✅ 1 second me check karo
    }

    updateProductCards() {
        document.querySelectorAll('.product-card').forEach(card => {
            this.updateSingleProductCard(card);
        });
    }

    updateSingleProductCard(card) {
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const priceDisplay = card.querySelector('.price-display');

        const shouldShowPrice = this.isLoggedIn() &&
            this.isLocationVerified() &&
            this.userDistance <= 20;

        if (priceDisplay) {
            priceDisplay.style.display = shouldShowPrice ? 'block' : 'none';
        }

        const shouldShowCart = this.isLoggedIn() && this.isLocationVerified();

        if (addToCartBtn) {
            addToCartBtn.style.display = shouldShowCart ? 'inline-flex' : 'none';
        }
    }

    // ✅ LIKE SYSTEM - FIXED
    addLikedProduct(productData) {
        const existingIndex = this.likedProducts.findIndex(p => p.name === productData.name);
        if (existingIndex === -1) {
            this.likedProducts.push(productData);
            localStorage.setItem("abutoys_liked_products", JSON.stringify(this.likedProducts));
            this.updateLikedCount(); // ✅ COUNT UPDATE KARO
            this.showMessage("Added to liked products!", "success");
            return true;
        }
        return false;
    }

    removeLikedProduct(productName) {
        const initialLength = this.likedProducts.length;
        this.likedProducts = this.likedProducts.filter(p => p.name !== productName);

        if (this.likedProducts.length < initialLength) {
            localStorage.setItem("abutoys_liked_products", JSON.stringify(this.likedProducts));
            this.updateLikedCount(); // ✅ COUNT UPDATE KARO
            this.showMessage("Removed from liked products", "info");
            return true;
        }
        return false;
    }

    isProductLiked(productName) {
        return this.likedProducts.some(p => p.name === productName);
    }

    showMessage(message, type = "info") {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed; top: 90px; right: 20px; z-index: 10000;
            padding: 12px 20px; border-radius: 25px; color: white;
            font-size: 0.9rem; font-weight: 600; opacity: 0;
            transition: all 0.3s ease; transform: translateX(100%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    toggleLikedView() {
        const heartIcon = document.getElementById('heartIcon');

        if (!this.isShowingLiked) {
            this.showOnlyLikedProducts();
            this.isShowingLiked = true;

            if (heartIcon) {
                heartIcon.classList.add('showing-liked');
                heartIcon.style.color = 'red';
            }

            if (this.likedProducts.length === 0) {
                this.showEmptyLikedMessage();
            }
        } else {
            this.showAllProducts();
            this.isShowingLiked = false;

            if (heartIcon) {
                heartIcon.classList.remove('showing-liked');
                heartIcon.style.color = '#333';
            }

            const emptyMessage = document.getElementById('empty-liked-message');
            if (emptyMessage) emptyMessage.remove();
        }
    }

    showOnlyLikedProducts() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productName = card.querySelector('h3')?.textContent;
            card.style.display = this.isProductLiked(productName) ? 'block' : 'none';
        });
    }

    showAllProducts() {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            card.style.display = index < this.visibleProductsCount ? 'block' : 'none';
        });
    }

    showEmptyLikedMessage() {
        const grid = document.getElementById('products-grid');
        const emptyMessage = document.createElement('div');
        emptyMessage.id = 'empty-liked-message';
        emptyMessage.style.cssText = `
            grid-column: 1 / -1; text-align: center; padding: 60px 20px;
            background: white; border-radius: 20px; margin: 20px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        `;
        emptyMessage.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px; color: #FF6B6B;">💔</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 15px; color: #333;">No liked products yet!</h3>
            <p style="font-size: 1rem; color: #666; margin-bottom: 20px;">Start exploring and like some products to see them here</p>
            <button onclick="userDataManager.toggleLikedView()" style="
                padding: 12px 25px; background: #FF6B6B; color: white; border: none;
                border-radius: 25px; cursor: pointer; font-weight: 600;
            ">Browse All Products</button>
        `;

        grid.appendChild(emptyMessage);
    }
}

// Initialize user data manager
const userDataManager = new UserDataManager();

// =================== ORDER SYSTEM (FIXED) ===================
class OrderManager {
    constructor() {
        this.APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxP4MCI7NOA7XvA-rFEDiJh0QCHP8isKmZtxclsIUZGz5JRSVUHxN2PPSUpDS_3UMb-hg/exec";
        this.orders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");

        // ✅ PAGE LOAD PE BADGE UPDATE KARO
        this.updateCartBadge();

        // ✅ HAR 2 SECOND ME SYNC KARO
        this.startSync();
    }

    get48hTimeLeft(paymentTime) {
        if (!paymentTime) return null;

        const now = Date.now();
        const diff = paymentTime + (48 * 60 * 60 * 1000) - now;

        if (diff <= 0) return "Waiting for delivery update";

        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

        return `${hours}h ${minutes}m`;
    }


    // ✅ AUTO SYNC - localStorage se orders refresh karo
    startSync() {
        setInterval(() => {
            const latestOrders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");

            // Agar orders change hue hain to update karo
            if (JSON.stringify(latestOrders) !== JSON.stringify(this.orders)) {
                this.orders = latestOrders;
                this.updateCartBadge();
            }
        }, 1000); // ✅ 1 second me check
    }

    generateOrderCode() {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `Abu${randomNum}Toys`;
    }

    // ✅ CART BADGE - FIXED LOGIC
    updateCartBadge() {
        const cartIcon = document.getElementById('cartIcon');
        if (!cartIcon) return;

        // ✅ localStorage se fresh orders fetch karo
        const freshOrders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");
        const pendingCount = freshOrders.filter(o => o.status !== 'Delivered').length;

        let badge = cartIcon.querySelector('.cart-badge');

        if (pendingCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(231,76,60,0.4);
                `;
                cartIcon.appendChild(badge);
            }
            badge.textContent = pendingCount;
        } else if (badge) {
            badge.remove();
        }
    }

    openOrderPanel(productCard, quantity = 1) {
    const orderCode = this.generateOrderCode();
    const productName = productCard.querySelector('h3')?.textContent || '';
    const productPrice = parseFloat(productCard.dataset.originalPrice || 0);
    const deliveryCharge = userDataManager.deliveryCharge;
    
    // Calculate with quantity & discount
    const subtotal = productPrice * quantity;
    const discountPercent = quantity;
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const totalPrice = afterDiscount + deliveryCharge;

    const userName = userDataManager.getCurrentUserName();
    const userEmail = userDataManager.currentUser;
    const userData = userDataManager.getUser(userEmail);
    const userAddress = userData?.address || '';
    const userPassword = userData?.password || '';

    const productCardClone = productCard.cloneNode(true);

    const allImages = productCardClone.querySelectorAll('.product-img');
    const videoContainers = productCardClone.querySelectorAll('.video-container');
    const arrows = productCardClone.querySelectorAll('.img-nav');
    const buyButton = productCardClone.querySelector('.add-to-cart-btn, .modal-buy-now-btn');
    const wishlistIcon = productCardClone.querySelector('.wishlist-icon');
    const productOverlay = productCardClone.querySelector('.product-overlay');

    allImages.forEach((img, index) => { if (index !== 0) img.remove(); });
    videoContainers.forEach((video, index) => { if (index !== 0) video.remove(); });
    arrows.forEach(arrow => arrow.remove());
    if (buyButton) buyButton.remove();
    if (wishlistIcon) wishlistIcon.remove();
    if (productOverlay) productOverlay.remove();

    productCardClone.style.width = '100%';
    productCardClone.style.maxWidth = '100%';
    productCardClone.style.margin = '0';
    productCardClone.style.transform = 'none';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'order-overlay';
    overlay.className = 'active';
    document.body.appendChild(overlay);

    // Create panel
    const panel = document.createElement('div');
    panel.id = 'order-panel';
    
    panel.innerHTML = `
        <div class="order-panel-inner">
            <!-- Header -->
            <div class="order-panel-header">
                <h2 class="order-panel-title">📦 Order Details</h2>
                <button class="order-close-btn" onclick="closeOrderPanel()">×</button>
            </div>
            
            <!-- Order Code -->
            <div class="order-code-display">
                🎫 ${orderCode}
            </div>
            
            <!-- Product Card -->
            <div id="order-product-card"></div>
            
            <!-- Price Details -->
            <div class="price-details-section">
                <h3 class="price-details-title">
                    💰 Price Breakdown
                </h3>
                
                <div class="price-row">
                    <span class="price-label">Unit Price:</span>
                    <span class="price-value">₹${productPrice.toFixed(0)}</span>
                </div>
                
                <div class="price-row">
                    <span class="price-label">Quantity:</span>
                    <span class="price-value highlight">× ${quantity}</span>
                </div>
                
                <div class="price-row">
                    <span class="price-label">Subtotal:</span>
                    <span class="price-value">₹${subtotal.toFixed(0)}</span>
                </div>
                
                <div class="price-row">
                    <span class="price-label">🎉 Discount (${discountPercent}%):</span>
                    <span class="price-value discount">-₹${discountAmount.toFixed(0)}</span>
                </div>
                
                <div class="price-row">
                    <span class="price-label">🚚 Delivery Charge:</span>
                    <span class="price-value">${deliveryCharge > 0 ? '₹' + deliveryCharge : 'FREE'}</span>
                </div>
                
                <div class="price-row total-price-row">
                    <span class="total-price-label">Grand Total:</span>
                    <span class="total-price-value">₹${totalPrice.toFixed(0)}</span>
                </div>
            </div>
            
            <!-- Order Form -->
            <form id="order-form" class="order-form">
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-user"></i> Name:
                    </label>
                    <input type="text" value="${userName}" readonly class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-box"></i> Product:
                    </label>
                    <input type="text" value="${productName}" readonly class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-map-marker-alt"></i> Full Address:
                    </label>
                    <textarea id="order-address" class="form-textarea" placeholder="Enter your complete delivery address" required>${userAddress}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-tag"></i> Order Code:
                    </label>
                    <input type="text" value="${orderCode}" readonly class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-lock"></i> Password:
                    </label>
                    <input type="password" id="order-password" placeholder="Enter your password to confirm" class="form-input" required>
                </div>
                
                <button type="submit" class="order-submit-btn">
                    <i class="fas fa-rocket"></i>
                    Submit Order
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(panel);

    // Show panel with animation
    setTimeout(() => panel.classList.add('active'), 10);

    // Close function
    window.closeOrderPanel = function() {
        panel.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            panel.remove();
            overlay.remove();
            document.body.style.overflow = '';
        }, 400);
    };

    // Overlay click to close
    overlay.addEventListener('click', closeOrderPanel);

    // Add product card
    const cardContainer = document.getElementById('order-product-card');
    cardContainer.appendChild(productCardClone);

    const firstImg = productCardClone.querySelector('.product-img');
    if (firstImg) {
        firstImg.style.display = "block";
        firstImg.classList.add("active");
    }

    // Form submit
    const form = document.getElementById('order-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const enteredPassword = document.getElementById('order-password').value;
        const address = document.getElementById('order-address').value;

        if (enteredPassword !== userPassword) {
            this.showPopup('❌ Password Incorrect!', 'error');
            return;
        }

        if (!address.trim()) {
            this.showPopup('❌ Please enter delivery address!', 'error');
            return;
        }

        this.showLoadingAnimation();

        this.submitOrder({
            orderCode,
            userName,
            productName,
            productPrice,
            quantity,
            deliveryCharge,
            totalPrice: totalPrice.toFixed(0),
            address,
            password: enteredPassword
        });
    });

    document.body.style.overflow = 'hidden';
}

    showLoadingAnimation() {
        const loader = document.createElement('div');
        loader.id = 'order-loader';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 99999999; display: flex; flex-direction: column; align-items: center; justify-content: center;`;

        loader.innerHTML = `
            <div style="width: 80px; height: 80px; border: 8px solid #f3f3f3; border-top: 8px solid #FF6B6B; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: white; font-size: 1.3rem; margin-top: 20px; font-weight: 600;">Submitting Order...</p>
        `;

        document.body.appendChild(loader);
    }

    async submitOrder(orderData) {
    try {
        const response = await fetch(this.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                orderCode: orderData.orderCode,
                orderDate: new Date().toLocaleString(),
                userName: orderData.userName,
                productName: orderData.productName,
                productPrice: orderData.productPrice,
                quantity: orderData.quantity, // ✅ YE ADD KIYA
                deliveryCharge: orderData.deliveryCharge,
                totalPrice: orderData.totalPrice,
                fullAddress: orderData.address,
                password: orderData.password,
                userEmail: userDataManager.currentUser
            })
        });

        const result = await response.json();
        document.getElementById('order-loader')?.remove();

        if (result.success) {
            const now = Date.now();
            const paymentDeadline = now + (60 * 60 * 1000);

            const orderToSave = {
                orderCode: orderData.orderCode,
                productName: orderData.productName,
                productPrice: orderData.productPrice,
                quantity: orderData.quantity, // ✅ YE BHI ADD KIYA
                deliveryCharge: orderData.deliveryCharge,
                totalPrice: orderData.totalPrice,
                orderDate: new Date().toLocaleString(),
                orderTimestamp: now,
                paymentDeadline: paymentDeadline,
                status: '',
                paymentStatus: '',
                paymentConfirmedAt: null
            };

            const currentOrders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");
            currentOrders.push(orderToSave);
            localStorage.setItem("abutoys_orders", JSON.stringify(currentOrders));

            this.orders = currentOrders;
            this.updateCartBadge();

            closeOrderPanel();
            this.showOrderConfirmationCardWithPayment(orderData, paymentDeadline);
        } else {
            this.showPopup('❌ Order failed! Try again.', 'error');
        }

    } catch (error) {
        document.getElementById('order-loader')?.remove();
        console.error(error);
        this.showPopup('❌ Network error! Check internet.', 'error');
    }
}

    // ✅ BEAUTIFUL ORDER CONFIRMATION CARD - FIXED
    showOrderConfirmationCard(orderData) {
        const backdrop = document.createElement('div');
        backdrop.id = 'confirmation-backdrop'; // ✅ ID DIYA
        backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(5px);
    `;

        const card = document.createElement('div');
        card.id = 'confirmation-card'; // ✅ ID DIYA
        card.style.cssText = `
        background: white; border-radius: 20px; max-width: 500px; width: 90%;
        padding: 40px 30px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideInUp 0.5s ease-out;
    `;

        card.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 8px;">🎉</div>
    <h2 style="color:#FF6B6B;margin:0 0 8px 0;">Order Submitted!</h2>
    <p style="color:#666;margin:0 0 16px 0;">Order Code: <strong>${orderData.orderCode}</strong></p>
    
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:18px;border-radius:12px;margin-bottom:16px;">
        <p style="margin:0;font-weight:700;font-size:18px;">₹${safeAmount}</p>
        <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Pay within 1 hour to avoid cancellation</p>
    </div>

    <div style="background:#e8f5e9;padding:15px;border-radius:10px;margin-bottom:16px;border-left:4px solid #4CAF50;">
        <p style="color:#2e7d32;margin:0;font-weight:600;font-size:14px;">
            ✅ Check your email for payment link
        </p>
        <p style="color:#2e7d32;margin:8px 0 0 0;font-size:13px;">
            Click the payment button in the email to pay instantly with UPI
        </p>
    </div>

    <div style="background:#fff3cd;padding:15px;border-radius:10px;margin-bottom:16px;border-left:4px solid #FF6B6B;">
        <p style="color:#856404;margin:0;font-weight:600;font-size:14px;">
            ⏰ After Payment:
        </p>
        <p style="color:#856404;margin:8px 0 0 0;font-size:13px;">
            Go to My Orders → Click WhatsApp button → Send payment confirmation message
        </p>
    </div>

    <div style="text-align:center;margin-top:20px;">
        <button id="done-btn" style="background:linear-gradient(45deg,#FF6B6B,#4ECDC4);color:white;border:0;padding:12px 30px;border-radius:10px;font-weight:700;cursor:pointer;">
            Done
        </button>
    </div>
`;

        backdrop.appendChild(card);
        document.body.appendChild(backdrop);

        // ✅ PROPER EVENT LISTENERS
        const closeBtn = document.getElementById('close-confirmation-btn');
        const confirmBackdrop = document.getElementById('confirmation-backdrop');

        // Button click
        closeBtn.addEventListener('click', function () {
            const backdrop = document.getElementById('confirmation-backdrop');
            if (backdrop) backdrop.remove();
        });


        // Backdrop click
        confirmBackdrop.addEventListener('click', function (e) {
            if (e.target === confirmBackdrop) {
                confirmBackdrop.remove();
            }
        });

        // ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                confirmBackdrop.remove();
            }
        });
    }

    // ======== ADD THIS METHOD inside OrderManager class ========
    showOrderConfirmationCardWithPayment(orderData, paymentDeadline) {
        // remove any previous backdrop
        document.getElementById('confirmation-backdrop')?.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'confirmation-backdrop';
        backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
    `;

        const remainingMs = paymentDeadline - Date.now();
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        const card = document.createElement('div');
        card.style.cssText = `
        background: white; border-radius: 16px; max-width: 520px; width: 92%;
        padding: 28px; text-align: center; box-shadow: 0 18px 60px rgba(0,0,0,0.25);
    `;

        // ⬇️ YE NAYA UPI PAYMENT LINK BANA
        const upiId = "9879254030@okbizaxis";
        const safeAmount = parseFloat(orderData.totalPrice) || 0;
        const upiUrl = `upi://pay?pa=${upiId}&am=${safeAmount}&cu=INR&tn=AbuToys Order ${orderData.orderCode}`;
        // 👉 Direct WhatsApp Payment Page (no chat)
        // const waPaymentId = "naimuddin.4030@waicici";
        // const waPayUrl = `upi://pay?pa=${waPaymentId}&pn=AbuToys&am=${safeAmount}&cu=INR&tn=AbuToys Order ${orderData.orderCode}`;


        card.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 8px;">🎉</div>
    <h2 style="color:#FF6B6B;margin:0 0 8px 0;">Order Submitted!</h2>
    <p style="color:#666;margin:0 0 16px 0;">Order Code: <strong>${orderData.orderCode}</strong></p>
    
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:18px;border-radius:12px;margin-bottom:16px;">
        <p style="margin:0;font-weight:700;font-size:18px;">₹${safeAmount}</p>
        <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Pay within 1 hour to avoid cancellation</p>
    </div>

    <div style="background:#e8f5e9;padding:15px;border-radius:10px;margin-bottom:16px;border-left:4px solid #4CAF50;">
        <p style="color:#2e7d32;margin:0;font-weight:600;font-size:14px;">
            ✅ Check your email for payment link
        </p>
        <p style="color:#2e7d32;margin:8px 0 0 0;font-size:13px;">
            Click the payment button in the email to pay instantly with UPI
        </p>
    </div>

    <div style="background:#fff3cd;padding:15px;border-radius:10px;margin-bottom:16px;border-left:4px solid #FF6B6B;">
        <p style="color:#856404;margin:0;font-weight:600;font-size:14px;">
            ⏰ After Payment:
        </p>
        <p style="color:#856404;margin:8px 0 0 0;font-size:13px;">
            Go to My Orders → Click WhatsApp button → Send payment confirmation
        </p>
    </div>

    <div style="text-align:center;margin-top:20px;">
        <button id="done-btn" style="background:linear-gradient(45deg,#FF6B6B,#4ECDC4);color:white;border:0;padding:12px 30px;border-radius:10px;font-weight:700;cursor:pointer;">
            Done
        </button>
    </div>
`;

        backdrop.appendChild(card);
        document.body.appendChild(backdrop);

        document.getElementById('done-btn').addEventListener('click', () => backdrop.remove());

        // Auto-close after 6 seconds maybe? (optional)
        // setTimeout(() => backdrop.remove(), 10000);
    }


    showPopup(message, type) {
        const popup = document.createElement('div');
        popup.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${type === 'success' ? '#4CAF50' : '#f44336'}; color: white; padding: 20px 40px; border-radius: 15px; font-size: 1.2rem; font-weight: 600; z-index: 9999999; box-shadow: 0 10px 30px rgba(0,0,0,0.3);`;
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }

    // ✅ INSTANT CART PANEL - Loading animation ke saath
    openCartPanelInstant() {
        const panel = document.createElement('div');
        panel.id = 'cart-panel';
        panel.style.cssText = `position: fixed; top: 0; right: -100%; width: 100%; max-width: 450px; height: 100%; background: white; z-index: 999999; box-shadow: -5px 0 20px rgba(0,0,0,0.3); transition: right 0.3s ease; overflow-y: auto;`;

        // ✅ LOADING STATE
        panel.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e0e0e0; padding-bottom: 15px;">
                <h2 style="color: #FF6B6B; font-family: 'Fredoka One', cursive !important;">🛒 My Orders</h2>
                <button onclick="document.getElementById('cart-panel').remove(); document.getElementById('cart-overlay').remove();" style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 20px;">×</button>
            </div>
            <div style="text-align: center; padding: 60px 20px;">
                <div style="width: 80px; height: 80px; border: 8px solid #f3f3f3; border-top: 8px solid #FF6B6B; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 20px;"></div>
                <p style="color: #666; font-size: 1.1rem; font-weight: 600;">📦 Order History Loading...</p>
            </div>
        </div>
    `;

        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999998; opacity: 0; transition: opacity 0.3s ease;`;
        overlay.addEventListener('click', () => { panel.remove(); overlay.remove(); });

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // ✅ INSTANT OPEN WITH ANIMATION
        setTimeout(() => {
            panel.style.right = '0';
            overlay.style.opacity = '1';
        }, 10);

        // ✅ AB FETCH KARO SHEET SE
        this.fetchOrdersFromSheetInstant(panel);
    }



    // ========== MISSING FUNCTION (ADD THIS INSIDE OrderManager CLASS) ==========
    async fetchOrdersFromSheet() {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL);
            const result = await response.json();

            if (!result.success) return;

            let localOrders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");

            localOrders = localOrders.map(local => {
                const sheetOrder = result.orders.find(o => o['Order Code'] === local.orderCode);

                let status = local.status || '';
                let paymentStatus = local.paymentStatus || '';
                let paymentConfirmedAt = local.paymentConfirmedAt || null;

                if (sheetOrder) {
                    const sheetPayment = (sheetOrder['Payment'] || '').toString().trim().toLowerCase();
                    const sheetStatus = (sheetOrder['Status'] || '').toString().trim().toLowerCase();

                    // PAYMENT OK → mark paid + start 48h timer
                    if (sheetPayment === 'ok') {
                        if (paymentStatus !== 'ok') {
                            paymentStatus = 'ok';
                            paymentConfirmedAt = Date.now();
                        }
                        if (status === 'Cancelled') status = '';
                    }

                    // DELIVERY OK → Delivered
                    if (sheetStatus === 'ok') status = 'Delivered';

                    // AUTO CANCEL (sheet canceled)
                    if (sheetStatus === 'cancelled') status = 'Cancelled';
                }

                return {
                    ...local,
                    status,
                    paymentStatus,
                    paymentConfirmedAt
                };
            });

            localStorage.setItem("abutoys_orders", JSON.stringify(localOrders));
            this.orders = localOrders;

        } catch (err) {
            console.error("fetchOrdersFromSheet ERROR:", err);
        }
    }

    // ✅ INSTANT FETCH - FIXED VERSION
async fetchOrdersFromSheetInstant(panel) {
    try {
        const response = await fetch(this.APPS_SCRIPT_URL);
        const result = await response.json();

        console.log("📡 API Response:", result); // ✅ DEBUG LINE

        if (result.success) {
            const localOrders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");

            console.log("📦 Local Orders:", localOrders); // ✅ DEBUG LINE
            console.log("📋 Sheet Orders:", result.orders); // ✅ DEBUG LINE

            this.orders = localOrders.map(localOrder => {
                // ✅ CASE-INSENSITIVE MATCH
                const sheetOrder = result.orders.find(o => {
                    const sheetCode = String(o['Order Code'] || '').trim().toLowerCase();
                    const localCode = String(localOrder.orderCode || '').trim().toLowerCase();
                    return sheetCode === localCode;
                });

                let status = localOrder.status || '';
                let paymentStatus = localOrder.paymentStatus || '';
                let paymentConfirmedAt = localOrder.paymentConfirmedAt || null;

                if (sheetOrder) {
                    console.log(`✅ Found match for ${localOrder.orderCode}:`, sheetOrder); // ✅ DEBUG

                    // ✅ GET STATUS - Try multiple column name variations
                    const sheetStatusRaw = sheetOrder['Status'] || sheetOrder['status'] || sheetOrder['STATUS'] || '';
                    const sheetStatus = String(sheetStatusRaw).trim().toLowerCase();

                    // ✅ GET PAYMENT - Try multiple column name variations
                    const sheetPaymentRaw = sheetOrder['Payment'] || sheetOrder['payment'] || sheetOrder['PAYMENT'] || '';
                    const sheetPayment = String(sheetPaymentRaw).trim().toLowerCase();

                    console.log(`🔍 Order ${localOrder.orderCode} - Status: "${sheetStatus}", Payment: "${sheetPayment}"`); // ✅ DEBUG

                    // ✅ PAYMENT LOGIC
                    if (sheetPayment === 'ok' || sheetPayment === 'done' || sheetPayment === '✅') {
                        if (paymentStatus !== 'ok') {
                            paymentStatus = 'ok';
                            paymentConfirmedAt = Date.now();  // ✅ TIMER START
                            console.log(`💰 Payment confirmed for ${localOrder.orderCode}`);
                        }
                        if (status === 'Cancelled') {
                            status = '';  // Reset cancelled status
                        }
                    }

                    // ✅ STATUS LOGIC (Delivery)
                    if (sheetStatus === 'ok' || sheetStatus === 'delivered' || sheetStatus === '✅') {
                        status = 'Delivered';
                        console.log(`✅ Delivered: ${localOrder.orderCode}`);
                    } else if (sheetStatus === 'cancelled' || sheetStatus === 'canceled' || sheetStatus === '❌') {
                        status = 'Cancelled';
                        console.log(`❌ Cancelled: ${localOrder.orderCode}`);
                    }
                } else {
                    console.warn(`⚠️ No sheet match found for ${localOrder.orderCode}`);
                }

                return {
                    ...localOrder,
                    status: status,
                    paymentStatus: paymentStatus,
                    paymentConfirmedAt: paymentConfirmedAt
                };
            });

            localStorage.setItem("abutoys_orders", JSON.stringify(this.orders));
            this.updateCartBadge();

            // ✅ RENDER ORDER CARDS
            let ordersHTML = '';

            if (this.orders.length === 0) {
                ordersHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #ddd;"></i>
                        <h3>No orders yet!</h3>
                    </div>
                `;
            } else {
                this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

                ordersHTML = this.orders.map(order => {
                    const isDelivered = order.status === 'Delivered';
                    const isCancelled = order.status === 'Cancelled';
                    const isPaymentPending = order.paymentStatus !== 'ok';

                    let statusHTML = '';
                    let whatsappButtonHTML = '';
                    let borderColor = '#4ECDC4';

                    if (isDelivered) {
                        borderColor = '#27ae60';
                        statusHTML = `
                            <div style="background: #d4edda; padding: 12px; border-radius: 8px; margin-top: 10px; text-align: center;">
                                <p style="color: #155724; margin: 0; font-weight: 600;">✅ Delivered!</p>
                            </div>
                        `;
                    } else if (isCancelled) {
                        borderColor = '#e74c3c';
                        statusHTML = `
                            <div style="background: #f8d7da; padding: 12px; border-radius: 8px; margin-top: 10px; text-align: center;">
                                <p style="color: #721c24; margin: 0; font-weight: 600;">❌ Cancelled</p>
                            </div>
                        `;
                    } else if (isPaymentPending) {
                        borderColor = '#f39c12';
                        const now = Date.now();
                        const timeLeft = order.paymentDeadline - now;
                        let timerText = '';
                        
                        if (timeLeft > 0) {
                            const minutes = Math.floor(timeLeft / (60 * 1000));
                            timerText = `⏰ ${minutes}m left`;
                        } else {
                            timerText = '⏰ Expired';
                        }

                        statusHTML = `
                            <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 10px; text-align: center;">
                                <p style="color: #856404; margin: 0 0 5px 0; font-weight: 600;">⏳ Payment Pending</p>
                                <p style="color: #d32f2f; margin: 0; font-weight: 700;">${timerText}</p>
                            </div>
                        `;
                        
                        whatsappButtonHTML = `
                            <a href="https://wa.me/8160154042?text=${encodeURIComponent(
                                `Order Code: ${order.orderCode}\nUser: ${userDataManager.getCurrentUserName()}\nAmount: ₹${order.totalPrice}\nPayment Done ✅`
                            )}" target="_blank" style="text-decoration:none;">
                                <button style="width:100%;background:#25D366;color:white;border:0;padding:10px;border-radius:8px;font-weight:600;cursor:pointer;margin-top:10px;">
                                    💬 Confirm Payment
                                </button>
                            </a>
                        `;
                    } else {
                        borderColor = '#3498db';
                        const timeLeft = this.get48hTimeLeft(order.paymentConfirmedAt);
                        statusHTML = `
                            <div style="background: #d1ecf1; padding: 12px; border-radius: 8px; margin-top: 10px; text-align: center;">
                                <p style="color: #0c5460; margin: 0; font-weight: 600;">🚚 Delivery: ${timeLeft}</p>
                            </div>
                        `;
                        
                        whatsappButtonHTML = `
                            <a href="https://wa.me/8160154042?text=${encodeURIComponent(
                                `Order Code: ${order.orderCode}\nUser: ${userDataManager.getCurrentUserName()}\nAmount: ₹${order.totalPrice}\nDelivery Done ✅`
                            )}" target="_blank" style="text-decoration:none;">
                                <button style="width:100%;background:#25D366;color:white;border:0;padding:10px;border-radius:8px;font-weight:600;cursor:pointer;margin-top:10px;">
                                    💬 Confirm Delivery
                                </button>
                            </a>
                        `;
                    }

                    // ✅ CALCULATE DISCOUNT FOR DISPLAY
                    const qty = order.quantity || 1;
                    const discountPercent = qty; // 1 qty = 1%, 10 qty = 10%
                    const productPrice = parseFloat(order.productPrice || 0);
                    const subtotal = productPrice * qty;
                    const discountAmount = Math.round((subtotal * discountPercent) / 100);
                    
                    return `
                        <div style="background: #f9f9f9; border-radius: 15px; padding: 20px; 
                            margin-bottom: 15px; border-left: 4px solid ${borderColor};">
                            <h3 style="color: #FF6B6B; margin: 0 0 10px 0;">${order.orderCode}</h3>
                            <p style="margin: 8px 0;"><strong>Product:</strong> ${order.productName}</p>
                            <p style="margin: 8px 0;"><strong>Quantity:</strong> <span style="background: #4ECDC4; color: white; padding: 3px 10px; border-radius: 5px; font-weight: 700;">${qty}</span></p>
                            <p style="margin: 8px 0;">
                                <strong>🎉 Discount:</strong> 
                                <span style="background: linear-gradient(45deg, #FF6B6B, #4ECDC4); color: white; padding: 3px 10px; border-radius: 5px; font-weight: 700;">${discountPercent}% OFF</span>
                                <span style="color: #27ae60; font-weight: 700; margin-left: 8px;">(-₹${discountAmount})</span>
                            </p>
                            <p style="margin: 8px 0;"><strong>Total:</strong> ₹${order.totalPrice}</p>
                            ${statusHTML}
                            ${whatsappButtonHTML}
                        </div>
                    `;
                }).join('');
            }

            panel.innerHTML = `
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e0e0e0; padding-bottom: 15px;">
                        <h2 style="color: #FF6B6B; font-family: 'Fredoka One', cursive !important;">🛒 My Orders</h2>
                        <button onclick="document.getElementById('cart-panel').remove(); document.getElementById('cart-overlay').remove();" style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 20px;">×</button>
                    </div>
                    ${ordersHTML}
                </div>
            `;

            console.log("✅ Orders rendered successfully!");
        }
    } catch (error) {
        console.error('❌ Failed to fetch orders:', error);
        panel.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e0e0e0; padding-bottom: 15px;">
                    <h2 style="color: #FF6B6B; font-family: 'Fredoka One', cursive !important;">🛒 My Orders</h2>
                    <button onclick="document.getElementById('cart-panel').remove(); document.getElementById('cart-overlay').remove();" style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 20px;">×</button>
                </div>
                <div style="text-align: center; padding: 60px 20px; background: #fff3f3; border-radius: 15px;">
                    <p style="color: #e74c3c; font-weight: 600;">⚠️ Failed to load orders</p>
                    <p style="color: #666; font-size: 0.9rem;">Check internet connection</p>
                </div>
            </div>
        `;
    }
}
    getTimeLeft(orderTimestamp) {
        const now = Date.now();
        const diff = orderTimestamp + (48 * 60 * 60 * 1000) - now;

        if (diff <= 0) {
            return "Waiting for delivery update";
        }

        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

        return `${hours}h ${minutes}m`;
    }
}

// =================== QUANTITY SELECTION PANEL ===================
function openQuantityPanel(productCard) {
    const panel = document.createElement('div');
    panel.id = 'quantity-panel';
    panel.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); z-index: 999998;
        display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: fadeIn 0.3s ease;
    `;

    panel.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 100%; 
            padding: 35px; position: relative; animation: slideInUp 0.4s ease;">
            
            <button onclick="document.getElementById('quantity-panel').remove(); document.body.style.overflow = '';" style="
                position: absolute; top: 15px; right: 15px;
                background: #ff6b6b; color: white; border: none; border-radius: 50%; 
                width: 35px; height: 35px; cursor: pointer; font-size: 18px;
            ">×</button>
            
            <h2 style="text-align: center; color: #FF6B6B; font-size: 1.8rem; 
                margin-bottom: 10px; font-family: 'Fredoka One', cursive !important;">
                📦 Select Quantity
            </h2>
            
            <p style="text-align: center; color: #666; margin-bottom: 25px; font-size: 0.95rem;">
                Choose how many items you want to order
            </p>
            
            <div id="quantity-options" style="display: grid; grid-template-columns: repeat(5, 1fr); 
                gap: 12px; margin-bottom: 20px;">
                ${Array.from({ length: 10 }, (_, i) => i + 1).map(num => `
                    <button class="qty-btn ${num === 1 ? 'active' : ''}" data-qty="${num}" style="
                        padding: 15px; border: 2px solid ${num === 1 ? '#FF6B6B' : '#e0e0e0'}; 
                        border-radius: 12px; background: ${num === 1 ? '#FF6B6B' : 'white'}; 
                        color: ${num === 1 ? 'white' : '#333'}; font-size: 1.1rem; 
                        font-weight: 700; cursor: pointer; transition: all 0.3s ease;
                    ">${num}</button>
                `).join('')}
            </div>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">🎉 Special Discount:</p>
                <p id="discount-info" style="margin: 0; color: #27ae60; font-weight: 700; font-size: 1.1rem;">
                    1% OFF on this order!
                </p>
            </div>
            
            <button id="confirm-qty-btn" style="
                width: 100%; padding: 15px; background: linear-gradient(45deg, #FF6B6B, #4ECDC4); 
                color: white; border: none; border-radius: 12px; font-size: 1.1rem; 
                font-weight: 700; cursor: pointer; transition: all 0.3s ease;
            ">
                ✅ Confirm Quantity
            </button>
        </div>
    `;

    document.body.appendChild(panel);

    let selectedQty = 1;

    // Quantity button click handler
    panel.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            panel.querySelectorAll('.qty-btn').forEach(b => {
                b.style.border = '2px solid #e0e0e0';
                b.style.background = 'white';
                b.style.color = '#333';
                b.classList.remove('active');
            });

            this.style.border = '2px solid #FF6B6B';
            this.style.background = '#FF6B6B';
            this.style.color = 'white';
            this.classList.add('active');

            selectedQty = parseInt(this.dataset.qty);

            const discountInfo = panel.querySelector('#discount-info');
            discountInfo.textContent = `${selectedQty}% OFF on this order!`;

            this.style.transform = 'scale(1.1)';
            setTimeout(() => this.style.transform = 'scale(1)', 200);
        });
    });

    // Confirm button
    panel.querySelector('#confirm-qty-btn').addEventListener('click', () => {
        panel.remove();
        document.body.style.overflow = '';
        orderManager.openOrderPanel(productCard, selectedQty);
    });

    // Body scroll lock
    document.body.style.overflow = 'hidden';
}

const orderManager = new OrderManager();

// ✅ CART ICON CLICK
document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!userDataManager.isLoggedIn()) {
                userDataManager.showMessage("Please login first!", "error");
                return;
            }

            // ✅ INSTANT PANEL KHOLO - PEHLE EMPTY, PHIR LOAD KARO
            orderManager.openCartPanelInstant();
        });
    }
});

// ✅ TIMER UPDATE HAR MINUTE
setInterval(() => {
    orderManager.fetchOrdersFromSheet();
    orderManager.updateCartBadge();
    userDataManager.updateLikedCount();
}, 60000);

function updateLikedCountBox() {
    const likedBox = document.getElementById("likedCountBox");
    if (!likedBox) return;
    likedBox.textContent = `❤️ Liked Products: ${userDataManager.likedProducts.length}`;
}

// If user clicked heart on home -> show liked products automatically
window.addEventListener('load', () => {
    if (localStorage.getItem('abutoys_show_liked_from_home') === '1') {
        localStorage.removeItem('abutoys_show_liked_from_home');
        // ensure userDataManager is initialized
        setTimeout(() => {
            try {
                if (typeof userDataManager !== 'undefined') {
                    userDataManager.toggleLikedView();
                    // scroll to top for clarity
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (e) { console.warn('toggleLikedView error', e); }
        }, 250);
    }
});


// =================== MOBILE NAVIGATION ===================
function initializeMobileNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

// =================== NAVBAR SCROLL EFFECT ===================
function initializeNavbarScrollEffect() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255,255,255,0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
            } else {
                navbar.style.background = 'rgba(255,255,255,0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            }
        }
    });
}

// =================== SEARCH FUNCTIONALITY ===================
function initializeSearchFunctionality() {
    const desktopSearch = document.getElementById('desktop-search');
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');

    function filterProducts(searchTerm) {
        const productCards = document.querySelectorAll('.product-card');
        let foundProducts = 0;

        productCards.forEach(card => {
            const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.product-description')?.textContent.toLowerCase() || '';

            if (name.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
                foundProducts++;
            } else {
                card.style.display = 'none';
            }
        });

        if (searchTerm) {
            const resultsMsg = foundProducts > 0 ?
                `Found ${foundProducts} products for "${searchTerm}"` :
                `No products found for "${searchTerm}". Try different keywords.`;

            userDataManager.showMessage(resultsMsg, foundProducts > 0 ? "success" : "error");
        }
    }

    if (desktopSearch) {
        desktopSearch.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterProducts(searchTerm);

            if (userDataManager.isShowingLiked && searchTerm) {
                userDataManager.isShowingLiked = false;
                const heartIcon = document.getElementById('heartIcon');
                if (heartIcon) heartIcon.classList.remove('showing-liked');
            }
        });
    }

    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            if (mobileSearchOverlay) {
                mobileSearchOverlay.style.display = 'flex';
                setTimeout(() => mobileSearchOverlay.style.opacity = '1', 10);
                if (mobileSearchInput) mobileSearchInput.focus();
            }
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterProducts(searchTerm);
        });
    }

    if (mobileSearchOverlay) {
        mobileSearchOverlay.addEventListener('click', (e) => {
            if (e.target === mobileSearchOverlay) {
                mobileSearchOverlay.style.opacity = '0';
                setTimeout(() => mobileSearchOverlay.style.display = 'none', 300);
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (mobileSearchBtn && window.innerWidth <= 768) {
            mobileSearchBtn.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
        }
    });
}

// =================== PRODUCT CATEGORY FILTERS ===================
function initializeProductFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.category;

            if (userDataManager.isShowingLiked) {
                userDataManager.isShowingLiked = false;
                const heartIcon = document.getElementById('heartIcon');
                if (heartIcon) heartIcon.classList.remove('showing-liked');
            }

            let visibleCount = 0;

            document.querySelectorAll('.product-card').forEach(card => {
                const cardCategory = card.dataset.category;

                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            const emptyMessage = document.getElementById('empty-liked-message');
            if (emptyMessage) emptyMessage.remove();

            showFilterResults(category, visibleCount);
        });
    });
}

function showFilterResults(category, count) {
    const categoryNames = {
        'all': 'All Products',
        'toys': 'Toys Items',
        'school': 'School Items'
    };

    const categoryName = categoryNames[category] || category;
    const message = count > 0 ?
        `Found ${count} products in ${categoryName}` :
        `No products found in ${categoryName}`;

    userDataManager.showMessage(message, "info");
}

// =================== ENHANCED IMAGE SLIDER WITH SWIPE =================== 
function initializeProductImageSliders() {
    document.querySelectorAll('.product-card').forEach(card => {
        const mediaContainer = card.querySelector('.product-images');
        const prevBtn = card.querySelector('.prev-img');
        const nextBtn = card.querySelector('.next-img');

        if (!mediaContainer || !prevBtn || !nextBtn) return;

        const mediaElements = Array.from(mediaContainer.children).filter(child => 
            !child.classList.contains('img-nav') && 
            !child.classList.contains('product-overlay') &&
            !child.classList.contains('image-dots')
        );
        
        let currentIndex = 0;
        let autoSlideInterval;
        let isVideoPlaying = false;
        
        // Add dots indicator
        if (mediaElements.length > 1) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'image-dots';
            mediaElements.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = `image-dot ${i === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    stopAutoSlide();
                    currentIndex = i;
                    showMedia(currentIndex);
                    if (!isVideoPlaying) startAutoSlide();
                });
                dotsContainer.appendChild(dot);
            });
            mediaContainer.appendChild(dotsContainer);
        }

        const validMedia = mediaElements.filter(media => {
            if (media.tagName === 'IMG') {
                return media.src && !media.src.includes('placeholder') && media.src !== window.location.href;
            } else if (media.classList.contains('video-container')) {
                return true;
            }
            return false;
        });

        if (validMedia.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            return;
        }

        function showMedia(index) {
            validMedia.forEach((media, i) => {
                media.classList.toggle('active', i === index);
                media.style.display = i === index ? 'block' : 'none';
            });
            
            // Update dots
            const dots = card.querySelectorAll('.image-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function nextSlide() {
            if (isVideoPlaying) return;
            currentIndex = (currentIndex + 1) % validMedia.length;
            showMedia(currentIndex);
        }

        function prevSlide() {
            if (isVideoPlaying) return;
            currentIndex = (currentIndex - 1 + validMedia.length) % validMedia.length;
            showMedia(currentIndex);
        }

        function startAutoSlide() {
            if (isVideoPlaying) return;
            autoSlideInterval = setInterval(nextSlide, 4000);
        }

        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }

        showMedia(currentIndex);
        startAutoSlide();

        card.addEventListener('mouseenter', stopAutoSlide);
        card.addEventListener('mouseleave', () => {
            if (!isVideoPlaying) startAutoSlide();
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stopAutoSlide();
            prevSlide();
            if (!isVideoPlaying) startAutoSlide();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stopAutoSlide();
            nextSlide();
            if (!isVideoPlaying) startAutoSlide();
        });

        // ✅ SWIPE FUNCTIONALITY
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        
        mediaContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            stopAutoSlide();
        }, { passive: true });

        mediaContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;
            
            // Only prevent scroll if horizontal swipe is dominant
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
            }
        }, { passive: false });

        mediaContainer.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Check if horizontal swipe is dominant
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            
            isDragging = false;
            if (!isVideoPlaying) startAutoSlide();
        }, { passive: true });

        // Video modal events
        document.addEventListener('video-modal-opened', () => {
            isVideoPlaying = true;
            stopAutoSlide();
        });

        document.addEventListener('video-modal-closed', () => {
            isVideoPlaying = false;
            startAutoSlide();
        });
    });
}

// =================== WISHLIST FUNCTIONALITY ===================
function initializeWishlistFunctionality() {
    document.querySelectorAll('.wishlist-icon').forEach(icon => {
        const card = icon.closest('.product-card');
        const productName = card?.querySelector('h3')?.textContent;

        if (userDataManager.isProductLiked(productName)) {
            icon.style.color = '#ff0000'; // Bright red
            icon.style.fontWeight = '900';
            icon.classList.add('liked');
            icon.classList.remove('fa-regular'); // Remove outline
            icon.classList.add('fa-solid'); // Add filled
        } else {
            icon.style.color = '#ffb3b3'; // Light pink
            icon.style.fontWeight = '400';
            icon.classList.remove('fa-solid'); // Remove filled
            icon.classList.add('fa-regular'); // Add outline
        }

        icon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const isLiked = this.classList.contains('liked');

            if (isLiked) {
                // UNLIKE - Make it outline and light
                this.style.color = '#ffb3b3';
                this.style.fontWeight = '400';
                this.classList.remove('liked');
                this.classList.remove('fa-solid');
                this.classList.add('fa-regular');
                userDataManager.removeLikedProduct(productName);
                updateLikedCountBox();

                if (userDataManager.isShowingLiked) {
                    card.style.display = 'none';

                    const remainingLiked = document.querySelectorAll('.product-card[style*="display: block"]').length;
                    if (remainingLiked === 0) {
                        userDataManager.showEmptyLikedMessage();
                    }
                }
            } else {
                // LIKE - Make it filled and bright red
                this.style.color = '#ff0000';
                this.style.fontWeight = '900';
                this.classList.add('liked');
                this.classList.remove('fa-regular');
                this.classList.add('fa-solid');

                const productData = {
                    name: productName,
                    description: card.querySelector('.product-description')?.textContent || '',
                    price: card.querySelector('.product-price')?.textContent || '',
                    image: card.querySelector('.product-img')?.src || '',
                    category: card.dataset.category || 'all'
                };

                userDataManager.addLikedProduct(productData);
                updateLikedCountBox();
            }

            this.style.transform = 'scale(1.4)';
            setTimeout(() => this.style.transform = 'scale(1)', 200);
        });
    });
}

// =================== NAVBAR ICONS FUNCTIONALITY ===================
function initializeNavbarIcons() {
    const heartIcon = document.getElementById('heartIcon');
    if (heartIcon) {
        heartIcon.addEventListener('click', () => {
            userDataManager.toggleLikedView();
        });
    }

    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            // userDataManager.showMessage("Cart feature coming soon!", "info");
        });
    }

    const userIcon = document.getElementById('userIcon');
    if (userIcon) {
        userIcon.addEventListener('click', () => {
            if (userDataManager.isLoggedIn()) {
                userDataManager.showMessage(`Hello ${userDataManager.getCurrentUserName()}! You are logged in.`, "success");
            } else if (userDataManager.isVisitorMode()) {
                userDataManager.showMessage("You are in Visitor Mode. Go to home page to create account.", "info");
            } else {
                userDataManager.showMessage("Please visit home page to login/signup", "info");
            }
        });
    }
}

// =================== CART BUTTONS - MOBILE FIX ===================
function initializeCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {

        // ✅ DESKTOP CLICK
        btn.addEventListener('click', handleBuyNowClick);

        // ✅ MOBILE TOUCH - YE BAHUT IMPORTANT HAI
        btn.addEventListener('touchend', function (e) {
            e.preventDefault(); // Default touch behavior rok do
            e.stopPropagation();
            handleBuyNowClick.call(this, e);
        });
    });
}

// ✅ COMMON FUNCTION - DESKTOP AUR MOBILE DONO KE LIYE
function handleBuyNowClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!userDataManager.isLocationVerified() || !userDataManager.isLoggedIn()) {
        userDataManager.showMessage("Please login and verify location first!", "error");
        return;
    }

    const card = this.closest('.product-card');
    if (!card) return;

    // ✅ OPEN QUANTITY PANEL FIRST
    openQuantityPanel(card);
}


// =================== FLOATING BUTTONS ===================
function initializeFloatingButtons() {
    const backToTopBtn = document.getElementById('backToTopSimple');
    const whatsappBtn = document.getElementById('whatsappFloat');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        backToTopBtn.addEventListener('mouseenter', () => {
            backToTopBtn.style.transform = 'scale(1.1)';
        });

        backToTopBtn.addEventListener('mouseleave', () => {
            backToTopBtn.style.transform = 'scale(1)';
        });
    }

    // ✅ WhatsApp Button - Sirf logged-in users ke liye
    if (whatsappBtn) {
        window.addEventListener('scroll', () => {
            const isLoggedIn = userDataManager.isLoggedIn();
            const isLocationVerified = userDataManager.isLocationVerified();

            if (window.pageYOffset > 300 && isLoggedIn && isLocationVerified) {
                whatsappBtn.style.display = 'flex';
            } else {
                whatsappBtn.style.display = 'none';
            }
        });

        whatsappBtn.addEventListener('click', () => {
            handleWhatsAppClick();
        });

        whatsappBtn.addEventListener('mouseenter', () => {
            whatsappBtn.style.transform = 'scale(1.05)';
        });

        whatsappBtn.addEventListener('mouseleave', () => {
            whatsappBtn.style.transform = 'scale(1)';
        });
    }
}

// ✅ NEW FUNCTION - CHECK IF USER IS LOGGED IN BEFORE WHATSAPP
function handleWhatsAppClick() {
    const currentUser = localStorage.getItem("abutoys_current_user");

    // Agar localStorage me data nahi hai to message show karo
    if (!currentUser || currentUser === "null" || currentUser === "" || currentUser === "visitor") {
        // Create message popup
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10002;
            max-width: 400px;
            text-align: center;
        `;
        messageDiv.innerHTML = `
            <h3 style="color: #FF6B6B; margin-bottom: 15px; font-size: 1.3rem;">⚠️ Registration Required</h3>
            <p style="color: #666; margin-bottom: 20px; font-size: 1rem;">Please register first to use WhatsApp support. Let's create your account!</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="this.closest('[style*=\\'position: fixed\\']').remove()" style="
                    padding: 10px 20px;
                    background: #ddd;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Cancel</button>
                <button onclick="window.location.href='index.html'; this.closest('[style*=\\'position: fixed\\']').remove()" style="
                    padding: 10px 20px;
                    background: #FF6B6B;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Go to Home Page</button>
            </div>
        `;

        // Add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 10001;
        `;
        overlay.addEventListener('click', () => {
            overlay.remove();
            messageDiv.remove();
        });

        document.body.appendChild(overlay);
        document.body.appendChild(messageDiv);
        return;
    }

    // Agar data hai localStorage me to normal WhatsApp function call karo
    openWhatsApp();
}

// ===== WhatsApp handler (home) - replace existing openWhatsApp / handler with this =====
function openWhatsApp() {
    // Ensure user is logged in (use existing user manager)
    const currentUser = localStorage.getItem("abutoys_current_user");
    if (!currentUser || currentUser === "null" || currentUser === "" || currentUser === "visitor") {
        showPopup("❌ Please sign up first!", "warning");
        return;
    }

    // Use stored location status (prefer userDataManager if available)
    const locStatus = (typeof userDataManager !== 'undefined') ? userDataManager.locationStatus : localStorage.getItem("abutoys_location_status");

    if (locStatus !== "in_range") {
        // Show popup asking to enable location, with Verify Now button
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%); max-width: 420px;
            background: white; padding: 20px; border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10002;
            text-align: left;
        `;
        messageDiv.innerHTML = `
            <h3 style="margin:0 0 8px; color:#FF6B6B;">⚠️ Location Unverified</h3>
            <p style="margin:0 0 12px; color:#333;">
                Sorry — your location is unverified. Please enable your location to use the WhatsApp function.
            </p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                <button id="wa_cancel_btn" style="padding:8px 12px;border-radius:8px;background:#eee;border:0;cursor:pointer;">Cancel</button>
                <button id="wa_verify_btn" style="padding:8px 12px;border-radius:8px;background:#FF6B6B;color:#fff;border:0;cursor:pointer;">Verify Now</button>
                <button id="wa_home_btn" style="padding:8px 12px;border-radius:8px;background:#4ECDC4;color:#fff;border:0;cursor:pointer;">Go to Home</button>
            </div>
        `;
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10001;`;
        overlay.addEventListener('click', () => { overlay.remove(); messageDiv.remove(); });

        document.body.appendChild(overlay);
        document.body.appendChild(messageDiv);

        document.getElementById('wa_cancel_btn').addEventListener('click', () => { overlay.remove(); messageDiv.remove(); });

        document.getElementById('wa_verify_btn').addEventListener('click', () => {
            overlay.remove(); messageDiv.remove();
            // Try to call debug verifier if available (home page has verify functions)
            if (typeof verifyUserLocation_debug === 'function') {
                try { verifyUserLocation_debug(); } catch (e) { console.warn(e); window.location.href = 'index.html'; }
            } else if (typeof verifyUserLocation === 'function') {
                try { verifyUserLocation(); } catch (e) { console.warn(e); window.location.href = 'index.html'; }
            } else {
                // fallback: go to home page where location system exists
                window.location.href = 'index.html';
            }
        });

        document.getElementById('wa_home_btn').addEventListener('click', () => {
            overlay.remove(); messageDiv.remove();
            window.location.href = 'index.html';
        });

        return;
    }

    // If here -> location is verified: open WhatsApp with prefilled message
    const userName = (typeof userDataManager !== 'undefined') ? userDataManager.getCurrentUserName() : (localStorage.getItem("abutoys_user_name") || localStorage.getItem("abutoys_current_user") || "User");
    const message = `Hii 🧸 AbuToys, My name is "${userName}"`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/8160154042?text=${encoded}`, '_blank');
}


// function openWhatsApp() {
//     const userName = userDataManager.getCurrentUserName();
//     const locationStatus = userDataManager.locationStatus;

//     let message;
//     if (locationStatus === "in_range") {
//         message = `Hi, I am ${userName}. Distance: ${userDataManager.userDistance} km. I want to purchase toys.`;
//     } else {
//         message = `Hi, I am ${userName}. Need to check delivery availability.`;
//     }

//     const encodedMessage = encodeURIComponent(message);
//     const whatsappUrl = `https://wa.me/9879254030?text=${encodedMessage}`;
//     window.open(whatsappUrl, '_blank');
// }

// =================== LOAD MORE FUNCTIONALITY ===================
function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', () => {
        const allCards = document.querySelectorAll('.product-card');
        const hiddenCards = Array.from(allCards).filter(card => card.style.display === 'none');

        if (hiddenCards.length === 0) {
            userDataManager.showMessage("All products are already loaded!", "info");
            loadMoreBtn.style.display = 'none';
            return;
        }

        const cardsToShow = hiddenCards.slice(0, 10);
        cardsToShow.forEach(card => {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease-out';
        });

        userDataManager.visibleProductsCount += cardsToShow.length;

        if (hiddenCards.length <= 10) {
            loadMoreBtn.style.display = 'none';
            userDataManager.showMessage("All products loaded!", "success");
        } else {
            userDataManager.showMessage(`Loaded ${cardsToShow.length} more products!`, "success");
        }
    });
}

// =================== PRODUCT DETAIL MODAL ===================
function openProductDetailModal(card) {
    const data = JSON.parse(card.dataset.fullData);
    
    document.getElementById('product-detail-modal')?.remove();
    
    const modal = document.createElement('div');
    modal.id = 'product-detail-modal';
    modal.className = 'product-detail-modal';

    // Sirf first image (Img1) show hogi, koi slider nahi, koi arrow nahi
    let mediaHTML = '';
    if (data.mediaItems && data.mediaItems.length > 0) {
        const first = data.mediaItems[0];
        if (first.type === 'image') {
            mediaHTML = `
                <img src="${first.src}" 
                     alt="${data.name}"
                     class="product-img active"
                     style="width:100%; height:100%; object-fit:contain; display:block;">
            `;
        }
    }

    // Baaki code same rahega, sirf arrows aur dots nahi honge
    const shouldShowPrice = userDataManager.isLoggedIn() && userDataManager.isLocationVerified() && userDataManager.userDistance <= 20;
    
    const priceHTML = shouldShowPrice ? `
        <div class="price-display" style="margin: 12px 0; padding: 15px; background: linear-gradient(135deg, #fff5f5, #ffe8e8); border-radius: 12px; text-align: center; border: 2px solid #ffe0e0;">
            <div style="font-size: 2rem; font-weight: 800; color: #FF6B6B; margin-bottom: 8px;">
                ₹${data.price.toFixed(0)}
            </div>
            ${data.oldPrice > data.price ? `
                <div style="font-size: 1rem; color: #999; text-decoration: line-through; margin-bottom: 8px;">
                    ₹${data.oldPrice.toFixed(0)}
                </div>
            ` : ''}
            ${data.deliveryCharge > 0 ? `
                <div style="font-size: 0.9rem; color: #666; margin-top: 8px; padding: 8px; background: white; border-radius: 8px;">
                    🚚 Delivery Charge: ₹${data.deliveryCharge}
                </div>
            ` : `
                <div style="font-size: 0.9rem; color: #27ae60; margin-top: 8px; padding: 8px; background: #d4edda; border-radius: 8px; font-weight: 600;">
                    🎉 FREE Delivery!
                </div>
            `}
            
            <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 8px; border: 2px dashed #FF6B6B;">
                <div style="font-size: 0.85rem; color: #666; margin-bottom: 5px;">Total Amount:</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #FF6B6B;">
                    ₹${data.totalPrice.toFixed(0)}
                </div>
            </div>
        </div>
    ` : `
        <div style="padding: 20px; background: linear-gradient(135deg, #fff3cd, #ffe8a1); border-radius: 12px; text-align: center; margin: 12px 0; border: 2px solid #ffd700;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
            <p style="color: #856404; margin: 0; font-weight: 700; font-size: 1.1rem;">Login & Verify Location</p>
            <p style="color: #856404; margin: 8px 0 0 0; font-size: 0.9rem;">to see prices and buy products</p>
        </div>
    `;
    
    const buttonsHTML = shouldShowPrice ? `
        <button class="btn modal-buy-now-btn" style="
            background: linear-gradient(45deg, #FF6B6B, #ff8787); 
            padding: 14px 30px; 
            border: none; 
            border-radius: 30px; 
            color: white; 
            font-weight: 700; 
            cursor: pointer; 
            width: 100%; 
            text-align: center; 
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: 'Poppins', sans-serif !important;
            font-size: 1.1rem;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
        ">
            <i class="fas fa-shopping-cart"></i>
            Buy Now
        </button>
    ` : `
        <button onclick="window.location.href='index.html'" style="
            background: linear-gradient(45deg, #4ECDC4, #6ee7e0); 
            padding: 14px 30px; 
            border: none; 
            border-radius: 30px; 
            color: white; 
            font-weight: 700; 
            cursor: pointer; 
            width: 100%; 
            text-align: center; 
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: 'Poppins', sans-serif !important;
            font-size: 1.1rem;
            box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
        ">
            <i class="fas fa-sign-in-alt"></i>
            Login to Buy
        </button>
    `;
    
    modal.innerHTML = `
        <div class="product-detail-content">
            <button class="product-detail-close">×</button>
            
            <div class="product-image-container" style="height: 350px; margin-bottom: 0;">
                <div class="product-images">
                    ${mediaHTML}
                </div>
                <!-- Arrows aur dots bilkul nahi daale -->
                <div class="product-overlay">
                    <i class="fa-solid fa-heart wishlist-icon" title="Add to Wishlist"></i>
                </div>
            </div>
            
            <div class="product-info" style="padding: 25px;">
                <h3 style="font-size: 1.6rem; margin-bottom: 12px; color: #333; font-weight: 700;">${data.name}</h3>
                ${data.description ? `<div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:15px;border-left:4px solid #4ECDC4;"><p class="product-description">${data.description}</p></div>` : ''}
                ${priceHTML}
                <div style="margin-top:20px;">${buttonsHTML}</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    // Close handlers same rakh sakte ho (baaki code copy-paste kar lena)
    modal.querySelector('.product-detail-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });
    
    // ESC key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModalWithAnimation();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Close modal function
    function closeModalWithAnimation() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
    
    // ✅ BUY NOW BUTTON - PROPER CARD CREATION
    const buyNowBtn = modal.querySelector('.modal-buy-now-btn');
    if (buyNowBtn) {
        const handleBuyClick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!userDataManager.isLocationVerified() || !userDataManager.isLoggedIn()) {
                userDataManager.showMessage("Please login and verify location first!", "error");
                return;
            }
            
            // Close modal
            closeModalWithAnimation();
            
            // ✅ CREATE PROPER PRODUCT CARD - WITH ALL REQUIRED DATA
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.originalPrice = data.price.toString();
            productCard.dataset.category = data.category;
            
            // ✅ CREATE COMPLETE CARD STRUCTURE
            let cardMediaHTML = '';
            if (data.mediaItems && data.mediaItems.length > 0) {
                data.mediaItems.forEach((media, idx) => {
                    if (media.type === 'image') {
                        cardMediaHTML += `
                            <img src="${media.src}" 
                                 alt="${data.name}"
                                 class="product-img ${idx === 0 ? 'active' : ''}"
                                 loading="lazy">
                        `;
                    }
                });
            }
            
            productCard.innerHTML = `
                <div class="product-image-container">
                    <div class="product-images">
                        ${cardMediaHTML || '<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;">No Image</div>'}
                    </div>
                </div>
                <div class="product-info">
                    <h3>${data.name}</h3>
                    <p class="product-description">${data.description || ''}</p>
                    <div class="product-price">₹${data.price.toFixed(0)}</div>
                </div>
            `;
            
            // ✅ OPEN QUANTITY PANEL WITH PROPER CARD
            setTimeout(() => {
                openQuantityPanel(productCard);
            }, 100);
        };
        
        // Click event
        buyNowBtn.addEventListener('click', handleBuyClick);
        
        // Touch event for mobile
        buyNowBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            handleBuyClick(e);
        });
    }
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Initialize modal features
    setTimeout(() => {
        initializeProductImageSliders();
        initializeWishlistFunctionality();
    }, 150);
}

// =================== GOOGLE SHEETS PRODUCT LOADING ===================
// ✅ REPLACE YOUR OLD loadProductsFromSheet FUNCTION WITH THIS

async function loadProductsFromSheet() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNpkT1YEuvannOK0u_zPu0HUOiGI9IoF4_GaZqi7Y9E_1H9_PGXBv-NvrviZuvF8EWfw/exec";
    const OPENSHEET_URL = "https://opensheet.vercel.app/1LaF1JFdRSGhNvonfo8-G3mHEXIA5-ulPl_4JlIAOAfc/AbuToys";
    const grid = document.getElementById("products-grid");

    // CHECK CACHE
    const cachedProducts = localStorage.getItem("abutoys_cached_products");
    if (cachedProducts) {
        const data = JSON.parse(cachedProducts);
        renderProductsWithPrice(data);
        return;
    }

    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="font-size: 3rem; margin-bottom: 20px; animation: spin 1s linear infinite;">🔄</div>
            <p style="font-size: 1.2rem; color: #666;">Loading products from Excel...</p>
        </div>
    `;

    try {
        let response;
        let data;

        try {
            response = await fetch(SCRIPT_URL);
            data = await response.json();
        } catch (error) {
            console.log("Apps Script failed, trying OpenSheet...");
            response = await fetch(OPENSHEET_URL);
            data = await response.json();
        }

        grid.innerHTML = "";

        // ✅ FILTER ACTIVE PRODUCTS
        const activeProducts = data.filter(item => item.Active === '✅');

        // Shuffle
        for (let i = activeProducts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [activeProducts[i], activeProducts[j]] = [activeProducts[j], activeProducts[i]];
        }

        // ✅ RENDER WITH PROPER PRICE LOGIC
        activeProducts.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "product-card";

            let category = 'all';
            if (item.Cat) {
                const catLower = item.Cat.toLowerCase().trim();
                if (catLower.includes('toy')) {
                    category = 'toys';
                } else if (catLower.includes('school')) {
                    category = 'school';
                }
            }

            card.dataset.category = category;
            card.dataset.originalPrice = item.Price || "0";
            card.style.display = index < 10 ? 'block' : 'none';

            // ✅ MEDIA ITEMS
            const mediaItems = [];
            if (item.Img1) mediaItems.push({ type: 'image', src: item.Img1 });
            if (item.Img2) mediaItems.push({ type: 'image', src: item.Img2 });
            if (item.Img3) mediaItems.push({ type: 'image', src: item.Img3 });
            if (item.Img4) mediaItems.push({ type: 'image', src: item.Img4 });

            if (item.Video && item.Video.toString().trim() !== '') {
                let videoSrc = item.Video.toString().trim();
                if (videoSrc.includes('youtube.com/watch?v=')) {
                    const videoId = videoSrc.split('watch?v=')[1].split('&')[0];
                    videoSrc = 'https://www.youtube.com/embed/' + videoId;
                } else if (videoSrc.includes('youtu.be/')) {
                    const videoId = videoSrc.split('youtu.be/')[1].split('?')[0];
                    videoSrc = 'https://www.youtube.com/embed/' + videoId;
                }
                mediaItems.push({ type: 'video', src: videoSrc });
            }

            let mediaHTML = '';
            mediaItems.forEach((media, idx) => {
                if (media.type === 'image') {
                    mediaHTML += `
            <img src="${media.src}" 
                 alt="${item.Name || 'Product'}"
                 class="product-img ${idx === 0 ? 'active' : ''}"
                 onerror="this.style.display='none'" 
                 loading="lazy">
        `;
                } else {
                    const isYouTube = media.src.includes('youtube.com/embed');
                    mediaHTML += `
            <div class="video-container ${idx === 0 ? 'active' : ''}" 
                 data-video-src="${media.src}" 
                 data-video-type="${isYouTube ? 'youtube' : 'direct'}">
                <div class="video-thumbnail">
                    <i class="fas fa-play-circle video-play-icon"></i>
                    <span class="video-label">🎬 Play Video</span>
                </div>
            </div>
        `;
                }
            });

            // ✅ PRICE LOGIC - ALWAYS SHOW (No login check)
            const originalPrice = parseFloat(item.Price || 0);

            // Try different variations of Old Price column
            let oldPriceValue = 0;
            if (item["Old Price"]) {
                oldPriceValue = parseFloat(item["Old Price"]) || 0;
            } else if (item["OldPrice"]) {
                oldPriceValue = parseFloat(item["OldPrice"]) || 0;
            } else if (item["old_price"]) {
                oldPriceValue = parseFloat(item["old_price"]) || 0;
            }

            const deliveryCharge = userDataManager.deliveryCharge || 0;
            const totalPrice = originalPrice + deliveryCharge;

            // ✅ PRICE SIRF LOGGED IN + LOCATION VERIFIED USER KO DIKHAO
            const shouldShowPrice = userDataManager.isLoggedIn() &&
                userDataManager.isLocationVerified() &&
                userDataManager.userDistance <= 20;

            const priceHTML = shouldShowPrice ? `
    <div class="price-display" style="margin: 12px 0; padding: 12px; background: #fcececff; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: #FF6B6B;">
            ₹${originalPrice.toFixed(0)}
        </div>
        ${oldPriceValue > originalPrice ? `
            <div style="font-size: 0.95rem; color: #999; text-decoration: line-through;">
                ₹${oldPriceValue.toFixed(0)}
            </div>
        ` : ''}
        ${deliveryCharge > 0 ? `
            <div style="font-size: 0.85rem; color: #666; margin-top: 6px;">
                🚚 + ₹${deliveryCharge} Delivery
            </div>
        ` : `
            <div style="font-size: 0.85rem; color: #27ae60; margin-top: 6px;">
                🎉 Free Delivery
            </div>
        `}
        
        <div class="total-price" style="font-size: 1rem; margin-top: 6px; font-weight: 700; color: #333;">
            Total: ₹${totalPrice}
        </div>
    </div>
` : `
    <div style="padding: 15px; background: #fff3cd; border-radius: 8px; text-align: center; margin: 12px 0;">
        <p style="color: #856404; margin: 0; font-weight: 600;">🔒 Login & Verify Location to See Price</p>
    </div>
`;


            const buttonsHTML = shouldShowPrice ? `
    <button class="btn add-to-cart-btn" data-product-name="${item.Name || 'Product'}" style="background: #f88787ff; padding: 10px 20px; border: none; border-radius: 25px; color: white; font-weight: 600; cursor: pointer; width: 100%; text-align: center; display: block; font-family: 'Poppins', sans-serif !important;">
        Buy Now
    </button>
` : `
    <button onclick="window.location.href='index.html'" style="background: #4ECDC4; padding: 10px 20px; border: none; border-radius: 25px; color: white; font-weight: 600; cursor: pointer; width: 100%; text-align: center; display: block; font-family: 'Poppins', sans-serif !important;">
        Login to Buy
    </button>
`;

            // ✅ COMPACT CARD HTML - Grid View
const compactCardHTML = `
    <div class="product-image-container">
        <div class="product-images">
            ${mediaHTML}
        </div>
        <button class="img-nav prev-img">◀</button>
        <button class="img-nav next-img">▶</button>
        <div class="product-overlay">
            <i class="fa-solid fa-heart wishlist-icon" title="Add to Wishlist"></i>
        </div>
    </div>
    <div class="product-info">
        <h3>${item.Name || "Product"}</h3>
        <button class="view-product-btn">
            <i class="fas fa-eye"></i>
            View Product
        </button>
    </div>
`;
card.innerHTML = compactCardHTML;

// Handle View Product button click
const viewBtn = card.querySelector('.view-product-btn');
if (viewBtn) {
    viewBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openProductDetailModal(card);
    });
}

// Remove old card click handler and replace with this:
// (Keep wishlist and nav button exceptions)
// card.addEventListener('click', function(e) {
//     if (e.target.closest('.wishlist-icon') || 
//         e.target.closest('.img-nav') ||
//         e.target.closest('.view-product-btn')) {
//         return;
//     }
//     // Do nothing - only View Product button opens modal
// });

// ✅ STORE FULL DATA IN DATASET
card.dataset.fullData = JSON.stringify({
    name: item.Name || "Product",
    description: item.Desc || "",
    price: originalPrice,
    oldPrice: oldPriceValue,
    deliveryCharge: deliveryCharge,
    totalPrice: totalPrice,
    mediaItems: mediaItems,
    category: category
});

// // ✅ CARD CLICK -> OPEN DETAIL MODAL
// card.addEventListener('click', function(e) {
//     // Ignore clicks on wishlist/nav buttons
//     if (e.target.closest('.wishlist-icon') || 
//         e.target.closest('.img-nav') ||
//         e.target.closest('.product-img')) {
//         return;
//     }
    
//     openProductDetailModal(this);
// });

grid.appendChild(card);
        });

        console.log(`Loaded ${activeProducts.length} products successfully!`);

        userDataManager.allProducts = activeProducts;
        userDataManager.updateProductCards();
        initializeProductImageSliders();
        initializeWishlistFunctionality();
        initializeCartButtons();
        initializeImageModal();

        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = activeProducts.length > 9 ? 'block' : 'none';
        }

        userDataManager.showMessage(`${Math.min(10, activeProducts.length)} products loaded successfully!`, "success");

    } catch (error) {
        console.error("Error loading products:", error);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff3f3; border-radius: 20px; border: 2px dashed #e74c3c;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #e74c3c;">⚠️</div>
                <h3 style="color: #e74c3c; margin-bottom: 15px;">Failed to load products</h3>
                <p style="color: #666; margin-bottom: 20px;">Please check your internet connection or try again later.</p>
                <button onclick="loadProductsFromSheet()" style="
                    padding: 12px 25px; background: #e74c3c; color: white; border: none;
                    border-radius: 25px; cursor: pointer; font-weight: 600;
                ">Try Again</button>
            </div>
        `;
    }
}

// Helper function for rendering
function renderProductsWithPrice(data) {
    const grid = document.getElementById("products-grid");
    grid.innerHTML = "";

    data.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.display = index < 9 ? 'block' : 'none';

        const originalPrice = parseFloat(item.Price || 0);
        let oldPriceValue = parseFloat(item["Old Price"] || item["OldPrice"] || item["old_price"] || 0);

        const priceHTML = `
    <div class="price-container">
        <div class="product-price" style="display: flex; align-items: center; gap: 8px;">
            <span class="current-price" style="font-size: 1.5rem; font-weight: 700; color: #FF6B6B;">
                ₹${originalPrice.toFixed(0)}
            </span>
            ${oldPriceValue > originalPrice ? `
                <span class="old-price" style="text-decoration: line-through; color: #999; font-size: 1.1rem;">
                    ₹${oldPriceValue.toFixed(0)}
                </span>
            ` : ''}
        </div>
    </div>
`;

        card.innerHTML = `<div class="product-info">${priceHTML}</div>`;
        grid.appendChild(card);
    });
}

// =================== CSS STYLES FOR PRODUCTS ===================
function addProductStyles() {
    const style = document.createElement('style');
    style.textContent = `

        /* Old - Only body */
body {
    font-family: 'Poppins', sans-serif !important;
}

/* New - Everything */
* {
    font-family: 'Poppins', sans-serif !important;
}
        /* Modal CSS - Must be hidden initially */
        .image-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 10px;
        }
        
        .close-btn {
            position: absolute;
            top: 20px;
            right: 40px;
            color: white;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close-btn:hover {
            color: #FF6B6B;
        }
     
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }

            // CSS me ye animations add kar - addProductStyles() function me
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
}

@keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
        .qty-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

        .product-card {
            animation: fadeInUp 0.6s ease-out;
        }

        /* ✅ BUY NOW BUTTON - MOBILE FIX */
        .add-to-cart-btn {
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            position: relative !important;
            z-index: 10 !important;
            pointer-events: auto !important;
        }

        .add-to-cart-btn:hover {
            background: #FF6B6B !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px #f56666ff;
        }

        /* ✅ ORDER PANEL - SCROLL BAR HIDE */
        #order-panel::-webkit-scrollbar {
            display: none;
        }

        #order-panel {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        #order-panel > div::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }

        #order-panel > div {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .showing-liked {
            color: red !important;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        /* ✅ VIDEO THUMBNAIL IN PRODUCT CARD */
        .video-container {
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15px;
            overflow: hidden;
            cursor: pointer;
        }

        .video-thumbnail {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            width: 100%;
            height: 100%;
            transition: all 0.3s ease;
        }

        .video-container:hover .video-thumbnail {
            transform: scale(1.05);
        }

        .video-play-icon {
            font-size: 80px;
            opacity: 0.9;
            transition: all 0.3s;
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
        }

        .video-container:hover .video-play-icon {
            transform: scale(1.2);
            opacity: 1;
        }

        .video-label {
            margin-top: 15px;
            font-size: 18px;
            font-weight: 600;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        /* ✅ FULLSCREEN VIDEO MODAL */
        #video-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        #video-modal.active {
            display: flex;
            opacity: 1;
        }

        .video-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 1;
        }

        .video-modal-content {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            padding: 60px 20px 20px;
        }

        .video-player-wrapper {
            width: 100%;
            max-width: 1400px;
            aspect-ratio: 16/9;
            background: #000;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
        }

        .video-player-wrapper iframe,
        .video-player-wrapper video {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        .video-close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #333;
            transition: all 0.3s ease;
            z-index: 3;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .video-close-btn:hover {
            background: #FF6B6B;
            color: white;
            transform: rotate(90deg) scale(1.1);
        }

        .video-close-btn i {
            pointer-events: none;
        }

        /* Prevent video download */
        video::-webkit-media-controls-download-button {
            display: none !important;
        }

        video::-webkit-media-controls-enclosure {
            overflow: hidden;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .video-play-icon {
                font-size: 60px;
            }
            
            .video-label {
                font-size: 16px;
            }

            .video-modal-content {
                padding: 70px 10px 10px;
            }

            .video-player-wrapper {
                max-width: 100%;
                border-radius: 5px;
            }

            .video-close-btn {
                width: 45px;
                height: 45px;
                top: 15px;
                right: 15px;
                font-size: 20px;
            }
                .add-to-cart-btn {
                min-height: 44px !important;
                font-size: 1rem !important;
            }

            #order-panel {
                padding: 10px;
            }

            #order-panel > div {
                padding: 20px;
                max-height: 95vh;
            }
        }

        @media (max-width: 480px) {
            .video-play-icon {
                font-size: 50px;
            }
            
            .video-label {
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(style);
}

// =================== INITIALIZATION ===================
document.addEventListener("DOMContentLoaded", () => {
    addProductStyles();

    initializeMobileNavigation();
    initializeNavbarScrollEffect();
    initializeSearchFunctionality();
    initializeProductFilters();
    initializeNavbarIcons();
    initializeFloatingButtons();
    initializeLoadMore();
    initializeVideoPlayers();

    loadProductsFromSheet();

    userDataManager.updateCartCount();
});

// =================== AUTO REFRESH FUNCTIONALITY ===================
setInterval(() => {
    console.log("Auto refreshing products...");
    loadProductsFromSheet();
}, 5 * 60 * 1000);


// =================== FULLSCREEN IMAGE VIEWER ===================
function initializeImageModal() {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.querySelector(".close-btn");

    // Ensure modal is hidden initially
    if (modal) {
        modal.style.display = "none";
    }

    // product images par click → modal open
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("product-img")) {
            modal.style.display = "flex";
            modalImg.src = e.target.src;
        }
    });

    // ✖ close button
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // background click par close
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    // ESC key par bhi close ho
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal) {
            modal.style.display = "none";
        }
    });
}


// =================== FONT AWESOME ICON FIX ===================
document.addEventListener('DOMContentLoaded', () => {
    // Force Font Awesome to load properly
    const icons = document.querySelectorAll('.fa-solid, .fab, .fas, .fa-regular, .fa-brands');
    icons.forEach(icon => {
        // Ensure proper font family
        icon.style.fontFamily = '"Font Awesome 6 Free", "Font Awesome 6 Brands"';
        icon.style.fontWeight = '900';
    });
});

// =================== VIDEO PLAYER FUNCTIONALITY ===================
// Create video modal only once
function initializeVideoPlayers() {
    // Create video modal only once
    if (!document.getElementById('video-modal')) {
        const modal = document.createElement('div');
        videoModalState = modal; // YE LINE ADD KAR
        modal.id = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-overlay"></div>
            <div class="video-modal-content">
                <button class="video-close-btn">
                    <i class="fas fa-times"></i>
                </button>
                <div class="video-player-wrapper" id="video-player-wrapper"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const overlay = modal.querySelector('.video-modal-overlay');
        const closeBtn = modal.querySelector('.video-close-btn');
        const playerWrapper = modal.querySelector('#video-player-wrapper');

        // Close button click
        closeBtn.addEventListener('click', () => {
            closeVideoModal();
        });

        // Overlay click to close
        overlay.addEventListener('click', () => {
            closeVideoModal();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeVideoModal();
            }
        });

        function closeVideoModal() {
            modal.classList.remove('active');
            playerWrapper.innerHTML = ''; // Clear video/iframe
            document.body.style.overflow = ''; // Re-enable scroll
            document.dispatchEvent(new Event('video-modal-closed'));
        }
    }

    // Handle video thumbnail clicks
    document.addEventListener('click', function (e) {
        const thumbnail = e.target.closest('.video-thumbnail');
        if (!thumbnail) return;

        e.stopPropagation();
        e.preventDefault();

        const container = thumbnail.closest('.video-container');
        const videoSrc = container.dataset.videoSrc;
        const videoType = container.dataset.videoType;

        openVideoModal(videoSrc, videoType);
    });
}

function openVideoModal(videoSrc, videoType) {
    const modal = document.getElementById('video-modal');
    const playerWrapper = modal.querySelector('#video-player-wrapper');

    // Clear previous content
    playerWrapper.innerHTML = '';

    if (videoType === 'youtube') {
        // YouTube iframe - LANDSCAPE + PORTRAIT DONO KE LIYE
        const iframe = document.createElement('iframe');
        iframe.src = videoSrc + (videoSrc.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Sahi sizing
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.display = 'block';

        playerWrapper.appendChild(iframe);
    } else {
        // Direct video file
        const video = document.createElement('video');
        video.src = videoSrc;
        video.controls = true;
        video.controlsList = 'nodownload';
        video.autoplay = true;

        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.display = 'block';

        playerWrapper.appendChild(video);
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new Event('video-modal-opened'));
}

// Add this function at end of toyproduct.js aur console me run kar
function debugPriceData() {
    console.log("========== DEBUGGING PRICE DATA ==========");

    // Check localStorage cache
    const cachedProducts = localStorage.getItem("abutoys_cached_products");
    if (cachedProducts) {
        const data = JSON.parse(cachedProducts);

        if (data.length > 0) {
            console.log("✅ Cache found with " + data.length + " products");
            console.log("\n========== FIRST PRODUCT ==========");
            console.log(JSON.stringify(data[0], null, 2));

            console.log("\n========== PRICE FIELDS ==========");
            console.log("Price: '" + data[0].Price + "' (Type: " + typeof data[0].Price + ")");
            console.log("Old Price: '" + data[0]["Old Price"] + "' (Type: " + typeof data[0]["Old Price"] + ")");

            console.log("\n========== ALL KEYS ==========");
            console.log(Object.keys(data[0]).join(", "));

            // Check if price is stored as string or number
            const price = parseFloat(data[0].Price || 0);
            const oldPrice = parseFloat(data[0]["Old Price"] || 0);
            console.log("\n========== PARSED VALUES ==========");
            console.log("Parsed Price: " + price);
            console.log("Parsed Old Price: " + oldPrice);
        }
    } else {
        console.log("❌ No cache found");
    }
}

// Apps Script me bhi ye test function add kar
function debugAppsScript() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AbuToys");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    console.log("========== HEADER NAMES ==========");
    headers.forEach((h, i) => {
        console.log(`${i}: "${h}" (Length: ${h.toString().length})`);
    });

    console.log("\n========== FIRST ROW DATA ==========");
    const row = data[1];
    headers.forEach((h, i) => {
        console.log(`${h}: "${row[i]}"`);
    });

    // Check specifically for Price columns
    const priceIndex = headers.findIndex(h => h.toString().toLowerCase().includes('price'));
    const oldPriceIndex = headers.findIndex(h => h.toString().toLowerCase().includes('old'));

    console.log("\n========== PRICE COLUMN INDICES ==========");
    console.log("Price column at index: " + priceIndex);
    console.log("Old Price column at index: " + oldPriceIndex);
}

function updateWhatsAppButtonVisibility() {
    const whatsappBtn = document.getElementById("whatsappFloat");

    const user = localStorage.getItem("abutoys_current_user");

    if (!user || user === "null" || user === "visitor") {
        whatsappBtn.style.display = "none";   // ❌ User not logged → hide
    } else {
        whatsappBtn.style.display = "flex";   // ✔ User logged → show
    }
}

function updateProductPriceVisibility() {
    const isLoggedIn = userDataManager.isLoggedIn();
    const isLocationVerified = userDataManager.isLocationVerified();
    const userDistance = userDataManager.userDistance;

    const shouldShow = isLoggedIn && isLocationVerified && userDistance <= 20;

    document.querySelectorAll(".price-display").forEach(e => {
        e.style.display = shouldShow ? "block" : "none";
    });

    document.querySelectorAll(".product-price").forEach(e => {
        e.style.display = shouldShow ? "block" : "none";
    });

    document.querySelectorAll(".old-price").forEach(e => {
        e.style.display = shouldShow ? "inline-block" : "none";
    });

    document.querySelectorAll(".delivery-info").forEach(e => {
        e.style.display = shouldShow ? "block" : "none";
    });

    document.querySelectorAll(".total-price").forEach(e => {
        e.style.display = shouldShow ? "block" : "none";
    });

    // 🔥 BUY NOW BUTTON – inline CSS ko override karne ke liye !important lagaya
    document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
        btn.style.setProperty("display", shouldShow ? "flex" : "none", "important");
    });
}


setInterval(() => {
    updateWhatsAppButtonVisibility();
    updateProductPriceVisibility();
}, 1000);

// ✅ AUTO REFRESH CART PANEL
setInterval(() => {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
        // Panel open hai to refresh kar
        orderManager.fetchOrdersFromSheetInstant(cartPanel);
    }
}, 30 * 1000); // ✅ 30 SECOND ME CHECK KARO

// ✅ AUTO CANCEL WATCHER - 1 HOUR PAYMENT DEADLINE
setInterval(() => {
    try {
        const orders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");
        let changed = false;
        const now = Date.now();

        for (let i = 0; i < orders.length; i++) {
            const o = orders[i];

            // ✅ AUTO-CANCEL: Payment deadline cross + payment not ok
            if (o.paymentStatus !== 'ok' && o.paymentDeadline) {
                if (now > o.paymentDeadline) {
                    if (o.status !== 'Cancelled') {
                        o.status = 'Cancelled';
                        changed = true;
                        console.log(`❌ Auto-cancelled order: ${o.orderCode}`);
                    }
                }
            }
        }

        if (changed) {
            localStorage.setItem("abutoys_orders", JSON.stringify(orders));
            orderManager.updateCartBadge();
        }
    } catch (err) {
        console.warn('Auto-cancel watcher error:', err);
    }
}, 30 * 1000); // ✅ Har 30 seconds check

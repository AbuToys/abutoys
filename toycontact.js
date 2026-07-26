// =================== USER DATA MANAGER ===================
class UserDataManager {
    constructor() {
        this.currentUser = localStorage.getItem("abutoys_current_user");
        this.userLocation = JSON.parse(localStorage.getItem("abutoys_user_location") || "null");
        this.locationStatus = localStorage.getItem("abutoys_location_status") || "unknown";
        this.deliveryCharge = parseFloat(localStorage.getItem("abutoys_delivery_charge") || "0");
        this.userDistance = parseFloat(localStorage.getItem("abutoys_user_distance") || "0");
        this.init();
    }

    init() {
        this.updateUserDisplay();
        this.syncWithHomePage();
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

    getCurrentUserName() {
        if (this.currentUser && this.currentUser !== "visitor") {
            const user = this.getUser(this.currentUser);
            return user ? user.fullName : "User";
        }
        return "Visitor";
    }

    updateUserDisplay() {
        const userNameDisplay = document.getElementById("userNameDisplay");

        if (userNameDisplay) {
            if (this.currentUser && (this.isLoggedIn() || this.isVisitorMode())) {
                const name = this.getCurrentUserName();
                userNameDisplay.textContent = `Hello ${name}!`;
                userNameDisplay.style.display = "block";
            } else {
                userNameDisplay.style.display = "none";
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
                updateWhatsAppButtonVisibility();
            }
        }, 1000);
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
}

// Initialize user data manager
const userDataManager = new UserDataManager();

// =================== MOBILE NAVIGATION ===================
function initializeMobileNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        navMenu.classList.remove('active');
                        hamburger.classList.remove('active');
                        setTimeout(() => {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 300);
                    }
                } else {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
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

// =================== NAVBAR ICONS FUNCTIONALITY ===================
function initializeNavbarIcons() {
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            const orders = JSON.parse(localStorage.getItem("abutoys_orders") || "[]");
            
            if (orders.length === 0) {
                showAlreadyCleanedPopup();
                return;
            }
            
            showClearOrderOverlay();
        });
    }

    const deleteAccountIcon = document.getElementById('deleteAccountIcon');
    if (deleteAccountIcon) {
        deleteAccountIcon.addEventListener('click', () => {
            const currentUser = localStorage.getItem("abutoys_current_user");
            
            if (!currentUser || currentUser === "null" || currentUser === "" || currentUser === "visitor") {
                showPopup("⚠️ Please create account first to delete account!", "error");
                return;
            }
            
            showDeleteAccountOverlay();
        });
    }
}

// =================== POPUP SYSTEM ===================
function showPopup(message, type = "info") {
    const old = document.getElementById("custom-popup");
    if (old) old.remove();

    const colors = {
        success: { bg: "#4CAF50", text: "#fff" },
        error: { bg: "#f44336", text: "#fff" },
        warning: { bg: "#ff9800", text: "#fff" },
        info: { bg: "#2196F3", text: "#fff" }
    };

    const color = colors[type] || colors.info;

    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;
        z-index:10001; overflow: auto;
    `;
    popup.innerHTML = `
        <div style="background:${color.bg}; color:${color.text}; padding:1.6rem; border-radius:14px; max-width:420px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); margin: auto; text-align: center;">
            <p style="margin-bottom: 1rem;">${message}</p>
            <button id="popup-ok" style="margin-top:0.6rem; padding:8px 16px; border:none; border-radius:8px; background:rgba(255,255,255,0.9); color:#333; cursor:pointer; font-weight:bold;">OK</button>
        </div>
    `;

    popup.querySelector("#popup-ok").addEventListener("click", () => popup.remove());
    setTimeout(() => {
        const el = document.getElementById("custom-popup");
        if (el) el.remove();
    }, 5000);

    document.body.appendChild(popup);
}

function showAlreadyCleanedPopup() {
    const box = document.createElement("div");
    box.style.cssText = `
        position: fixed; inset:0; display:flex;
        align-items:center; justify-content:center;
        z-index:999999; background:rgba(0,0,0,0.7);
    `;

    box.innerHTML = `
        <div style="
            background:white; padding:25px; border-radius:12px;
            width:90%; max-width:350px; text-align:center;
            animation: fadeIn 0.3s ease-out;
        ">
            <h2 style="color:#4ECDC4; margin-bottom:10px;">✨ Clean Already!</h2>
            <p style="color:#444; font-size:1rem; margin-bottom:20px;">
                You already cleaned your order history.  
                There are no orders to delete.
            </p>
            <button id="cleanedOkBtn" style="
                background:#4ECDC4; color:white; border:none;
                padding:10px 20px; border-radius:8px; cursor:pointer;
                font-weight:600;
            ">OK</button>
        </div>
    `;

    document.body.appendChild(box);
    document.getElementById("cleanedOkBtn").onclick = () => box.remove();
}

function showClearOrderOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.8);
        display: flex; align-items: center; justify-content: center;
        z-index: 999999;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: #fff; width: 90%; max-width: 380px;
            padding: 25px; border-radius: 12px;
            text-align: center; animation: fadeIn 0.3s ease-out;
        ">
            <h2 style="color:#FF6B6B; margin-bottom: 15px;">⚠️ Confirm Action</h2>
            <p style="color:#333; font-size: 1rem; margin-bottom: 25px;">
                Are you sure?<br>
                All your order history cards will be permanently deleted.
            </p>
            <div style="display:flex; gap: 15px; justify-content:center;">
                <button id="cancelClearBtn" style="
                    background:#ccc; border:none; padding:10px 18px;
                    border-radius:8px; cursor:pointer; font-weight:600;
                ">Cancel</button>
                <button id="sureClearBtn" style="
                    background:#FF6B6B; color:white; border:none;
                    padding:10px 18px; border-radius:8px;
                    cursor:pointer; font-weight:600;
                ">Sure</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('cancelClearBtn').addEventListener('click', () => overlay.remove());
    document.getElementById('sureClearBtn').addEventListener('click', () => {
        localStorage.removeItem("abutoys_orders");
        overlay.remove();
        showPopup("✅ Order history cleared!", "success");
    });
}

function showDeleteAccountOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10005; padding: 20px;
    `;

    overlay.innerHTML = `
        <div style="
            background: white; border-radius: 20px; padding: 40px;
            max-width: 450px; width: 100%; text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            animation: slideUp 0.4s ease-out;
        ">
            <div style="font-size: 3.5rem; margin-bottom: 20px; color: #FF6B6B;">⚠️</div>
            <h2 style="color: #333; font-size: 1.8rem; margin-bottom: 15px;
                font-family: 'Fredoka One', cursive;">Delete Account?</h2>
            <p style="color: #666; font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
                ⚠️ <strong>Warning:</strong> This will permanently remove all your data.
                This action cannot be undone! 🔒
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="cancelDeleteBtn" style="padding: 12px 30px; background: #e0e0e0;
                    border: none; border-radius: 25px; cursor: pointer; font-weight: 600;
                    font-size: 1rem;">✕ Cancel</button>
                <button id="confirmDeleteBtn" style="padding: 12px 30px; background: #FF6B6B;
                    color: white; border: none; border-radius: 25px; cursor: pointer;
                    font-weight: 600; font-size: 1rem;">🗑️ Delete Account</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => overlay.remove());
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        const currentUser = localStorage.getItem("abutoys_current_user");
        
        try {
            localStorage.removeItem(`abutoys_user_${currentUser}`);
            localStorage.removeItem("abutoys_current_user");
            localStorage.removeItem("abutoys_user_location");
            localStorage.removeItem("abutoys_location_status");
            localStorage.removeItem("abutoys_delivery_charge");
            localStorage.removeItem("abutoys_user_distance");
        } catch (e) {
            console.log("Error deleting data:", e);
        }

        overlay.remove();
        showPopup("✅ Account deleted successfully!", "success");
        
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
    });
}

// =================== CONTACT FORM HANDLING ===================
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    const phoneInput = document.getElementById('phone');

    // Phone number validation (only digits, max 10)
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value.trim()
            };

            // Validation
            if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
                showPopup("⚠️ Please fill all fields!", "warning");
                return;
            }

            if (formData.phone.length !== 10) {
                showPopup("⚠️ Phone number must be 10 digits!", "warning");
                return;
            }

            // Show loading
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Simulate sending (replace with actual API call)
            setTimeout(() => {
                showPopup("✅ Message sent successfully! We'll get back to you soon.", "success");
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
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

// =================== WHATSAPP FUNCTIONALITY ===================
function handleWhatsAppClick() {
    const currentUser = localStorage.getItem("abutoys_current_user");

    if (!currentUser || currentUser === "null" || currentUser === "" || currentUser === "visitor") {
        showPopup("⚠️ Please register first to use WhatsApp support!", "warning");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
        return;
    }

    openWhatsApp();
}

function openWhatsApp() {
    const locStatus = userDataManager.locationStatus;

    if (locStatus !== "in_range") {
        showPopup("⚠️ Location unverified. Please verify your location on home page first.", "warning");
        return;
    }

    const userName = userDataManager.getCurrentUserName();
    const message = `Hii 🧸 AbuToys, My name is "${userName}"`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919879254030?text=${encoded}`, '_blank');
}

function updateWhatsAppButtonVisibility() {
    const whatsappBtn = document.getElementById("whatsappFloat");
    const user = localStorage.getItem("abutoys_current_user");

    if (!whatsappBtn) return;

    if (!user || user === "null" || user === "visitor") {
        whatsappBtn.style.display = "none";
    } else {
        const isLocationVerified = userDataManager.isLocationVerified();
        if (window.pageYOffset > 300 && isLocationVerified) {
            whatsappBtn.style.display = "flex";
        }
    }
}

// =================== SMOOTH SCROLL FOR ANCHOR LINKS ===================
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// =================== SCROLL ANIMATIONS ===================
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.contact-card, .info-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// =================== INITIALIZATION ===================
document.addEventListener("DOMContentLoaded", () => {
    initializeMobileNavigation();
    initializeNavbarScrollEffect();
    initializeNavbarIcons();
    initializeContactForm();
    initializeFloatingButtons();
    initializeSmoothScroll();
    initializeScrollAnimations();
    
    userDataManager.updateUserDisplay();
});

// =================== AUTO SYNC ===================
setInterval(() => {
    updateWhatsAppButtonVisibility();
}, 1000);
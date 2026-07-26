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

        // Nav links click pe menu close ho
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Agar link "#" se start hota hai aur same page hai
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
                    // External link hai to sirf menu close karo
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            });
        });

        // Click outside to close
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
    const heartIcon = document.getElementById('heartIcon');
    if (heartIcon) {
        heartIcon.addEventListener('click', () => {
            localStorage.setItem('abutoys_show_liked_from_home', '1');
            window.location.href = 'toyproduct.html';
        });
    }

    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'toyproduct.html';
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

// =================== WHATSAPP FUNCTIONALITY ===================
function handleWhatsAppClick() {
    const currentUser = localStorage.getItem("abutoys_current_user");

    if (!currentUser || currentUser === "null" || currentUser === "" || currentUser === "visitor") {
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

    openWhatsApp();
}

function openWhatsApp() {
    const locStatus = userDataManager.locationStatus;

    if (locStatus !== "in_range") {
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
                Sorry – your location is unverified. Please enable your location to use the WhatsApp function.
            </p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                <button id="wa_cancel_btn" style="padding:8px 12px;border-radius:8px;background:#eee;border:0;cursor:pointer;">Cancel</button>
                <button id="wa_home_btn" style="padding:8px 12px;border-radius:8px;background:#4ECDC4;color:#fff;border:0;cursor:pointer;">Go to Home</button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10001;`;
        overlay.addEventListener('click', () => { overlay.remove(); messageDiv.remove(); });

        document.body.appendChild(overlay);
        document.body.appendChild(messageDiv);

        document.getElementById('wa_cancel_btn').addEventListener('click', () => { 
            overlay.remove(); 
            messageDiv.remove(); 
        });

        document.getElementById('wa_home_btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        return;
    }

    const userName = userDataManager.getCurrentUserName();
    const message = `Hii 🧸 AbuToys, My name is "${userName}"`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/8160154042?text=${encoded}`, '_blank');
}

// =================== UPDATE WHATSAPP BUTTON VISIBILITY ===================
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

    document.querySelectorAll('.mission-card, .value-card, .choose-item, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
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

// =================== INITIALIZATION ===================
document.addEventListener("DOMContentLoaded", () => {
    initializeMobileNavigation();
    initializeNavbarScrollEffect();
    initializeNavbarIcons();
    initializeFloatingButtons();
    initializeScrollAnimations();
    initializeSmoothScroll();
    
    userDataManager.updateUserDisplay();
});

// =================== AUTO SYNC ===================
setInterval(() => {
    updateWhatsAppButtonVisibility();
}, 1000);

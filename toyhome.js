// =================== LOADER BUBBLES ===================
function spawnLoaderBubbles(targetId = "loaderBubbles") {
    const wrap = document.getElementById(targetId);
    if (!wrap) return;
    wrap.innerHTML = "";

    const count = 16;
    for (let i = 0; i < count; i++) {
        const bubble = document.createElement("div");
        bubble.className = "loader-bubble";

        const size = Math.round(18 + Math.random() * 55); // 18px - 73px (small + big mix)
        const left = Math.random() * 100; // vw %
        const duration = (3.5 + Math.random() * 2.5).toFixed(2); // 3.5s - 6s
        const delay = (Math.random() * 1.2).toFixed(2); // start almost immediately
        const drift = Math.round((Math.random() - 0.5) * 140); // -70px to 70px sideways drift

        bubble.style.width = size + "px";
        bubble.style.height = size + "px";
        bubble.style.left = left + "%";
        bubble.style.animationDuration = duration + "s";
        bubble.style.animationDelay = delay + "s";
        bubble.style.setProperty("--bubble-drift", drift + "px");

        bubble.addEventListener("click", () => {
            if (bubble.classList.contains("popped")) return;
            bubble.classList.add("popped");
            setTimeout(() => bubble.remove(), 260);
        });

        wrap.appendChild(bubble);
    }
}

// =================== PAGE LOAD LOADER ===================

function hasLoaderBeenShown() {
    return sessionStorage.getItem("abutoys_loader_shown") === "true";
}

function markLoaderAsShown() {
    sessionStorage.setItem("abutoys_loader_shown", "true");
}

function hidePageLoadLoader() {
    const loader = document.getElementById("abutoys-page-loader");
    if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => {
            loader.classList.add("hidden");
        }, 600);
    }
}

// Start loader immediately on page load
function initializeLoader() {
    if (!hasLoaderBeenShown()) {
        markLoaderAsShown();

 // Show loader for 1 second
        setTimeout(() => {
            hidePageLoadLoader();
        }, 2000);
    } else {
 // Hide loader immediately if already shown
        const loader = document.getElementById("abutoys-page-loader");
        if (loader) {
            loader.classList.add("hidden");
        }
    }
}

// Run as soon as DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoader);
} else {
    initializeLoader();
}

function showLocationLoader() {
    const old = document.getElementById("location-loader");
    if (old) old.remove();

    const wrap = document.createElement("div");
    wrap.id = "location-loader";
    wrap.style.cssText = `
        position: fixed;
        top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.7);
        display:flex; align-items:center; justify-content:center;
        z-index:10002;
    `;

    wrap.innerHTML = `
        <div class="loader-bubbles" id="locationLoaderBubbles"></div>
        <div style="text-align:center; position:relative; z-index:2;">
            <div style="
                border: 6px solid #fff;
                border-top: 6px solid #4ECDC4;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: auto;
            "></div>
            <p style="color:white; margin-top:15px; font-size:1.1rem;">
                Verifying your location…
            </p>
        </div>
    `;

    document.body.appendChild(wrap);
    spawnLoaderBubbles("locationLoaderBubbles");
}

function hideLocationLoader() {
    const el = document.getElementById("location-loader");
    if (el) el.remove();
}

// Add CSS (spinner animation)
const style = document.createElement("style");
style.textContent = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}`;
document.head.appendChild(style);


// =================== CLEAR INVALID DATA ===================
try {
    const storedUser = localStorage.getItem("abutoys_current_user");
    if (storedUser === "visitor" || storedUser === "null" || storedUser === null) {
        localStorage.removeItem("abutoys_current_user");
        localStorage.removeItem("abutoys_location_status");
        localStorage.removeItem("abutoys_delivery_charge");
    }
} catch (e) {
 console.log("localStorage not available");
}

// =================== CONFIG ===================
const SHOP_LOCATION = { lat: 23.0370322, lng: 72.5822496 }; // use this if you want exact map pin
const DELIVERY_RANGE_KM = 10;

// SAME URL FOR BOTH - YAHI ISSUE THA
// (old Google-Apps-Script signup URL removed - replaced by Firebase Auth)

console.log(" AbuToys Script Loaded");

// ---------- Detect WebView (in-app browser) ----------
function isInWebView() {
    const ua = navigator.userAgent || "";
    const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) return false;
    return /wv|WebView|FBAN|FBAV|Instagram|Line|FB_IAB|Twitter|Pinterest/i.test(ua);
}

// ---------- Main Robust Location Function (with retry + fallback) ----------
async function verifyUserLocation_debug() {
    showLocationLoader();

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            hideLocationLoader();
            localStorage.setItem("abutoys_location_status", "no_geo");
            resolve({ status: "no_geo" });
            return;
        }

 // Mobile pe high accuracy (GPS), desktop pe low (WiFi/IP)
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let attempts = 0;
        const maxAttempts = 2;

        const tryGeo = (highAccuracy) => {
            attempts++;
            const options = {
                enableHighAccuracy: highAccuracy,
                timeout: highAccuracy ? 15000 : 10000,
                maximumAge: 600000 // 10 min cache
            };

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const result = await handlePositionSuccess(pos.coords);
                    resolve(result);
                },
                async (err) => {
 console.warn(`Geo attempt ${attempts} failed:`, err.message);

                    if (attempts < maxAttempts && err.code === 3) { // Timeout
 // Flip accuracy and retry
                        tryGeo(!highAccuracy);
                    } else {
 // Final fallback
                        hideLocationLoader();
                        localStorage.setItem("abutoys_location_status", "unknown");
                        resolve({ status: "unknown" });
                    }
                },
                options
            );
        };

 // First try: mobile = high, desktop = low
        tryGeo(isMobile);
    });
}

// Success handler
async function handlePositionSuccess(coords) {
    const userLat = coords.latitude;
    const userLng = coords.longitude;
    const dist = calculateDistance(userLat, userLng, SHOP_LOCATION.lat, SHOP_LOCATION.lng);
    const charge = getDeliveryCharge(dist);

    localStorage.setItem("abutoys_user_location", JSON.stringify({ lat: userLat, lng: userLng }));
    localStorage.setItem("abutoys_user_distance", dist.toFixed(2));
    localStorage.setItem("abutoys_delivery_charge", charge);

    if (charge === -1) {
        localStorage.setItem("abutoys_location_status", "out_of_range");
        localStorage.setItem("abutoys_location_timestamp", Date.now().toString());
        hideLocationLoader();
        return { status: "out_of_range", distance: dist, charge };
    }

    localStorage.setItem("abutoys_location_status", "in_range");
    localStorage.setItem("abutoys_location_timestamp", Date.now().toString());
    hideLocationLoader();
    return { status: "in_range", distance: dist, charge };
}

// ---------- Start Verification (main function jo baaki jagah use hota hai) ----------
async function startLocationVerification() {
    try {
 // WebView mein directly deny dikhao
        if (isInWebView()) {
            hideLocationLoader();
            showPopup("<i class='fa-solid fa-mobile-screen-button'></i> App ke browser mein location block hota hai.\n\nChrome ya Safari mein kholo aur try karo!", "error");
            localStorage.setItem("abutoys_location_status", "permission_denied");
            return { status: "permission_denied", fallback: true };
        }

        const result = await verifyUserLocation_debug();

        if (result.status === "in_range") {
            showPopup(`<i class='fa-solid fa-circle-check'></i> Location Verified!\nDistance: ${result.distance.toFixed(1)} km\nDelivery Charge: ₹${result.charge}`, "success");
        } else if (result.status === "out_of_range") {
            showPopup(`<i class='fa-solid fa-circle-xmark'></i> Sorry baby!\nAap ${Math.round(result.distance)} km door ho.\nDelivery nahi ho payegi `, "warning");
        } else if (result.status === "permission_denied") {
            showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Location permission deny kar diya tune!\nSettings mein jaake allow kar na <i class='fa-solid fa-heart'></i>", "error");
        } else {
            showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Location nahi mil raha...\nGPS + Internet on hai na? Try again kar!", "warning");
        }

        return result;
    } catch (e) {
        hideLocationLoader();
        localStorage.setItem("abutoys_location_status", "unknown");
        return { status: "unknown" };
    }
}

// Distance & Charge (unchanged)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// // ---------- HELPER: Detect if inside an in-app WebView ----------
// function isInWebView() {
// const ua = navigator.userAgent || "";
// // crude but works in many cases
// const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
// if (standalone) return false;
// // common webview signals
// return /wv|WebView|FBAN|FBAV|Instagram|Line|FB_IAB|Twitter|Pinterest/i.test(ua);
// }

// ---------- WRAPPER: Try geolocation, if denied or WebView show fallback ----------
async function verifyOrFallback() {
 // show loader quickly
 try { showLocationLoader(); } catch(e){console.warn("no loader fn", e);}

 // If we're likely inside a WebView, skip native geo attempts and show fallback hint
    if (isInWebView()) {
 console.warn("Running inside WebView, geolocation often blocked.");
        hideLocationLoader();
        showLocationDeniedInstructions(true); // true => show WebView specific hint
        return { status: "permission_denied", fallback: true };
    }

 // Try the robust debug verifier first (it returns normalized statuses)
    let res;
    if (typeof verifyUserLocation_debug === "function") {
        res = await verifyUserLocation_debug();
    } else if (typeof verifyUserLocation === "function") {
        res = await verifyUserLocation();
    } else {
 // fallback if neither present
        try { hideLocationLoader(); } catch(e){}
        showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Location feature temporarily unavailable", "warning");
        return { status: "unknown" };
    }

    if (res && res.status === "in_range") {
 // success, UI will handle it
        return res;
    }

 // denied or unknown -> show instructions and fallback UI
    hideLocationLoader();
    if (res && res.status === "permission_denied") {
        showLocationDeniedInstructions(false); // false => browser-specific instructions
    } else {
 // unknown/out_of_range
        showManualLocationModal();
    }
    return res || { status: "unknown" };
}

// ---------- UI: Show instructions when permission denied ----------
function showLocationDeniedInstructions(isWebView) {
    const msg = isWebView
      ? `It looks like you're inside an app's browser (in-app). Geolocation is often disabled there.\n\nOpen this link in Chrome/Safari (tap the three dots → Open in browser) and try again.`
      : `Location permission is blocked for this site.\n\nChrome: tap lock icon → Site settings → Location → Allow.\n\nAfter allowing, refresh the page.`;
    showPopup(msg, "error");
}

// ---------- UI: Manual location modal (simple) ----------
function showManualLocationModal() {
 // create a simple modal overlay if not exists
    if (document.getElementById("abutoys-manual-loc-modal")) {
        document.getElementById("abutoys-manual-loc-modal").style.display = "flex";
        return;
    }

    const modal = document.createElement("div");
    modal.id = "abutoys-manual-loc-modal";
    modal.style = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.6);z-index:9999;padding:16px;
    `;
    modal.innerHTML = `
      <div style="width:100%;max-width:420px;background:#fff;border-radius:10px;padding:18px;text-align:left;">
        <h3 style="margin:0 0 8px">Enter your pincode or location</h3>
        <p style="margin:0 0 12px;font-size:13px;color:#333">If browser blocked location, enter your pincode or city so we can check delivery availability.</p>
        <input id="abutoys_manual_pincode" placeholder="Pincode or city name" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px" />
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="abutoys_manual_cancel" style="padding:8px 12px;border-radius:6px;background:#eee;border:0">Cancel</button>
          <button id="abutoys_manual_submit" style="padding:8px 12px;border-radius:6px;background:#007bff;color:#fff;border:0">Submit</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("abutoys_manual_cancel").onclick = () => {
        modal.style.display = "none";
    };
    document.getElementById("abutoys_manual_submit").onclick = () => {
        const val = (document.getElementById("abutoys_manual_pincode").value || "").trim();
        if (!val) {
            alert("Please enter pincode or city.");
            return;
        }
 // handle manual value: try to geocode or use pincode mapping
        handleManualLocationValue(val);
        modal.style.display = "none";
    };
}

// ---------- Handler: what to do when user enters manual fallback ----------
async function handleManualLocationValue(val) {
 // naive: if numeric assume pincode -> map to approximate lat/lng if you have dataset
 // For now, just store the manual entry and continue the flow as 'manual' so user can place order
    localStorage.setItem("abutoys_manual_location", val);
    localStorage.setItem("abutoys_location_status", "manual");
    showPopup("Manual location saved. You can continue ordering.", "success");

 // continue the usual UI flow (e.g., show account modal or products)
    if (!userManager.isLoggedIn()) {
        setTimeout(() => showAccountModal(), 700);
    } else {
 // run whatever success handler you have
 // e.g., loadProductsForLocation()
        if (typeof loadProductsForLocation === "function") loadProductsForLocation();
    }
}


// ===== fast + fallback location verification =====
async function verifyUserLocation() {
    showLocationLoader();

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            hideLocationLoader();
            resolve({ status: "no_geo" });
            return;
        }

 // SIMPLE WORKING OPTIONS
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                hideLocationLoader();

                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;

                const dist = calculateDistance(
                    userLat,
                    userLng,
                    SHOP_LOCATION.lat,
                    SHOP_LOCATION.lng
                );

                const charge = getDeliveryCharge(dist);

                localStorage.setItem("abutoys_user_location", JSON.stringify({ lat: userLat, lng: userLng }));
                localStorage.setItem("abutoys_user_distance", dist.toFixed(2));
                localStorage.setItem("abutoys_delivery_charge", charge);

                if (charge === -1) {
                    localStorage.setItem("abutoys_location_status", "out_of_range");
                    localStorage.setItem("abutoys_location_timestamp", Date.now().toString());
                    resolve({ status: "out_of_range", distance: dist, charge });
                } else {
                    localStorage.setItem("abutoys_location_status", "in_range");
                    localStorage.setItem("abutoys_location_timestamp", Date.now().toString());
                    resolve({ status: "in_range", distance: dist, charge });
                }
            },

 // ERROR CALLBACK
            (err) => {
                hideLocationLoader();

                if (err.code === 1) {
                    localStorage.setItem("abutoys_location_status", "permission_denied");
                    resolve({ status: "permission_denied" });
                } else {
                    localStorage.setItem("abutoys_location_status", "unknown");
                    resolve({ status: "unknown" });
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    });
}

// // ========== ROBUST DEBUG VERSION WITH FALLBACKS ==========
// async function verifyUserLocation_debug() {
// showLocationLoader();

// return new Promise((resolve) => {
// if (!navigator.geolocation) {
// hideLocationLoader();
// resolve({ status: "no_geo" });
// return;
// }

// const isMobile = /mobile|tablet|ipad|android/i.test(navigator.userAgent.toLowerCase());
// const options = {
// enableHighAccuracy: isMobile, // High accuracy on mobile (GPS), low on desktop (IP/WiFi)
// timeout: 10000,
// maximumAge: 0
// };

// navigator.geolocation.getCurrentPosition(
// async (pos) => {
// const res = await handlePositionAndReturn(pos.coords);
// resolve(res);
// },
// (err) => {
// if (err.code === 1) {
// hideLocationLoader();
// localStorage.setItem("abutoys_location_status", "permission_denied");
// resolve({ status: "permission_denied" });
// } else if (err.code === 3) { // TIMEOUT - Retry with flipped accuracy and longer timeout
// const retryOptions = {
// enableHighAccuracy: !options.enableHighAccuracy,
// timeout: 15000,
// maximumAge: 0
// };
// navigator.geolocation.getCurrentPosition(
// async (pos) => {
// const res = await handlePositionAndReturn(pos.coords);
// resolve(res);
// },
// (retryErr) => {
// hideLocationLoader();
// localStorage.setItem("abutoys_location_status", "unknown");
// resolve({ status: "unknown", error: retryErr.message });
// },
// retryOptions
// );
// } else { // POSITION_UNAVAILABLE or other
// hideLocationLoader();
// localStorage.setItem("abutoys_location_status", "unknown");
// resolve({ status: "unknown", error: err.message });
// }
// },
// options
// );
// });
// }


// small helper used above to compute distance/charge & return same shape as original
async function handlePositionAndReturn(coords) {
    const userLat = coords.latitude;
    const userLng = coords.longitude;

    const dist = calculateDistance(userLat, userLng, SHOP_LOCATION.lat, SHOP_LOCATION.lng);

    localStorage.setItem("abutoys_user_location", JSON.stringify({ lat: userLat, lng: userLng }));
    localStorage.setItem("abutoys_user_distance", dist.toFixed(2));

    const charge = getDeliveryCharge(dist);
    localStorage.setItem("abutoys_delivery_charge", charge);

    if (charge === -1) {
        localStorage.setItem("abutoys_location_status", "out_of_range");
        localStorage.setItem("abutoys_location_timestamp", Date.now().toString());
        hideLocationLoader();
        return { status: "out_of_range", distance: dist, charge };
    }

    localStorage.setItem("abutoys_location_status", "in_range");
    localStorage.setItem("abutoys_location_timestamp", Date.now().toString());
    hideLocationLoader();
    return { status: "in_range", distance: dist, charge };
}

// // ------------------ LOCATION VERIFICATION HELPERS (FIXED) ------------------
// async function startLocationVerification() {
// // start and return the verification result so callers can use it
// try {
// const result = await verifyUserLocation();

// // Normalize statuses (verifyUserLocation returns in_range / out_of_range / unknown)
// if (result && result.status === "in_range") {
// showPopup(` Location Verified!\nDistance Charge: \n₹${result.charge}`, "success");
// } else if (result && result.status === "out_of_range") {
// showPopup(` You are ${Math.round(result.distance)} km away.\nDelivery not available!`, "error");
// } else if (result && result.status === "permission_denied") {
// showPopup(" Location Access Denied! Please enable location permissions.", "error");
// } else {
// showPopup(" Cannot detect location.\nPlease enable GPS & internet.", "warning");
// }

// // always return the raw result object so the caller can make decisions
// return result;
// } catch (err) {
// // In case anything throws, ensure loader is hidden and return unknown
// hideLocationLoader();
// localStorage.setItem("abutoys_location_status", "unknown");
// return { status: "unknown" };
// }
// }

async function showWelcomeMessage() {
    const isFirstVisit = !sessionStorage.getItem("abutoys_welcomed");

    if (!isFirstVisit) {
 console.log("ℹ Not first visit, skipping welcome");
        return;
    }

    sessionStorage.setItem("abutoys_welcomed", "true");

    let userName = "Guest";
    if (userManager.isLoggedIn()) {
        const user = userManager.getUser(userManager.currentUser);
        if (user) userName = user.fullName;
    }

 console.log(" Showing welcome for:", userName);

    showCustomWelcomePopup(userName, async () => {
 // show loader immediately so user sees something while we ask for permission
        showLocationLoader();

 // get the verification result (startLocationVerification now RETURNS it)
        const res = await startLocationVerification();

 // ensure loader hidden (verifyUserLocation also hides, but double-safety is fine)
        hideLocationLoader();

 // Use normalized keys returned by verifyUserLocation
        if (res && res.status === 'in_range') {
            showPopup(`<i class='fa-solid fa-circle-check'></i> Location Verified!\n\nDistance: ${Number(res.distance).toFixed(2)} km\nDelivery Charge: ₹${res.charge}`, "success");
        }
        else if (res && res.status === 'out_of_range') {
            showPopup(`<i class='fa-solid fa-circle-xmark'></i> Sorry!\n\nYou are ${Math.round(res.distance)} km away.\n\nWe don't deliver there.`, "warning");
        }
        else if (res && res.status === 'permission_denied') {
            showPopup(`<i class='fa-solid fa-triangle-exclamation'></i> Location Access Denied!\n\nPlease enable your location.`, "error");
        }
        else {
            showPopup(`<i class='fa-solid fa-triangle-exclamation'></i> Cannot detect location\n\nPlease check your GPS/internet`, "warning");
        }

 // If not logged in, show signup modal after a small delay
        if (!userManager.isLoggedIn()) {
            setTimeout(() => {
                showAccountModal();
            }, 1500);
        }
    });
}


/* ========== CALCULATE DISTANCE ========== */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a =
        Math.sin(dLat/2)*Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) *
        Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2)*Math.sin(dLon/2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ========== DELIVERY CHARGE ========== */
function getDeliveryCharge(d) {
    if (d > 10) return -1;     // Above 10 km = No delivery
    if (d <= 1) return 0;
    if (d <= 2) return 60;
    if (d <= 3) return 80;
    if (d <= 4) return 100;
    if (d <= 5) return 120;
    if (d <= 6) return 140;
    if (d <= 7) return 160;
    if (d <= 8) return 180;
    if (d <= 9) return 200;
    if (d <= 10) return 220;

    return -1;
}



// =================== USER MANAGER (Firebase-backed) ===================
class UserManager {
    constructor() {
        this.currentUser = null;   // email or phone (display key)
        this.uid = null;
        this.profile = null;       // { fullName, email, phone, address, provider }
        this.photoURL = null;
        this.isGoogleAccount = false;
        this._ready = false;

        this._wireFirebase();
    }

    _wireFirebase() {
        const attach = () => {
            if (!window.AbuFirebase) return;
            window.AbuFirebase.onAuthChange((user, profile) => {
                this._ready = true;
                if (user) {
                    this.uid = user.uid;
                    this.photoURL = user.photoURL || null;
                    this.isGoogleAccount = (user.providerData || []).some(p => p.providerId === "google.com");
                    this.profile = profile || {
                        fullName: user.displayName || "AbuToys Customer",
                        email: user.email || "",
                        phone: user.phoneNumber || "",
                        address: ""
                    };
                    this.currentUser = this.profile.email || this.profile.phone || user.uid;
                } else {
                    this.uid = null;
                    this.profile = null;
                    this.photoURL = null;
                    this.isGoogleAccount = false;
                    this.currentUser = null;
                }
                this.updateUserDisplay();
                if (typeof updateFloatingButtons === "function") updateFloatingButtons();
                if (typeof refreshProfileModalIfOpen === "function") refreshProfileModalIfOpen();
            });
        };

        if (window.AbuFirebase) {
            attach();
        } else {
            window.addEventListener("abufirebase-ready", attach, { once: true });
        }
    }

    // Pull the latest Firestore doc for the current user. Called right after
    // register()/verifyOtp() succeed, because Firestore's onAuthChange callback
    // can fire before the profile doc actually exists, which used to leave the
    // UI stuck showing "AbuToys Customer" instead of the real name.
    async _syncFreshProfile() {
        try {
            if (!window.AbuFirebase || !window.AbuFirebase.refreshCurrentUser) return;
            const fresh = await window.AbuFirebase.refreshCurrentUser();
            if (fresh && fresh.user) {
                this.uid = fresh.user.uid;
                this.photoURL = fresh.user.photoURL || null;
                this.isGoogleAccount = (fresh.user.providerData || []).some(p => p.providerId === "google.com");
                if (fresh.profile) {
                    this.profile = fresh.profile;
                    this.currentUser = this.profile.email || this.profile.phone || fresh.user.uid;
                }
                this.updateUserDisplay();
            }
        } catch (e) {
            console.warn("Profile sync failed:", e);
        }
    }

    isLoggedIn() {
        return !!this.uid;
    }

    getUser() {
 // kept for backward compatibility with old code that called getUser(email)
        return this.profile;
    }

    async register(userData) {
        try {
            if (!window.AbuFirebase) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Firebase load ho raha hai, thoda ruk ke try karo.", "error");
                return false;
            }
            showPopup("<i class='fa-solid fa-spinner fa-spin'></i> Creating your account...", "loading");

            await window.AbuFirebase.register({
                fullName: userData.fullName,
                email: userData.email.toLowerCase().trim(),
                password: userData.password,
                phone: userData.phone,
                address: userData.address
            });

            if (typeof showTab === "function") showTab("login");
            showPopup("<i class='fa-solid fa-envelope-circle-check'></i> Account created! We've sent a verification link to your email — please verify it, then log in.", "success");
            return true;

        } catch (error) {
 console.error(" Registration error:", error);
            showPopup("<i class='fa-solid fa-circle-xmark'></i> " + this._friendlyAuthError(error), "error");
            return false;
        }
    }

    async login(email, password) {
        try {
            if (!window.AbuFirebase) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Firebase load ho raha hai, thoda ruk ke try karo.", "error");
                return false;
            }
            showPopup("<i class='fa-solid fa-spinner fa-spin'></i> Logging in...", "loading");
            await window.AbuFirebase.login(email.toLowerCase().trim(), password);
            closeAccountModal();
            showPopup("<i class='fa-solid fa-circle-check'></i> Welcome back!", "success");
            if (typeof updateFloatingButtons === "function") updateFloatingButtons();
            return true;
        } catch (error) {
 console.error(" Login error:", error);
            showPopup("<i class='fa-solid fa-circle-xmark'></i> " + this._friendlyAuthError(error), "error");
            return false;
        }
    }

    async loginWithGoogle() {
        try {
            if (!window.AbuFirebase) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Firebase load ho raha hai, thoda ruk ke try karo.", "error");
                return false;
            }
            await window.AbuFirebase.loginWithGoogle();
            closeAccountModal();
            showPopup("<i class='fa-solid fa-circle-check'></i> Logged in with Google!", "success");
            if (typeof updateFloatingButtons === "function") updateFloatingButtons();
            return true;
        } catch (error) {
 console.error(" Google login error:", error);
            if (error.code !== "auth/popup-closed-by-user") {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> " + this._friendlyAuthError(error), "error");
            }
            return false;
        }
    }

    async resetPassword(email) {
        try {
            await window.AbuFirebase.resetPassword(email.toLowerCase().trim());
            showPopup("<i class='fa-solid fa-circle-check'></i> Password reset link sent to your email!", "success");
            return true;
        } catch (error) {
 console.error(" Reset password error:", error);
            showPopup("<i class='fa-solid fa-circle-xmark'></i> " + this._friendlyAuthError(error), "error");
            return false;
        }
    }

    async logout() {
        try {
            await window.AbuFirebase.logout();
            showPopup("<i class='fa-solid fa-hand'></i> Logged out.", "success");
        } catch (error) {
 console.error(" Logout error:", error);
        }
    }

    async deleteAccount() {
        try {
            await window.AbuFirebase.deleteAccount();
            return true;
        } catch (error) {
 console.error(" Delete account error:", error);
            if (error.code === "auth/requires-recent-login") {
                showPopup("<i class='fa-solid fa-triangle-exclamation'></i> For security, please login again and then delete your account.", "warning");
            } else {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> " + this._friendlyAuthError(error), "error");
            }
            return false;
        }
    }

    _friendlyAuthError(error) {
        const code = error && error.code ? error.code : "";
        const map = {
            "auth/email-already-in-use": "Email already registered! Try logging in.",
            "auth/invalid-email": "Invalid email address.",
            "auth/weak-password": "Password should be at least 6 characters.",
            "auth/user-not-found": "No account found with this email.",
            "auth/wrong-password": "Incorrect password.",
            "auth/invalid-credential": "Incorrect email or password.",
            "auth/too-many-requests": "Too many attempts. Try again later.",
            "auth/invalid-phone-number": "Invalid phone number.",
            "auth/invalid-verification-code": "Incorrect OTP. Try again.",
            "auth/email-not-verified": "Please verify your email first! We've just sent you a new verification link — check your inbox."
        };
        return map[code] || (error && error.message ? error.message : "Something went wrong. Try again.");
    }

    async updateProfile(updates) {
        try {
            if (!window.AbuFirebase) throw new Error("Firebase not ready");
            const result = await window.AbuFirebase.updateProfileData(updates);
            if (result && result.user) {
                this.photoURL = result.user.photoURL || null;
            }
            if (result && result.profile) {
                this.profile = result.profile;
                this.currentUser = this.profile.email || this.profile.phone || this.uid;
            }
            this.updateUserDisplay();
            showPopup("<i class='fa-solid fa-circle-check'></i> Profile updated!", "success");
            return true;
        } catch (error) {
            console.error("Profile update error:", error);
            showPopup("<i class='fa-solid fa-circle-xmark'></i> " + this._friendlyAuthError(error), "error");
            return false;
        }
    }

    getInitial() {
        const name = (this.profile && this.profile.fullName) || "";
        return name.trim().charAt(0).toUpperCase() || "?";
    }

    updateUserDisplay() {
        const userNameDisplay = document.getElementById("userNameDisplay");
        const avatarImg = document.getElementById("profileAvatarImg");
        const avatarInitial = document.getElementById("profileAvatarInitial");

        if (this.isLoggedIn() && this.profile) {
            if (userNameDisplay) {
                userNameDisplay.innerHTML = `<i class="fa-solid fa-hand"></i> Hello ${this.profile.fullName || "there"}!`;
                userNameDisplay.style.display = "block";
            }
            if (avatarImg && avatarInitial) {
                if (this.photoURL) {
                    avatarImg.src = this.photoURL;
                    avatarImg.style.display = "block";
                    avatarInitial.style.display = "none";
                } else {
                    avatarImg.style.display = "none";
                    avatarInitial.style.display = "flex";
                    avatarInitial.textContent = this.getInitial();
                }
            }
        } else {
            if (userNameDisplay) userNameDisplay.style.display = "none";
            if (avatarImg && avatarInitial) {
                avatarImg.style.display = "none";
                avatarInitial.style.display = "flex";
                avatarInitial.innerHTML = `<i class="fa-solid fa-user"></i>`;
            }
        }
    }

    loadCurrentUser() {
        this.updateUserDisplay();
    }

    getCurrentUserName() {
        if (this.isLoggedIn() && this.profile) {
            return this.profile.fullName || "User";
        }
        return "Guest";
    }
}

// =================== INITIALIZE ===================
const userManager = new UserManager();

// =================== PROFILE MODAL ===================
function openProfileModal() {
    if (!userManager.isLoggedIn()) {
        showAccountModal();
        return;
    }
    const modal = document.getElementById("profileModal");
    if (!modal) return;
    populateProfileModal();
    modal.classList.add("active");
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeProfileModal() {
    const modal = document.getElementById("profileModal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.style.display = "none";
    document.body.style.overflow = "";
}

function refreshProfileModalIfOpen() {
    const modal = document.getElementById("profileModal");
    if (modal && modal.classList.contains("active")) populateProfileModal();
}

function populateProfileModal() {
    if (!userManager.isLoggedIn() || !userManager.profile) return;
    const p = userManager.profile;

    const nameEl = document.getElementById("profileModalName");
    const metaEl = document.getElementById("profileModalMeta");
    const avatarImg = document.getElementById("profileModalAvatarImg");
    const avatarInitial = document.getElementById("profileModalAvatarInitial");

    if (nameEl) nameEl.textContent = p.fullName || "AbuToys Customer";
    if (metaEl) metaEl.textContent = p.email || p.phone || "";

    if (avatarImg && avatarInitial) {
        if (userManager.photoURL) {
            avatarImg.src = userManager.photoURL;
            avatarImg.style.display = "block";
            avatarInitial.style.display = "none";
        } else {
            avatarImg.style.display = "none";
            avatarInitial.style.display = "flex";
            avatarInitial.innerHTML = userManager.getInitial();
        }
    }

    const fullNameInput = document.getElementById("profileFullName");
    const emailInput = document.getElementById("profileEmail");
    const phoneInput = document.getElementById("profilePhone");
    const addressInput = document.getElementById("profileAddress");
    const googleNote = document.getElementById("profileGoogleNote");

    if (fullNameInput) fullNameInput.value = p.fullName || "";
    if (emailInput) emailInput.value = p.email || "";
    if (phoneInput) phoneInput.value = (p.phone || "").replace(/^\+91/, "");
    if (addressInput) addressInput.value = p.address || "";

    const isGoogle = userManager.isGoogleAccount;
    if (fullNameInput) fullNameInput.disabled = isGoogle;
    if (emailInput) emailInput.disabled = true; // email can never be edited, for anyone
    if (googleNote) googleNote.style.display = isGoogle ? "block" : "none";

    renderProfileOrders();
}

function switchProfileTab(tab) {
    document.querySelectorAll(".profile-tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    document.getElementById("profileDetailsTab").classList.toggle("active", tab === "details");
    document.getElementById("profileOrdersTab").classList.toggle("active", tab === "orders");
}

function getStoredOrders() {
    try {
        return JSON.parse(localStorage.getItem("abutoys_orders") || "[]");
    } catch (e) {
        return [];
    }
}

function renderProfileOrders() {
    const orders = getStoredOrders();
    const active = orders.filter(o => o && o.status && !/delivered|completed|cancelled/i.test(o.status));
    const history = orders.filter(o => !o || !o.status || /delivered|completed|cancelled/i.test(o.status));

    const activeList = document.getElementById("activeOrdersList");
    const historyList = document.getElementById("orderHistoryList");

    const renderCard = (order, idx) => `
        <div class="order-card">
            <div class="order-card-top">
                <span class="order-card-id"><i class="fa-solid fa-box"></i> ${order.id || ("Order #" + (idx + 1))}</span>
                <span class="order-card-status">${order.status || "Placed"}</span>
            </div>
            ${order.items ? `<p class="order-card-items">${order.items}</p>` : ""}
            <div class="order-card-bottom">
                <span>${order.date || ""}</span>
                ${order.total ? `<span class="order-card-total">₹${order.total}</span>` : ""}
            </div>
        </div>
    `;

    if (activeList) {
        activeList.innerHTML = active.length
            ? active.map(renderCard).join("")
            : `<p class="orders-empty">No active orders right now.</p>`;
    }
    if (historyList) {
        historyList.innerHTML = history.length
            ? history.map(renderCard).join("")
            : `<p class="orders-empty">No past orders yet.</p>`;
    }
}

function setupProfileModal() {
    const trigger = document.getElementById("profileTrigger");
    if (trigger) trigger.addEventListener("click", openProfileModal);

    const closeX = document.getElementById("closeProfileModalX");
    if (closeX) closeX.addEventListener("click", closeProfileModal);

    const modal = document.getElementById("profileModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeProfileModal();
        });
    }

    document.querySelectorAll(".profile-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => switchProfileTab(btn.dataset.tab));
    });

    const form = document.getElementById("profileDetailsForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fullName = document.getElementById("profileFullName").value.trim();
            const email = document.getElementById("profileEmail").value.trim();
            const phoneRaw = document.getElementById("profilePhone").value.trim();
            const address = document.getElementById("profileAddress").value.trim();

            if (phoneRaw && phoneRaw.replace(/[^0-9]/g, "").length !== 10) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Phone number must be 10 digits!", "error");
                return;
            }

            const updates = {
                fullName,
                email,
                phone: phoneRaw ? "+91" + phoneRaw.replace(/[^0-9]/g, "") : "",
                address
            };
            await userManager.updateProfile(updates);
        });
    }

    const phoneField = document.getElementById("profilePhone");
    if (phoneField) {
        phoneField.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
        });
    }

    const logoutBtn = document.getElementById("profileLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await userManager.logout();
            closeProfileModal();
        });
    }

    const deleteBtn = document.getElementById("profileDeleteAccountBtn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            closeProfileModal();
            if (typeof showDeleteAccountOverlay === "function") showDeleteAccountOverlay();
        });
    }

    const clearHistoryBtn = document.getElementById("clearOrderHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            const orders = getStoredOrders();
            if (orders.length === 0) {
                showPopup("<i class='fa-solid fa-circle-check'></i> Your order history is already clean.", "info");
                return;
            }
            showConfirmPopup(
                "Clear order history?",
                "All your past order cards will be permanently removed. This can't be undone.",
                () => {
                    localStorage.removeItem("abutoys_orders");
                    renderProfileOrders();
                    showPopup("<i class='fa-solid fa-circle-check'></i> Order history cleared!", "success");
                }
            );
        });
    }
}

document.addEventListener("DOMContentLoaded", setupProfileModal);

// Small reusable yes/no confirmation popup (used by clear-history, etc.)
function showConfirmPopup(title, message, onConfirm) {
    const old = document.getElementById("confirm-popup");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "confirm-popup";
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.75);
        display:flex; align-items:center; justify-content:center;
        z-index: 10008; padding: 16px;
    `;
    overlay.innerHTML = `
        <div style="background:#fff; width:100%; max-width:380px; padding:26px; border-radius:16px; text-align:center; animation: slideUp 0.3s ease-out;">
            <h2 style="color:#FF6B6B; margin-bottom:12px; font-size:1.3rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${title}</h2>
            <p style="color:#555; margin-bottom:22px; font-size:0.95rem; line-height:1.5;">${message}</p>
            <div style="display:flex; gap:12px; justify-content:center;">
                <button id="confirmPopupCancel" style="background:#eee; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">Cancel</button>
                <button id="confirmPopupOk" style="background:#FF6B6B; color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("confirmPopupCancel").addEventListener("click", () => overlay.remove());
    document.getElementById("confirmPopupOk").addEventListener("click", () => {
        overlay.remove();
        onConfirm();
    });
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// =================== AUTH UI WIRING (Login / Signup / Google / Phone) ===================
function showTab(tab) {
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const tabBtnLogin = document.getElementById("tabBtnLogin");
    const tabBtnSignup = document.getElementById("tabBtnSignup");
    if (!loginTab || !signupTab || !tabBtnLogin || !tabBtnSignup) return;

    if (tab === "login") {
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        tabBtnLogin.classList.add("active");
        tabBtnSignup.classList.remove("active");
    } else {
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        tabBtnSignup.classList.add("active");
        tabBtnLogin.classList.remove("active");
    }
}

document.addEventListener("DOMContentLoaded", () => {
 // ---- Close modal (top-right X) ----
    const closeX = document.getElementById("closeAccountModalX");
    if (closeX) {
        closeX.addEventListener("click", () => {
            closeAccountModal();
            updateFloatingButtons();
        });
    }

 // ---- Password eye toggle (works for both login + signup inputs) ----
    document.querySelectorAll(".toggle-password").forEach((eye) => {
        eye.addEventListener("click", function () {
            const targetId = eye.getAttribute("data-target") || "password";
            const pass = document.getElementById(targetId);
            if (!pass) return;
            if (pass.type === "password") {
                pass.type = "text";
                eye.classList.remove("fa-eye");
                eye.classList.add("fa-eye-slash");
            } else {
                pass.type = "password";
                eye.classList.add("fa-eye");
                eye.classList.remove("fa-eye-slash");
            }
        });
    });

 // ---- SIGNUP FORM ----
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim().toLowerCase();
            const password = document.getElementById("password").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const address = document.getElementById("address").value.trim();

            if (!fullName || !email || !password || !phone || !address) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Please fill all fields!", "error");
                return;
            }
            if (phone.length !== 10) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Phone number must be 10 digits!", "error");
                return;
            }
            if (password.length < 6) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Password should be at least 6 characters!", "error");
                return;
            }

            const success = await userManager.register({
                fullName, email, password, phone: "+91" + phone, address
            });

            if (success) signupForm.reset();
        });
    }

 // ---- LOGIN FORM ----
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            if (!email || !password) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Please enter email and password!", "error");
                return;
            }
            await userManager.login(email, password);
        });
    }

 // ---- FORGOT PASSWORD ----
    const forgotLink = document.getElementById("forgotPasswordLink");
    if (forgotLink) {
        forgotLink.addEventListener("click", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            if (!email) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Pehle apna email likho, phir Forgot password click karo.", "warning");
                return;
            }
            await userManager.resetPassword(email);
        });
    }

 // ---- GOOGLE LOGIN/SIGNUP ----
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    if (googleLoginBtn) googleLoginBtn.addEventListener("click", () => userManager.loginWithGoogle());

    const googleSignupBtn = document.getElementById("googleSignupBtn");
    if (googleSignupBtn) googleSignupBtn.addEventListener("click", () => userManager.loginWithGoogle());
});

// =================== POPUP SYSTEM ===================
function showPopup(message, type = "info") {
    const old = document.getElementById("custom-popup");
    if (old) old.remove();

    const colors = {
        success: { bg: "#4CAF50", text: "#fff" },
        error: { bg: "#f44336", text: "#fff" },
        warning: { bg: "#ff9800", text: "#fff" },
        loading: { bg: "#2196F3", text: "#fff" },
        info: { bg: "#fff", text: "#333" }
    };

    const color = colors[type] || colors.info;
    const isLoading = type === "loading";

    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;
        z-index:10001; overflow: auto;
    `;
    popup.innerHTML = `
        <div style="background:${color.bg}; color:${color.text}; padding:1.6rem; border-radius:14px; max-width:420px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); margin: auto; text-align: center;">
            <p style="margin-bottom: ${isLoading ? '0' : '1rem'};">${message}</p>
            ${!isLoading ? '<button id="popup-ok" style="margin-top:0.6rem; padding:8px 16px; border:none; border-radius:8px; background:rgba(255,255,255,0.9); color:#333; cursor:pointer; font-weight:bold;">OK</button>' : ''}
        </div>
    `;

    if (!isLoading) {
        popup.querySelector("#popup-ok").addEventListener("click", () => popup.remove());
        setTimeout(() => {
            const el = document.getElementById("custom-popup");
            if (el) el.remove();
        }, 5000);
    }

    document.body.appendChild(popup);
}

// =================== WELCOME MESSAGE ===================
function showCustomWelcomePopup(userName, onOKClick) {
    const old = document.getElementById("custom-popup");
    if (old) old.remove();

    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center;
        z-index:10001; overflow: auto; padding: 20px;
    `;

    const welcomeText = userName === "Guest" ?
        "Join our happy family!" :
        `Welcome back, <strong>${userName}</strong>!`;

    popup.innerHTML = `
        <div style="background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: white; padding: 2rem; border-radius: 20px; max-width: 450px; box-shadow: 0 15px 40px rgba(0,0,0,0.4); text-align: center; margin: auto;">
            <h2 style="font-size: 1.8rem; margin-bottom: 1rem; font-family: 'Fredoka One', cursive;"><i class='fa-solid fa-shapes'></i> Welcome to AbuToys!</h2>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">${welcomeText}</p>
            <p style="font-size: 0.95rem; margin-bottom: 1.5rem; opacity: 0.9;">We need to verify your location to check delivery availability.</p>
            <button id="welcome-ok-btn" style="padding: 12px 30px; border: none; border-radius: 25px; background: white; color: #FF6B6B; cursor: pointer; font-weight: bold; font-size: 1rem;">OK, Check Location</button>
        </div>
    `;

    document.body.appendChild(popup);
    document.getElementById("welcome-ok-btn").addEventListener("click", () => {
        popup.remove();
        showLocationLoader();   // starts loader animation
        setTimeout(() => {
            if (onOKClick) onOKClick();
        }, 300); // small delay so loader shows smoothly

    });
}

// async function showWelcomeMessage() {
// const isFirstVisit = !sessionStorage.getItem("abutoys_welcomed");

// if (!isFirstVisit) {
// console.log("ℹ Not first visit, skipping welcome");
// return;
// }

// sessionStorage.setItem("abutoys_welcomed", "true");

// let userName = "Guest";
// if (userManager.isLoggedIn()) {
// const user = userManager.getUser(userManager.currentUser);
// if (user) userName = user.fullName;
// }

// console.log(" Showing welcome for:", userName);

// showCustomWelcomePopup(userName, async () => {
// const res = await startLocationVerification();
// hideLocationLoader(); // Stop animation here


// // Result ke base pe message dikhao
// if (res.status === 'in_range') {
// showPopup(` Location Verified!\n\nDelivery Charge: Rs.${res.deliveryCharge}\n\nYou can purchase items!`, "success");
// }
// else if (res.status === 'out_of_range') {
// showPopup(` Sorry!\n\nYou are ${Math.round(res.distance)} km away.\n\nWe don't deliver there.`, "warning");
// }
// else if (res.status === 'permission_denied') {
// showPopup(` Location Access Denied!\n\nPlease enable location in browser settings:\n1. Click lock icon in address bar\n2. Allow location access\n3. Refresh page`, "error");
// }
// else {
// showPopup(` Cannot detect location\n\nPlease check your GPS/internet`, "warning");
// }

// // Sirf agar logged in nahi hai to form dikhao
// if (!userManager.isLoggedIn()) {
// setTimeout(() => {
// showAccountModal();
// }, 2000);
// }
// });
// }

/* ====== WhatsApp with location-check & prefilled message (replace old openWhatsApp) ====== */

function openWhatsAppDirect() {
 // get name from Firebase-backed userManager
    let displayName = "Guest";
    try {
        if (typeof userManager !== "undefined" && userManager.getCurrentUserName) {
            displayName = userManager.getCurrentUserName() || displayName;
        }
    } catch (e) {
 console.warn("Error reading user name:", e);
    }

 // Message exactly as requested
    const message = `Hii AbuToys, My name is "${displayName}"`;
    const encodedMessage = encodeURIComponent(message);

 // open whatsapp (use target _blank)
    window.open(`https://wa.me/8160154042?text=${encodedMessage}`, "_blank");
}

function showLocationRequiredForWhatsAppPopup() {
 // If there is already our popup, don't duplicate
    if (document.getElementById("whatsapp-location-required-popup")) return;

    const overlay = document.createElement("div");
    overlay.id = "whatsapp-location-required-popup";
    overlay.style.cssText = `
        position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
        background: rgba(0,0,0,0.6); z-index:10010; padding:16px;
    `;
    overlay.innerHTML = `
        <div style="max-width:420px; width:100%; background:#fff; border-radius:12px; padding:18px; text-align:left; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 8px; font-size:18px;"><i class='fa-solid fa-triangle-exclamation'></i> Location Unverified</h3>
            <p style="margin:0 0 12px; color:#444; font-size:15px;">
                Sorry — your location is unverified. Please enable your location to use the WhatsApp function.
            </p>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button id="whatsapp-loc-cancel" style="padding:8px 12px; background:#eee; border:0; border-radius:8px; cursor:pointer;">Cancel</button>
                <button id="whatsapp-loc-verify" style="padding:8px 12px; background:#25d366; color:#fff; border:0; border-radius:8px; cursor:pointer;">Verify Now</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("whatsapp-loc-cancel").addEventListener("click", () => {
        overlay.remove();
    });

    document.getElementById("whatsapp-loc-verify").addEventListener("click", async () => {
        overlay.remove();
        try { showLocationLoader(); } catch(e){/* ignore */ }
 // startLocationVerification returns the normalized result (we used that earlier)
        const res = await startLocationVerification();
        try { hideLocationLoader(); } catch(e){/* ignore */ }

 // If location now verified -> open direct
        if (res && res.status === "in_range") {
            showPopup("<i class='fa-solid fa-circle-check'></i> Location verified. Opening WhatsApp...", "success");
 // small delay so user sees popup
            setTimeout(() => openWhatsAppDirect(), 350);
        } else if (res && res.status === "permission_denied") {
            showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Location permission denied. Please enable GPS/permissions and try again.", "error");
        } else {
            showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Could not verify location. Try again.", "warning");
        }
    });
}

function openWhatsApp() {
 // If user not logged in, ask them to sign up (keep previous behavior)
    if (typeof userManager !== "undefined" && !userManager.isLoggedIn()) {
        showPopup("<i class='fa-solid fa-circle-xmark'></i> Please sign up first!", "warning");
        return;
    }

    const status = localStorage.getItem("abutoys_location_status"); // possible values: in_range, out_of_range, permission_denied, manual, unknown, etc.

 // If location not verified (not 'in_range') -> show the special popup with Verify Now button
    if (status !== "in_range") {
 // special message required by you
        showLocationRequiredForWhatsAppPopup();
        return;
    }

 // If in_range, proceed to open WhatsApp with prefilled message
    openWhatsAppDirect();
}

/* === Hook footer whatsapp button (if present) so footer also uses same logic === */
document.addEventListener("DOMContentLoaded", () => {
    const footerBtn = document.getElementById("footerWhatsAppBtn");
    if (footerBtn) {
 // remove old listeners to avoid duplicates (best-effort)
        footerBtn.replaceWith(footerBtn.cloneNode(true));
        const newFooterBtn = document.getElementById("footerWhatsAppBtn") || document.querySelector("[data-footer-whatsapp]");
        if (newFooterBtn) newFooterBtn.addEventListener("click", (e) => { e.preventDefault(); openWhatsApp(); });
    }
});

// =================== WHATSAPP ===================
// function openWhatsApp() {
// if (!userManager.isLoggedIn()) {
// showPopup(" Please sign up first!", "warning");
// return;
// }

// const locationStatus = locationManager.getLocationStatus();

// if (locationStatus === 'out_of_range') {
// showPopup(" Sorry! You are outside 20 km delivery area.", "warning");
// return;
// }

// const userName = userManager.getCurrentUserName();
// const distance = locationManager.distance ? locationManager.distance.toFixed(2) : "Unknown";
// const message = `Hi, I am ${userName}. Distance: ${distance} km. I want to purchase toys.`;

// const encodedMessage = encodeURIComponent(message);
// window.open(`https://wa.me/9879254030?text=${encodedMessage}`, '_blank');
// }

// =================== ACCOUNT MODAL ===================
function showAccountModal() {
    console.log(" Opening account modal...");

    if (userManager.isLoggedIn()) {
        openProfileModal();
        return;
    }

    const modal = document.getElementById("accountModal");
    if (modal) {
        modal.style.display = "block";
        console.log(" Modal displayed");
    } else {
        console.error(" Modal not found!");
    }
}

function closeAccountModal() {
    const modal = document.getElementById("accountModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// =================== HERO SLIDER ===================
function initHeroSlider() {
    let current = 0;
    const slides = document.querySelectorAll(".slide");
    if (slides && slides.length > 0) {
        setInterval(() => {
            slides[current].classList.remove("active");
            current = (current + 1) % slides.length;
            slides[current].classList.add("active");
        }, 5000);
    }
 console.log(" Hero slider started");
}

// =================== FLOATING BUTTONS ===================
function createFloatingButtons() {
 console.log(" Creating floating buttons...");

    const whatsappFloat = document.createElement("div");
    whatsappFloat.className = "whatsapp-float";
    whatsappFloat.innerHTML = `<i class="fab fa-whatsapp"></i>`;
    whatsappFloat.style.cssText = `
        position: fixed; 
        bottom: 80px; 
        right: 20px;
        background: #25d366; 
        color: white; 
        border-radius: 50%;
        width: 60px; 
        height: 60px; 
        display: flex;
        align-items: center; 
        justify-content: center;
        box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
        cursor: pointer; 
        z-index: 999; 
        font-size: 28px;
        transition: all 0.3s ease; 
        opacity: 0; 
        visibility: hidden;
    `;

    whatsappFloat.addEventListener("mouseenter", () => {
        whatsappFloat.style.transform = "scale(1.05)";
    });

    whatsappFloat.addEventListener("mouseleave", () => {
        whatsappFloat.style.transform = "scale(1)";
    });

    whatsappFloat.addEventListener("click", openWhatsApp);
    document.body.appendChild(whatsappFloat);
 console.log(" WhatsApp button added");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            whatsappFloat.style.opacity = "1";
            whatsappFloat.style.visibility = "visible";
        } else {
            whatsappFloat.style.opacity = "0";
            whatsappFloat.style.visibility = "hidden";
        }
    });
}

// =================== FLOATING REGISTRATION BUTTON ===================
function createFloatingRegisterButton() {
 console.log(" Creating floating registration button...");

    const regFloat = document.createElement("div");
    regFloat.id = "floatingRegBtn";
    regFloat.innerHTML = `<i class="fas fa-user-plus"></i>`;
    regFloat.style.cssText = `
        position: fixed; 
        bottom: 80px; 
        right: 20px;
        background: linear-gradient(45deg, #FF6B6B, #4ECDC4); 
        color: white; 
        border-radius: 50%;
        width: 60px; 
        height: 60px; 
        display: flex;
        align-items: center; 
        justify-content: center;
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
        cursor: pointer; 
        z-index: 999; 
        font-size: 28px;
        transition: all 0.3s ease; 
        opacity: 0; 
        visibility: hidden;
    `;

    regFloat.addEventListener("mouseenter", () => {
        regFloat.style.transform = "scale(1.05)";
    });

    regFloat.addEventListener("mouseleave", () => {
        regFloat.style.transform = "scale(1)";
    });

    regFloat.addEventListener("click", () => {
        showAccountModal();
    });

    document.body.appendChild(regFloat);
 console.log(" Registration button added");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            regFloat.style.opacity = "1";
            regFloat.style.visibility = "visible";
        } else {
            regFloat.style.opacity = "0";
            regFloat.style.visibility = "hidden";
        }
    });
}

function updateFloatingButtons() {
    const whatsappBtn = document.querySelector(".whatsapp-float");
    const regBtn = document.getElementById("floatingRegBtn");

    if (userManager.isLoggedIn()) {
        if (whatsappBtn) whatsappBtn.style.display = "flex";
        if (regBtn) regBtn.style.display = "none";
    } else {
        if (whatsappBtn) whatsappBtn.style.display = "none";
        if (regBtn) regBtn.style.display = "flex";
    }
}

// =================== DOM READY ===================
document.addEventListener("DOMContentLoaded", () => {
 console.log(" DOM Ready");

 // ========= HAMBURGER MENU FIX =========
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("active");
            hamburger.classList.toggle("active");
 console.log(" Hamburger clicked - menu active:", navMenu.classList.contains("active"));
        });

 // Close menu when nav link clicked
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("active");
                hamburger.classList.remove("active");
 console.log(" Nav link clicked - menu closed");
            });
        });

 // Close menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove("active");
                hamburger.classList.remove("active");
            }
        });
    } else {
 console.warn(" Hamburger or nav-menu not found");
    }

 // ========= PHONE INPUT ==========
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
});

// =================== PAGE LOAD ===================
window.addEventListener("load", () => {
 console.log(" Page loaded, initializing...");

    setTimeout(() => {
        initHeroSlider();
        createFloatingButtons();
        createFloatingRegisterButton();
        updateFloatingButtons();

 // Har baar welcome message dikhao
        showWelcomeMessage();
    }, 800);
});


// =================== DELETE ACCOUNT SYSTEM ===================
// (Triggered from the profile modal's "Delete Account" button — see setupProfileModal())

function showDeleteAccountOverlay() {
 // Pehle check kar ki user logged in hai ya nahi (Firebase)
    if (!userManager.isLoggedIn()) {
        showPopup("<i class='fa-solid fa-circle-xmark'></i> Please login first to delete account!", "error");
        return;
    }

 // Overlay create kar
    const overlay = document.createElement('div');
    overlay.id = 'delete-account-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10005;
        padding: 20px;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            animation: slideUp 0.4s ease-out;
        ">
            <div style="font-size: 3.5rem; margin-bottom: 20px; color: #FF6B6B;"><i class='fa-solid fa-triangle-exclamation'></i></div>
            
            <h2 style="
                color: #333;
                font-size: 1.8rem;
                margin-bottom: 15px;
                font-family: 'Fredoka One', cursive;
            ">Delete Account?</h2>
            
            <p style="
                color: #666;
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 25px;
            ">
                <i class='fa-solid fa-triangle-exclamation'></i> <strong>Warning:</strong> Deleting your account will permanently remove all your data including:
                <br><br>
                • Account Information
                <br>
                • Saved Addresses
                <br>
                • Wishlist Items
                <br>
                • Password
            </p>

            <p style="
                color: #FF6B6B;
                font-size: 1.1rem;
                font-weight: 700;
                margin-bottom: 30px;
            ">
                This action cannot be undone! <i class='fa-solid fa-lock'></i>
            </p>

            <p style="
                color: #999;
                font-size: 0.95rem;
                margin-bottom: 25px;
            ">
                Are you sure you want to delete your account?
            </p>

            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="cancelDeleteBtn" style="
                    padding: 12px 30px;
                    background: #e0e0e0;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                ">
                    <i class='fa-solid fa-xmark'></i> Cancel
                </button>
                <button id="confirmDeleteBtn" style="
                    padding: 12px 30px;
                    background: #FF6B6B;
                    color: white;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                ">
                    <i class='fa-solid fa-trash'></i> Delete Account
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

 // Cancel button
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        overlay.remove();
    });

 // Delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        deleteUserAccount(overlay);
    });

 // Background click se bhi close ho
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

async function deleteUserAccount(overlay) {
 // Actual Firebase account delete (Auth + Firestore profile) — this happens
 // instantly, so there's no need for any waiting period afterwards.
    const ok = await userManager.deleteAccount();

    if (!ok) {
 // deleteAccount() already showed the reason (e.g. needs recent login)
        return;
    }

 // Clean up local caches (cart/liked items are still local for now)
    try {
        localStorage.removeItem("abutoys_liked_products");
        localStorage.removeItem("abutoys_cart");
        localStorage.removeItem("abutoys_user_location");
        localStorage.removeItem("abutoys_location_status");
        localStorage.removeItem("abutoys_delivery_charge");
        localStorage.removeItem("abutoys_user_distance");
        localStorage.removeItem("abutoys_location_address");
    } catch (e) {
 console.log("Error clearing local cache:", e);
    }

 // Close the confirmation overlay
    overlay.remove();

    showPopup("<i class='fa-solid fa-circle-check'></i> Your account was deleted from server.", "success");
}

// Add CSS animation
function addDeleteAccountStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .profile-trigger {
            transition: all 0.3s ease;
        }

        .profile-trigger:hover {
            transform: scale(1.08);
        }
    `;
    document.head.appendChild(style);
}

// Call in DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    addDeleteAccountStyles();
});

// Allow using product page order history from home page
function openOrderHistoryFromHome() {
    window.location.href = "toyproduct.html?orders=1";
}

/* ===================== FLOATING LOCATION BUTTON ===================== */

function createFloatingLocationButton() {
    const locBtn = document.createElement("div");
    locBtn.id = "floatingLocationBtn";

    locBtn.innerHTML = `<i class="fas fa-map-marker-alt"></i>`;

    locBtn.style.cssText = `
        position: fixed;
        bottom: 25px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        z-index: 999;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: 0.3s ease;
    `;

 // Hover animation
    locBtn.addEventListener("mouseenter", () => {
        locBtn.style.transform = "scale(1.1)";
    });

    locBtn.addEventListener("mouseleave", () => {
        locBtn.style.transform = "scale(1)";
    });

 // Click open popup
    locBtn.addEventListener("click", () => {
        openLocationPopup();
    });

    document.body.appendChild(locBtn);
}


function openLocationPopup() {
    const status = localStorage.getItem("abutoys_location_status");

 // Already open? → close it on second click
    const oldPopup = document.getElementById("locationPopup");
    if (oldPopup) {
        oldPopup.remove();
        return; // no new popup
    }

    const popup = document.createElement("div");
    popup.id = "locationPopup";

    popup.style.cssText = `
        position: fixed;
        bottom: 95px;
        left: 20px;
        background: white;
        padding: 18px;
        width: 320px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.25);
        z-index: 2000;
        animation: popIn 0.3s ease;
        font-family: sans-serif;
    `;

    let html = "";
    let showVerifyBtn = false; //  yahan se control karenge

    if (status === "permission_denied") {
        html = `
            <h3 style="margin:0; font-size:18px; color:#d63031;"><i class='fa-solid fa-circle-xmark'></i> Location Denied</h3>
            <p style="margin:8px 0; font-size:15px;">
                You denied location access.<br>
                <b>You can't purchase any item.</b><br>
                After allowing location in browser/app settings, tap below:
            </p>
        `;
        showVerifyBtn = true; // deny ke baad bhi "Verify Now" dikhega
    }
    else if (status === "in_range") {
        const charge = localStorage.getItem("abutoys_delivery_charge");
        const distance = localStorage.getItem("abutoys_user_distance");
        html = `
            <h3 style="margin:0; font-size:18px; color:#2ecc71;"><i class='fa-solid fa-circle-check'></i> Location Verified</h3>
            <p style="margin:8px 0; font-size:15px;">
                Delivery Available!<br>
                ${distance ? `<b>Distance from shop: ${distance} km</b><br>` : ""}
                <b>Delivery Charge: ₹${charge}</b>
            </p>
        `;
 // in_range me button nahi chahiye (already verified)
    }
    else if (status === "out_of_range") {
        const distance = localStorage.getItem("abutoys_user_distance");
        html = `
            <h3 style="margin:0; font-size:18px; color:#e67e22;"><i class='fa-solid fa-triangle-exclamation'></i> Out of Range</h3>
            <p style="margin:8px 0; font-size:15px;">
                Sorry! You are outside the delivery area.<br>
                ${distance ? `<b>Distance from shop: ${distance} km</b><br>` : ""}
                If you moved to a new location, tap below to re-check:
            </p>
        `;
        showVerifyBtn = true; // yahan bhi dobara check karne ka option
    }
    else {
 // null / unknown / manual / no_geo sab yahan aa jayenge
        html = `
            <h3 style="margin:0; font-size:18px; color:#0984e3;"><i class='fa-solid fa-location-dot'></i> Location Unknown</h3>
            <p style="margin:8px 0; font-size:15px;">
                Click below to verify your location.
            </p>
        `;
        showVerifyBtn = true;
    }

 // Common "Verify Now" button agar showVerifyBtn true hai
    if (showVerifyBtn) {
        html += `
            <button id="verifyLocationBtn" style="
                margin-top:10px;
                padding:10px 18px;
                background:#0984e3;
                color:white;
                border:none;
                border-radius:8px;
                cursor:pointer;
                font-weight:bold;
            ">Verify Now</button>
        `;
    }

    popup.innerHTML = html;
    document.body.appendChild(popup);

 // Agar button hai tabhi listener lagayenge
    const btn = document.getElementById("verifyLocationBtn");
    if (btn) {
        btn.addEventListener("click", async () => {
            popup.remove();
            showLocationLoader();
            const res = await startLocationVerification(); // iske andar verifyUserLocation_debug bhi use ho sakta hai
            hideLocationLoader();

            if (res.status === "in_range") {
                showPopup("<i class='fa-solid fa-circle-check'></i> Location Verified!", "success");
            } else if (res.status === "out_of_range") {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> You are outside 20km area!", "error");
            } else if (res.status === "permission_denied") {
                showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Location access denied again!", "warning");
            } else {
                showPopup("<i class='fa-solid fa-triangle-exclamation'></i> Cannot verify location", "warning");
            }
        });
    }

 // CLICK ANYWHERE OUTSIDE → CLOSE 
    setTimeout(() => enablePopupCloseOnOutsideClick(popup), 50);
}

/* ============ POPUP ANIMATION CSS ============ */
const floatCss = document.createElement("style");
floatCss.textContent = `
@keyframes popIn {
    from { transform: translateY(10px); opacity:0; }
    to { transform: translateY(0px); opacity:1; }
}
`;
document.head.appendChild(floatCss);

function enablePopupCloseOnOutsideClick(popup) {
    function outsideClick(e) {
        const locBtn = document.getElementById("floatingLocationBtn");

        if (!popup.contains(e.target) && e.target !== locBtn) {
            popup.remove();
            document.removeEventListener("click", outsideClick);
        }
    }
    document.addEventListener("click", outsideClick);
}

// ========== SCROLL ANIMATIONS ========== 
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

 // Add scroll-animate class to sections
    document.querySelectorAll('.feature-card, .testimonial-card, .offer-card, .store-card').forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
    });
}

// ========== ENHANCED NAVBAR SCROLL ========== 
function enhancedNavbarScroll() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255,255,255,0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        } else {
            navbar.style.background = 'rgba(255,255,255,0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        }

        lastScroll = currentScroll;
    });
}

// Call these on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        initScrollAnimations();
        enhancedNavbarScroll();
    }, 500);
});

window.addEventListener("load", () => {
    setTimeout(() => {
        createFloatingLocationButton();   // New floating button
    }, 1000);
});

// ========== TESTIMONIALS PANEL FUNCTIONALITY ========== 
function initTestimonialsPanel() {
    const viewMoreBtn = document.getElementById('viewMoreTestimonials');
    const panel = document.getElementById('testimonialsPanel');
    const closeBtn = document.getElementById('closePanelBtn');
    const overlay = panel.querySelector('.panel-overlay');

 // Open Panel
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            panel.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        });
    }

 // Close Panel - Close Button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
        });
    }

 // Close Panel - Overlay Click
    if (overlay) {
        overlay.addEventListener('click', () => {
            panel.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

 // Close Panel - ESC Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('active')) {
            panel.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Call on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        initTestimonialsPanel();
    }, 500);
});

// =================== REVIEWS: RANDOM 3-ON-HOME + GIVE REVIEW + FIRESTORE ===================

let dynamicReviews = []; // reviews fetched from Firestore, merged in quietly

function getStaticReviewPool() {
    const cards = document.querySelectorAll("#testimonialsPanel .panel-review");
    const pool = [];
    cards.forEach(card => {
        const stars = card.querySelectorAll(".stars i").length;
        const text = (card.querySelector(".review-text") || {}).textContent || "";
        const name = ((card.querySelector(".reviewer-name") || {}).textContent || "").replace(/^-\s*/, "").trim();
        if (text && name) pool.push({ stars, text, name });
    });
    return pool;
}

function fullReviewPool() {
    return [...getStaticReviewPool(), ...dynamicReviews];
}

function starsHtml(count) {
    let html = "";
    for (let i = 0; i < 5; i++) {
        html += `<i class="fa-solid fa-star" style="${i < count ? "" : "opacity:0.25;"}"></i>`;
    }
    return html;
}

function pickRandomReviews(pool, n) {
    const copy = [...pool];
    const picked = [];
    while (copy.length && picked.length < n) {
        const idx = Math.floor(Math.random() * copy.length);
        picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
}

function renderHomeReviews() {
    const grid = document.querySelector(".testimonials-grid");
    if (!grid) return;
    const pool = fullReviewPool();
    if (!pool.length) return;
    const chosen = pickRandomReviews(pool, Math.min(3, pool.length));

    grid.innerHTML = chosen.map(r => `
        <div class="testimonial-card scroll-animate visible">
            <div class="stars">${starsHtml(r.stars)}</div>
            <p>"${r.text.replace(/^"|"$/g, "")}"</p>
            <div class="customer-info">
                <strong>- ${r.name}</strong>
            </div>
        </div>
    `).join("");
}

// Keep the home page reviews feeling alive — reshuffle every few seconds.
function startHomeReviewRotation() {
    renderHomeReviews();
    setInterval(renderHomeReviews, 7000);
}

// Quietly fetch Firestore reviews in the background and merge them in.
// This never disturbs whatever is already on screen — it just adds to the pool
// so future rotations / the "View All Reviews" panel can include them.
async function fetchAndMergeFirestoreReviews() {
    if (!window.AbuFirebase || !window.AbuFirebase.fetchReviews) return;
    try {
        const reviews = await window.AbuFirebase.fetchReviews(50);
        if (!reviews.length) return;
        dynamicReviews = reviews.map(r => ({
            stars: r.stars || 5,
            text: r.text || "",
            name: r.name || "AbuToys Customer"
        }));

        // Prepend the newest ones to the "View All Reviews" panel, above the
        // existing static reviews, without touching what's already rendered.
        const panelBody = document.querySelector("#testimonialsPanel .panel-body");
        if (panelBody) {
            const frag = document.createDocumentFragment();
            dynamicReviews.forEach(r => {
                const div = document.createElement("div");
                div.className = "panel-review";
                div.innerHTML = `
                    <div class="review-header">
                        <div class="stars">${starsHtml(r.stars)}</div>
                    </div>
                    <p class="review-text">"${r.text.replace(/^"|"$/g, "")}"</p>
                    <div class="reviewer-name">- ${r.name}</div>
                `;
                frag.appendChild(div);
            });
            panelBody.insertBefore(frag, panelBody.firstChild);
        }
    } catch (e) {
        console.warn("Could not load reviews from Firestore:", e);
    }
}

function setupGiveReview() {
    const giveBtn = document.getElementById("giveReviewBtn");
    const modal = document.getElementById("giveReviewModal");
    const closeX = document.getElementById("closeGiveReviewModalX");
    const form = document.getElementById("giveReviewForm");
    const starsWrap = document.getElementById("giveReviewStars");
    let selectedStars = 0;

    function openModal() {
        if (!userManager.isLoggedIn()) {
            showPopup("<i class='fa-solid fa-circle-info'></i> Please login first before giving review.", "warning");
            return;
        }
        selectedStars = 0;
        if (starsWrap) starsWrap.querySelectorAll("i").forEach(i => i.classList.remove("selected"));
        if (form) form.reset();
        if (modal) modal.style.display = "block";
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
    }

    if (giveBtn) giveBtn.addEventListener("click", openModal);
    if (closeX) closeX.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    if (starsWrap) {
        starsWrap.querySelectorAll("i").forEach(star => {
            star.addEventListener("click", () => {
                selectedStars = parseInt(star.dataset.star, 10);
                starsWrap.querySelectorAll("i").forEach(i => {
                    i.classList.toggle("selected", parseInt(i.dataset.star, 10) <= selectedStars);
                });
            });
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!userManager.isLoggedIn()) {
                showPopup("<i class='fa-solid fa-circle-info'></i> Please login first before giving review.", "warning");
                closeModal();
                return;
            }
            const text = document.getElementById("giveReviewText").value.trim();
            if (!selectedStars) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Please select a star rating!", "error");
                return;
            }
            if (!text) {
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Please write your review!", "error");
                return;
            }
            try {
                const name = (userManager.profile && userManager.profile.fullName) || "AbuToys Customer";
                await window.AbuFirebase.submitReview({ name, stars: selectedStars, text });
                dynamicReviews.unshift({ stars: selectedStars, text, name });
                closeModal();
                showPopup("<i class='fa-solid fa-circle-check'></i> Thank you! Your review has been submitted.", "success");
            } catch (err) {
                console.error("Submit review error:", err);
                showPopup("<i class='fa-solid fa-circle-xmark'></i> Could not submit review, try again.", "error");
            }
        });
    }
}

window.addEventListener("load", () => {
    setTimeout(() => {
        startHomeReviewRotation();
        setupGiveReview();
    }, 600);

    const kickOffReviewFetch = () => fetchAndMergeFirestoreReviews();
    if (window.AbuFirebase) {
        kickOffReviewFetch();
    } else {
        window.addEventListener("abufirebase-ready", kickOffReviewFetch, { once: true });
    }
});

// =================== LOCATION: ADDRESS AUTO-SUGGEST FROM SAVED LOCATION ===================
// After a successful GPS verification we reverse-geocode the coordinates once
// (via OpenStreetMap Nominatim) and cache a human-readable address string, so
// the address inputs (signup + profile) can offer it as a one-tap suggestion.

async function reverseGeocodeAndCache(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { "Accept": "application/json" }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.display_name) {
            localStorage.setItem("abutoys_location_address", data.display_name);
        }
    } catch (e) {
        console.warn("Reverse geocode failed:", e);
    }
}

// Piggyback on the existing success handler so this runs automatically
// every time a location gets verified, without changing its return value.
if (typeof handlePositionSuccess === "function" && !window._abutoysGeocodeWrapped) {
    window._abutoysGeocodeWrapped = true;
    const _origHandlePositionSuccess = handlePositionSuccess;
    handlePositionSuccess = async function (coords) {
        const result = await _origHandlePositionSuccess(coords);
        reverseGeocodeAndCache(coords.latitude, coords.longitude);
        return result;
    };
}

function attachLocationSuggestion(input) {
    if (!input) return;
    let box = null;

    const removeBox = () => {
        if (box) { box.remove(); box = null; }
    };

    input.addEventListener("focus", () => {
        const saved = localStorage.getItem("abutoys_location_address");
        if (!saved) return;
        removeBox();
        box = document.createElement("div");
        box.className = "location-suggest-box";
        box.innerHTML = `<small><i class="fa-solid fa-location-dot"></i> Use your verified location</small>${saved}`;

        const rect = input.getBoundingClientRect();
        box.style.left = (rect.left + window.scrollX) + "px";
        box.style.top = (rect.bottom + window.scrollY + 6) + "px";
        box.style.width = Math.max(rect.width, 240) + "px";

        box.addEventListener("mousedown", (e) => {
            e.preventDefault();
            input.value = saved;
            removeBox();
        });

        document.body.appendChild(box);
    });

    input.addEventListener("blur", () => {
        setTimeout(removeBox, 150);
    });
}

window.addEventListener("load", () => {
    setTimeout(() => {
        attachLocationSuggestion(document.getElementById("address"));
        attachLocationSuggestion(document.getElementById("profileAddress"));
    }, 800);
});

// =================== FOOTER "CALL NOW" — DESKTOP GUARD ===================
// tel: links do nothing useful on a computer/laptop, so on non-mobile devices
// we show a friendly message instead of letting the browser try (and fail) to dial.
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener("click", (e) => {
        if (!isMobileDevice()) {
            e.preventDefault();
            showPopup("<i class='fa-solid fa-mobile-screen-button'></i> For calling, please use your mobile.", "info");
        }
        // On an actual mobile device, let the browser open the dialer normally
        // (the number is already prefilled via the tel: href).
    });
});

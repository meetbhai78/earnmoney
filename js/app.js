// ===================== CONSTANTS =====================
const ADMIN_MOBILE   = '7990431779';

// ===================== SUPABASE CONFIGURATION =====================
const SUPABASE_URL = 'https://kdmggzuqoxpbuifmzypy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RfaDbcEOo6rryl76t3FMWg_ITTjrsBj';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Cryptographic hash helper to keep admin password secure in frontend JS
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===================== DATA HELPERS =====================
async function dbGetUsers() {
    const { data, error } = await supabaseClient.from('ep_users').select('*');
    if (error) { console.error('Error fetching users:', error); return []; }
    return data || [];
}

async function dbGetRedeems() {
    const { data, error } = await supabaseClient.from('ep_redeems').select('*');
    if (error) { console.error('Error fetching redeems:', error); return []; }
    return data || [];
}

async function dbGetLogs() {
    const { data, error } = await supabaseClient.from('ep_logs').select('*');
    if (error) { console.error('Error fetching logs:', error); return []; }
    return data || [];
}

const getCurrent = () => localStorage.getItem('ep_current');
const saveCurrent = (m) => m ? localStorage.setItem('ep_current', m) : localStorage.removeItem('ep_current');

async function dbGetUser(mobile) {
    const { data, error } = await supabaseClient.from('ep_users').select('*').eq('mobile', mobile).maybeSingle();
    if (error) { console.error('Error fetching user:', error); return null; }
    return data;
}

async function dbGetActiveUser() {
    const current = getCurrent();
    if (!current || current === 'ADMIN') return null;
    return await dbGetUser(current);
}

// ===================== REFERRAL SYSTEM URL PARSER =====================
const REFERRAL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function parseReferralCode() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    // Store fresh referral code from URL
    if (ref && /^\d{7,15}$/.test(ref)) {
        localStorage.setItem('ep_ref_code', ref);
        localStorage.setItem('ep_ref_code_ts', Date.now().toString());
        console.log('☁️ Stored referral code (7-day expiry):', ref);
    }

    // Clear expired referral codes
    const storedTs = parseInt(localStorage.getItem('ep_ref_code_ts') || '0');
    if (storedTs && Date.now() - storedTs > REFERRAL_EXPIRY_MS) {
        localStorage.removeItem('ep_ref_code');
        localStorage.removeItem('ep_ref_code_ts');
        console.log('⏰ Referral code expired and cleared.');
    }
}
parseReferralCode();

// ===================== AUTH SYSTEM =====================
let isSignup = false;

// Called by landing page buttons to pre-set login vs signup mode
function updateAuthModal() {
    const wantSignup = !!window.__landingOpenSignup;
    if (isSignup !== wantSignup) {
        isSignup = wantSignup;
        document.getElementById('email-field').style.display   = isSignup ? 'block' : 'none';
        document.getElementById('name-field').style.display    = isSignup ? 'block' : 'none';
        document.getElementById('referral-field').style.display = isSignup ? 'block' : 'none';
        const emailEl = document.getElementById('auth-email');
        const nameEl  = document.getElementById('auth-name');
        if (emailEl) emailEl.required = isSignup;
        if (nameEl)  nameEl.required  = false;
        document.getElementById('auth-btn-text').textContent   = isSignup ? 'Create Account' : 'Sign In';
        document.getElementById('auth-switch-msg').textContent  = isSignup ? 'Already have an account?' : "Don't have an account?";
        document.getElementById('auth-toggle').textContent     = isSignup ? ' Sign In' : ' Create Account';
        document.getElementById('auth-subtitle').textContent   = isSignup ? 'Join now and start earning rewards!' : 'Sign in to start earning rewards!';

        if (isSignup) {
            const refInput  = document.getElementById('auth-referral');
            const storedRef = localStorage.getItem('ep_ref_code');
            if (storedRef && refInput) { refInput.value = storedRef; refInput.readOnly = true; refInput.style.opacity = '0.7'; }
            else if (refInput)         { refInput.value = ''; refInput.readOnly = false; refInput.style.opacity = '1'; }
        }
    }
}

function initAuthPage() {
    const form       = document.getElementById('auth-form');
    const toggleBtn  = document.getElementById('auth-toggle');
    const pwInput    = document.getElementById('auth-password');
    const pwToggle   = document.getElementById('toggle-pw-btn');
    const pwIcon     = document.getElementById('pw-icon');
    const mobileInput= document.getElementById('auth-mobile');

    // Only allow numbers in mobile field
    mobileInput.addEventListener('input', () => {
        mobileInput.value = mobileInput.value.replace(/\D/g, '').slice(0, 15);
    });

    // Formatting for referral code field
    const refInput = document.getElementById('auth-referral');
    if (refInput) {
        refInput.addEventListener('input', () => {
            refInput.value = refInput.value.replace(/\D/g, '').slice(0, 15);
        });
    }

    // Password show/hide toggle
    pwToggle.addEventListener('click', () => {
        const isHidden = pwInput.type === 'password';
        pwInput.type   = isHidden ? 'text' : 'password';
        pwIcon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // Switch login/signup mode
    toggleBtn.addEventListener('click', () => {
        isSignup = !isSignup;
        document.getElementById('email-field').style.display  = isSignup ? 'block' : 'none';
        document.getElementById('name-field').style.display   = isSignup ? 'block' : 'none';
        document.getElementById('referral-field').style.display = isSignup ? 'block' : 'none';
        document.getElementById('auth-email').required        = isSignup;
        document.getElementById('auth-name').required         = isSignup;
        document.getElementById('auth-btn-text').textContent  = isSignup ? 'Create Account' : 'Sign In';
        document.getElementById('auth-switch-msg').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
        toggleBtn.textContent = isSignup ? 'Sign In' : 'Create Account';
        document.getElementById('auth-subtitle').textContent  = isSignup ? 'Join now and start earning rewards!' : 'Sign in to start earning rewards!';

        if (isSignup) {
            const storedRef = localStorage.getItem('ep_ref_code');
            if (storedRef && refInput) {
                refInput.value = storedRef;
                refInput.readOnly = true;
                refInput.style.opacity = '0.7';
            } else if (refInput) {
                refInput.value = '';
                refInput.readOnly = false;
                refInput.style.opacity = '1';
            }
        }
    });

    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const mobile = document.getElementById('auth-mobile').value.trim();
        const password = document.getElementById('auth-password').value;

        if (mobile.length < 7 || mobile.length > 15) {
            showError('Please enter a valid mobile number with country code (7-15 digits).');
            return;
        }
        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }

        if (isSignup) {
            handleRegister(mobile, password);
        } else {
            handleLogin(mobile, password);
        }
    });
}

async function handleRegister(mobile, password) {
    const email = document.getElementById('auth-email').value.trim();
    const name  = document.getElementById('auth-name').value.trim() || 'Earner';
    const referralCode = document.getElementById('auth-referral').value.trim();

    if (!email) { showError('Please enter your email address.'); return; }

    const users = await dbGetUsers();

    // Check if admin mobile
    if (mobile === ADMIN_MOBILE) {
        showError('This mobile number is reserved. Use a different number.');
        return;
    }

    if (users.find(u => u.mobile === mobile)) {
        showError('This mobile number is already registered. Please Sign In.');
        return;
    }

    // Process referral code if provided
    let referrerMobile = '';
    if (referralCode) {
        if (referralCode === mobile) {
            showError('You cannot refer yourself.');
            return;
        }
        const referrer = users.find(u => u.mobile === referralCode);
        if (!referrer) {
            showError('Invalid referral code. Mobile number not registered.');
            return;
        }
        referrerMobile = referralCode;
    }

    // ── Tiered reward: calculate bonus for referrer ───────────────────────
    // Count how many people the referrer has already referred
    const existingReferralCount = referrerMobile
        ? users.filter(u => u.referred_by === referrerMobile).length
        : 0;
    const newReferralRank = existingReferralCount + 1; // this registration is their Nth referral
    let referralBonus = 50;
    if (newReferralRank > 10) referralBonus = 100;      // Tier 3: 11th+ referral → 100 pts
    else if (newReferralRank > 5) referralBonus = 75;   // Tier 2: 6th-10th referral → 75 pts
    // else Tier 1: 1st-5th referral → 50 pts

    // ── Welcome bonus for newly registered user who came via referral ─────
    const welcomeBonus = referrerMobile ? 25 : 0;

    const newUser = {
        mobile,
        password,
        email,
        name,
        points: welcomeBonus,   // 25 pts welcome bonus if referred, else 0
        streak: 0,
        last_claimed: 0,
        referred_by: referrerMobile,
        date_joined: new Date().toLocaleDateString('en-IN')
    };

    // Insert new user into Supabase
    const { error: regError } = await supabaseClient.from('ep_users').insert([newUser]);
    if (regError) {
        console.error('Registration error:', regError);
        if (regError.code === '42501' || regError.message?.includes('row-level security')) {
            showError('Database access error. Please contact support (RLS not configured).');
        } else if (regError.code === '23505') {
            showError('This mobile number is already registered. Please Sign In.');
        } else {
            showError(`Registration failed: ${regError.message || 'Unknown error. Please try again.'}`);
        }
        return;
    }

    // Log welcome bonus for the new user
    if (welcomeBonus > 0) {
        await supabaseClient.from('ep_logs').insert([{
            mobile,
            type: 'credit',
            title: '🎁 Welcome Bonus (Joined via referral)',
            points: welcomeBonus,
            date: new Date().toLocaleDateString('en-IN')
        }]);
    }

    // Credit referrer with tiered bonus
    if (referrerMobile) {
        const referrerUser = users.find(u => u.mobile === referrerMobile);
        if (referrerUser) {
            const newPoints = (referrerUser.points || 0) + referralBonus;
            await supabaseClient.from('ep_users').update({ points: newPoints }).eq('mobile', referrerMobile);

            // Tier label for history log
            const tierLabel = newReferralRank > 10 ? ' 🥇 Tier 3' : newReferralRank > 5 ? ' 🥈 Tier 2' : ' 🥉 Tier 1';

            // Log it for referrer
            await supabaseClient.from('ep_logs').insert([{
                mobile: referrerMobile,
                type: 'credit',
                title: `Referral Bonus${tierLabel} (Joined: ${name}) +${referralBonus} pts`,
                points: referralBonus,
                date: new Date().toLocaleDateString('en-IN')
            }]);
        }
        localStorage.removeItem('ep_ref_code');
        localStorage.removeItem('ep_ref_code_ts');
    }

    saveCurrent(mobile);
    await loadApp();
}

async function handleLogin(mobile, password) {
    const hashedPW = await sha256(password);
    const ADMIN_PW_HASH = '7429c36f688a03058dcd5bbe2ac9e8ef078122e675ab5fb3fe0d8189451cf395';

    // Admin login check
    if (mobile === ADMIN_MOBILE && hashedPW === ADMIN_PW_HASH) {
        saveCurrent('ADMIN');
        await loadApp();
        return;
    }

    const user = await dbGetUser(mobile);
    if (!user) {
        showError('Mobile number not registered. Please Create Account first.');
        return;
    }
    if (user.password !== password) {
        showError('Incorrect password. Please try again.');
        return;
    }

    saveCurrent(mobile);
    await loadApp();
}

function showError(msg) {
    let box = document.getElementById('auth-error');
    if (!box) {
        box = document.createElement('div');
        box.id = 'auth-error';
        box.style.cssText = 'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:10px 14px;margin-bottom:12px;color:#f87171;font-size:0.88rem;font-weight:500;';
        const form = document.getElementById('auth-form');
        form.insertBefore(box, form.firstChild);
    }
    box.textContent = msg;
    setTimeout(() => box && (box.textContent = ''), 4000);
}

function handleLogout() {
    saveCurrent(null);
    location.reload();
}

// ===================== LOAD APP =====================
async function loadApp() {
    const current = getCurrent();
    if (!current) {
        document.getElementById('auth-page').style.display = 'flex';
        document.getElementById('app-wrapper').style.display = 'none';
        return;
    }

    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-wrapper').style.display = 'block';
    // Close auth modal if open (from landing page)
    const modalOverlay = document.getElementById('auth-modal-overlay');
    if (modalOverlay) modalOverlay.style.display = 'none';

    const isAdmin = current === 'ADMIN';
    const user = isAdmin ? { mobile: ADMIN_MOBILE, name: 'Admin', points: 0, streak: 0, last_claimed: 0 } : await dbGetActiveUser();

    if (!user && !isAdmin) {
        saveCurrent(null);
        location.reload();
        return;
    }

    // Update header
    document.getElementById('pts-display').textContent  = isAdmin ? '∞' : user.points;
    document.getElementById('user-display').textContent = isAdmin ? 'ADMIN' : user.mobile;
    document.getElementById('hero-name').textContent    = isAdmin ? 'Admin' : (user.name || 'Earner');

    // Show/hide admin nav
    document.getElementById('admin-nav-btn').style.display = isAdmin ? 'inline-flex' : 'none';

    // Setup navigation
    setupNav();

    // Setup logout (cloned to clean old event listeners)
    const logoutBtn = document.getElementById('btn-logout');
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    newLogoutBtn.addEventListener('click', handleLogout);

    // Dashboard
    await updateDashStats();
    await startDailyTimer();

    // Daily claim button (cloned to clean listeners)
    const claimBtn = document.getElementById('btn-daily-claim');
    const newClaimBtn = claimBtn.cloneNode(true);
    claimBtn.parentNode.replaceChild(newClaimBtn, claimBtn);
    newClaimBtn.addEventListener('click', handleDailyClaim);

    // Refer & Earn setup
    if (!isAdmin) {
        await initReferTab();
    }

    // History
    await renderHistory();

    // Redeem buttons
    document.querySelectorAll('.btn-redeem').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            openRedeemModal(newBtn.dataset.reward, parseInt(newBtn.dataset.cost), newBtn.dataset.type);
        });
    });

    // Modal close
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('redeem-modal').addEventListener('click', (e) => {
        if (e.target.id === 'redeem-modal') closeModal();
    });

    // Redeem form submit (cloned to clean listeners)
    const redeemForm = document.getElementById('redeem-form');
    const newRedeemForm = redeemForm.cloneNode(true);
    redeemForm.parentNode.replaceChild(newRedeemForm, redeemForm);
    newRedeemForm.addEventListener('submit', handleRedeemSubmit);

    // Admin setup
    if (isAdmin) {
        await setupAdmin();
        // Auto-switch to admin tab
        setTimeout(() => {
            const adminBtn = document.querySelector('[data-tab="admin-tab"]');
            if (adminBtn) adminBtn.click();
        }, 100);
    }
}

// ===================== NAVIGATION =====================
function setupNav() {
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            newBtn.classList.add('active');
            const tab = document.getElementById(newBtn.dataset.tab);
            if (tab) tab.classList.add('active');
        });
    });
}

// ===================== DASHBOARD STATS =====================
async function updateDashStats() {
    const isAdmin = getCurrent() === 'ADMIN';
    if (isAdmin) return;

    const user = await dbGetActiveUser();
    if (!user) return;

    document.getElementById('pts-display').textContent  = user.points;
    document.getElementById('dash-pts').textContent     = user.points;
    document.getElementById('dash-streak').textContent  = user.streak;

    const allLogs = await dbGetLogs();
    const userLogs = allLogs.filter(l => l.mobile === user.mobile && l.type === 'credit');
    document.getElementById('dash-tasks').textContent = userLogs.length;
}

// ===================== DAILY CLAIM =====================
let timerInt;

async function handleDailyClaim() {
    const user = await dbGetActiveUser();
    if (!user) return;

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    if (now - parseInt(user.last_claimed || 0) < DAY) {
        alert('You already claimed today! Come back tomorrow.');
        return;
    }

    // Calculate streak
    let streak = user.streak || 0;
    const sinceClaim = now - parseInt(user.last_claimed || 0);
    if (user.last_claimed > 0 && sinceClaim > 2 * DAY) {
        streak = 1;
    } else if (user.last_claimed > 0) {
        streak = streak + 1;
    } else {
        streak = 1;
    }

    const bonus = 10 + (streak * 5);
    const newPoints = (user.points || 0) + bonus;

    // Update in Supabase
    const { error: updateError } = await supabaseClient
        .from('ep_users')
        .update({ points: newPoints, streak: streak, last_claimed: now })
        .eq('mobile', user.mobile);

    if (updateError) {
        alert('Failed to claim daily bonus. Please try again.');
        console.error(updateError);
        return;
    }

    // Log it
    await supabaseClient.from('ep_logs').insert([{
        mobile: user.mobile,
        type: 'credit',
        title: `Daily Bonus (Day ${streak})`,
        points: bonus,
        date: new Date().toLocaleDateString('en-IN')
    }]);

    await updateDashStats();
    await startDailyTimer();
    await renderHistory();
    alert(`🎉 You earned +${bonus} Points! Streak: ${streak} days`);
}

async function startDailyTimer() {
    const btn = document.getElementById('btn-daily-claim');
    const timer = document.getElementById('claim-timer');
    if (!btn || !timer) return;

    clearInterval(timerInt);
    const isAdmin = getCurrent() === 'ADMIN';
    if (isAdmin) { btn.disabled = true; timer.textContent = 'N/A for Admin'; return; }

    const user = await dbGetActiveUser();
    if (!user) return;

    const DAY = 24 * 60 * 60 * 1000;

    function tick() {
        const remaining = DAY - (Date.now() - parseInt(user.last_claimed || 0));
        if (remaining <= 0) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-gift"></i> Claim Daily Bonus';
            timer.textContent = '✅ Available now!';
            clearInterval(timerInt);
        } else {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Claimed Today';
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            timer.textContent = `Next: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
    }
    tick();
    timerInt = setInterval(tick, 1000);
}

// ===================== HISTORY =====================
async function renderHistory() {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    const isAdmin = getCurrent() === 'ADMIN';
    if (isAdmin) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem;">Switch to History tab after logging in as a user.</td></tr>'; return; }

    const user = await dbGetActiveUser();
    if (!user) return;

    const allLogs = await dbGetLogs();
    const allRedeems = await dbGetRedeems();

    const logs    = allLogs.filter(l => l.mobile === user.mobile);
    const redeems = allRedeems.filter(r => r.mobile === user.mobile);

    const rows = [
        ...logs.map(l => ({ date: l.date, desc: l.title, pts: l.points, type: 'credit', status: 'success' })),
        ...redeems.map(r => ({ date: r.date, desc: `Redeemed: ${r.reward_name}`, pts: r.point_cost, type: 'debit', status: r.status }))
    ].reverse();

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem;">No transactions yet. Start earning!</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(r => {
        const ptsHtml = r.type === 'credit'
            ? `<span class="pts-add">+${parseInt(r.pts)}</span>`
            : `<span class="pts-sub">-${parseInt(r.pts)}</span>`;
        const badgeMap = { success: 'success', approved: 'success', pending: 'pending', rejected: 'fail' };
        const badge = `<span class="badge ${badgeMap[r.status] || 'pending'}">${r.status}</span>`;
        return `<tr><td>${r.date}</td><td>${r.desc}</td><td>${ptsHtml}</td><td>${badge}</td></tr>`;
    }).join('');
}

// ===================== REDEEM MODAL =====================
let activeReward = null;

async function openRedeemModal(name, cost, type) {
    const isAdmin = getCurrent() === 'ADMIN';
    if (isAdmin) { alert('Admin cannot redeem rewards.'); return; }

    const user = await dbGetActiveUser();
    if (!user) return;
    if (user.points < cost) {
        alert(`Not enough points! You need ${cost.toLocaleString()} pts but have ${user.points.toLocaleString()} pts.`);
        return;
    }

    activeReward = { name, cost, type };
    document.getElementById('modal-title').textContent = name;
    document.getElementById('modal-cost').textContent = `Cost: ${cost.toLocaleString()} Points`;

    // Show relevant payment field
    const ppGrp   = document.getElementById('redeem-paypal-group');
    const wiseGrp = document.getElementById('redeem-wise-group');
    const emGrp   = document.getElementById('redeem-email-group');
    ppGrp.style.display   = type === 'paypal' ? 'block' : 'none';
    wiseGrp.style.display = type === 'wise'   ? 'block' : 'none';
    emGrp.style.display   = (type === 'email' || !type) ? 'block' : 'none';

    // Pre-fill user email
    const emailVal = user.email || '';
    if (type === 'paypal') document.getElementById('redeem-paypal').value = emailVal;
    else if (type === 'wise') document.getElementById('redeem-wise').value = emailVal;
    else document.getElementById('redeem-email').value = emailVal;

    const icons = { paypal: '💵', wise: '🏦', email: '🎁' };
    document.getElementById('modal-icon').textContent = icons[type] || '🎁';
    document.getElementById('redeem-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('redeem-modal').style.display = 'none';
    activeReward = null;
}

async function handleRedeemSubmit(e) {
    e.preventDefault();
    if (!activeReward) return;

    const type = activeReward.type;
    let paymentInfo = '';

    if (type === 'paypal') {
        paymentInfo = document.getElementById('redeem-paypal').value.trim();
        if (!paymentInfo) { alert('Please enter your PayPal email.'); return; }
    } else if (type === 'wise') {
        paymentInfo = document.getElementById('redeem-wise').value.trim();
        if (!paymentInfo) { alert('Please enter your Wise account email.'); return; }
    } else {
        paymentInfo = document.getElementById('redeem-email').value.trim();
        if (!paymentInfo) { alert('Please enter your email for delivery.'); return; }
    }

    const user = await dbGetActiveUser();
    if (!user) return;

    // Deduct points in database
    const newPoints = user.points - activeReward.cost;
    const { error: updateError } = await supabaseClient
        .from('ep_users')
        .update({ points: newPoints })
        .eq('mobile', user.mobile);

    if (updateError) {
        alert('Failed to submit redemption request. Please try again.');
        console.error(updateError);
        return;
    }

    // Save redeem request to Supabase
    const { error: redeemError } = await supabaseClient.from('ep_redeems').insert([{
        id: Date.now(),
        mobile: user.mobile,
        name: user.name,
        email: paymentInfo,
        payment_type: type,
        reward_name: activeReward.name,
        point_cost: activeReward.cost,
        date: new Date().toLocaleDateString('en-IN'),
        status: 'pending'
    }]);

    if (redeemError) {
        alert('Failed to log redemption request.');
        console.error(redeemError);
        return;
    }

    await updateDashStats();
    await renderHistory();
    closeModal();
    alert(`✅ Request submitted!\n\nReward: ${activeReward.name}\nPayment: ${paymentInfo}\n\nYou will receive it within 24–48 hours after admin approval.`);
}

// ===================== ADMIN PANEL =====================
async function setupAdmin() {
    // Admin sub-tab switching
    document.querySelectorAll('.admin-tab').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            newBtn.classList.add('active');
            const sec = document.getElementById(newBtn.dataset.sec);
            if (sec) sec.classList.add('active');
        });
    });

    await renderAdminData();
}

async function renderAdminData() {
    const users   = await dbGetUsers();
    const redeems = await dbGetRedeems();
    const pending = redeems.filter(r => r.status === 'pending');

    document.getElementById('admin-user-count').textContent = `(${users.length})`;
    document.getElementById('admin-req-count').textContent  = `(${pending.length})`;

    // Users table
    const uTbody = document.getElementById('admin-users-tbody');
    if (uTbody) {
        uTbody.innerHTML = users.length === 0
            ? '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:1.5rem;">No registered users yet.</td></tr>'
            : users.map(u => {
                const refCount = users.filter(ru => ru.referred_by === u.mobile).length;
                return `
                <tr>
                    <td><strong>${u.mobile}</strong></td>
                    <td>${u.name || '—'}</td>
                    <td>${u.email || '—'}</td>
                    <td style="color:var(--gold);font-weight:700;"><i class="fa-solid fa-coins"></i> ${u.points}</td>
                    <td style="font-weight:600; color:var(--cyan);"><i class="fa-solid fa-user-group"></i> ${refCount}</td>
                    <td>
                        <div class="admin-action-btns">
                            <button class="btn-a add" onclick="adminAdjustPts('${u.mobile}', 100)">+100</button>
                            <button class="btn-a sub" onclick="adminAdjustPts('${u.mobile}', -100)">-100</button>
                            <button class="btn-a add" onclick="adminAdjustPts('${u.mobile}', 1000)">+1000</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
    }

    // Requests table
    const rTbody = document.getElementById('admin-req-tbody');
    if (rTbody) {
        const sorted = [...redeems].sort((a, b) => b.id - a.id);
        rTbody.innerHTML = sorted.length === 0
            ? '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:1.5rem;">No redemption requests yet.</td></tr>'
            : sorted.map(r => {
                const badgeMap = { pending: 'pending', approved: 'success', rejected: 'fail' };
                const badge = `<span class="badge ${badgeMap[r.status] || 'pending'}">${r.status}</span>`;
                const ptypeBadge = r.payment_type === 'paypal'
                    ? `<span style="color:#009cde; font-weight:700; font-size:0.8rem;"><i class="fa-brands fa-paypal"></i> PayPal</span>`
                    : r.payment_type === 'wise'
                    ? `<span style="color:#48c85b; font-weight:700; font-size:0.8rem;"><i class="fa-solid fa-money-bill-transfer"></i> Wise</span>`
                    : `<span style="color:var(--cyan); font-weight:700; font-size:0.8rem;"><i class="fa-solid fa-envelope"></i> Email</span>`;
                const infoCell = `${ptypeBadge}<br><small style="color:var(--muted);">${r.email}</small>`;
                const mailSubject = `Your ${r.reward_name} - EarnPoints.Pro`;
                const mailBody = r.payment_type === 'paypal'
                    ? `Hello ${r.name},%0A%0AYour PayPal Cash has been sent to: ${r.email}%0A%0AAmount: ${r.reward_name}%0A%0AThank you for using EarnPoints.Pro!`
                    : r.payment_type === 'wise'
                    ? `Hello ${r.name},%0A%0AYour Wise Transfer has been sent to: ${r.email}%0A%0AAmount: ${r.reward_name}%0A%0AThank you for using EarnPoints.Pro!`
                    : `Hello ${r.name},%0A%0AYour redemption request has been approved!%0A%0AItem: ${r.reward_name}%0ARedeem Code: [PASTE CODE HERE]%0A%0AThank you for using EarnPoints.Pro!`;
                const actions = r.status === 'pending'
                    ? `<div class="admin-action-btns">
                        <button class="btn-a approve" onclick="adminApprove(${r.id})"><i class="fa-solid fa-check"></i> Approve</button>
                        <button class="btn-a reject" onclick="adminReject(${r.id})"><i class="fa-solid fa-xmark"></i> Reject</button>
                        <a class="btn-a mail" href="mailto:${r.email}?subject=${mailSubject}&body=${mailBody}" target="_blank"><i class="fa-solid fa-envelope"></i> Email</a>
                       </div>`
                    : `<span style="color:var(--muted);font-size:0.8rem;">Done</span>`;
                return `<tr>
                    <td>${r.date}</td>
                    <td><strong>${r.mobile}</strong></td>
                    <td>${infoCell}</td>
                    <td>${r.reward_name}</td>
                    <td>${r.point_cost}</td>
                    <td>${badge}</td>
                    <td>${actions}</td>
                </tr>`;
            }).join('');
    }
}

window.adminAdjustPts = async function(mobile, amount) {
    const user = await dbGetUser(mobile);
    if (!user) return;
    const newPoints = Math.max(0, (user.points || 0) + amount);
    const { error } = await supabaseClient.from('ep_users').update({ points: newPoints }).eq('mobile', mobile);
    if (error) { alert('Failed to adjust points.'); console.error(error); return; }
    await renderAdminData();
};

window.adminApprove = async function(id) {
    const { error } = await supabaseClient.from('ep_redeems').update({ status: 'approved' }).eq('id', id);
    if (error) { alert('Failed to approve request.'); console.error(error); return; }
    await renderAdminData();
    alert('✅ Request approved!');
};

window.adminReject = async function(id) {
    const redeems = await dbGetRedeems();
    const req = redeems.find(r => r.id === id);
    if (!req) return;

    const { error: rejectError } = await supabaseClient.from('ep_redeems').update({ status: 'rejected' }).eq('id', id);
    if (rejectError) { alert('Failed to reject request.'); console.error(rejectError); return; }

    // Refund points
    const user = await dbGetUser(req.mobile);
    if (user) {
        const newPoints = (user.points || 0) + req.point_cost;
        await supabaseClient.from('ep_users').update({ points: newPoints }).eq('mobile', req.mobile);
    }

    await renderAdminData();
    alert('❌ Request rejected. Points refunded to user.');
};

// ===================== REFERRAL TAB LOGIC =====================
async function initReferTab() {
    const user = await dbGetActiveUser();
    if (!user) return;

    // Generate Referral Link
    const refLink = window.location.origin + window.location.pathname + '?ref=' + user.mobile;
    const linkInput = document.getElementById('referral-link-input');
    if (linkInput) linkInput.value = refLink;

    // ── QR Code (via free qrserver.com API) ───────────────────────────────
    const qrImg = document.getElementById('ref-qr-img');
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(refLink)}&bgcolor=0f0726&color=a78bfa&margin=12&qzone=1&format=png`;
        qrImg.alt = 'Scan QR Code to join with referral';
    }

    // ── Sharing Links ─────────────────────────────────────────────────────
    const shareText = `🎁 Join EarnPoints Pro — earn free points by completing tasks! Use my referral link & get a 25 pts Welcome Bonus: ${refLink}`;
    const waBtn = document.getElementById('share-wa');
    const tgBtn = document.getElementById('share-tg');
    if (waBtn) waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    if (tgBtn) tgBtn.href = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🎁 Join EarnPoints Pro and get a 25 pts Welcome Bonus!')} `;

    // ── Copy Button Handler ───────────────────────────────────────────────
    const copyBtn = document.getElementById('btn-copy-link');
    if (copyBtn && linkInput) {
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        newCopyBtn.addEventListener('click', () => {
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(linkInput.value)
                .then(() => {
                    const originalHTML = newCopyBtn.innerHTML;
                    newCopyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    newCopyBtn.style.background = 'var(--green)';
                    newCopyBtn.style.borderColor = 'var(--green)';
                    newCopyBtn.style.boxShadow = '0 0 15px rgba(16,185,129,0.3)';
                    setTimeout(() => {
                        newCopyBtn.innerHTML = originalHTML;
                        newCopyBtn.style.background = '';
                        newCopyBtn.style.borderColor = '';
                        newCopyBtn.style.boxShadow = '';
                    }, 2000);
                })
                .catch(() => alert('Failed to copy link. Please select and copy manually.'));
        });
    }

    // ── Load Stats & Tier info ────────────────────────────────────────────
    const allUsers = await dbGetUsers();
    const referredUsers = allUsers.filter(u => u.referred_by === user.mobile);
    const refCount = referredUsers.length;

    // Calculate actual points earned via tiered system
    let refEarned = 0;
    for (let i = 1; i <= refCount; i++) {
        if (i > 10) refEarned += 100;
        else if (i > 5) refEarned += 75;
        else refEarned += 50;
    }

    // Next tier info
    let nextTierMsg = '';
    if (refCount < 5) nextTierMsg = `${5 - refCount} more to reach Tier 2 (75 pts/referral)`;
    else if (refCount < 10) nextTierMsg = `${10 - refCount} more to reach Tier 3 (100 pts/referral)`;
    else nextTierMsg = '🏆 Max Tier reached! Earning 100 pts per referral';

    const countElem = document.getElementById('ref-count');
    const ptsElem   = document.getElementById('ref-points');
    const tierElem  = document.getElementById('ref-tier-msg');
    if (countElem) countElem.textContent = refCount;
    if (ptsElem)   ptsElem.textContent   = refEarned;
    if (tierElem)  tierElem.textContent  = nextTierMsg;

    // ── Referred Users Table ──────────────────────────────────────────────
    const tbody = document.getElementById('referral-tbody');
    if (tbody) {
        if (referredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem;">No referrals yet. Share your link to start earning!</td></tr>';
        } else {
            tbody.innerHTML = referredUsers.map(u => {
                const maskedMobile = u.mobile.slice(0, 3) + '***' + u.mobile.slice(Math.max(3, u.mobile.length - 3));
                const joinDate = u.date_joined || 'Recent';
                return `<tr>
                    <td><strong>${maskedMobile}</strong></td>
                    <td>${u.name || 'Earner'}</td>
                    <td>${joinDate}</td>
                    <td><span class="badge success">Registered</span></td>
                </tr>`;
            }).join('');
        }
    }

    // ── Global Leaderboard (Top 10 referrers) ────────────────────────────
    const leaderboard = allUsers
        .map(u => ({
            name:     u.name || 'Earner',
            mobile:   u.mobile,
            refCount: allUsers.filter(r => r.referred_by === u.mobile).length
        }))
        .filter(u => u.refCount > 0)
        .sort((a, b) => b.refCount - a.refCount)
        .slice(0, 10);

    const lbTbody = document.getElementById('leaderboard-tbody');
    if (lbTbody) {
        if (leaderboard.length === 0) {
            lbTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:2rem;">No referrals recorded yet. Be the first!</td></tr>';
        } else {
            const medals = ['🥇','🥈','🥉'];
            lbTbody.innerHTML = leaderboard.map((u, i) => {
                const rankBadge = i < 3 ? medals[i] : `#${i + 1}`;
                const isMe = u.mobile === user.mobile;
                const rowStyle = isMe ? 'background:rgba(167,139,250,0.08); font-weight:700;' : '';
                const maskedName = u.name.length > 12 ? u.name.slice(0, 12) + '…' : u.name;
                const tier = u.refCount > 10 ? '<span class="badge success">Tier 3</span>' :
                             u.refCount > 5  ? '<span class="badge pending">Tier 2</span>' :
                                              '<span style="color:var(--muted);font-size:0.8rem;">Tier 1</span>';
                return `<tr style="${rowStyle}">
                    <td style="font-size:1.2rem;text-align:center;">${rankBadge}</td>
                    <td>${maskedName}${isMe ? ' <span style="color:var(--purple);font-size:0.75rem;">(You)</span>' : ''}</td>
                    <td style="color:var(--cyan);font-weight:700;"><i class="fa-solid fa-users"></i> ${u.refCount}</td>
                    <td>${tier}</td>
                </tr>`;
            }).join('');
        }
    }
}

// ===================== BOOT =====================
document.addEventListener('DOMContentLoaded', async () => {
    const current = getCurrent();
    if (current) {
        document.getElementById('auth-page').style.display = 'none';
        await loadApp();
    } else {
        document.getElementById('auth-page').style.display = 'flex';
        document.getElementById('app-wrapper').style.display = 'none';
        initAuthPage();

        // Show error message if redirected from downloads page
        const params = new URLSearchParams(window.location.search);
        if (params.get('msg') === 'login_required') {
            showError('Please sign in first to access premium files.');
        }
    }
});

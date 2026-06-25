/**
 * EarnPoints Pro — Cloudinary Integration
 * Cloud Name: daveigdbp
 *
 * Uses Cloudinary Fetch API (frontend-safe — no API Secret needed)
 * Auto-optimizes all images via f_auto + q_auto transformations
 */

const CLOUDINARY_CLOUD = 'daveigdbp';
const CLOUDINARY_BASE  = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}`;

/**
 * Generate an auto-optimized Cloudinary fetch URL
 * f_auto → best format (WebP/AVIF) for the browser
 * q_auto → best quality/size balance
 * w_<width> → resize to specific width
 * @param {string} imageUrl - original image URL (public URL)
 * @param {object} opts     - { width, height, crop }
 * @returns {string} cloudinary delivery URL
 */
function cloudinaryUrl(imageUrl, opts = {}) {
    const { width = 200, height = 200, crop = 'fill' } = opts;
    const transforms = [
        'f_auto',
        'q_auto',
        `w_${width}`,
        `h_${height}`,
        `c_${crop}`,
        'dpr_auto'
    ].join(',');
    return `${CLOUDINARY_BASE}/image/fetch/${transforms}/${encodeURIComponent(imageUrl)}`;
}

/**
 * Get a Cloudinary-hosted image by public ID (for uploaded images)
 * @param {string} publicId   - Cloudinary public_id
 * @param {object} opts       - { width, height, crop }
 */
function cloudinaryPublicUrl(publicId, opts = {}) {
    const { width = 200, height = 200, crop = 'fill' } = opts;
    const transforms = [
        'f_auto',
        'q_auto',
        `w_${width}`,
        `h_${height}`,
        `c_${crop}`
    ].join(',');
    return `${CLOUDINARY_BASE}/image/upload/${transforms}/${publicId}`;
}

/**
 * PRODUCT IMAGES
 * These are source image URLs — Cloudinary will fetch, cache, and
 * serve them optimized with f_auto + q_auto from CDN globally.
 */
const REWARD_IMAGES = {
    // Google Play
    'googleplay': cloudinaryUrl(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/1200px-Google_Play_Store_badge_EN.svg.png',
        { width: 120, height: 120, crop: 'pad' }
    ),
    // PayPal
    'paypal': cloudinaryUrl(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png',
        { width: 120, height: 60, crop: 'pad' }
    ),
    // Wise
    'wise': cloudinaryUrl(
        'https://cdn.wise.com/public-resources/assets/logos/wise/brand_logo.svg',
        { width: 120, height: 60, crop: 'pad' }
    ),
    // Downloads — AI Script
    'ai_script': cloudinaryUrl(
        'https://cdn-icons-png.flaticon.com/512/2721/2721297.png',
        { width: 80, height: 80, crop: 'fill' }
    ),
    // Downloads — Blogger Theme
    'blogger_theme': cloudinaryUrl(
        'https://cdn-icons-png.flaticon.com/512/2821/2821637.png',
        { width: 80, height: 80, crop: 'fill' }
    ),
    // Downloads — eBook
    'ebook': cloudinaryUrl(
        'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
        { width: 80, height: 80, crop: 'fill' }
    ),
    // Downloads — Game Config
    'game': cloudinaryUrl(
        'https://cdn-icons-png.flaticon.com/512/2991/2991117.png',
        { width: 80, height: 80, crop: 'fill' }
    ),
    // Downloads — Social Media Pack
    'social_pack': cloudinaryUrl(
        'https://cdn-icons-png.flaticon.com/512/733/733547.png',
        { width: 80, height: 80, crop: 'fill' }
    ),
    // Downloads — CPA Guide
    'cpa_guide': cloudinaryUrl(
        'https://cdn-icons-png.flaticon.com/512/3135/3135694.png',
        { width: 80, height: 80, crop: 'fill' }
    ),
    // Hero / Banner image
    'hero_banner': cloudinaryUrl(
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
        { width: 1200, height: 400, crop: 'fill' }
    ),
};

/**
 * Apply Cloudinary images to reward cards on the page.
 * Adds an <img> inside each card's brand-logo div.
 */
function applyCloudinaryImages() {
    // Reward store cards
    const rewardCards = document.querySelectorAll('.reward-card');
    rewardCards.forEach(card => {
        const btn = card.querySelector('.btn-redeem');
        if (!btn) return;

        const reward = btn.dataset.reward || '';
        const logoDiv = card.querySelector('.brand-logo');
        if (!logoDiv) return;

        let imgSrc = '';
        if (reward.toLowerCase().includes('paypal')) {
            imgSrc = REWARD_IMAGES.paypal;
            logoDiv.innerHTML = `<img src="${imgSrc}" alt="PayPal" style="width:80%; object-fit:contain;" onerror="this.style.display='none'">`;
        } else if (reward.toLowerCase().includes('wise')) {
            imgSrc = REWARD_IMAGES.wise;
            logoDiv.innerHTML = `<img src="${imgSrc}" alt="Wise" style="width:80%; object-fit:contain;" onerror="this.style.display='none'">`;
        } else if (reward.toLowerCase().includes('google play')) {
            // Keep icon, add optimized background
            logoDiv.style.backgroundImage = `url('${REWARD_IMAGES.googleplay}')`;
            logoDiv.style.backgroundSize = 'cover';
        }
    });
}

/**
 * Log Cloudinary info to console for debugging
 */
function cloudinaryDebugInfo() {
    console.group('☁️ Cloudinary Integration — EarnPoints Pro');
    console.log('Cloud Name:', CLOUDINARY_CLOUD);
    console.log('Delivery Base URL:', CLOUDINARY_BASE);
    console.log('');
    console.log('Sample Optimized Image URLs:');
    Object.entries(REWARD_IMAGES).forEach(([key, url]) => {
        console.log(`  ${key}:`, url);
    });
    console.log('');
    console.log('✅ f_auto  → serves WebP/AVIF to supported browsers');
    console.log('✅ q_auto  → auto quality for best size/quality ratio');
    console.log('✅ dpr_auto → serves 2x image for Retina displays');
    console.groupEnd();
}

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    applyCloudinaryImages();
    cloudinaryDebugInfo();
});

/* Straits Aquatics Auctions v1 */
(() => {
  'use strict';

  const SUPABASE_URL = "https://addrfpwgtixvzokkkuyi.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Pb-Qpdgq18RlUXgVe3SkKQ_7ba5-ZLO";
  const MEDIA_BUCKET = 'auction-media';

  const { createClient } = window.supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });

  const state = {
    session: null,
    user: null,
    bidder: null,
    isAdmin: false,
    auctions: [],
    mediaByAuction: new Map(),
    activeFilter: 'live',
    selectedAuctionId: null,
    otpEmail: '',
    realtimeChannel: null,
    finalized: new Set(),
    countdownTimer: null
  };

  const $ = (id) => document.getElementById(id);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {
    authBtn: $('authBtn'),
    myAuctionsBtn: $('myAuctionsBtn'),
    auctionGrid: $('auctionGrid'),
    emptyState: $('emptyState'),
    statusBanner: $('statusBanner'),
    refreshBtn: $('refreshBtn'),
    auctionModal: $('auctionModal'),
    auctionModalContent: $('auctionModalContent'),
    authModal: $('authModal'),
    authEmailStep: $('authEmailStep'),
    authCodeStep: $('authCodeStep'),
    authEmail: $('authEmail'),
    authCode: $('authCode'),
    otpEmailDisplay: $('otpEmailDisplay'),
    sendOtpBtn: $('sendOtpBtn'),
    verifyOtpBtn: $('verifyOtpBtn'),
    backToEmailBtn: $('backToEmailBtn'),
    authEmailMessage: $('authEmailMessage'),
    authCodeMessage: $('authCodeMessage'),
    profileModal: $('profileModal'),
    profileName: $('profileName'),
    profileWhatsapp: $('profileWhatsapp'),
    profileTerms: $('profileTerms'),
    saveProfileBtn: $('saveProfileBtn'),
    profileMessage: $('profileMessage'),
    myAuctionsModal: $('myAuctionsModal'),
    myAuctionsContent: $('myAuctionsContent'),
    toast: $('toast')
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function money(amount, currency = 'GBP') {
    const n = Number(amount || 0);
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(n);
    } catch (_) {
      return `${currency} ${n.toFixed(2)}`;
    }
  }

  function dt(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Gibraltar'
    }).format(new Date(value));
  }

  function shortTime(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Gibraltar'
    }).format(new Date(value));
  }

  function showToast(message, ms = 3400) {
    els.toast.textContent = message;
    els.toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.add('hidden'), ms);
  }

  function setMessage(el, message = '', type = '') {
    el.textContent = message;
    el.className = `form-message ${type}`;
  }

  function openModal(el) {
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(el) {
    el.classList.add('hidden');
    if (!document.querySelector('.modal-backdrop:not(.hidden)')) {
      document.body.style.overflow = '';
    }
  }

  function currentPhase(a) {
    if (a.status === 'cancelled') return 'ended';
    if (a.status === 'ended') return 'ended';
    const now = Date.now();
    const start = new Date(a.starts_at).getTime();
    const end = new Date(a.ends_at).getTime();
    if (now < start) return 'upcoming';
    if (now >= end) return 'ended';
    return 'live';
  }

  function countdownText(target) {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return '00d 00h 00m 00s';
    const sec = Math.floor(diff / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
    return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }

  function getCoverMedia(auctionId) {
    const items = state.mediaByAuction.get(auctionId) || [];
    return items.find(x => x.is_cover) || items[0] || null;
  }

  function mediaUrl(item) {
    if (!item) return '';
    if (item.media_type === 'external_video') return item.external_url || '';
    if (!item.storage_path) return '';
    const { data } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(item.storage_path);
    return data?.publicUrl || '';
  }

  function externalVideoEmbed(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : url;
      }
      if (u.hostname === 'youtu.be') {
        const id = u.pathname.replace(/^\//, '');
        return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
      }
      if (u.hostname.includes('vimeo.com')) {
        const id = u.pathname.split('/').filter(Boolean).pop();
        return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : url;
      }
    } catch (_) {}
    return url;
  }

  function renderMediaElement(item, className = '') {
    if (!item) return `<div class="card-media-placeholder">🐠</div>`;
    const url = mediaUrl(item);
    if (!url) return `<div class="card-media-placeholder">🐠</div>`;

    if (item.media_type === 'image') {
      return `<img class="${className}" src="${escapeHtml(url)}" alt="${escapeHtml(item.caption || 'Auction image')}" loading="lazy">`;
    }
    if (item.media_type === 'video') {
      return `<video class="${className}" src="${escapeHtml(url)}" muted playsinline preload="metadata"></video>`;
    }
    return `<iframe class="${className}" src="${escapeHtml(externalVideoEmbed(url))}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }

  function publicPrice(a) {
    if (a.current_bid != null) return money(a.current_bid, a.currency);
    return money(a.starting_bid, a.currency);
  }

  function nextMinimum(a) {
    if (a.current_bid == null) return Number(a.starting_bid);
    return Number(a.current_bid) + Number(a.min_increment);
  }

  function renderCard(a) {
    const phase = currentPhase(a);
    const cover = getCoverMedia(a.id);
    const priceLabel = a.current_bid == null ? 'Starting bid' : (phase === 'ended' ? 'Final bid' : 'Current bid');
    const reserve = a.has_reserve
      ? `<div class="reserve-note ${a.reserve_met ? 'met' : 'not-met'}">${a.reserve_met ? '✓ Reserve met' : 'Reserve not yet met'}</div>`
      : '';

    let timer = '';
    if (phase === 'upcoming') {
      timer = `<div class="countdown" data-countdown="${escapeHtml(a.starts_at)}" data-kind="starts" data-auction="${a.id}">Starts in ${countdownText(a.starts_at)}</div>`;
    } else if (phase === 'live') {
      timer = `<div class="countdown" data-countdown="${escapeHtml(a.ends_at)}" data-kind="ends" data-auction="${a.id}">Ends in ${countdownText(a.ends_at)}</div>`;
    } else {
      timer = `<div class="countdown">Ended ${escapeHtml(dt(a.ends_at))}</div>`;
    }

    return `
      <article class="auction-card">
        <div class="card-media">
          ${renderMediaElement(cover)}
          <span class="status-chip ${phase}">${phase === 'live' ? '● Live' : phase}</span>
        </div>
        <div class="card-body">
          ${a.category ? `<div class="card-category">${escapeHtml(a.category)}</div>` : ''}
          <h2 class="card-title">${escapeHtml(a.title)}</h2>
          <div class="price-label">${priceLabel}</div>
          <div class="price-main">${publicPrice(a)}</div>
          ${reserve}
          <div class="card-meta">
            <span>${Number(a.bid_count || 0)} bid${Number(a.bid_count || 0) === 1 ? '' : 's'}</span>
            ${a.current_leader_public_name ? `<span>Leader: ${escapeHtml(a.current_leader_public_name)}</span>` : ''}
          </div>
          ${timer}
          <div class="card-actions">
            <button class="btn btn-primary" data-open-auction="${a.id}">${phase === 'live' ? 'View & Bid' : 'View Auction'}</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderAuctions() {
    const filtered = state.auctions.filter(a => {
      const phase = currentPhase(a);
      return state.activeFilter === 'all' || phase === state.activeFilter;
    });

    els.auctionGrid.innerHTML = filtered.map(renderCard).join('');
    els.emptyState.classList.toggle('hidden', filtered.length > 0);

    qsa('[data-open-auction]').forEach(btn => {
      btn.addEventListener('click', () => openAuction(btn.dataset.openAuction));
    });

    updateCountdowns();
  }

  async function loadAuctions(showError = true) {
    const { data, error } = await sb
      .from('auctions')
      .select('*')
      .not('published_at', 'is', null)
      .order('starts_at', { ascending: false });

    if (error) {
      if (showError) {
        els.statusBanner.textContent = `Could not load auctions: ${error.message}`;
        els.statusBanner.classList.remove('hidden');
      }
      return;
    }

    state.auctions = data || [];
    els.statusBanner.classList.add('hidden');
    await loadMedia();
    renderAuctions();

    if (state.selectedAuctionId) {
      const current = state.auctions.find(a => a.id === state.selectedAuctionId);
      if (current && !els.auctionModal.classList.contains('hidden')) {
        renderAuctionModal(current);
      }
    }
  }

  async function loadMedia() {
    if (!state.auctions.length) {
      state.mediaByAuction.clear();
      return;
    }
    const ids = state.auctions.map(a => a.id);
    const { data, error } = await sb
      .from('auction_media')
      .select('*')
      .in('auction_id', ids)
      .order('sort_order', { ascending: true });

    if (error) return;

    state.mediaByAuction.clear();
    (data || []).forEach(item => {
      if (!state.mediaByAuction.has(item.auction_id)) state.mediaByAuction.set(item.auction_id, []);
      state.mediaByAuction.get(item.auction_id).push(item);
    });
  }

  async function openAuction(id) {
    const a = state.auctions.find(x => x.id === id);
    if (!a) return;
    state.selectedAuctionId = id;
    openModal(els.auctionModal);
    await renderAuctionModal(a);
  }

  async function fetchBidHistory(auctionId) {
    const { data, error } = await sb.rpc('get_public_auction_bids', {
      p_auction_id: auctionId,
      p_limit: 25
    });
    if (error) return [];
    return data || [];
  }

  function galleryHtml(a) {
    const items = state.mediaByAuction.get(a.id) || [];
    if (!items.length) {
      return `
        <div class="gallery-main" id="galleryMain">
          <div class="card-media-placeholder">🐠</div>
        </div>
      `;
    }

    const main = items.find(x => x.is_cover) || items[0];
    return `
      <div class="gallery-main" id="galleryMain">${renderMediaElement(main)}</div>
      ${items.length > 1 ? `
        <div class="gallery-thumbs">
          ${items.map((item, i) => `
            <button class="gallery-thumb ${item.id === main.id ? 'active' : ''}" data-media-index="${i}">
              ${item.media_type === 'image'
                ? `<img src="${escapeHtml(mediaUrl(item))}" alt="">`
                : `<div class="card-media-placeholder" style="font-size:22px">▶</div>`}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  async function renderAuctionModal(a) {
    const phase = currentPhase(a);
    const history = await fetchBidHistory(a.id);
    const minimum = nextMinimum(a);
    const canBid = phase === 'live';
    const bidderReady = !!state.bidder;
    const loggedIn = !!state.user;

    let actionArea = '';
    if (phase === 'upcoming') {
      actionArea = `<div class="bid-guidance">Bidding opens ${escapeHtml(dt(a.starts_at))}.</div>`;
    } else if (phase === 'ended') {
      actionArea = `
        <div class="winner-box">
          <strong>Auction ended</strong>
          <div style="margin-top:5px">Final bid: ${publicPrice(a)}</div>
          ${a.has_reserve && !a.reserve_met ? '<div class="reserve-note not-met">Reserve was not met — no winning sale.</div>' : ''}
        </div>
      `;
    } else if (!loggedIn) {
      actionArea = `
        <button id="detailSignInBtn" class="btn btn-primary btn-block">Sign in / Register to bid</button>
      `;
    } else if (!bidderReady) {
      actionArea = `
        <button id="detailCompleteProfileBtn" class="btn btn-primary btn-block">Complete bidder registration</button>
      `;
    } else {
      actionArea = `
        <div class="bid-input-row">
          <input id="bidAmount" class="field" type="number" inputmode="decimal" min="${minimum.toFixed(2)}" step="0.01" value="${minimum.toFixed(2)}">
          <button id="placeBidBtn" class="btn btn-primary">Place Bid</button>
        </div>
        <div class="bid-guidance">Minimum next bid: <strong>${money(minimum, a.currency)}</strong></div>
        ${a.buy_now_price != null ? `
          <button id="buyNowBtn" class="btn btn-orange btn-block">
            Buy It Now — ${money(a.buy_now_price, a.currency)}
          </button>
        ` : ''}
      `;
    }

    els.auctionModalContent.innerHTML = `
      <div class="detail-layout">
        <div>
          ${galleryHtml(a)}
        </div>
        <div class="detail-panel">
          <span class="eyebrow">${escapeHtml(a.category || 'Auction')}</span>
          <h2>${escapeHtml(a.title)}</h2>
          <div class="detail-description">${escapeHtml(a.description || '')}</div>

          <div class="bid-box">
            <div class="price-label">${a.current_bid == null ? 'Starting bid' : (phase === 'ended' ? 'Final bid' : 'Current bid')}</div>
            <div class="bid-price">${publicPrice(a)}</div>
            <div class="card-meta">
              <span>${Number(a.bid_count || 0)} bid${Number(a.bid_count || 0) === 1 ? '' : 's'}</span>
              ${a.current_leader_public_name ? `<span>Leader: ${escapeHtml(a.current_leader_public_name)}</span>` : ''}
            </div>
            ${a.has_reserve ? `<div class="reserve-note ${a.reserve_met ? 'met' : 'not-met'}">${a.reserve_met ? '✓ Reserve met' : 'Reserve not yet met'}</div>` : ''}
            ${phase === 'live' ? `<div class="countdown" data-countdown="${escapeHtml(a.ends_at)}" data-kind="ends" data-auction="${a.id}">Ends in ${countdownText(a.ends_at)}</div>` : ''}
            ${phase === 'upcoming' ? `<div class="countdown" data-countdown="${escapeHtml(a.starts_at)}" data-kind="starts" data-auction="${a.id}">Starts in ${countdownText(a.starts_at)}</div>` : ''}
            ${actionArea}
          </div>

          <div class="delivery-info">
            ${a.collection_enabled ? '<span>🏪 Free collection from Straits Aquatics</span>' : ''}
            ${a.local_delivery_enabled ? `<span>🚚 Gibraltar local delivery — ${money(a.local_delivery_price_gbp, 'GBP')}</span>` : ''}
            ${a.iberia_shipping_enabled ? `<span>📦 Spain / Portugal shipping — ${money(a.iberia_shipping_price_eur, 'EUR')}</span>` : ''}
            ${a.custom_delivery_note ? `<span>${escapeHtml(a.custom_delivery_note)}</span>` : ''}
            <span><strong>Delivery is added to the final winning bid where applicable.</strong></span>
          </div>

          <div class="bid-history">
            <h3>Bid history</h3>
            ${history.length ? history.map(b => `
              <div class="bid-row">
                <span>${escapeHtml(b.bidder_public_name)}</span>
                <span class="amount">${money(b.amount, a.currency)}</span>
                <span class="time">${escapeHtml(shortTime(b.placed_at))}</span>
              </div>
            `).join('') : '<p class="muted">No bids yet.</p>'}
          </div>
        </div>
      </div>
    `;

    qsa('[data-media-index]', els.auctionModalContent).forEach(btn => {
      btn.addEventListener('click', () => {
        const items = state.mediaByAuction.get(a.id) || [];
        const item = items[Number(btn.dataset.mediaIndex)];
        $('galleryMain').innerHTML = renderMediaElement(item);
        qsa('[data-media-index]', els.auctionModalContent).forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    $('detailSignInBtn')?.addEventListener('click', () => openAuth());
    $('detailCompleteProfileBtn')?.addEventListener('click', () => openProfile());

    $('placeBidBtn')?.addEventListener('click', async () => {
      const amount = Number($('bidAmount')?.value);
      if (!Number.isFinite(amount)) return;
      await placeBid(a.id, amount);
    });

    $('buyNowBtn')?.addEventListener('click', async () => {
      await buyNow(a);
    });

    updateCountdowns();
  }

  async function placeBid(auctionId, amount) {
    if (!state.user) return openAuth();
    if (!state.bidder) return openProfile();

    const a = state.auctions.find(x => x.id === auctionId);
    if (!a) return;

    const minimum = nextMinimum(a);
    if (amount < minimum) {
      return showToast(`Minimum bid is ${money(minimum, a.currency)}`);
    }

    const btn = $('placeBidBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Placing bid…';
    }

    const { data, error } = await sb.rpc('place_auction_bid', {
      p_auction_id: auctionId,
      p_amount: Number(amount.toFixed(2))
    });

    if (error) {
      showToast(error.message || 'Bid could not be placed.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Place Bid';
      }
      await loadAuctions(false);
      return;
    }

    // Notify the previous leading bidder by email. The bid remains valid even if email delivery fails.
    const placedBid = Array.isArray(data) ? data[0] : data;
    if (placedBid?.bid_id) {
      sb.functions.invoke('auction-email', {
        body: { action: 'outbid', auction_id: auctionId, bid_id: placedBid.bid_id }
      }).then(({ error }) => {
        if (error) console.warn('Outbid notification email could not be sent:', error);
      }).catch(err => console.warn('Outbid notification email failed:', err));
    }

    showToast(`Bid accepted at ${money(amount, a.currency)}`);
    await loadAuctions(false);

    const fresh = state.auctions.find(x => x.id === auctionId);
    if (fresh) await renderAuctionModal(fresh);
  }

  async function buyNow(a) {
    if (!state.user) return openAuth();
    if (!state.bidder) return openProfile();

    const ok = window.confirm(
      `Buy It Now for ${money(a.buy_now_price, a.currency)}?\n\nIf you confirm, the auction ends immediately and you are committing to purchase the item.`
    );
    if (!ok) return;

    const btn = $('buyNowBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing…';
    }

    const { data, error } = await sb.rpc('buy_now_auction', {
      p_auction_id: a.id
    });

    if (error) {
      showToast(error.message || 'Buy It Now could not be completed.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = `Buy It Now — ${money(a.buy_now_price, a.currency)}`;
      }
      return;
    }

    showToast('Congratulations — the auction is yours.');
    await loadAuctions(false);
    closeModal(els.auctionModal);
    await openMyAuctions();
  }

  function openAuth() {
    setMessage(els.authEmailMessage);
    setMessage(els.authCodeMessage);
    els.authEmailStep.classList.remove('hidden');
    els.authCodeStep.classList.add('hidden');
    openModal(els.authModal);
    setTimeout(() => els.authEmail.focus(), 50);
  }

  async function sendOtp() {
    const email = els.authEmail.value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setMessage(els.authEmailMessage, 'Enter a valid email address.', 'error');
    }

    els.sendOtpBtn.disabled = true;
    els.sendOtpBtn.textContent = 'Sending…';
    setMessage(els.authEmailMessage);

    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    els.sendOtpBtn.disabled = false;
    els.sendOtpBtn.textContent = 'Send login code';

    if (error) {
      return setMessage(els.authEmailMessage, error.message, 'error');
    }

    state.otpEmail = email;
    els.otpEmailDisplay.textContent = email;
    els.authEmailStep.classList.add('hidden');
    els.authCodeStep.classList.remove('hidden');
    els.authCode.value = '';
    setTimeout(() => els.authCode.focus(), 50);
  }

  async function verifyOtp() {
    const token = els.authCode.value.replace(/\D/g, '');
    if (token.length !== 6) {
      return setMessage(els.authCodeMessage, 'Enter the 6-digit code from your email.', 'error');
    }

    els.verifyOtpBtn.disabled = true;
    els.verifyOtpBtn.textContent = 'Verifying…';
    setMessage(els.authCodeMessage);

    const { data, error } = await sb.auth.verifyOtp({
      email: state.otpEmail,
      token,
      type: 'email'
    });

    els.verifyOtpBtn.disabled = false;
    els.verifyOtpBtn.textContent = 'Verify & sign in';

    if (error) {
      return setMessage(els.authCodeMessage, error.message, 'error');
    }

    state.session = data.session;
    state.user = data.user;
    await refreshIdentity();
    closeModal(els.authModal);

    if (!state.bidder && !state.isAdmin) {
      openProfile();
    } else {
      showToast('Signed in successfully.');
    }

    updateHeader();
    if (state.selectedAuctionId && !els.auctionModal.classList.contains('hidden')) {
      const a = state.auctions.find(x => x.id === state.selectedAuctionId);
      if (a) await renderAuctionModal(a);
    }
  }

  function openProfile() {
    if (!state.user) return openAuth();
    els.profileName.value = state.bidder?.full_name || '';
    els.profileWhatsapp.value = state.bidder?.whatsapp || '';
    els.profileTerms.checked = false;
    setMessage(els.profileMessage);
    openModal(els.profileModal);
  }

  async function saveProfile() {
    if (!state.user) return;
    const fullName = els.profileName.value.trim();
    const whatsapp = els.profileWhatsapp.value.trim();

    if (fullName.length < 2) {
      return setMessage(els.profileMessage, 'Enter your full name.', 'error');
    }
    if (!els.profileTerms.checked) {
      return setMessage(els.profileMessage, 'You must accept the bidding commitment to register.', 'error');
    }

    els.saveProfileBtn.disabled = true;
    els.saveProfileBtn.textContent = 'Saving…';

    let error;
    if (state.bidder) {
      ({ error } = await sb
        .from('auction_bidders')
        .update({ full_name: fullName, whatsapp: whatsapp || null })
        .eq('id', state.user.id));
    } else {
      ({ error } = await sb
        .from('auction_bidders')
        .insert({
          id: state.user.id,
          email: state.user.email,
          full_name: fullName,
          whatsapp: whatsapp || null
        }));
    }

    els.saveProfileBtn.disabled = false;
    els.saveProfileBtn.textContent = 'Complete registration';

    if (error) {
      return setMessage(els.profileMessage, error.message, 'error');
    }

    await refreshIdentity();
    closeModal(els.profileModal);
    updateHeader();
    showToast('Bidder registration complete.');

    if (state.selectedAuctionId && !els.auctionModal.classList.contains('hidden')) {
      const a = state.auctions.find(x => x.id === state.selectedAuctionId);
      if (a) await renderAuctionModal(a);
    }
  }

  async function refreshIdentity() {
    if (!state.user) {
      state.bidder = null;
      state.isAdmin = false;
      return;
    }

    const [bidderRes, adminRes] = await Promise.all([
      sb.from('auction_bidders').select('*').eq('id', state.user.id).maybeSingle(),
      sb.from('auction_admins').select('active').eq('user_id', state.user.id).maybeSingle()
    ]);

    state.bidder = bidderRes.data || null;
    state.isAdmin = !!adminRes.data?.active;
  }

  function updateHeader() {
    const signedIn = !!state.user;
    els.myAuctionsBtn.classList.toggle('hidden', !signedIn);

    if (!signedIn) {
      els.authBtn.textContent = 'Sign in / Register';
      els.authBtn.onclick = openAuth;
      return;
    }

    const label = state.bidder?.full_name || state.user.email || 'Account';
    els.authBtn.textContent = label.length > 24 ? `${label.slice(0,21)}…` : label;
    els.authBtn.onclick = async () => {
      const signOut = window.confirm(`Signed in as ${state.user.email}.\n\nSign out?`);
      if (!signOut) return;
      await sb.auth.signOut();
    };
  }

  async function openMyAuctions() {
    if (!state.user) return openAuth();
    openModal(els.myAuctionsModal);
    els.myAuctionsContent.innerHTML = '<p class="muted">Loading your auctions…</p>';

    const [bidsRes, resultsRes] = await Promise.all([
      sb.from('auction_bids')
        .select('auction_id,amount,placed_at,bid_kind')
        .order('placed_at', { ascending: false }),
      sb.from('auction_results')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    const ownBids = bidsRes.data || [];
    const ownResults = resultsRes.data || [];
    const auctionIds = [...new Set([
      ...ownBids.map(x => x.auction_id),
      ...ownResults.map(x => x.auction_id)
    ])];

    if (!auctionIds.length) {
      els.myAuctionsContent.innerHTML = '<p class="muted">You have not bid in any auctions yet.</p>';
      return;
    }

    const { data: auctionsData } = await sb
      .from('auctions')
      .select('*')
      .in('id', auctionIds);

    const byId = new Map((auctionsData || []).map(a => [a.id, a]));
    const resultById = new Map(ownResults.map(r => [r.auction_id, r]));
    const latestBidById = new Map();

    for (const b of ownBids) {
      if (!latestBidById.has(b.auction_id)) latestBidById.set(b.auction_id, b);
    }

    const rows = auctionIds.map(id => {
      const a = byId.get(id);
      if (!a) return '';
      const r = resultById.get(id);
      const myBid = latestBidById.get(id);
      const phase = currentPhase(a);

      let stateLabel = 'Ended';
      let stateClass = 'ended';

      if (r?.winner_id === state.user.id) {
        stateLabel = 'Won';
        stateClass = 'won';
      } else if (phase === 'live' && state.bidder && a.current_leader_public_name === state.bidder.public_name) {
        stateLabel = 'You’re winning';
        stateClass = 'winning';
      } else if (phase === 'live') {
        stateLabel = 'Outbid';
        stateClass = 'outbid';
      }

      return `
        <div class="my-auction-item">
          <div class="my-auction-head">
            <div>
              <strong>${escapeHtml(a.title)}</strong>
              <div class="muted" style="margin-top:4px">Your latest bid: ${myBid ? money(myBid.amount, a.currency) : '—'}</div>
              <span class="account-state ${stateClass}">${stateLabel}</span>
            </div>
            <div style="text-align:right">
              <div class="price-label">${phase === 'ended' ? 'Final bid' : 'Current bid'}</div>
              <div style="font-weight:900;color:var(--navy);font-size:20px">${publicPrice(a)}</div>
              <button class="btn btn-ghost btn-small" style="margin-top:8px" data-my-open="${a.id}">View</button>
            </div>
          </div>
          ${r?.winner_id === state.user.id ? winnerPanel(a, r) : ''}
        </div>
      `;
    }).join('');

    els.myAuctionsContent.innerHTML = `<div class="my-auction-list">${rows}</div>`;

    qsa('[data-my-open]', els.myAuctionsContent).forEach(btn => {
      btn.addEventListener('click', async () => {
        closeModal(els.myAuctionsModal);
        await openAuction(btn.dataset.myOpen);
      });
    });

    qsa('[data-delivery-submit]', els.myAuctionsContent).forEach(btn => {
      btn.addEventListener('click', async () => {
        const auctionId = btn.dataset.deliverySubmit;
        const selected = els.myAuctionsContent.querySelector(`input[name="delivery-${auctionId}"]:checked`);
        if (!selected) return showToast('Choose a delivery option.');
        await chooseDelivery(auctionId, selected.value);
      });
    });
  }

  function winnerPanel(a, r) {
    const awaitingChoice = r.payment_status === 'awaiting_delivery_choice';
    const paymentReady = !!(r.paypal_url || r.revolut_url);

    let delivery = '';
    if (awaitingChoice) {
      const options = [];
      if (a.collection_enabled) options.push(`
        <label class="check-row"><input type="radio" name="delivery-${a.id}" value="collection"><span>Collect from Straits Aquatics — <strong>FREE</strong></span></label>
      `);
      if (a.local_delivery_enabled) options.push(`
        <label class="check-row"><input type="radio" name="delivery-${a.id}" value="gibraltar_delivery"><span>Gibraltar delivery — <strong>${money(a.local_delivery_price_gbp,'GBP')}</strong></span></label>
      `);
      if (a.iberia_shipping_enabled) options.push(`
        <label class="check-row"><input type="radio" name="delivery-${a.id}" value="spain_portugal_shipping"><span>Spain / Portugal shipping — <strong>${money(a.iberia_shipping_price_eur,'EUR')}</strong></span></label>
      `);

      delivery = `
        <div style="margin-top:12px">
          <strong>Choose collection / delivery</strong>
          ${options.join('')}
          <button class="btn btn-primary btn-small" style="margin-top:10px" data-delivery-submit="${a.id}">Confirm delivery</button>
        </div>
      `;
    } else if (r.delivery_method) {
      const labels = {
        collection: 'Shop collection',
        gibraltar_delivery: 'Gibraltar local delivery',
        spain_portugal_shipping: 'Spain / Portugal shipping'
      };
      delivery = `
        <div class="muted" style="margin-top:10px">
          Delivery: <strong>${escapeHtml(labels[r.delivery_method] || r.delivery_method)}</strong>
          ${r.delivery_amount != null ? ` · ${money(r.delivery_amount, r.delivery_currency || 'GBP')}` : ''}
        </div>
      `;
    }

    return `
      <div class="winner-box">
        <strong>🎉 Congratulations — you won this auction.</strong>
        <div style="margin-top:6px">Winning bid: <strong>${money(r.winning_bid, a.currency)}</strong></div>
        ${delivery}
        ${r.total_due != null ? `<div style="margin-top:9px">Total due: <strong>${money(r.total_due, r.payment_currency || a.currency)}</strong></div>` : ''}
        ${paymentReady ? `
          <div class="payment-buttons">
            ${r.paypal_url ? `<a class="payment-link" href="${escapeHtml(r.paypal_url)}" target="_blank" rel="noopener">Pay with PayPal</a>` : ''}
            ${r.revolut_url ? `<a class="payment-link" href="${escapeHtml(r.revolut_url)}" target="_blank" rel="noopener">Pay with Revolut</a>` : ''}
          </div>
        ` : (r.payment_status !== 'paid' ? '<div class="muted" style="margin-top:9px">Payment link will appear here once Straits Aquatics prepares it.</div>' : '')}
        ${r.payment_status === 'paid' ? '<div class="reserve-note met" style="margin-top:10px">✓ Payment recorded as paid</div>' : ''}
      </div>
    `;
  }

  async function chooseDelivery(auctionId, method) {
    const { error } = await sb.rpc('choose_auction_delivery', {
      p_auction_id: auctionId,
      p_delivery_method: method
    });

    if (error) return showToast(error.message || 'Could not save delivery choice.');
    showToast('Delivery choice saved.');
    await openMyAuctions();
  }

  async function finalizeIfNeeded(a) {
    if (state.finalized.has(a.id)) return;
    if (a.status === 'ended' || a.status === 'cancelled') return;
    if (Date.now() < new Date(a.ends_at).getTime()) return;

    state.finalized.add(a.id);
    const { error } = await sb.rpc('finalize_auction', {
      p_auction_id: a.id
    });
    if (error) {
      state.finalized.delete(a.id);
      return;
    }
    await loadAuctions(false);
  }

  function updateCountdowns() {
    qsa('[data-countdown]').forEach(el => {
      const target = el.dataset.countdown;
      const kind = el.dataset.kind;
      el.textContent = `${kind === 'starts' ? 'Starts in' : 'Ends in'} ${countdownText(target)}`;
    });

    state.auctions.forEach(a => {
      if (Date.now() >= new Date(a.ends_at).getTime() && currentPhase(a) === 'ended') {
        finalizeIfNeeded(a);
      }
    });
  }

  function startCountdownTimer() {
    clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(() => {
      updateCountdowns();

      // Re-render around start/end boundaries.
      const needs = state.auctions.some(a => {
        const phase = currentPhase(a);
        const previous = a.__lastPhase;
        a.__lastPhase = phase;
        return previous && previous !== phase;
      });
      if (needs) renderAuctions();
    }, 1000);
  }

  function setupRealtime() {
    if (state.realtimeChannel) sb.removeChannel(state.realtimeChannel);

    state.realtimeChannel = sb
      .channel('public-auctions-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auctions'
      }, async () => {
        await loadAuctions(false);
      })
      .subscribe();
  }

  async function bootstrapAuth() {
    const { data } = await sb.auth.getSession();
    state.session = data.session;
    state.user = data.session?.user || null;
    await refreshIdentity();
    updateHeader();

    sb.auth.onAuthStateChange(async (_event, session) => {
      state.session = session;
      state.user = session?.user || null;
      await refreshIdentity();
      updateHeader();

      if (!state.user) {
        state.bidder = null;
        state.isAdmin = false;
        closeModal(els.myAuctionsModal);
        closeModal(els.profileModal);
        showToast('Signed out.');
      }
    });
  }

  function bindEvents() {
    els.refreshBtn.addEventListener('click', () => loadAuctions());
    els.sendOtpBtn.addEventListener('click', sendOtp);
    els.verifyOtpBtn.addEventListener('click', verifyOtp);
    els.saveProfileBtn.addEventListener('click', saveProfile);
    els.myAuctionsBtn.addEventListener('click', openMyAuctions);

    els.authEmail.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendOtp();
    });
    els.authCode.addEventListener('keydown', e => {
      if (e.key === 'Enter') verifyOtp();
    });

    els.authCode.addEventListener('input', () => {
      els.authCode.value = els.authCode.value.replace(/\D/g, '').slice(0,6);
    });

    els.backToEmailBtn.addEventListener('click', () => {
      els.authCodeStep.classList.add('hidden');
      els.authEmailStep.classList.remove('hidden');
      setTimeout(() => els.authEmail.focus(), 50);
    });

    qsa('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        qsa('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeFilter = tab.dataset.filter;
        renderAuctions();
      });
    });

    qsa('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal($(btn.dataset.close)));
    });

    qsa('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop && backdrop !== els.profileModal) closeModal(backdrop);
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = qsa('.modal-backdrop:not(.hidden)');
      if (open.length) closeModal(open[open.length - 1]);
    });
  }

  async function init() {
    bindEvents();
    await bootstrapAuth();
    await loadAuctions();

    // Direct auction links from notification emails: ?auction=UUID
    const params = new URLSearchParams(window.location.search);
    const directAuction = params.get('auction');
    if (directAuction && state.auctions.some(a => a.id === directAuction)) {
      await openAuction(directAuction);
    }

    setupRealtime();
    startCountdownTimer();
  }

  init().catch(err => {
    console.error(err);
    els.statusBanner.textContent = 'The auction application could not start. Please refresh the page.';
    els.statusBanner.classList.remove('hidden');
  });
})();

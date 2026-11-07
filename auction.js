/* Straits Aquatics Auctions v3 — EN/ES/PT + fixed EUR display */
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
    countdownTimer: null,
    lang: localStorage.getItem('saAuctionLang') || 'en'
  };

  const GBP_TO_EUR = 1.20;
  const LOCALES = { en: 'en-GB', es: 'es-ES', pt: 'pt-PT' };
  const I18N = {
    en: {
      pageTitle:'Straits Aquatics Auctions', heroEyebrow:'STRAITS AQUATICS AUCTIONS', heroTitle:'Bid live. Win your item. Choose collection or delivery.',
      heroText:'Browse current auctions from Straits Aquatics. Registration is free and only required when you want to bid.',
      deliveryAfterWinning:'Delivery after winning', shopCollection:'Shop collection', free:'FREE', gibraltarDelivery:'Gibraltar delivery', spainPortugal:'Spain & Portugal',
      fxNote:'', live:'Live', upcoming:'Upcoming', ended:'Ended', all:'All', refresh:'Refresh',
      emptyTitle:'No auctions here right now', emptyText:'Check back soon for new livestock, coral and equipment auctions.',
      footerTerms:'By placing a bid, you agree to purchase the item at your winning bid price if you are the highest eligible bidder when the auction closes.',
      bidderSignIn:'BIDDER SIGN IN', signInOrRegister:'Sign in or register', emailInstruction:'Enter your email address and we’ll send you a 6-digit one-time code.',
      emailAddress:'Email address', sendLoginCode:'Send login code', checkEmail:'CHECK YOUR EMAIL', enterLoginCode:'Enter your login code', sentCode:'We sent a 6-digit code to',
      sixDigitCode:'6-digit code', verifySignIn:'Verify & sign in', differentEmail:'Use a different email', oneTimeRegistration:'ONE-TIME REGISTRATION',
      completeBidderProfile:'Complete your bidder profile', profileText:'You only do this once. Your full details are visible to Straits Aquatics, while other bidders only see an anonymised name.',
      fullName:'Full name', whatsapp:'Mobile / WhatsApp number', bindingAgree:'I agree that bids I place are binding if I win the auction.', completeRegistration:'Complete registration',
      yourAccount:'YOUR ACCOUNT', myAuctions:'My Auctions', signInRegister:'Sign in / Register', auction:'Auction', startingBid:'Starting bid', finalBid:'Final bid', currentBid:'Current bid',
      reserveMet:'✓ Reserve met', reserveNotMet:'Reserve not yet met', startsIn:'Starts in', endsIn:'Ends in', endedOn:'Ended {date}', bids:'{count} bids', oneBid:'1 bid', leader:'Leader',
      viewBid:'View & Bid', viewAuction:'View Auction', loadError:'Could not load auctions: {error}', biddingOpens:'Bidding opens {date}.', auctionEnded:'Auction ended',
      reserveNoSale:'Reserve was not met — no winning sale.', signInToBid:'Sign in / Register to bid', completeBidderRegistration:'Complete bidder registration',
      placeBid:'Place Bid', minimumNextBid:'Minimum next bid:', buyItNow:'Buy It Now', freeCollection:'Free collection from Straits Aquatics', deliveryAdded:'Delivery is added to the final winning bid where applicable.',
      bidHistory:'Bid history', noBidsYet:'No bids yet.', minimumBidIs:'Minimum bid is {amount}', placingBid:'Placing bid…', bidFailed:'Bid could not be placed.', bidAccepted:'Bid accepted at {amount}',
      processing:'Processing…', buyNowPrompt:'Buy It Now for {amount}?\n\nIf you confirm, the auction ends immediately and you are committing to purchase the item.', buyNowFailed:'Buy It Now could not be completed.',
      auctionYours:'Congratulations — the auction is yours.', invalidEmail:'Enter a valid email address.', sending:'Sending…', enter6Digit:'Enter the 6-digit code from your email.', verifying:'Verifying…',
      signedIn:'Signed in successfully.', enterFullName:'Enter your full name.', acceptCommitment:'You must accept the bidding commitment to register.', saving:'Saving…', bidderComplete:'Bidder registration complete.',
      account:'Account', signOutPrompt:'Signed in as {email}.\n\nSign out?', signedOut:'Signed out.', loadingAuctions:'Loading your auctions…', noAuctionBids:'You have not bid in any auctions yet.',
      stateEnded:'Ended', stateWon:'Won', stateWinning:'You’re winning', stateOutbid:'Outbid', yourLatestBid:'Your latest bid:', view:'View', chooseDeliveryOption:'Choose a delivery option.',
      collectFrom:'Collect from Straits Aquatics', chooseCollectionDelivery:'Choose collection / delivery', confirmDelivery:'Confirm delivery', delivery:'Delivery', congratulationsWon:'🎉 Congratulations — you won this auction.',
      winningBid:'Winning bid:', totalDue:'Total due:', payPaypal:'Pay with PayPal', payRevolut:'Pay with Revolut', paymentPending:'Payment link will appear here once Straits Aquatics prepares it.',
      paymentPaid:'✓ Payment recorded as paid', deliverySaveFailed:'Could not save delivery choice.', deliverySaved:'Delivery choice saved.', appStartError:'The auction application could not start. Please refresh the page.'
    },
    es: {
      pageTitle:'Subastas de Straits Aquatics', heroEyebrow:'SUBASTAS STRAITS AQUATICS', heroTitle:'Puja en directo. Gana tu artículo. Elige recogida o entrega.',
      heroText:'Consulta las subastas actuales de Straits Aquatics. El registro es gratuito y solo es necesario cuando quieras pujar.',
      deliveryAfterWinning:'Entrega después de ganar', shopCollection:'Recogida en tienda', free:'GRATIS', gibraltarDelivery:'Entrega en Gibraltar', spainPortugal:'España y Portugal',
      fxNote:'Precios convertidos a EUR con cambio fijo: £1 = €1,20', live:'En directo', upcoming:'Próximas', ended:'Finalizadas', all:'Todas', refresh:'Actualizar',
      emptyTitle:'No hay subastas ahora mismo', emptyText:'Vuelve pronto para nuevas subastas de peces, corales y equipamiento.',
      footerTerms:'Al realizar una puja, aceptas comprar el artículo por el importe de tu puja ganadora si eres el mejor postor válido cuando cierre la subasta.',
      bidderSignIn:'ACCESO DE PUJADOR', signInOrRegister:'Inicia sesión o regístrate', emailInstruction:'Introduce tu correo electrónico y te enviaremos un código de un solo uso de 6 dígitos.',
      emailAddress:'Correo electrónico', sendLoginCode:'Enviar código de acceso', checkEmail:'REVISA TU CORREO', enterLoginCode:'Introduce tu código de acceso', sentCode:'Hemos enviado un código de 6 dígitos a',
      sixDigitCode:'Código de 6 dígitos', verifySignIn:'Verificar e iniciar sesión', differentEmail:'Usar otro correo', oneTimeRegistration:'REGISTRO ÚNICO',
      completeBidderProfile:'Completa tu perfil de pujador', profileText:'Solo tendrás que hacerlo una vez. Straits Aquatics verá tus datos completos; los demás pujadores solo verán un nombre anonimizado.',
      fullName:'Nombre completo', whatsapp:'Móvil / número de WhatsApp', bindingAgree:'Acepto que las pujas que realice son vinculantes si gano la subasta.', completeRegistration:'Completar registro',
      yourAccount:'TU CUENTA', myAuctions:'Mis subastas', signInRegister:'Iniciar sesión / Registrarse', auction:'Subasta', startingBid:'Puja inicial', finalBid:'Puja final', currentBid:'Puja actual',
      reserveMet:'✓ Reserva alcanzada', reserveNotMet:'Reserva aún no alcanzada', startsIn:'Comienza en', endsIn:'Finaliza en', endedOn:'Finalizó {date}', bids:'{count} pujas', oneBid:'1 puja', leader:'Líder',
      viewBid:'Ver y pujar', viewAuction:'Ver subasta', loadError:'No se pudieron cargar las subastas: {error}', biddingOpens:'La puja comienza {date}.', auctionEnded:'Subasta finalizada',
      reserveNoSale:'No se alcanzó la reserva — no hay venta ganadora.', signInToBid:'Inicia sesión / Regístrate para pujar', completeBidderRegistration:'Completar registro de pujador',
      placeBid:'Pujar', minimumNextBid:'Puja mínima siguiente:', buyItNow:'Comprar ahora', freeCollection:'Recogida gratuita en Straits Aquatics', deliveryAdded:'La entrega se añade a la puja ganadora final cuando corresponda.',
      bidHistory:'Historial de pujas', noBidsYet:'Todavía no hay pujas.', minimumBidIs:'La puja mínima es {amount}', placingBid:'Enviando puja…', bidFailed:'No se pudo realizar la puja.', bidAccepted:'Puja aceptada por {amount}',
      processing:'Procesando…', buyNowPrompt:'¿Comprar ahora por {amount}?\n\nSi confirmas, la subasta finalizará inmediatamente y te comprometes a comprar el artículo.', buyNowFailed:'No se pudo completar la compra inmediata.',
      auctionYours:'Enhorabuena — la subasta es tuya.', invalidEmail:'Introduce un correo electrónico válido.', sending:'Enviando…', enter6Digit:'Introduce el código de 6 dígitos de tu correo.', verifying:'Verificando…',
      signedIn:'Sesión iniciada correctamente.', enterFullName:'Introduce tu nombre completo.', acceptCommitment:'Debes aceptar el compromiso de puja para registrarte.', saving:'Guardando…', bidderComplete:'Registro de pujador completado.',
      account:'Cuenta', signOutPrompt:'Sesión iniciada como {email}.\n\n¿Cerrar sesión?', signedOut:'Sesión cerrada.', loadingAuctions:'Cargando tus subastas…', noAuctionBids:'Todavía no has pujado en ninguna subasta.',
      stateEnded:'Finalizada', stateWon:'Ganada', stateWinning:'Vas ganando', stateOutbid:'Superado', yourLatestBid:'Tu última puja:', view:'Ver', chooseDeliveryOption:'Elige una opción de entrega.',
      collectFrom:'Recoger en Straits Aquatics', chooseCollectionDelivery:'Elige recogida / entrega', confirmDelivery:'Confirmar entrega', delivery:'Entrega', congratulationsWon:'🎉 Enhorabuena — has ganado esta subasta.',
      winningBid:'Puja ganadora:', totalDue:'Total a pagar:', payPaypal:'Pagar con PayPal', payRevolut:'Pagar con Revolut', paymentPending:'El enlace de pago aparecerá aquí cuando Straits Aquatics lo prepare.',
      paymentPaid:'✓ Pago registrado como pagado', deliverySaveFailed:'No se pudo guardar la opción de entrega.', deliverySaved:'Opción de entrega guardada.', appStartError:'La aplicación de subastas no pudo iniciarse. Actualiza la página.'
    },
    pt: {
      pageTitle:'Leilões Straits Aquatics', heroEyebrow:'LEILÕES STRAITS AQUATICS', heroTitle:'Licite em direto. Ganhe o seu artigo. Escolha recolha ou entrega.',
      heroText:'Consulte os leilões atuais da Straits Aquatics. O registo é gratuito e só é necessário quando quiser licitar.',
      deliveryAfterWinning:'Entrega depois de ganhar', shopCollection:'Recolha na loja', free:'GRÁTIS', gibraltarDelivery:'Entrega em Gibraltar', spainPortugal:'Espanha e Portugal',
      fxNote:'Preços convertidos para EUR à taxa fixa: £1 = €1,20', live:'Em direto', upcoming:'Próximos', ended:'Terminados', all:'Todos', refresh:'Atualizar',
      emptyTitle:'Não há leilões neste momento', emptyText:'Volte em breve para novos leilões de peixes, corais e equipamento.',
      footerTerms:'Ao fazer uma licitação, aceita comprar o artigo pelo valor da sua licitação vencedora se for o licitante elegível mais alto quando o leilão terminar.',
      bidderSignIn:'ACESSO DO LICITANTE', signInOrRegister:'Iniciar sessão ou registar', emailInstruction:'Introduza o seu email e enviaremos um código único de 6 dígitos.',
      emailAddress:'Endereço de email', sendLoginCode:'Enviar código de acesso', checkEmail:'VERIFIQUE O SEU EMAIL', enterLoginCode:'Introduza o seu código de acesso', sentCode:'Enviámos um código de 6 dígitos para',
      sixDigitCode:'Código de 6 dígitos', verifySignIn:'Verificar e iniciar sessão', differentEmail:'Usar outro email', oneTimeRegistration:'REGISTO ÚNICO',
      completeBidderProfile:'Complete o seu perfil de licitante', profileText:'Só precisa de fazer isto uma vez. A Straits Aquatics vê os seus dados completos; os outros licitantes apenas veem um nome anonimizado.',
      fullName:'Nome completo', whatsapp:'Telemóvel / número de WhatsApp', bindingAgree:'Aceito que as licitações que fizer são vinculativas se ganhar o leilão.', completeRegistration:'Concluir registo',
      yourAccount:'A SUA CONTA', myAuctions:'Os meus leilões', signInRegister:'Iniciar sessão / Registar', auction:'Leilão', startingBid:'Licitação inicial', finalBid:'Licitação final', currentBid:'Licitação atual',
      reserveMet:'✓ Reserva atingida', reserveNotMet:'Reserva ainda não atingida', startsIn:'Começa em', endsIn:'Termina em', endedOn:'Terminou {date}', bids:'{count} licitações', oneBid:'1 licitação', leader:'Líder',
      viewBid:'Ver e licitar', viewAuction:'Ver leilão', loadError:'Não foi possível carregar os leilões: {error}', biddingOpens:'As licitações abrem {date}.', auctionEnded:'Leilão terminado',
      reserveNoSale:'A reserva não foi atingida — não há venda vencedora.', signInToBid:'Inicie sessão / Registe-se para licitar', completeBidderRegistration:'Concluir registo de licitante',
      placeBid:'Licitar', minimumNextBid:'Próxima licitação mínima:', buyItNow:'Comprar já', freeCollection:'Recolha gratuita na Straits Aquatics', deliveryAdded:'A entrega é adicionada à licitação vencedora final quando aplicável.',
      bidHistory:'Histórico de licitações', noBidsYet:'Ainda não há licitações.', minimumBidIs:'A licitação mínima é {amount}', placingBid:'A enviar licitação…', bidFailed:'Não foi possível fazer a licitação.', bidAccepted:'Licitação aceite por {amount}',
      processing:'A processar…', buyNowPrompt:'Comprar já por {amount}?\n\nSe confirmar, o leilão termina imediatamente e compromete-se a comprar o artigo.', buyNowFailed:'Não foi possível concluir a compra imediata.',
      auctionYours:'Parabéns — o leilão é seu.', invalidEmail:'Introduza um endereço de email válido.', sending:'A enviar…', enter6Digit:'Introduza o código de 6 dígitos do seu email.', verifying:'A verificar…',
      signedIn:'Sessão iniciada com sucesso.', enterFullName:'Introduza o seu nome completo.', acceptCommitment:'Tem de aceitar o compromisso de licitação para se registar.', saving:'A guardar…', bidderComplete:'Registo de licitante concluído.',
      account:'Conta', signOutPrompt:'Sessão iniciada como {email}.\n\nTerminar sessão?', signedOut:'Sessão terminada.', loadingAuctions:'A carregar os seus leilões…', noAuctionBids:'Ainda não licitou em nenhum leilão.',
      stateEnded:'Terminado', stateWon:'Ganho', stateWinning:'Está a ganhar', stateOutbid:'Ultrapassado', yourLatestBid:'A sua última licitação:', view:'Ver', chooseDeliveryOption:'Escolha uma opção de entrega.',
      collectFrom:'Recolher na Straits Aquatics', chooseCollectionDelivery:'Escolha recolha / entrega', confirmDelivery:'Confirmar entrega', delivery:'Entrega', congratulationsWon:'🎉 Parabéns — ganhou este leilão.',
      winningBid:'Licitação vencedora:', totalDue:'Total a pagar:', payPaypal:'Pagar com PayPal', payRevolut:'Pagar com Revolut', paymentPending:'O link de pagamento aparecerá aqui quando a Straits Aquatics o preparar.',
      paymentPaid:'✓ Pagamento registado como pago', deliverySaveFailed:'Não foi possível guardar a opção de entrega.', deliverySaved:'Opção de entrega guardada.', appStartError:'Não foi possível iniciar a aplicação de leilões. Atualize a página.'
    }
  };

  function t(key, vars = {}) {
    const dict = I18N[state.lang] || I18N.en;
    let text = dict[key] ?? I18N.en[key] ?? key;
    Object.entries(vars).forEach(([k,v]) => { text = text.replaceAll(`{${k}}`, String(v)); });
    return text;
  }

  function euroMode() { return state.lang === 'es' || state.lang === 'pt'; }
  function displayCurrency(currency = 'GBP') { return euroMode() ? 'EUR' : currency; }
  function displayNumeric(amount, currency = 'GBP') {
    const n = Number(amount || 0);
    return euroMode() && currency === 'GBP' ? n * GBP_TO_EUR : n;
  }
  function toBackendNumeric(amount, currency = 'GBP') {
    const n = Number(amount || 0);
    return euroMode() && currency === 'GBP' ? n / GBP_TO_EUR : n;
  }

  function applyStaticLanguage() {
    document.documentElement.lang = state.lang === 'pt' ? 'pt-PT' : (state.lang === 'es' ? 'es' : 'en');
    document.title = t('pageTitle');
    qsa('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    qsa('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    qsa('.lang-btn').forEach(btn => {
      const active = btn.dataset.lang === state.lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const col = $('deliveryCollectionStatic');
    const gib = $('deliveryGibraltarStatic');
    const ib = $('deliveryIberiaStatic');
    if (col) col.innerHTML = `🏪 ${escapeHtml(t('shopCollection'))} — <b>${escapeHtml(t('free'))}</b>`;
    if (gib) gib.innerHTML = `🚚 ${escapeHtml(t('gibraltarDelivery'))} — <b>${money(7.5,'GBP')}</b>`;
    if (ib) ib.innerHTML = `📦 ${escapeHtml(t('spainPortugal'))} — <b>${money(18,'EUR')}</b>`;
    const fx = $('fxNote');
    if (fx) {
      fx.textContent = t('fxNote');
      fx.classList.toggle('hidden', !euroMode());
    }
  }

  async function setLanguage(lang) {
    if (!['en','es','pt'].includes(lang)) lang = 'en';
    state.lang = lang;
    localStorage.setItem('saAuctionLang', lang);
    applyStaticLanguage();
    updateHeader();
    renderAuctions();
    if (state.selectedAuctionId && !els.auctionModal.classList.contains('hidden')) {
      const a = state.auctions.find(x => x.id === state.selectedAuctionId);
      if (a) await renderAuctionModal(a);
    }
    if (!els.myAuctionsModal.classList.contains('hidden') && state.user) await openMyAuctions();
  }

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
    const n = displayNumeric(amount, currency);
    const outCurrency = displayCurrency(currency);
    try {
      return new Intl.NumberFormat(LOCALES[state.lang] || 'en-GB', {
        style: 'currency', currency: outCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(n);
    } catch (_) { return `${outCurrency} ${n.toFixed(2)}`; }
  }

  function dt(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat(LOCALES[state.lang] || 'en-GB', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Gibraltar'
    }).format(new Date(value));
  }

  function shortTime(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat(LOCALES[state.lang] || 'en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Gibraltar'
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
    const priceLabel = a.current_bid == null ? t('startingBid') : (phase === 'ended' ? t('finalBid') : t('currentBid'));
    const reserve = a.has_reserve
      ? `<div class="reserve-note ${a.reserve_met ? 'met' : 'not-met'}">${escapeHtml(a.reserve_met ? t('reserveMet') : t('reserveNotMet'))}</div>`
      : '';

    let timer = '';
    if (phase === 'upcoming') {
      timer = `<div class="countdown" data-countdown="${escapeHtml(a.starts_at)}" data-kind="starts" data-auction="${a.id}">${escapeHtml(t('startsIn'))} ${countdownText(a.starts_at)}</div>`;
    } else if (phase === 'live') {
      timer = `<div class="countdown" data-countdown="${escapeHtml(a.ends_at)}" data-kind="ends" data-auction="${a.id}">${escapeHtml(t('endsIn'))} ${countdownText(a.ends_at)}</div>`;
    } else {
      timer = `<div class="countdown">${escapeHtml(t('endedOn',{date:dt(a.ends_at)}))}</div>`;
    }

    const count = Number(a.bid_count || 0);
    const bidText = count === 1 ? t('oneBid') : t('bids',{count});
    const phaseText = phase === 'live' ? `● ${t('live')}` : (phase === 'upcoming' ? t('upcoming') : t('ended'));

    return `
      <article class="auction-card">
        <div class="card-media">
          ${renderMediaElement(cover)}
          <span class="status-chip ${phase}">${escapeHtml(phaseText)}</span>
        </div>
        <div class="card-body">
          ${a.category ? `<div class="card-category">${escapeHtml(a.category)}</div>` : ''}
          <h2 class="card-title">${escapeHtml(a.title)}</h2>
          <div class="price-label">${escapeHtml(priceLabel)}</div>
          <div class="price-main">${publicPrice(a)}</div>
          ${reserve}
          <div class="card-meta">
            <span>${escapeHtml(bidText)}</span>
            ${a.current_leader_public_name ? `<span>${escapeHtml(t('leader'))}: ${escapeHtml(a.current_leader_public_name)}</span>` : ''}
          </div>
          ${timer}
          <div class="card-actions">
            <button class="btn btn-primary" data-open-auction="${a.id}">${escapeHtml(phase === 'live' ? t('viewBid') : t('viewAuction'))}</button>
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
        els.statusBanner.textContent = t('loadError',{error:error.message});
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
    const minimumDisplay = displayNumeric(minimum, a.currency);
    const bidderReady = !!state.bidder;
    const loggedIn = !!state.user;

    let actionArea = '';
    if (phase === 'upcoming') {
      actionArea = `<div class="bid-guidance">${escapeHtml(t('biddingOpens',{date:dt(a.starts_at)}))}</div>`;
    } else if (phase === 'ended') {
      actionArea = `
        <div class="winner-box">
          <strong>${escapeHtml(t('auctionEnded'))}</strong>
          <div style="margin-top:5px">${escapeHtml(t('finalBid'))}: ${publicPrice(a)}</div>
          ${a.has_reserve && !a.reserve_met ? `<div class="reserve-note not-met">${escapeHtml(t('reserveNoSale'))}</div>` : ''}
        </div>`;
    } else if (!loggedIn) {
      actionArea = `<button id="detailSignInBtn" class="btn btn-primary btn-block">${escapeHtml(t('signInToBid'))}</button>`;
    } else if (!bidderReady) {
      actionArea = `<button id="detailCompleteProfileBtn" class="btn btn-primary btn-block">${escapeHtml(t('completeBidderRegistration'))}</button>`;
    } else {
      actionArea = `
        <div class="bid-input-row">
          <input id="bidAmount" class="field" type="number" inputmode="decimal" min="${minimumDisplay.toFixed(2)}" step="0.01" value="${minimumDisplay.toFixed(2)}">
          <button id="placeBidBtn" class="btn btn-primary">${escapeHtml(t('placeBid'))}</button>
        </div>
        <div class="bid-guidance">${escapeHtml(t('minimumNextBid'))} <strong>${money(minimum, a.currency)}</strong></div>
        ${a.buy_now_price != null ? `<button id="buyNowBtn" class="btn btn-orange btn-block">${escapeHtml(t('buyItNow'))} — ${money(a.buy_now_price, a.currency)}</button>` : ''}`;
    }

    const count = Number(a.bid_count || 0);
    const bidText = count === 1 ? t('oneBid') : t('bids',{count});

    els.auctionModalContent.innerHTML = `
      <div class="detail-layout">
        <div>${galleryHtml(a)}</div>
        <div class="detail-panel">
          <span class="eyebrow">${escapeHtml(a.category || t('auction'))}</span>
          <h2>${escapeHtml(a.title)}</h2>
          <div class="detail-description">${escapeHtml(a.description || '')}</div>

          <div class="bid-box">
            <div class="price-label">${escapeHtml(a.current_bid == null ? t('startingBid') : (phase === 'ended' ? t('finalBid') : t('currentBid')))}</div>
            <div class="bid-price">${publicPrice(a)}</div>
            <div class="card-meta">
              <span>${escapeHtml(bidText)}</span>
              ${a.current_leader_public_name ? `<span>${escapeHtml(t('leader'))}: ${escapeHtml(a.current_leader_public_name)}</span>` : ''}
            </div>
            ${a.has_reserve ? `<div class="reserve-note ${a.reserve_met ? 'met' : 'not-met'}">${escapeHtml(a.reserve_met ? t('reserveMet') : t('reserveNotMet'))}</div>` : ''}
            ${phase === 'live' ? `<div class="countdown" data-countdown="${escapeHtml(a.ends_at)}" data-kind="ends" data-auction="${a.id}">${escapeHtml(t('endsIn'))} ${countdownText(a.ends_at)}</div>` : ''}
            ${phase === 'upcoming' ? `<div class="countdown" data-countdown="${escapeHtml(a.starts_at)}" data-kind="starts" data-auction="${a.id}">${escapeHtml(t('startsIn'))} ${countdownText(a.starts_at)}</div>` : ''}
            ${actionArea}
          </div>

          <div class="delivery-info">
            ${a.collection_enabled ? `<span>🏪 ${escapeHtml(t('freeCollection'))}</span>` : ''}
            ${a.local_delivery_enabled ? `<span>🚚 ${escapeHtml(t('gibraltarDelivery'))} — ${money(a.local_delivery_price_gbp, 'GBP')}</span>` : ''}
            ${a.iberia_shipping_enabled ? `<span>📦 ${escapeHtml(t('spainPortugal'))} — ${money(a.iberia_shipping_price_eur, 'EUR')}</span>` : ''}
            ${a.custom_delivery_note ? `<span>${escapeHtml(a.custom_delivery_note)}</span>` : ''}
            <span><strong>${escapeHtml(t('deliveryAdded'))}</strong></span>
          </div>

          <div class="bid-history">
            <h3>${escapeHtml(t('bidHistory'))}</h3>
            ${history.length ? history.map(b => `
              <div class="bid-row"><span>${escapeHtml(b.bidder_public_name)}</span><span class="amount">${money(b.amount, a.currency)}</span><span class="time">${escapeHtml(shortTime(b.placed_at))}</span></div>
            `).join('') : `<p class="muted">${escapeHtml(t('noBidsYet'))}</p>`}
          </div>
        </div>
      </div>`;

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
      if (Number.isFinite(amount)) await placeBid(a.id, amount);
    });
    $('buyNowBtn')?.addEventListener('click', async () => buyNow(a));
    updateCountdowns();
  }

  async function placeBid(auctionId, displayAmount) {
    if (!state.user) return openAuth();
    if (!state.bidder) return openProfile();
    const a = state.auctions.find(x => x.id === auctionId);
    if (!a) return;

    const minimumBackend = nextMinimum(a);
    const minimumDisplay = displayNumeric(minimumBackend, a.currency);
    if (displayAmount + 0.00001 < minimumDisplay) return showToast(t('minimumBidIs',{amount:money(minimumBackend,a.currency)}));

    const backendAmount = Number(toBackendNumeric(displayAmount, a.currency).toFixed(2));
    const btn = $('placeBidBtn');
    if (btn) { btn.disabled = true; btn.textContent = t('placingBid'); }

    const { data, error } = await sb.rpc('place_auction_bid', { p_auction_id: auctionId, p_amount: backendAmount });
    if (error) {
      showToast(error.message || t('bidFailed'));
      if (btn) { btn.disabled = false; btn.textContent = t('placeBid'); }
      await loadAuctions(false); return;
    }

    const placedBid = Array.isArray(data) ? data[0] : data;
    if (placedBid?.bid_id) {
      sb.functions.invoke('auction-email', { body: { action:'bid_event', auction_id:auctionId, bid_id:placedBid.bid_id } })
        .then(({error}) => { if (error) console.warn('Auction bid email notification could not be sent:', error); })
        .catch(err => console.warn('Auction bid email notification failed:', err));
    }

    showToast(t('bidAccepted',{amount:money(backendAmount,a.currency)}));
    await loadAuctions(false);
    const fresh = state.auctions.find(x => x.id === auctionId);
    if (fresh) await renderAuctionModal(fresh);
  }

  async function buyNow(a) {
    if (!state.user) return openAuth();
    if (!state.bidder) return openProfile();
    const ok = window.confirm(t('buyNowPrompt',{amount:money(a.buy_now_price,a.currency)}));
    if (!ok) return;
    const btn = $('buyNowBtn');
    if (btn) { btn.disabled = true; btn.textContent = t('processing'); }
    const { error } = await sb.rpc('buy_now_auction', { p_auction_id:a.id });
    if (error) {
      showToast(error.message || t('buyNowFailed'));
      if (btn) { btn.disabled=false; btn.textContent=`${t('buyItNow')} — ${money(a.buy_now_price,a.currency)}`; }
      return;
    }
    showToast(t('auctionYours'));
    await loadAuctions(false); closeModal(els.auctionModal); await openMyAuctions();
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
      return setMessage(els.authEmailMessage, t('invalidEmail'), 'error');
    }

    els.sendOtpBtn.disabled = true;
    els.sendOtpBtn.textContent = t('sending');
    setMessage(els.authEmailMessage);

    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    els.sendOtpBtn.disabled = false;
    els.sendOtpBtn.textContent = t('sendLoginCode');

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
      return setMessage(els.authCodeMessage, t('enter6Digit'), 'error');
    }

    els.verifyOtpBtn.disabled = true;
    els.verifyOtpBtn.textContent = t('verifying');
    setMessage(els.authCodeMessage);

    const { data, error } = await sb.auth.verifyOtp({
      email: state.otpEmail,
      token,
      type: 'email'
    });

    els.verifyOtpBtn.disabled = false;
    els.verifyOtpBtn.textContent = t('verifySignIn');

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
      showToast(t('signedIn'));
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
      return setMessage(els.profileMessage, t('enterFullName'), 'error');
    }
    if (!els.profileTerms.checked) {
      return setMessage(els.profileMessage, t('acceptCommitment'), 'error');
    }

    els.saveProfileBtn.disabled = true;
    els.saveProfileBtn.textContent = t('saving');

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
    els.saveProfileBtn.textContent = t('completeRegistration');

    if (error) {
      return setMessage(els.profileMessage, error.message, 'error');
    }

    await refreshIdentity();
    closeModal(els.profileModal);
    updateHeader();
    showToast(t('bidderComplete'));

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
      els.authBtn.textContent = t('signInRegister');
      els.authBtn.onclick = openAuth;
      return;
    }

    const label = state.bidder?.full_name || state.user.email || t('account');
    els.authBtn.textContent = label.length > 24 ? `${label.slice(0,21)}…` : label;
    els.authBtn.onclick = async () => {
      const signOut = window.confirm(t('signOutPrompt',{email:state.user.email}));
      if (!signOut) return;
      await sb.auth.signOut();
    };
  }

  async function openMyAuctions() {
    if (!state.user) return openAuth();
    openModal(els.myAuctionsModal);
    els.myAuctionsContent.innerHTML = `<p class="muted">${escapeHtml(t('loadingAuctions'))}</p>`;

    const [bidsRes, resultsRes] = await Promise.all([
      sb.from('auction_bids').select('auction_id,amount,placed_at,bid_kind').order('placed_at',{ascending:false}),
      sb.from('auction_results').select('*').order('created_at',{ascending:false})
    ]);
    const ownBids=bidsRes.data||[], ownResults=resultsRes.data||[];
    const auctionIds=[...new Set([...ownBids.map(x=>x.auction_id),...ownResults.map(x=>x.auction_id)])];
    if (!auctionIds.length) { els.myAuctionsContent.innerHTML=`<p class="muted">${escapeHtml(t('noAuctionBids'))}</p>`; return; }

    const {data:auctionsData}=await sb.from('auctions').select('*').in('id',auctionIds);
    const byId=new Map((auctionsData||[]).map(a=>[a.id,a]));
    const resultById=new Map(ownResults.map(r=>[r.auction_id,r]));
    const latestBidById=new Map();
    for (const b of ownBids) if(!latestBidById.has(b.auction_id)) latestBidById.set(b.auction_id,b);

    const rows=auctionIds.map(id=>{
      const a=byId.get(id); if(!a) return '';
      const r=resultById.get(id), myBid=latestBidById.get(id), phase=currentPhase(a);
      let stateLabel=t('stateEnded'), stateClass='ended';
      if(r?.winner_id===state.user.id){stateLabel=t('stateWon');stateClass='won';}
      else if(phase==='live'&&state.bidder&&a.current_leader_public_name===state.bidder.public_name){stateLabel=t('stateWinning');stateClass='winning';}
      else if(phase==='live'){stateLabel=t('stateOutbid');stateClass='outbid';}
      return `<div class="my-auction-item"><div class="my-auction-head"><div>
        <strong>${escapeHtml(a.title)}</strong>
        <div class="muted" style="margin-top:4px">${escapeHtml(t('yourLatestBid'))} ${myBid?money(myBid.amount,a.currency):'—'}</div>
        <span class="account-state ${stateClass}">${escapeHtml(stateLabel)}</span>
      </div><div style="text-align:right">
        <div class="price-label">${escapeHtml(phase==='ended'?t('finalBid'):t('currentBid'))}</div>
        <div style="font-weight:900;color:var(--navy);font-size:20px">${publicPrice(a)}</div>
        <button class="btn btn-ghost btn-small" style="margin-top:8px" data-my-open="${a.id}">${escapeHtml(t('view'))}</button>
      </div></div>${r?.winner_id===state.user.id?winnerPanel(a,r):''}</div>`;
    }).join('');
    els.myAuctionsContent.innerHTML=`<div class="my-auction-list">${rows}</div>`;
    qsa('[data-my-open]',els.myAuctionsContent).forEach(btn=>btn.addEventListener('click',async()=>{closeModal(els.myAuctionsModal);await openAuction(btn.dataset.myOpen);}));
    qsa('[data-delivery-submit]',els.myAuctionsContent).forEach(btn=>btn.addEventListener('click',async()=>{
      const auctionId=btn.dataset.deliverySubmit;
      const selected=els.myAuctionsContent.querySelector(`input[name="delivery-${auctionId}"]:checked`);
      if(!selected)return showToast(t('chooseDeliveryOption'));
      await chooseDelivery(auctionId,selected.value);
    }));
  }

  function winnerPanel(a, r) {
    const awaitingChoice=r.payment_status==='awaiting_delivery_choice';
    const paymentReady=!!(r.paypal_url||r.revolut_url);
    let delivery='';
    if(awaitingChoice){
      const options=[];
      if(a.collection_enabled) options.push(`<label class="check-row"><input type="radio" name="delivery-${a.id}" value="collection"><span>${escapeHtml(t('collectFrom'))} — <strong>${escapeHtml(t('free'))}</strong></span></label>`);
      if(a.local_delivery_enabled) options.push(`<label class="check-row"><input type="radio" name="delivery-${a.id}" value="gibraltar_delivery"><span>${escapeHtml(t('gibraltarDelivery'))} — <strong>${money(a.local_delivery_price_gbp,'GBP')}</strong></span></label>`);
      if(a.iberia_shipping_enabled) options.push(`<label class="check-row"><input type="radio" name="delivery-${a.id}" value="spain_portugal_shipping"><span>${escapeHtml(t('spainPortugal'))} — <strong>${money(a.iberia_shipping_price_eur,'EUR')}</strong></span></label>`);
      delivery=`<div style="margin-top:12px"><strong>${escapeHtml(t('chooseCollectionDelivery'))}</strong>${options.join('')}<button class="btn btn-primary btn-small" style="margin-top:10px" data-delivery-submit="${a.id}">${escapeHtml(t('confirmDelivery'))}</button></div>`;
    } else if(r.delivery_method){
      const labels={collection:t('shopCollection'),gibraltar_delivery:t('gibraltarDelivery'),spain_portugal_shipping:t('spainPortugal')};
      delivery=`<div class="muted" style="margin-top:10px">${escapeHtml(t('delivery'))}: <strong>${escapeHtml(labels[r.delivery_method]||r.delivery_method)}</strong>${r.delivery_amount!=null?` · ${money(r.delivery_amount,r.delivery_currency||'GBP')}`:''}</div>`;
    }
    return `<div class="winner-box">
      <strong>${escapeHtml(t('congratulationsWon'))}</strong>
      <div style="margin-top:6px">${escapeHtml(t('winningBid'))} <strong>${money(r.winning_bid,a.currency)}</strong></div>
      ${delivery}
      ${r.total_due!=null?`<div style="margin-top:9px">${escapeHtml(t('totalDue'))} <strong>${money(r.total_due,r.payment_currency||a.currency)}</strong></div>`:''}
      ${paymentReady?`<div class="payment-buttons">${r.paypal_url?`<a class="payment-link" href="${escapeHtml(r.paypal_url)}" target="_blank" rel="noopener">${escapeHtml(t('payPaypal'))}</a>`:''}${r.revolut_url?`<a class="payment-link" href="${escapeHtml(r.revolut_url)}" target="_blank" rel="noopener">${escapeHtml(t('payRevolut'))}</a>`:''}</div>`:(r.payment_status!=='paid'?`<div class="muted" style="margin-top:9px">${escapeHtml(t('paymentPending'))}</div>`:'')}
      ${r.payment_status==='paid'?`<div class="reserve-note met" style="margin-top:10px">${escapeHtml(t('paymentPaid'))}</div>`:''}
    </div>`;
  }

  async function chooseDelivery(auctionId, method) {
    const { error } = await sb.rpc('choose_auction_delivery', {
      p_auction_id: auctionId,
      p_delivery_method: method
    });

    if (error) return showToast(error.message || t('deliverySaveFailed'));
    showToast(t('deliverySaved'));
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
      const target=el.dataset.countdown, kind=el.dataset.kind;
      el.textContent=`${kind==='starts'?t('startsIn'):t('endsIn')} ${countdownText(target)}`;
    });
    state.auctions.forEach(a=>{ if(Date.now()>=new Date(a.ends_at).getTime()&&currentPhase(a)==='ended') finalizeIfNeeded(a); });
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
        showToast(t('signedOut'));
      }
    });
  }

  function bindEvents() {
    qsa('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
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
    applyStaticLanguage();
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
    els.statusBanner.textContent = t('appStartError');
    els.statusBanner.classList.remove('hidden');
  });
})();

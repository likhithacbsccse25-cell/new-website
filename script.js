/* Shared script for index, shop, cart, signin pages
   - Cart stored in localStorage under 'delish_cart'
   - User (mock) stored under 'delish_user'
*/
(() => {
  const sampleMenu = [
    { id: 'm1', name: 'Schezwan Noodles', price: 179, emoji: '🍜' },
    { id: 'm2', name: 'Paneer Butter Masala', price: 249, emoji: '🍛' },
    { id: 'm3', name: 'Margherita Pizza', price: 299, emoji: '🍕' },
    { id: 'm4', name: 'Chocolate Lava Cake', price: 129, emoji: '🧁' },
    { id: 'm5', name: 'Iced Lemon Tea', price: 79, emoji: '🧋' },
    { id: 'm6', name: 'Grilled Sandwich', price: 149, emoji: '🥪' }
  ];

  /* --- utils --- */
  const el = id => document.getElementById(id);
  const getCart = () => JSON.parse(localStorage.getItem('delish_cart') || '[]');
  const saveCart = (cart) => localStorage.setItem('delish_cart', JSON.stringify(cart));
  const updateCartCount = () => {
    const c = getCart().reduce((s,i)=>s+i.qty,0);
    const headerCount = document.querySelectorAll('#cart-count, #cart-count-header');
    headerCount.forEach(node => node.textContent = c);
  };

  /* --- Animations: fly to cart --- */
  function flyToCart(startRect, emoji){
    const cartBtn = document.querySelector('#cart-btn') || document.querySelector('.nav-link[href="cart.html"]') || document.querySelector('#cart-count-header');
    const cartRect = cartBtn ? cartBtn.getBoundingClientRect() : {left: window.innerWidth - 60, top: 20, width:40, height:40};
    const clone = document.createElement('div');
    clone.className = 'flying-clone';
    clone.style.left = (startRect.left + startRect.width/2) + 'px';
    clone.style.top = (startRect.top + startRect.height/2) + 'px';
    clone.style.fontSize = '32px';
    clone.style.transform = 'translate(-50%,-50%) scale(1)';
    clone.innerText = emoji;
    document.body.appendChild(clone);

    // compute bezier-ish control to look parabolic
    const dx = cartRect.left + cartRect.width/2 - (startRect.left + startRect.width/2);
    const dy = cartRect.top + cartRect.height/2 - (startRect.top + startRect.height/2);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    requestAnimationFrame(() => {
      clone.style.transition = 'transform 0.9s cubic-bezier(.22,.9,.18,1), opacity 0.6s ease';
      clone.style.transform = `translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(.28)`;
      clone.style.opacity = '0.95';
    });

    setTimeout(() => {
      clone.style.opacity = '0';
      setTimeout(()=> clone.remove(), 700);
    }, 900);
  }

  /* --- render menu on shop page --- */
  function renderMenu(){
    const wrap = el('menu-items');
    if(!wrap) return;
    wrap.innerHTML = '';
    sampleMenu.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="thumb">${item.emoji}</div>
        <h3>${item.name}</h3>
        <p class="muted">Deliciously prepared, freshly served.</p>
        <div class="price">₹${item.price}</div>
        <div class="actions">
          <button class="btn add-btn" data-id="${item.id}">Add to cart</button>
          <button class="btn ghost info" aria-hidden="true">Quick view</button>
        </div>
      `;
      wrap.appendChild(card);

      card.querySelector('.add-btn').addEventListener('click', (ev) => {
        const rect = ev.currentTarget.getBoundingClientRect();
        addToCart(item);
        flyToCart(rect, item.emoji);
        // tiny pulse on header cart count
        const header = document.querySelectorAll('#cart-count, #cart-count-header');
        header.forEach(h => {
          h.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 420 });
        });
      });
    });
  }

  /* --- cart management --- */
  function addToCart(product){
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === product.id);
    if(idx >= 0) cart[idx].qty += 1;
    else cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
    saveCart(cart);
    updateCartCount();
  }

  function renderCartPage(){
    const list = el('cart-list-page');
    const totalEl = el('total-price-page');
    if(!list) return;
    const cart = getCart();
    list.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.qty;
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div style="font-size:20px">${item.emoji} ${item.name}</div>
          <div class="muted">₹${item.price} x ${item.qty}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div>₹${item.price * item.qty}</div>
          <div>
            <button class="btn small dec" data-id="${item.id}">-</button>
            <button class="btn small inc" data-id="${item.id}">+</button>
            <button class="btn ghost small rem" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `;
      list.appendChild(li);

      li.querySelector('.inc').addEventListener('click', () => {
        changeQty(item.id, 1);
      });
      li.querySelector('.dec').addEventListener('click', () => {
        changeQty(item.id, -1);
      });
      li.querySelector('.rem').addEventListener('click', () => {
        removeItem(item.id);
      });
    });
    totalEl.textContent = total;
  }

  function changeQty(id, delta){
    const cart = getCart();
    const idx = cart.findIndex(i=>i.id===id);
    if(idx < 0) return;
    cart[idx].qty += delta;
    if(cart[idx].qty <= 0) cart.splice(idx,1);
    saveCart(cart);
    renderCartPage();
    updateCartCount();
  }

  function removeItem(id){
    const cart = getCart().filter(i=>i.id!==id);
    saveCart(cart);
    renderCartPage();
    updateCartCount();
  }

  function clearCart(){
    saveCart([]);
    renderCartPage();
    updateCartCount();
  }

  /* --- checkout confetti --- */
  function burstConfetti(){
    const canvas = el('confetti-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const pieces = [];
    for(let i=0;i<120;i++){
      pieces.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height - canvas.height/2,
        r: Math.random()*8+4,
        color: `hsl(${Math.random()*360} 80% 60%)`,
        tilt: Math.random()*10,
        speed: Math.random()*3 + 2,
        rot: Math.random()*360
      });
    }
    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.y += p.speed;
        p.x += Math.sin(t/10 + p.tilt) * 2;
        p.rot += 6;
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot * Math.PI/180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
        ctx.restore();
      });
      if(t < 160) requestAnimationFrame(draw);
      else ctx.clearRect(0,0,canvas.width,canvas.height);
    };
    draw();
  }

  /* --- Sign-in handling (mock) --- */
  function initSignin(){
    const form = el('signin-form');
    if(!form) return;
    const msg = el('signin-msg');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = el('email').value.trim();
      const pw = el('password').value.trim();
      if(!email || !pw) { msg.textContent = 'Please provide email and password'; return; }
      localStorage.setItem('delish_user', JSON.stringify({ email }));
      msg.textContent = 'Signed in — redirecting to shop...';
      setTimeout(()=> location.href = 'shop.html', 800);
    });
    el('guest-btn').addEventListener('click', () => {
      localStorage.removeItem('delish_user');
      location.href = 'shop.html';
    });
  }

  /* --- Other page wiring --- */
  function initCommon(){
    updateCartCount();
    // theme toggle (simple)
    const tbtn = document.querySelectorAll('#toggle-theme');
    tbtn.forEach(b => b.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      // simple visual swap
      if(document.documentElement.classList.contains('dark')){
        document.documentElement.style.setProperty('--bg','#0b1221');
        document.documentElement.style.setProperty('--accent','#ff9aa2');
      } else {
        document.documentElement.style.removeProperty('--bg');
        document.documentElement.style.removeProperty('--accent');
      }
    }));
  }

  /* --- initialize by page id --- */
  document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    const id = document.body.id;
    if(id === 'page-shop') {
      renderMenu();
    } else if(id === 'page-cart') {
      renderCartPage();
      el('checkout-btn-page').addEventListener('click', () => {
        burstConfetti();
        clearCart();
        setTimeout(()=> alert('Thanks for your order!'), 600);
      });
      el('clear-cart-btn').addEventListener('click', () => {
        clearCart();
      });
    } else if(id === 'page-signin') {
      initSignin();
    }

    // show mini-cart list on pages with #cart-list
    const miniList = el('cart-list');
    if(miniList){
      const cart = getCart();
      miniList.innerHTML = cart.map(i => `<li>${i.emoji} ${i.name} × ${i.qty}</li>`).join('');
    }
  });
})();
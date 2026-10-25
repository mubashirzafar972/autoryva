/* Cookie notice. Analytics and ads only load after the visitor clicks Accept. */
(function () {
  var cfg = window.AV_CFG || {}, K = 'av-consent', v = null;
  try { v = localStorage.getItem(K); } catch (e) {}
  function inject() {
    if (cfg.analyticsId) {
      var s = document.createElement('script'); s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.analyticsId; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', cfg.analyticsId);
    }
    if (cfg.adsenseId) {
      var a = document.createElement('script'); a.async = true; a.crossOrigin = 'anonymous';
      a.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + cfg.adsenseId; document.head.appendChild(a);
    }
  }
  if (v === 'yes') { inject(); return; }
  if (v === 'no') return;
  function show() {
    var b = document.createElement('div');
    b.className = 'cookie'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie notice');
    b.innerHTML = '<p>We use cookies to remember your choices and, if you agree, for visitor statistics and ads. Read our <a href="/privacy.html">Privacy Policy</a>.</p><div><button class="btn" type="button" id="ck-y">Accept</button> <button class="btn ghost" type="button" id="ck-n">Decline</button></div>';
    document.body.appendChild(b);
    function done(x) { try { localStorage.setItem(K, x); } catch (e) {} b.remove(); if (x === 'yes') inject(); }
    document.getElementById('ck-y').onclick = function () { done('yes'); };
    document.getElementById('ck-n').onclick = function () { done('no'); };
  }
  if (document.readyState !== 'loading') show(); else document.addEventListener('DOMContentLoaded', show);
})();

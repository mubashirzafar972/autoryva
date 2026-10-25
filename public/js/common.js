/* Shared by every page: saved cars, compare list, badges, back arrow (app mode), offline support */
(function () {
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var AV = window.AV = { esc: esc, fav: function () { return LS.get('av-fav'); }, cmp: function () { return LS.get('av-cmp'); } };
  AV.btns = function (id) { return '<button class="ic cp" data-c="' + id + '" aria-label="Compare">\u21C4</button><button class="ic" data-f="' + id + '" aria-label="Save">\u2665</button>'; };
  AV.card = function (c) {
    return '<a class="card" href="/cars/' + esc(c.id) + '.html">' + (c.image ? '<img src="' + esc(c.image) + '" alt="' + esc(c.make + ' ' + c.model) + '" loading="lazy" referrerpolicy="no-referrer">' : '<div class="ph"></div>') + AV.btns(esc(c.id)) +
      '<div class="b"><span class="yr">' + c.from + '\u2013' + c.to + '</span><h3 style="margin-top:8px">' + esc(c.make) + ' ' + esc(c.model) + '</h3><div class="meta">' + esc(c.country) + '</div></div></a>';
  };
  function sync() {
    var f = LS.get('av-fav'), c = LS.get('av-cmp');
    document.querySelectorAll('[data-f]').forEach(function (b) { b.classList.toggle('on', f.indexOf(b.dataset.f) > -1); });
    document.querySelectorAll('[data-c]').forEach(function (b) { b.classList.toggle('on', c.indexOf(b.dataset.c) > -1); });
    document.querySelectorAll('.bs').forEach(function (e) { e.textContent = f.length; });
    document.querySelectorAll('.bc').forEach(function (e) { e.textContent = c.length; });
    if (!document.body) return;
    var bar = document.getElementById('cbar');
    if (!bar) { bar = document.createElement('a'); bar.id = 'cbar'; bar.className = 'btn cb'; bar.href = '/compare.html'; document.body.appendChild(bar); }
    bar.hidden = !(c.length > 1 && location.pathname.indexOf('/compare') !== 0);
    bar.textContent = 'Compare ' + c.length + ' cars';
  }
  AV.sync = sync;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-f],[data-c]');
    if (b) {
      e.preventDefault(); e.stopPropagation();
      var isF = b.hasAttribute('data-f'), k = isF ? 'av-fav' : 'av-cmp', id = isF ? b.dataset.f : b.dataset.c, l = LS.get(k);
      if (l.indexOf(id) > -1) l = l.filter(function (x) { return x !== id; });
      else if (!isF && l.length >= 3) { alert('You can compare up to 3 cars.'); return; }
      else l.push(id);
      LS.set(k, l); sync(); document.dispatchEvent(new Event('av-change'));
      return;
    }
    if (e.target.closest('#bk')) { if (history.length > 1) history.back(); else location.href = '/'; }
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    sync();
    var p = location.pathname;
    document.querySelectorAll('[data-s]').forEach(function (a) { a.classList.toggle('on', p.indexOf(a.dataset.s) === 0); });
  });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost'))
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
})();

(function(){
    var acc = document.getElementById('concernAcc');
    if (!acc) return;
    var cards = Array.prototype.slice.call(acc.querySelectorAll('.concern-card'));
    if (!cards.length) return;

    var lastOpen = cards[0];
    function setOpen(el) {
      if (el === lastOpen) return;
      cards.forEach(function(c){
        var on = c === el;
        c.classList.toggle('is-open', on);
        var head = c.querySelector('.concern-head');
        if (head) head.setAttribute('aria-expanded', String(on));
      });
      lastOpen = el;
    }

    // scroll-driven: card whose center is closest to ~65% of viewport opens
    // (lower trigger line = card activates earlier as it enters from below);
    // others auto-close.
    var raf = null;
    function tick() {
      var triggerY = window.innerHeight * 0.65;
      var best = null;
      var bestDist = Infinity;
      cards.forEach(function(el){
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var center = r.top + r.height / 2;
        var dist = Math.abs(center - triggerY);
        if (dist < bestDist) { bestDist = dist; best = el; }
      });
      if (best) setOpen(best);
    }
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function(){ raf = null; tick(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // tap a header to manually jump to a card (helpful on tablet / desktop hover)
    cards.forEach(function(card){
      var head = card.querySelector('.concern-head');
      if (head) head.addEventListener('click', function(){ setOpen(card); });
    });
    tick();
  })();

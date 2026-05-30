(function(){
    var tickets = Array.prototype.slice.call(document.querySelectorAll('.sb-ticket'));
    var scene = document.getElementById('sbScene');
    if (!tickets.length || !scene) return;

    var DATA = {
      "1": { num: "01", name: "兼職",         feel: "看起來安全",
             truth: "只是下班後再上一份班。",
             risks: ["時間被切走", "體力消耗", "不易累積"],
             img: "images/side-01-parttime.jpg" },
      "2": { num: "02", name: "接案",         feel: "看起來自由",
             truth: "有案才有收入。",
             risks: ["案源不穩", "溝通修改", "自己收款"],
             img: "images/side-02-freelance.jpg" },
      "3": { num: "03", name: "電商 / 微商",  feel: "看起來好賺",
             truth: "庫存、客服、流量都要自己扛。",
             risks: ["出貨壓力", "庫存風險", "售後成本"],
             img: "images/side-03-ecom.jpg" },
      "4": { num: "04", name: "加盟創業",     feel: "看起來有靠山",
             truth: "固定成本從第一天就開始。",
             risks: ["店租人事", "設備庫存", "現金流"],
             img: "images/side-04-franchise.jpg" },
      "5": { num: "05", name: "自媒體",       feel: "看起來有機會",
             truth: "很多人撐不到變現那天。",
             risks: ["持續輸出", "流量波動", "變現等待"],
             img: "images/side-05-creator.jpg" },
      "6": { num: "06", name: "投資",         feel: "看起來被動",
             truth: "本金和風險都是真的。",
             risks: ["本金波動", "判斷壓力", "情緒承受"],
             img: "images/side-06-invest.jpg" }
    };

    var elNum   = scene.querySelector('[data-scene="num"]');
    var elName  = scene.querySelector('[data-scene="name"]');
    var elFeel  = scene.querySelector('[data-scene="feel"]');
    var elTruth = scene.querySelector('[data-scene="truth"]');
    var elR1    = scene.querySelector('[data-scene="r1"]');
    var elR2    = scene.querySelector('[data-scene="r2"]');
    var elR3    = scene.querySelector('[data-scene="r3"]');
    var slots   = Array.prototype.slice.call(scene.querySelectorAll('.sb-scene-img'));
    var current = "1";
    var clickSeq = 0;

    var decoded = Object.create(null);
    function ensureDecoded(src) {
      if (decoded[src]) return decoded[src];
      var im = new Image();
      im.src = src;
      var p = new Promise(function(res){
        if (im.complete && im.naturalWidth > 0) return res();
        im.onload = res; im.onerror = res;
      });
      decoded[src] = p;
      return p;
    }
    Object.keys(DATA).forEach(function(k){ ensureDecoded(DATA[k].img); });

    function getActiveSlot() {
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].classList.contains('is-active')) return slots[i];
      }
      return slots[0];
    }
    function getInactiveSlot(active) {
      for (var i = 0; i < slots.length; i++) {
        if (slots[i] !== active) return slots[i];
      }
      return slots[1];
    }

    function runProgress() {
      scene.classList.remove('is-running');
      void scene.offsetWidth;
      scene.classList.add('is-running');
    }

    function select(key) {
      if (key === current || !DATA[key]) return;
      current = key;
      var seq = ++clickSeq;
      var d = DATA[key];

      tickets.forEach(function(t){
        var on = t.getAttribute('data-opt') === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      scene.classList.add('is-switching');
      var active   = getActiveSlot();
      var inactive = getInactiveSlot(active);

      Promise.all([
        ensureDecoded(d.img),
        new Promise(function(r){ setTimeout(r, 200); })
      ]).then(function(){
        if (seq !== clickSeq) return;
        if (inactive.getAttribute('src') !== d.img) inactive.src = d.img;
        elNum.textContent   = d.num;
        elName.textContent  = d.name;
        elFeel.textContent  = d.feel;
        elTruth.textContent = d.truth;
        elR1.textContent    = d.risks[0];
        elR2.textContent    = d.risks[1];
        elR3.textContent    = d.risks[2];

        active.classList.remove('is-active');
        inactive.classList.add('is-active');
        scene.classList.remove('is-switching');
        runProgress();
      });
    }

    tickets.forEach(function(t){
      t.addEventListener('click', function(){
        select(t.getAttribute('data-opt'));
      });
    });

    setTimeout(runProgress, 600);
  })();

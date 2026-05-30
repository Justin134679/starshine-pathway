(function(){
    var stage = document.getElementById('dhmStage');
    var grid  = document.getElementById('dhmGrid');
    var photo = document.getElementById('dhmPhoto');
    if (!stage || !grid || !photo) return;

    var DATA = {
      '1': {
        cat: '01 · 體態與代謝',
        tags: '外食 / 澱粉 / 代謝',
        desc: '戒不掉外食與精緻澱粉，肚子越來越難消，體檢數字也開始提醒自己該重視。',
        img: 'images/need-01-body.jpg'
      },
      '2': {
        cat: '02 · 腸胃與消化',
        tags: '三餐不正常 / 脹氣 / 沉重感',
        desc: '三餐時間被工作切碎，吃得快也吃得急，腸胃在每天的午後悄悄發出警訊。',
        img: 'images/need-02-gut.jpg'
      },
      '3': {
        cat: '03 · 循環與保養',
        tags: '高壓 / 高醣 / 日常保養',
        desc: '年紀到了，開始記得量血壓、記下每天的飲食，把保養變成不必催促的日常。',
        img: 'images/need-03-circulation.jpg'
      },
      '4': {
        cat: '04 · 睡眠與情緒',
        tags: '責任 / 腦袋停不下來 / 疲累',
        desc: '累了一天躺下後，腦袋還在跑明天的事，淺眠成了再熟悉不過的夜晚。',
        img: 'images/need-04-sleep.jpg'
      },
      '5': {
        cat: '05 · 免疫與防護',
        tags: '換季 / 大人小孩 / 防護力',
        desc: '換季那幾週，全家輪流不舒服，從早晨出門到晚上回家都是要照顧的細節。',
        img: 'images/need-05-immunity.webp'
      },
      '6': {
        cat: '06 · 護眼與抗衰',
        tags: '電腦 / 滑手機 / 乾澀模糊',
        desc: '整天盯著螢幕，下班還繼續滑手機，眼睛從上午就開始酸澀到失焦。',
        img: 'images/need-06-eyes.jpg'
      }
    };

    var pills = Array.prototype.slice.call(grid.querySelectorAll('.dhm-pill'));
    var elCat  = document.getElementById('dhmCat');
    var elTags = document.getElementById('dhmTags');
    var elDesc = document.getElementById('dhmDesc');
    var slots  = Array.prototype.slice.call(photo.querySelectorAll('.dhm-img'));
    var current = '1';
    var clickSeq = 0;

    // Cache: decoded Image objects, keyed by src
    var decoded = Object.create(null);

    function ensureDecoded(src) {
      if (decoded[src]) return decoded[src];
      var im = new Image();
      im.src = src;
      var p = new Promise(function(res){
        if (im.complete && im.naturalWidth > 0) return res();
        im.onload = res;
        im.onerror = res;
      });
      decoded[src] = p;
      return p;
    }

    // pre-decode all six up front for instant switching
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

    function select(key) {
      if (key === current || !DATA[key]) return;
      current = key;
      var seq = ++clickSeq;
      var d = DATA[key];

      pills.forEach(function(p){
        p.classList.toggle('is-active', p.getAttribute('data-key') === key);
      });

      // fade text out immediately
      stage.classList.add('is-switching');

      var active   = getActiveSlot();
      var inactive = getInactiveSlot(active);

      // make sure new image is fully decoded BEFORE committing
      Promise.all([
        ensureDecoded(d.img),
        new Promise(function(r){ setTimeout(r, 200); }) // min text-fade-out duration
      ]).then(function(){
        if (seq !== clickSeq) return; // a newer click superseded this one

        // Commit src onto inactive slot — image is already decoded, so this is instant
        if (inactive.getAttribute('src') !== d.img) {
          inactive.src = d.img;
        }

        // Update text trio while still faded out
        elCat.textContent  = d.cat;
        elTags.textContent = d.tags;
        elDesc.textContent = d.desc;

        // Swap visibility synchronously — the CSS transitions handle the animation
        // (rAF was unreliable on slow devices / background tabs)
        active.classList.remove('is-active');
        inactive.classList.add('is-active');
        stage.classList.remove('is-switching');
      });
    }

    pills.forEach(function(p){
      p.addEventListener('click', function(){
        select(p.getAttribute('data-key'));
      });
    });
  })();

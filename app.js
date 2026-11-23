(function () {
  'use strict';

  var PRICE = 350;
  var MAX_PEOPLE = 10;

  /* Куда уходят заявки. FormSubmit пересылает письмо на почту агентства,
     бэкенд не нужен — работает и на GitHub Pages. */
  var OWNER_EMAIL = 'vlad1952@yandex.ru';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + OWNER_EMAIL;
  var SUBJECT = 'Заявка на экскурсию по Светлогорску';

  var TOURS = {
    sea: 'Море Светлогорска',
    lake: 'Озеро Тихое',
    streets: 'Улицы Светлогорска',
    otradnoe: 'Отрадное и Волчий овраг'
  };

  var state = {
    tour: 'sea',
    people: 1
  };

  var el = {
    grid: document.getElementById('tourGrid'),
    cards: Array.prototype.slice.call(document.querySelectorAll('.tour')),
    panelTour: document.getElementById('panelTour'),
    tourError: document.getElementById('tourError'),
    date: document.getElementById('date'),
    dateError: document.getElementById('dateError'),
    minus: document.getElementById('minus'),
    plus: document.getElementById('plus'),
    people: document.getElementById('people'),
    total: document.getElementById('total'),
    totalCalc: document.getElementById('totalCalc'),
    name: document.getElementById('name'),
    nameError: document.getElementById('nameError'),
    contact: document.getElementById('contact'),
    contactError: document.getElementById('contactError'),
    form: document.getElementById('bookingForm'),
    status: document.getElementById('status'),
    fallback: document.getElementById('fallback'),
    submitBtn: document.getElementById('submitBtn'),
    honey: document.getElementById('honey'),
    success: document.getElementById('success'),
    successList: document.getElementById('successList'),
    again: document.getElementById('again'),
    mobileBar: document.getElementById('mobileBar'),
    mobileTour: document.getElementById('mobileTour'),
    mobileTotal: document.getElementById('mobileTotal')
  };

  /* ---------- утилиты ---------- */

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function money(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function totalSum() {
    return PRICE * state.people;
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function showError(node, message) {
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
  }

  function clearError(node) {
    if (!node) return;
    node.hidden = true;
    node.textContent = '';
  }

  function markInvalid(input, invalid) {
    if (!input) return;
    input.classList.toggle('is-invalid', !!invalid);
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  /* ---------- отрисовка ---------- */

  function render() {
    var hasTour = !!TOURS[state.tour];
    var sum = totalSum();

    el.panelTour.textContent = hasTour ? TOURS[state.tour] : 'Экскурсия не выбрана';
    el.mobileTour.textContent = hasTour ? TOURS[state.tour] : 'Выберите экскурсию';

    el.people.textContent = String(state.people);
    el.total.textContent = hasTour ? money(sum) : '—';
    el.mobileTotal.textContent = hasTour ? money(sum) : '—';
    el.totalCalc.textContent = hasTour
      ? PRICE + ' ₽ × ' + state.people + ' ' +
        plural(state.people, 'участник', 'участника', 'участников')
      : 'Выберите экскурсию';

    el.minus.disabled = state.people <= 1;
    el.plus.disabled = state.people >= MAX_PEOPLE;

    el.cards.forEach(function (card) {
      var active = card.getAttribute('data-id') === state.tour;
      card.classList.toggle('is-active', active);
      var btn = card.querySelector('[data-choose]');
      if (btn) {
        btn.textContent = active ? 'Выбрано' : 'Записаться';
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    });
  }

  /* ---------- выбор экскурсии ---------- */

  function chooseTour(id) {
    if (!TOURS[id]) return;
    state.tour = state.tour === id ? null : id;
    clearError(el.tourError);
    render();
  }

  el.grid.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-choose]');
    if (!btn) return;
    chooseTour(btn.getAttribute('data-choose'));

    if (state.tour && window.matchMedia('(max-width: 1024px)').matches) {
      document.getElementById('booking').scrollIntoView({ block: 'start' });
    }
  });

  /* ---------- количество участников ---------- */

  el.minus.addEventListener('click', function () {
    if (state.people > 1) {
      state.people -= 1;
      render();
    }
  });

  el.plus.addEventListener('click', function () {
    if (state.people < MAX_PEOPLE) {
      state.people += 1;
      render();
    }
  });

  /* ---------- проверки ---------- */

  function isPhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15 && /^[\d\s()+\-]+$/.test(value);
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[a-zа-я]{2,}$/i.test(value);
  }

  function validateDate(silent) {
    var value = el.date.value;

    if (!value) {
      if (!silent) {
        showError(el.dateError, 'Выберите дату');
        markInvalid(el.date, true);
      }
      return false;
    }

    if (value < todayISO()) {
      if (!silent) {
        showError(el.dateError, 'Дата уже прошла');
        markInvalid(el.date, true);
      }
      return false;
    }

    clearError(el.dateError);
    markInvalid(el.date, false);
    return true;
  }

  function validateName(silent) {
    var value = el.name.value.trim();

    if (!value) {
      if (!silent) {
        showError(el.nameError, 'Укажите имя');
        markInvalid(el.name, true);
      }
      return false;
    }

    clearError(el.nameError);
    markInvalid(el.name, false);
    return true;
  }

  function validateContact(silent) {
    var value = el.contact.value.trim();

    if (!value) {
      if (!silent) {
        showError(el.contactError, 'Укажите телефон или почту');
        markInvalid(el.contact, true);
      }
      return false;
    }

    var ok = value.indexOf('@') !== -1 ? isEmail(value) : isPhone(value);

    if (!ok) {
      if (!silent) {
        showError(el.contactError, 'Проверьте телефон или почту');
        markInvalid(el.contact, true);
      }
      return false;
    }

    clearError(el.contactError);
    markInvalid(el.contact, false);
    return true;
  }

  el.date.addEventListener('input', function () {
    if (!el.dateError.hidden) validateDate(false);
  });
  el.name.addEventListener('input', function () {
    if (!el.nameError.hidden) validateName(false);
  });
  el.contact.addEventListener('input', function () {
    if (!el.contactError.hidden) validateContact(false);
  });

  /* ---------- отправка ---------- */

  function formatDate(value) {
    var parts = value.split('-');
    if (parts.length !== 3) return value;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function collectRows() {
    return [
      ['Экскурсия', TOURS[state.tour]],
      ['Дата', formatDate(el.date.value)],
      ['Участники', state.people + ' ' + plural(state.people, 'человек', 'человека', 'человек')],
      ['Итого', money(totalSum())],
      ['Имя', el.name.value.trim()],
      ['Контакт', el.contact.value.trim()]
    ];
  }

  function showSuccess(rows) {
    el.successList.innerHTML = rows.map(function (row) {
      return '<div><dt>' + row[0] + '</dt><dd>' + escapeHtml(row[1]) + '</dd></div>';
    }).join('');

    el.form.hidden = true;
    el.success.hidden = false;
    el.success.scrollIntoView({ block: 'center' });
  }

  function showMailFallback(rows) {
    var body = rows.map(function (row) {
      return row[0] + ': ' + row[1];
    }).join('\n');

    var href = 'mailto:' + OWNER_EMAIL +
      '?subject=' + encodeURIComponent(SUBJECT) +
      '&body=' + encodeURIComponent(body);

    el.fallback.innerHTML = 'Не удалось отправить автоматически. ' +
      '<a href="' + href + '">Открыть письмо в почтовой программе</a> — ' +
      'текст заявки уже подставлен.';
    el.fallback.hidden = false;
  }

  function setSending(sending) {
    el.submitBtn.disabled = sending;
    el.submitBtn.textContent = sending ? 'Отправляем…' : 'Отправить заявку';
    el.form.setAttribute('aria-busy', sending ? 'true' : 'false');
  }

  el.form.addEventListener('submit', function (event) {
    event.preventDefault();
    el.status.textContent = '';
    el.fallback.hidden = true;

    var hasTour = !!TOURS[state.tour];
    var okDate = validateDate(false);
    var okName = validateName(false);
    var okContact = validateContact(false);

    if (!hasTour) {
      showError(el.tourError, 'Выберите экскурсию');
      document.getElementById('tours').scrollIntoView({ block: 'start' });
      return;
    }

    if (!okDate || !okName || !okContact) {
      var firstInvalid = el.form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus({ preventScroll: false });
      el.status.textContent = 'Проверьте выделенные поля.';
      return;
    }

    /* ловушка для ботов: человек это поле не видит */
    if (el.honey.value) {
      showSuccess(collectRows());
      return;
    }

    var rows = collectRows();

    var payload = {
      _subject: SUBJECT,
      _template: 'table',
      _captcha: 'false',
      'Экскурсия': rows[0][1],
      'Дата': rows[1][1],
      'Участники': rows[2][1],
      'Итого': rows[3][1],
      'Имя': rows[4][1],
      'Контакт': rows[5][1]
    };

    setSending(true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (data && String(data.success) === 'false') throw new Error('rejected');
        setSending(false);
        showSuccess(rows);
      })
      .catch(function () {
        setSending(false);
        showMailFallback(rows);
        el.status.textContent = 'Отправка не удалась. Проверьте связь и попробуйте ещё раз.';
      });
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  el.again.addEventListener('click', function () {
    el.success.hidden = true;
    el.form.hidden = false;
    el.status.textContent = '';
    el.fallback.hidden = true;
    el.form.reset();
    state.people = 1;
    render();
    el.name.focus();
  });

  /* ---------- старт ---------- */

  el.date.min = todayISO();
  render();
})();

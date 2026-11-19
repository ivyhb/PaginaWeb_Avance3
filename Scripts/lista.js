/* lista.js — Lista de consulta: el cliente guarda productos y los envía por WhatsApp.
   Se usa en productos.html. Necesita config.js (opcional: sin él no muestra la promo). */
(function () {
  'use strict';

  if (typeof HTMLDialogElement === 'undefined') return;

  var TELEFONO = '51930438700';
  var CLAVE = 'listaConsultaVanidades';
  var PROMO = window.PROMO || null;

  var tarjetas = Array.prototype.slice.call(document.querySelectorAll('.producto'));
  if (!tarjetas.length) return;

  /* ---------- 1. Catálogo de la página: id (nombre de la imagen) -> datos ---------- */
  function idDe(tarjeta) {
    var img = tarjeta.querySelector('img');
    var src = img ? img.getAttribute('src') : '';
    return src.split('/').pop();
  }
  function categoriaDe(tarjeta) {
    var sec = tarjeta.closest('.seccion-productos');
    return sec ? sec.id : '';
  }

  var catalogo = {};
  tarjetas.forEach(function (t) {
    var id = idDe(t);
    var titulo = t.querySelector('h3');
    if (!id || !titulo) return;
    var actual = catalogo[id];
    /* Si un producto sale en "Favoritos" y en su categoría, manda la categoría real */
    if (!actual || actual.categoria === 'favoritos') {
      catalogo[id] = { id: id, nombre: titulo.textContent.trim(), categoria: categoriaDe(t) };
    }
  });

  /* ---------- 2. Lista guardada en el navegador ---------- */
  function leer() {
    try {
      var v = JSON.parse(localStorage.getItem(CLAVE) || '[]');
      return Array.isArray(v) ? v.filter(function (id) { return catalogo[id]; }) : [];
    } catch (e) { return []; }
  }
  var lista = leer();
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
  }

  /* ---------- 3. Promo ---------- */
  function promoVigente() {
    return !!PROMO && (!PROMO.fin || new Date() <= new Date(PROMO.fin));
  }
  function juguetesEnLista() {
    return lista.filter(function (id) { return catalogo[id].categoria === PROMO.categoria; }).length;
  }

  /* ---------- 4. Elementos que crea el script ---------- */
  var CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  var botones = [];
  tarjetas.forEach(function (t) {
    var id = idDe(t);
    if (!catalogo[id]) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-lista';
    b.setAttribute('data-id', id);
    b.innerHTML = CORAZON;
    b.addEventListener('click', function () { alternar(id); });
    t.appendChild(b);
    botones.push(b);
  });

  var flotante = document.createElement('button');
  flotante.type = 'button';
  flotante.className = 'lista-flotante';
  flotante.hidden = true;
  flotante.setAttribute('aria-haspopup', 'dialog');
  flotante.innerHTML = CORAZON + '<span>Mi lista</span><span class="lista-contador" aria-hidden="true">0</span>';
  document.body.appendChild(flotante);

  var panel = document.createElement('dialog');
  panel.className = 'lista-panel';
  panel.setAttribute('aria-labelledby', 'lista-titulo');
  panel.innerHTML =
    '<div class="lista-interior">' +
      '<div class="lista-cabecera">' +
        '<h2 id="lista-titulo">Mi lista de consulta</h2>' +
        '<button type="button" class="lista-cerrar" aria-label="Cerrar lista">✕</button>' +
      '</div>' +
      '<p class="lista-ayuda">Guarda lo que te interesa y consúltalo todo junto por WhatsApp.</p>' +
      '<ul class="lista-items"></ul>' +
      '<p class="lista-vacia">Aún no guardaste productos. Toca el corazón en cada producto para agregarlo.</p>' +
      '<p class="lista-promo" hidden></p>' +
      '<div class="lista-acciones">' +
        '<a class="btn btn-wa lista-enviar" target="_blank" rel="noopener">' +
          '<img src="Imagenes/icons8-whatsapp-48.png" alt="" width="22" height="22"> Enviar lista por WhatsApp</a>' +
        '<button type="button" class="lista-vaciar">Vaciar lista</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);

  var estado = document.createElement('p');          /* avisos para lectores de pantalla */
  estado.className = 'solo-lector';
  estado.setAttribute('aria-live', 'polite');
  document.body.appendChild(estado);

  var ul = panel.querySelector('.lista-items');
  var vacia = panel.querySelector('.lista-vacia');
  var promo = panel.querySelector('.lista-promo');
  var acciones = panel.querySelector('.lista-acciones');
  var enviar = panel.querySelector('.lista-enviar');

  /* ---------- 5. Acciones ---------- */
  function alternar(id) {
    var i = lista.indexOf(id);
    if (i > -1) lista.splice(i, 1); else lista.push(id);
    guardar();
    actualizar();
    estado.textContent = (i > -1 ? 'Quitado de tu lista: ' : 'Agregado a tu lista: ') + catalogo[id].nombre +
      '. Tu lista tiene ' + lista.length + (lista.length === 1 ? ' producto.' : ' productos.');
  }

  function armarMensaje() {
    var l = ['Hola, quisiera consultar por estos productos:', ''];
    lista.forEach(function (id, i) { l.push((i + 1) + '. ' + catalogo[id].nombre); });
    if (promoVigente() && juguetesEnLista() >= PROMO.minimo) {
      l.push('', 'Quiero aprovechar la promo de Navidad (' + PROMO.resumen + ').');
    }
    l.push('', '¿Me confirman disponibilidad y precio?');
    return l.join('\n');
  }

  function textoPromo() {
    if (!promoVigente()) return '';
    var n = juguetesEnLista();
    var faltan = PROMO.minimo - n;
    if (n >= PROMO.minimo) {
      return '🎄 ¡Tu lista califica para la promo de Navidad (' + PROMO.resumen + ')! Te la confirmamos por WhatsApp.';
    }
    if (n > 0) {
      return '🎄 Agrega ' + faltan + (faltan === 1 ? ' juguete más' : ' juguetes más') +
        ' y aprovecha la promo de Navidad (' + PROMO.resumen + ').';
    }
    return '';
  }

  function dibujarPanel() {
    ul.innerHTML = '';
    lista.forEach(function (id) {
      var li = document.createElement('li');
      var nombre = document.createElement('span');
      nombre.textContent = catalogo[id].nombre;
      var q = document.createElement('button');
      q.type = 'button';
      q.className = 'lista-quitar';
      q.setAttribute('data-id', id);
      q.setAttribute('aria-label', 'Quitar de la lista: ' + catalogo[id].nombre);
      q.textContent = '✕';
      li.appendChild(nombre);
      li.appendChild(q);
      ul.appendChild(li);
    });
    var hay = lista.length > 0;
    ul.hidden = !hay;
    vacia.hidden = hay;
    acciones.hidden = !hay;
    enviar.href = 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(armarMensaje());
    var t = textoPromo();
    promo.textContent = t;
    promo.hidden = !t;
  }

  function actualizar() {
    botones.forEach(function (b) {
      var id = b.getAttribute('data-id');
      var activo = lista.indexOf(id) > -1;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      b.setAttribute('aria-label', (activo ? 'Quitar de mi lista: ' : 'Agregar a mi lista: ') + catalogo[id].nombre);
    });
    flotante.hidden = lista.length === 0;
    flotante.querySelector('.lista-contador').textContent = lista.length;
    flotante.setAttribute('aria-label', 'Mi lista, ' + lista.length + (lista.length === 1 ? ' producto' : ' productos'));
    dibujarPanel();
  }

  flotante.addEventListener('click', function () { dibujarPanel(); panel.showModal(); });

  panel.addEventListener('click', function (e) {
    if (e.target === panel) { panel.close(); return; }          /* clic fuera de la tarjeta */
    if (e.target.closest('.lista-cerrar')) { panel.close(); return; }
    var q = e.target.closest('.lista-quitar');
    if (q) { alternar(q.getAttribute('data-id')); return; }
    if (e.target.closest('.lista-vaciar')) {
      lista = [];
      guardar();
      actualizar();
      estado.textContent = 'Tu lista quedó vacía.';
    }
  });

  actualizar();
})();
/* reclamaciones.js — Libro de Reclamaciones virtual (necesita validacion.js antes).
   IMPORTANTE: la web no tiene servidor, así que el reclamo NO queda guardado en ningún sistema.
   Al validar se genera una constancia (imprimible / PDF) y un mensaje listo para WhatsApp.
   El N.º de hoja se cuenta en este navegador; para un correlativo real hace falta un servidor.
   Datos del proveedor: completar el RUC en reclamaciones.html (id="proveedor-ruc"). */
(function () {
  var form = document.getElementById('form-reclamo');
  if (!form || !window.Validador) return;

  var NUMERO_WA = '51930438700';

  var DOCS = {
    DNI: { patron: /^\d{8}$/,                 max: 8,  modo: 'numeric', solo: /\D/g,
           ayuda: 'El DNI tiene 8 dígitos.' },
    CE:  { patron: /^[A-Za-z0-9]{9,12}$/,     max: 12, modo: 'text',    solo: /[^A-Za-z0-9]/g,
           ayuda: 'El carné de extranjería tiene entre 9 y 12 letras o números.' },
    PAS: { patron: /^[A-Za-z0-9]{6,12}$/,     max: 12, modo: 'text',    solo: /[^A-Za-z0-9]/g,
           ayuda: 'El pasaporte tiene entre 6 y 12 letras o números.' },
    RUC: { patron: /^(10|15|17|20)\d{9}$/,    max: 11, modo: 'numeric', solo: /\D/g,
           ayuda: 'El RUC tiene 11 dígitos y empieza con 10, 15, 17 o 20.' }
  };
  var ETIQUETA_DOC = { DNI: 'DNI', CE: 'Carné de extranjería', PAS: 'Pasaporte', RUC: 'RUC' };

  var tipoDoc = document.getElementById('tipoDoc');
  var numDoc = document.getElementById('numDoc');
  var ayudaDoc = document.getElementById('ayuda-numDoc');
  var menor = document.getElementById('menor');
  var bloqueApoderado = document.getElementById('bloque-apoderado');

  document.getElementById('fecha-hoja').textContent = new Date().toLocaleDateString('es-PE');

  var v = Validador(form, {
    nombres: function (x) { return Validador.nombreCompleto(x, 'tus nombres y apellidos'); },
    tipoDoc: function (x) { return x ? '' : 'Selecciona el tipo de documento.'; },
    numDoc: function (x, get) {
      var t = get('tipoDoc');
      if (!t) return 'Primero selecciona el tipo de documento.';
      if (!x) return 'Escribe tu número de documento.';
      return DOCS[t].patron.test(x) ? '' : DOCS[t].ayuda;
    },
    domicilio: function (x) { return Validador.largo(x, 'tu domicilio', 5, 120); },
    telefono: function (x) {
      if (!x) return 'Escribe tu número de teléfono.';
      var limpio = x.replace(/[\s()-]/g, '');
      return Validador.texto.telefono.test(limpio) ? '' : 'Escribe un celular de 9 dígitos que empiece con 9 (ej. 987 654 321) o un fijo de Lima.';
    },
    correo: Validador.correo,
    apoderado: function (x, get) {
      if (!get('menor')) return '';
      return Validador.nombreCompleto(x, 'el nombre completo del padre, madre o apoderado');
    },
    tipoBien: function (x) { return x ? '' : 'Indica si es un producto o un servicio.'; },
    descBien: function (x) { return Validador.largo(x, 'qué producto o servicio es', 3, 150); },
    monto: function (x) {
      if (!x) return '';
      if (!/^\d{1,6}([.,]\d{1,2})?$/.test(x)) return 'Escribe solo el monto en soles, por ejemplo 49.90.';
      return parseFloat(x.replace(',', '.')) > 0 ? '' : 'El monto debe ser mayor a 0.';
    },
    tipoReclamo: function (x) { return x ? '' : 'Elige si es un reclamo o una queja.'; },
    detalle: function (x) { return Validador.largo(x, 'el detalle de lo ocurrido', 20, 1000); },
    pedido: function (x) { return Validador.largo(x, 'lo que esperas como solución', 10, 500); },
    acepto: function (x) { return x ? '' : 'Debes confirmar que los datos son verdaderos.'; }
  }, registrar);

  /* El documento depende del tipo elegido */
  tipoDoc.addEventListener('change', function () {
    var d = DOCS[tipoDoc.value];
    numDoc.value = '';
    numDoc.maxLength = d ? d.max : 12;
    numDoc.inputMode = d ? d.modo : 'numeric';
    ayudaDoc.textContent = d ? d.ayuda : 'Primero elige el tipo de documento.';
    if (v.tocado('numDoc')) v.validar('numDoc');
  });
  numDoc.addEventListener('input', function () {
    var d = DOCS[tipoDoc.value];
    if (d) { var limpio = numDoc.value.replace(d.solo, ''); if (limpio !== numDoc.value) numDoc.value = limpio; }
  });

  /* Menor de edad → pide los datos del apoderado */
  menor.addEventListener('change', function () {
    bloqueApoderado.hidden = !menor.checked;
    if (!menor.checked) { document.getElementById('apoderado').value = ''; v.validar('apoderado'); }
  });

  /* Contadores de caracteres */
  function contador(idCampo, idContador, max) {
    var campo = document.getElementById(idCampo), cont = document.getElementById(idContador);
    function act() {
      cont.textContent = campo.value.length + ' / ' + max;
      cont.classList.toggle('excedido', campo.value.length > max);
    }
    campo.addEventListener('input', act);
    act();
    return act;
  }
  var actDetalle = contador('detalle', 'contador-detalle', 1000);
  var actPedido = contador('pedido', 'contador-pedido', 500);

  /* N.º de hoja: contador guardado en este navegador (ver nota de arriba) */
  function siguienteNumero() {
    var anio = new Date().getFullYear(), n = 1;
    try {
      n = (parseInt(localStorage.getItem('reclamosVanidades' + anio), 10) || 0) + 1;
      localStorage.setItem('reclamosVanidades' + anio, String(n));
    } catch (e) { n = Math.floor(Date.now() / 1000) % 100000; }
    return 'N.º ' + String(n).padStart(4, '0') + '-' + anio;
  }

  function registrar(d) {
    var numero = siguienteNumero();
    var fecha = new Date().toLocaleDateString('es-PE');
    var ruc = (document.getElementById('proveedor-ruc').textContent || '').trim();

    var filas = [
      ['Fecha', fecha],
      ['Consumidor', d.nombres],
      ['Documento', ETIQUETA_DOC[d.tipoDoc] + ' ' + d.numDoc],
      ['Domicilio', d.domicilio],
      ['Teléfono', d.telefono],
      ['Correo', d.correo]
    ];
    if (menor.checked) filas.push(['Padre, madre o apoderado', d.apoderado]);
    filas.push(
      ['Bien contratado', d.tipoBien + ': ' + d.descBien + (d.monto ? ' (S/ ' + d.monto.replace(',', '.') + ')' : '')],
      ['Tipo', d.tipoReclamo],
      ['Detalle', d.detalle],
      ['Pedido del consumidor', d.pedido],
      ['Proveedor', 'C&R Vanidades Store' + (ruc && ruc.charAt(0) !== '[' ? ' · RUC ' + ruc : '')]
    );

    var dl = document.getElementById('constancia-datos');
    dl.textContent = '';
    var texto = 'LIBRO DE RECLAMACIONES - Vanidades Store\nHoja ' + numero + '\n';
    filas.forEach(function (f) {
      var fila = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = f[0]; dd.textContent = f[1];
      fila.appendChild(dt); fila.appendChild(dd); dl.appendChild(fila);
      texto += f[0] + ': ' + f[1] + '\n';
    });

    document.getElementById('constancia-numero').textContent = 'Hoja de reclamación ' + numero;
    document.getElementById('btn-wa').href = 'https://wa.me/' + NUMERO_WA + '?text=' + encodeURIComponent(texto);

    form.hidden = true;
    var c = document.getElementById('constancia');
    c.hidden = false;
    c.focus();
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('btn-imprimir').addEventListener('click', function () { window.print(); });

  document.getElementById('btn-nuevo').addEventListener('click', function () {
    form.reset();
    v.reiniciar();
    bloqueApoderado.hidden = true;
    ayudaDoc.textContent = 'Primero elige el tipo de documento.';
    actDetalle(); actPedido();
    document.getElementById('constancia').hidden = true;
    form.hidden = false;
    document.getElementById('nombres').focus();
  });
})();

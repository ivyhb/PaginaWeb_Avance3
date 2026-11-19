/* contacto.js — validación del formulario de contacto (necesita validacion.js antes).
   IMPORTANTE: esta web no tiene servidor, así que al validar NO se envía el mensaje a ningún
   lado: se muestra la confirmación y se ofrece enviarlo por WhatsApp con el texto ya escrito.
   Si más adelante tienes un servicio (Formspree, EmailJS, etc.), conéctalo dentro de
   enviarMensaje(datos). */
(function () {
  var form = document.getElementById('form-contacto');
  if (!form || !window.Validador) return;

  var NUMERO_WA = '51930438700';
  var MAX_MENSAJE = 500;
  var campos = document.getElementById('campos-contacto');
  var exito = document.getElementById('exito-contacto');
  var contador = document.getElementById('contador-mensaje');
  var textarea = document.getElementById('mensaje');

  var v = Validador(form, {
    nombre:  function (x) { return Validador.nombreCompleto(x, 'tu nombre completo'); },
    correo:  Validador.correo,
    asunto:  function (x) { return x.length > 80 ? 'Máximo 80 caracteres.' : ''; },
    mensaje: function (x) { return Validador.largo(x, 'tu mensaje', 10, MAX_MENSAJE); },
    acepto:  function (x) { return x ? '' : 'Debes aceptar el uso de tus datos para poder responderte.'; }
  }, enviarMensaje);

  /* Contador de caracteres */
  function actualizarContador() {
    var n = textarea.value.length;
    contador.textContent = n + ' / ' + MAX_MENSAJE;
    contador.classList.toggle('excedido', n > MAX_MENSAJE);
  }
  textarea.addEventListener('input', actualizarContador);
  actualizarContador();

  function enviarMensaje(datos) {
    /* Anti-spam: si el campo trampa tiene texto, es un robot; fingimos éxito y no hacemos nada */
    if (form.elements.web && form.elements.web.value) return;

    var texto = 'Hola, soy ' + datos.nombre + '.\n' +
      (datos.asunto ? 'Asunto: ' + datos.asunto + '\n' : '') +
      datos.mensaje + '\n' +
      'Mi correo: ' + datos.correo;
    document.getElementById('exito-nombre').textContent = datos.nombre.split(/\s+/)[0];
    document.getElementById('exito-wa').href = 'https://wa.me/' + NUMERO_WA + '?text=' + encodeURIComponent(texto);

    campos.hidden = true;
    exito.hidden = false;
    exito.focus();
  }

  document.getElementById('nuevo-mensaje').addEventListener('click', function () {
    form.reset();
    v.reiniciar();
    actualizarContador();
    exito.hidden = true;
    campos.hidden = false;
    document.getElementById('nombre').focus();
  });
})();

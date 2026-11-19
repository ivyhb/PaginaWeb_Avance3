/* validacion.js — motor de validación compartido (contacto.html y reclamaciones.html)
   Uso:  var v = Validador(formulario, reglas, function (datos) { ... });
   - reglas: { nombreDelCampo: function (valor, obtener) { return 'mensaje de error' o '' } }
   - Escribir las reglas en el MISMO orden en que aparecen los campos en la página.
   - Cada campo necesita un <p class="error-msg" id="error-NOMBRE"></p> en el HTML. */
(function () {
  'use strict';

  function Validador(form, reglas, alEnviarValido) {
    form.setAttribute('novalidate', '');          // usamos nuestros mensajes, no los del navegador
    var tocados = {};
    var resumen = form.querySelector('.resumen-errores');
    var nombres = Object.keys(reglas);

    function campos(nombre) { return form.querySelectorAll('[name="' + nombre + '"]'); }

    function obtener(nombre) {
      var els = campos(nombre);
      if (!els.length) return '';
      if (els[0].type === 'radio') {
        for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
        return '';
      }
      if (els[0].type === 'checkbox') return els[0].checked;
      return els[0].value.trim();
    }

    function mostrar(nombre, mensaje) {
      var els = campos(nombre);
      var caja = document.getElementById('error-' + nombre);
      var cont = els[0].closest('.campo, .campo-grupo');
      if (caja) caja.textContent = mensaje;
      if (cont) {
        cont.classList.toggle('campo--error', !!mensaje);
        var lleno = obtener(nombre) !== '' && obtener(nombre) !== false;
        cont.classList.toggle('campo--ok', !mensaje && !!tocados[nombre] && lleno);
      }
      for (var i = 0; i < els.length; i++) {
        if (mensaje) els[i].setAttribute('aria-invalid', 'true');
        else els[i].removeAttribute('aria-invalid');
      }
    }

    function validar(nombre) {
      var els = campos(nombre);
      if (!els.length) return '';
      /* Campos ocultos (por ejemplo, datos del apoderado) no se validan */
      var mensaje = els[0].closest('[hidden]') ? '' : (reglas[nombre](obtener(nombre), obtener) || '');
      mostrar(nombre, mensaje);
      return mensaje;
    }

    function limpiarResumen() {
      if (!resumen) return;
      resumen.hidden = true;
      resumen.textContent = '';
    }

    function mostrarResumen(errores) {
      if (!resumen) return;
      resumen.textContent = '';
      var titulo = document.createElement('strong');
      titulo.textContent = errores.length === 1
        ? 'Revisa 1 campo antes de continuar:'
        : 'Revisa ' + errores.length + ' campos antes de continuar:';
      var lista = document.createElement('ul');
      errores.forEach(function (e) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        var primero = campos(e.nombre)[0];
        a.href = '#' + primero.id;
        a.textContent = e.mensaje;
        a.addEventListener('click', function (ev) { ev.preventDefault(); primero.focus(); });
        li.appendChild(a);
        lista.appendChild(li);
      });
      resumen.appendChild(titulo);
      resumen.appendChild(lista);
      resumen.hidden = false;
    }

    /* Validación al salir del campo y mientras corrige */
    form.addEventListener('focusout', function (e) {
      var n = e.target.name;
      if (n && reglas[n]) { tocados[n] = true; validar(n); }
    });
    form.addEventListener('input', function (e) {
      var n = e.target.name;
      if (n && reglas[n] && tocados[n]) validar(n);
    });
    form.addEventListener('change', function (e) {
      var n = e.target.name;
      if (n && reglas[n]) { tocados[n] = true; validar(n); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errores = [];
      nombres.forEach(function (n) {
        tocados[n] = true;
        var m = validar(n);
        if (m) errores.push({ nombre: n, mensaje: m });
      });
      if (errores.length) {
        mostrarResumen(errores);
        if (resumen) resumen.focus();
        campos(errores[0].nombre)[0].focus();
        return;
      }
      limpiarResumen();
      var datos = {};
      nombres.forEach(function (n) { datos[n] = obtener(n); });
      alEnviarValido(datos);
    });

    return {
      validar: validar,
      obtener: obtener,
      tocado: function (n) { return !!tocados[n]; },
      reiniciar: function () {
        tocados = {};
        nombres.forEach(function (n) { if (campos(n).length) mostrar(n, ''); });
        limpiarResumen();
      }
    };
  }

  /* Reglas reutilizables */
  Validador.texto = {
    nombrePersona: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]*$/,
    correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    /* Celular peruano (9 + 8 dígitos) o fijo de Lima (01 + 7 dígitos), con o sin +51 */
    telefono: /^(?:\+?51)?(?:9\d{8}|0?1\d{7})$/
  };

  Validador.nombreCompleto = function (v, etiqueta) {
    if (!v) return 'Escribe ' + etiqueta + '.';
    if (v.length > 80) return 'Usa máximo 80 caracteres.';
    if (!Validador.texto.nombrePersona.test(v)) return 'Usa solo letras y espacios.';
    var palabras = v.split(/\s+/).filter(function (p) { return p.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length >= 2; });
    if (palabras.length < 2) return 'Escribe nombre y apellido.';
    return '';
  };

  Validador.correo = function (v) {
    if (!v) return 'Escribe tu correo electrónico.';
    if (v.length > 100) return 'El correo es demasiado largo.';
    if (!Validador.texto.correo.test(v)) return 'Escribe un correo válido, por ejemplo tu@correo.com.';
    return '';
  };

  Validador.largo = function (v, etiqueta, min, max) {
    if (!v) return 'Escribe ' + etiqueta + '.';
    if (v.length < min) return 'Escribe al menos ' + min + ' caracteres (llevas ' + v.length + ').';
    if (v.length > max) return 'Máximo ' + max + ' caracteres (llevas ' + v.length + ').';
    return '';
  };

  window.Validador = Validador;
})();

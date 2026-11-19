/* franja.js — franja de promoción arriba de la página (necesita config.js antes).
   Se crea sola: en cada página solo hay que agregar el <script>. */
(function () {
  var P = window.PROMO;
  if (!P) return;                                            /* sin config.js no se muestra */
  if (P.fin && new Date() > new Date(P.fin)) return;         /* promo vencida: desaparece sola */
  if (document.querySelector('.franja-promo')) return;

  var franja = document.createElement('div');
  franja.className = 'franja-promo';

  var enlace = document.createElement('a');
  enlace.href = 'productos.html#' + P.categoria;
  enlace.textContent = (P.boton || 'Ver juguetes') + ' →';

  franja.appendChild(document.createTextNode('🎄 '));
  var fuerte = document.createElement('strong');
  fuerte.textContent = 'Navidad: ';
  franja.appendChild(fuerte);
  franja.appendChild(document.createTextNode(P.resumen + ' · '));
  franja.appendChild(enlace);

  document.body.insertBefore(franja, document.body.firstChild);   /* arriba de todo, antes del menú */
})();
/* config.js — datos de la promoción. Es el ÚNICO lugar donde se cambian
   el porcentaje, la fecha y las condiciones (los usan el pop-up y la lista). */
window.PROMO = {
  categoria: 'juguetes',                 // sección donde aplica (id de la sección en productos.html)
  minimo: 2,                             // cuántos juguetes hacen falta
  porcentaje: 20,                        // descuento del 2.º juguete
  resumen: '2.º juguete con 20 % de descuento',   // 
  fechaTexto: '24 de diciembre',         // texto que se muestra
  fin: '2026-12-24T23:59:59-05:00',      // fecha límite  (hora de Perú)
  condiciones: 'Descuento sobre el juguete de menor precio. Hasta agotar stock.'   
};
const RUTAS_JSON = { pizza_rush: './data/pizza_rush.json', tetris: './data/tetris.json', chef_fraccion: './data/chef_fraccion.json' };
let cursoSeleccionado = ''; let elementoArrastrado = null; let offsetX = 0, offsetY = 0; let zonaDestino = null;
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./service-worker.js'); }); }
document.getElementById('select-curso').addEventListener('change', (e) => { cursoSeleccionado = e.target.value; document.querySelectorAll('#menu button').forEach(btn => btn.disabled =!cursoSeleccionado); });
async function cargarJuego(tipoJuego) {
  if (!cursoSeleccionado) return;
  const response = await fetch(RUTAS_JSON[tipoJuego]); const data = await response.json();
  let ejerciciosFiltrados;
  if (tipoJuego === 'pizza_rush') ejerciciosFiltrados = data.pedidos.filter(p => p.curso_minimo === cursoSeleccionado);
  else if (tipoJuego === 'tetris') ejerciciosFiltrados = data.fichas.filter(f => f.curso_minimo === cursoSeleccionado);
  else if (tipoJuego === 'chef_fraccion') ejerciciosFiltrados = data.recetas.filter(r => r.curso_minimo === cursoSeleccionado);
  mostrarJuego(data, ejerciciosFiltrados, cursoSeleccionado);
}
function volverMenu() { document.getElementById('menu').classList.remove('oculto'); document.getElementById('juego-container').classList.add('oculto'); document.getElementById('contenido-juego').innerHTML = ''; clearInterval(window.timerID); }
function parsearFraccion(str) {
  str = str.trim();
  const mixto = str.match(/^(\d+)\s*[⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/) || str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixto) {
    let entero, num, den;
    if (mixto[0].includes('⅓')) { entero = parseInt(mixto[1]); num = 1; den = 3; }
    else if (mixto[0].includes('⅔')) { entero = parseInt(mixto[1]); num = 2; den = 3; }
    else if (mixto[0].includes('¼')) { entero = parseInt(mixto[1]); num = 1; den = 4; }
    else if (mixto[0].includes('¾')) { entero = parseInt(mixto[1]); num = 3; den = 4; }
    else if (mixto[0].includes('⅕')) { entero = parseInt(mixto[1]); num = 1; den = 5; }
    else if (mixto[0].includes('⅖')) { entero = parseInt(mixto[1]); num = 2; den = 5; }
    else if (mixto[0].includes('⅗')) { entero = parseInt(mixto[1]); num = 3; den = 5; }
    else if (mixto[0].includes('⅘')) { entero = parseInt(mixto[1]); num = 4; den = 5; }
    else if (mixto[0].includes('⅙')) { entero = parseInt(mixto[1]); num = 1; den = 6; }
    else if (mixto[0].includes('⅚')) { entero = parseInt(mixto[1]); num = 5; den = 6; }
    else if (mixto[0].includes('⅛')) { entero = parseInt(mixto[1]); num = 1; den = 8; }
    else if (mixto[0].includes('⅜')) { entero = parseInt(mixto[1]); num = 3; den = 8; }
    else if (mixto[0].includes('⅝')) { entero = parseInt(mixto[1]); num = 5; den = 8; }
    else if (mixto[0].includes('⅞')) { entero = parseInt(mixto[1]); num = 7; den = 8; }
    else { entero = parseInt(mixto[1]); num = parseInt(mixto[2]); den = parseInt(mixto[3]); }
    return { num: entero * den + num, den: den };
  }
  const partes = str.split('/'); if (partes.length === 2) return { num: parseInt(partes[0]), den: parseInt(partes[1]) };
  if (!isNaN(str)) return { num: parseInt(str), den: 1 };
  throw new Error(`Fracción inválida: ${str}`);
}
function mcd(a, b) { while (b) { let t = b; b = a % b; a = t; } return a; }
function simplificarFraccion(f) { if (f.num === 0) return "0"; const divisor = mcd(Math.abs(f.num), Math.abs(f.den)); let num = f.num / divisor; let den = f.den / divisor; if (den === 1) return `${num}`; return `${num}/${den}`; }
function sumarFracciones(...fraccionesStr) { if (fraccionesStr.length === 0) return "0"; let resultado = parsearFraccion(fraccionesStr[0]); for (let i = 1; i < fraccionesStr.length; i++) { const f2 = parsearFraccion(fraccionesStr[i]); resultado = { num: resultado.num * f2.den + f2.num * resultado.den, den: resultado.den * f2.den }; } return simplificarFraccion(resultado); }
function sonEquivalentes(f1Str, f2Str) { const f1 = parsearFraccion(f1Str); const f2 = parsearFraccion(f2Str); return f1.num * f2.den === f1.den * f2.num; }
function hacerArrastrable(elemento, tipo) { elemento.draggable = false; elemento.dataset.tipo = tipo; elemento.addEventListener('touchstart', iniciarArrastre, { passive: false }); elemento.addEventListener('mousedown', iniciarArrastre); }
function iniciarArrastre(e) { e.preventDefault(); elementoArrastrado = e.currentTarget; if (elementoArrastrado.classList.contains('usada')) return; const touch = e.touches? e.touches[0] : e; const rect = elementoArrastrado.getBoundingClientRect(); offsetX = touch.clientX - rect.left; offsetY = touch.clientY - rect.top; elementoArrastrado.classList.add('arrastrando'); elementoArrastrado.style.position = 'fixed'; elementoArrastrado.style.zIndex = '1000'; elementoArrastrado.style.pointerEvents = 'none'; moverElemento(touch.clientX, touch.clientY); document.addEventListener('touchmove', arrastrar, { passive: false }); document.addEventListener('touchend', soltar); document.addEventListener('mousemove', arrastrar); document.addEventListener('mouseup', soltar); }
function arrastrar(e) { e.preventDefault(); const touch = e.touches? e.touches[0] : e; moverElemento(touch.clientX, touch.clientY); const elemDebajo = document.elementFromPoint(touch.clientX, touch.clientY); zonaDestino = elemDebajo?.closest('.caja-pizza,.bowl'); document.querySelectorAll('.caja-pizza,.bowl').forEach(zona => { zona.style.outline = zona === zonaDestino? '3px solid #2ecc71' : 'none'; }); }
function moverElemento(x, y) { if (!elementoArrastrado) return; elementoArrastrado.style.left = `${x - offsetX}px`; elementoArrastrado.style.top = `${y - offsetY}px`; }
function soltar(e) { document.removeEventListener('touchmove', arrastrar); document.removeEventListener('touchend', soltar); document.removeEventListener('mousemove', arrastrar); document.removeEventListener('mouseup', soltar); if (!elementoArrastrado) return; elementoArrastrado.style.position = ''; elementoArrastrado.style.zIndex = ''; elementoArrastrado.style.left = ''; elementoArrastrado.style.top = ''; elementoArrastrado.style.pointerEvents = ''; elementoArrastrado.classList.remove('arrastrando'); document.querySelectorAll('.caja-pizza,.bowl').forEach(z => z.style.outline = 'none'); if (zonaDestino) { const tipo = elementoArrastrado.dataset.tipo; const valor = elementoArrastrado.textContent.trim(); if (tipo === 'porcion') window.agregarPorcionAPizza(valor, elementoArrastrado); else if (tipo === 'jarra') window.agregarJarraABowl(valor, elementoArrastrado); } elementoArrastrado = null; zonaDestino = null; }
function mostrarJuego(dataCompleta, ejercicios, curso) {
  document.getElementById('menu').classList.add('oculto'); document.getElementById('juego-container').classList.remove('oculto');
  document.getElementById('titulo-juego').textContent = `${dataCompleta.metadata.descripcion} - ${curso}`;
  document.getElementById('desc-juego').textContent = dataCompleta.metadata.mecanica;
  const contenedor = document.getElementById('contenido-juego');
  if (dataCompleta.juego === 'pizza_rush') {
    let pedidoActual = 0, puntaje = 0, tiempoRestante = 0, fraccionesEnCaja = [];
    function renderizarPedido() {
      const ej = ejercicios[pedidoActual]; tiempoRestante = ej.tiempo_seg; fraccionesEnCaja = [];
      contenedor.innerHTML = `<div class="header-juego"><div class="timer">⏱️ ${tiempoRestante}s</div><div class="puntaje">⭐ ${puntaje}</div></div><div class="zona-pedido">${ej.texto_pedido}</div><div class="caja-pizza" data-objetivo='${JSON.stringify(ej.fracciones_necesarias)}'></div><div class="jarras-container"><div class="porcion">1/2</div><div class="porcion">1/4</div><div class="porcion">1/4</div><div class="porcion">1/8</div><div class="porcion">1/8</div></div>`;
      contenedor.querySelectorAll('.porcion').forEach(p => hacerArrastrable(p, 'porcion'));
      clearInterval(window.timerID);
      window.timerID = setInterval(() => { tiempoRestante--; document.querySelector('.timer').textContent = `⏱️ ${tiempoRestante}s`; if (tiempoRestante <= 0) { clearInterval(window.timerID); verificarRespuesta(); } }, 1000);
    }
    window.agregarPorcionAPizza = function(fraccion, elemento) { elemento.classList.add('usada'); const caja = document.querySelector('.caja-pizza'); caja.appendChild(elemento.cloneNode(true)); fraccionesEnCaja.push(fraccion); verificarRespuesta(); }
    function verificarRespuesta() { clearInterval(window.timerID); const objetivo = JSON.parse(document.querySelector('.caja-pizza').dataset.objetivo); const sumaAlumno = sumarFracciones(...fraccionesEnCaja); const sumaCorrecta = sumarFracciones(...objetivo); if (sumaAlumno === sumaCorrecta) { puntaje += 10 * ejercicios[pedidoActual].dificultad; mostrarMensaje("¡Pedido correcto!", "exito"); } else { mostrarMensaje(`Era ${sumaCorrecta}, pusiste ${sumaAlumno}`, "error"); } setTimeout(() => { pedidoActual++; if (pedidoActual < ejercicios.length) renderizarPedido(); else contenedor.innerHTML = `<h2>Juego terminado</h2><p>Puntaje final: ${puntaje}</p>`; }, 2000); }
    renderizarPedido();
  } else if (dataCompleta.juego === 'equivalencia_tetris') {
    let fichaActual = 0, puntaje = 0;
    function renderizarFicha() {
      const ej = ejercicios[fichaActual]; const correctas = ej.equivalentes_validos; const incorrectas = ["1/3", "2/5", "3/8", "5/6"].filter(f =>!correctas.includes(f));
      let todasLasFichas = [...correctas,...incorrectas.slice(0, 4)].sort(() => Math.random() - 0.5);
      contenedor.innerHTML = `<div class="header-juego"><div class="puntaje">⭐ ${puntaje}</div></div><div class="ficha-tetris ficha-base">${ej.fraccion_visible}</div><p style="text-align:center; margin: 16px 0;">Tocá solo las equivalentes</p><div class="tablero-tetris">${todasLasFichas.map(f => `<div class="ficha-tetris" data-valor="${f}">${f}</div>`).join('')}</div>`;
      contenedor.querySelectorAll('.ficha-tetris[data-valor]').forEach(ficha => { ficha.onclick = () => { const valor = ficha.dataset.valor; if (sonEquivalentes(valor, ej.fraccion_visible)) { ficha.classList.add('correcta'); puntaje += 10; document.querySelector('.puntaje').textContent = `⭐ ${puntaje}`; } else { ficha.classList.add('incorrecta'); puntaje = Math.max(0, puntaje - 5); } ficha.onclick = null; const quedanCorrectas = [...contenedor.querySelectorAll('.ficha-tetris[data-valor]')].some(f => sonEquivalentes(f.dataset.valor, ej.fraccion_visible) &&!f.classList.contains('correcta')); if (!quedanCorrectas) { setTimeout(() => { fichaActual++; if (fichaActual < ejercicios.length) renderizarFicha(); else contenedor.innerHTML = `<h2>¡Listo!</h2><p>Puntaje: ${puntaje}</p>`; }, 1000); } }; });
    }
    renderizarFicha();
  } else if (dataCompleta.juego === 'chef_fraccion') {
    let recetaActual = 0, totalEnBowl = "0";
    function renderizarReceta() { const ej = ejercicios[recetaActual]; totalEnBowl = "0"; contenedor.innerHTML = `<div class="objetivo-chef" data-objetivo="${ej.cantidad_objetivo}">${ej.objetivo_texto}</div><div class="bowl" data-total="0">0</div><div class="jarras-container">${ej.jarras_disponibles.map(j => `<div class="jarra">${j}</div>`).join('')}</div><p style="text-align:center; color:#7f8c8d;">${ej.pista_opcional}</p>`; contenedor.querySelectorAll('.jarra').forEach(j => hacerArrastrable(j, 'jarra')); }
    window.agregarJarraABowl = function(fraccion, elemento) { elemento.classList.add('usada'); const bowl = document.querySelector('.bowl'); totalEnBowl = sumarFracciones(totalEnBowl, fraccion); bowl.dataset.total = totalEnBowl; bowl.textContent = totalEnBowl; const {num, den} = parsearFraccion(totalEnBowl); const porcentaje = Math.min((num / den) * 100, 100); bowl.style.setProperty('--nivel-liquido', `${porcentaje}%`); const objetivo = document.querySelector('.objetivo-chef').dataset.objetivo; if (totalEnBowl === objetivo) { mostrarMensaje("¡Receta perfecta!", "exito"); setTimeout(() => { recetaActual++; if (recetaActual < ejercicios.length) renderizarReceta(); else contenedor.innerHTML = `<h2>¡Sos Chef Fracción!</h2>`; }, 1500); } else if (parsearFraccion(totalEnBowl).num / parsearFraccion(totalEnBowl).den > parsearFraccion(objetivo).num / parsearFraccion(objetivo).den) { mostrarMensaje("Te pasaste. Reiniciando...", "error"); setTimeout(renderizarReceta, 1500); } }
    renderizarReceta();
  }
}
function mostrarMensaje(texto, tipo) { const div = document.createElement('div'); div.className = `mensaje-feedback ${tipo}`; div.textContent = texto; document.getElementById('contenido-juego').prepend(div); setTimeout(() => div.remove(), 2000); }
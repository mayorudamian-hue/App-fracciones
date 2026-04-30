// ── Configuración ──────────────────────────────────────────────
const RUTAS_JSON = { 
  pizza_rush: './data/pizza_rush.json', 
  tetris: './data/tetris.json', 
  chef_fraccion: './data/chef_fraccion.json', 
  arquitecto: './data/arquitecto.json',
  porcentajes: './data/porcentajes.json',
  ascensor_extremo: './data/ascensor_extremo.json',
  clima_loco: './data/clima_loco.json',
  saldo_inteligente: './data/saldo_inteligente.json',
  zona_impacto: './data/zona_impacto.json',
  combinados_fracciones: './data/combinados_fracciones.json',
  combinados_enteros: './data/combinados_enteros.json'
};
const TIEMPO_DEFECTO = 60;
const TIEMPO_POR_EJERCICIO = 60; // 1 minuto por ejercicio
let cursoSeleccionado = '', nombreAlumno = '', comboActual = 0;
let elementoArrastrado = null, offsetX = 0, offsetY = 0, zonaDestino = null;

// ── Google Analytics Helper ───────────────────────────────────
function trackMP(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      'app_name': 'MatePlay',
      'alumno': nombreAlumno,
      'curso': cursoSeleccionado,
      ...params
    });
  }
}

// ── Estilo Visual MatePlay (Estilo "Play") ───────────────────
document.title = "MatePlay";
const mp_init = () => {
  const h1 = document.querySelector('h1');
  if (h1 && !document.querySelector('.mp-slogan')) {
    h1.textContent = "MatePlay";
    const slogan = document.createElement('p');
    slogan.className = 'mp-slogan';
    slogan.textContent = "¡Aprendé jugando!";
    h1.insertAdjacentElement('afterend', slogan);
  }

  // Actualizar los nombres de los botones en el menú principal para que sean más atractivos
  const nombresBotones = {
    pizza_rush: '🍕 Pizza Express',
    equivalencia_tetris: '🧩 Tetris Galáctico',
    arquitecto: '📏 Arquitecto Supremo',
    porcentajes: '📊 Radar de Porcentajes',
    chef_fraccion: '👨‍🍳 Super Chef',
    ascensor_extremo: '🛗 Rascacielos Extremo',
    clima_loco: '🌡️ Héroe del Clima',
    saldo_inteligente: '💳 Magnate de la Isla',
    zona_impacto: '💥 Zona de Impacto',
    combinados_fracciones: '🔬 Cálculos Combinados',
    combinados_enteros: '⚡ Cálculos Combinados'
  };

  document.querySelectorAll('#menu button[onclick^="cargarJuego"]').forEach(btn => {
    const attr = btn.getAttribute('onclick');
    const match = attr.match(/'([^']+)'/) || attr.match(/"([^"]+)"/);
    if (match && nombresBotones[match[1]]) {
      btn.textContent = nombresBotones[match[1]];
    }
  });

  // Cargar nombre guardado del alumno si existe
  const nombreGuardado = localStorage.getItem('mateplay_nombre');
  if (nombreGuardado) {
    const inputNombre = document.getElementById('input-nombre-menu');
    if (inputNombre) {
      inputNombre.value = nombreGuardado;
      validarMenu(); // Actualiza la variable global y el estado de los botones
    }
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mp_init);
else mp_init();

// ── Sonidos ───────────────────────────────────────────────────
const SONIDOS = {
  exito: new Audio('./assets/sounds/exito.mp3'),
  error: new Audio('./assets/sounds/error.mp3'),
  grab: new Audio('./assets/sounds/grab.mp3'),
  drop: new Audio('./assets/sounds/drop.mp3'),
  bubbling: new Audio('./assets/sounds/bubbling.mp3'),
  fanfarria: new Audio('./assets/sounds/fanfarria.mp3'),
  elevator: new Audio('./assets/sounds/elevator.mp3'),
  ding: new Audio('./assets/sounds/ding.mp3'),
  caja: new Audio('./assets/sounds/caja.mp3'),
  encaje: new Audio('./assets/sounds/encaje.mp3')
};

function reproducirSonido(tipo) {
  if (!SONIDOS[tipo]) return;
  SONIDOS[tipo].currentTime = 0; // Reiniciar para permitir clics rápidos
  SONIDOS[tipo].play().catch(() => {}); // Evita errores si el navegador bloquea el autoplay
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}

// ── Lógica de Instalación (PWA) ───────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  // Evitar que el navegador muestre su propio prompt predeterminado
  e.preventDefault();
  deferredPrompt = e;
  // Mostrar nuestro banner personalizado después de 3 segundos de entrar
  setTimeout(mostrarBannerInstalacion, 3000);
});

function mostrarBannerInstalacion() {
  if (!deferredPrompt || document.getElementById('install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: white; padding: 15px 20px; border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 10000;
    display: flex; align-items: center; gap: 15px; width: 90%; max-width: 420px;
    border: 3px solid var(--azul); animation: mpFadeIn 0.5s ease-out;
    font-family: sans-serif;
  `;
  banner.innerHTML = `
    <div style="font-size: 28px;">🎮</div>
    <div style="flex:1;">
      <div style="font-weight: 900; color: var(--azul-oscuro); font-size: 1rem;">¡Instalá MatePlay!</div>
      <div style="font-size: 0.8rem; color: #7f8c8d; font-weight: 600;">Jugá sin internet y desde tu escritorio.</div>
    </div>
    <button id="btn-pwa-install" style="margin:0; padding:10px 18px; font-size:0.85rem; font-weight:800; background:var(--azul); color:white; border:none; border-radius:12px; cursor:pointer; box-shadow: 0 4px 0 var(--azul-oscuro);">INSTALAR</button>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#bdc3c7; font-size:1.5rem; cursor:pointer; padding:0 5px; font-weight:bold;">&times;</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('btn-pwa-install').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        trackMP('pwa_install_accepted');
        banner.remove();
      }
      deferredPrompt = null;
    }
  });
}

function validarMenu() {
  nombreAlumno = document.getElementById('input-nombre-menu').value.trim();
  localStorage.setItem('mateplay_nombre', nombreAlumno); // Guardar nombre automáticamente
  const listo = cursoSeleccionado && nombreAlumno.length >= 2;
  document.querySelectorAll('#menu button[onclick^="cargarJuego"]').forEach(btn => btn.disabled = !listo);
  if (document.getElementById('btn-logros')) document.getElementById('btn-logros').disabled = !listo;
}

document.getElementById('select-curso').addEventListener('change', (e) => {
  cursoSeleccionado = e.target.value;
  validarMenu();
});

document.getElementById('input-nombre-menu').addEventListener('input', validarMenu);

// ── Cargar juego ───────────────────────────────────────────────
async function cargarJuego(tipoJuego) {
  if (!cursoSeleccionado) return;

  // Crear y mostrar pantalla de carga con logo animado
  const loader = document.createElement('div');
  loader.id = 'mateplay-loader';
  loader.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #fffdeb; z-index: 10000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: sans-serif;
  `;
  loader.innerHTML = `
    <style>
      @keyframes rotate-logo { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .loader-logo { 
        width: 100px; height: 100px; background: linear-gradient(135deg, #f1c40f, #f39c12); 
        border-radius: 22px; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 20px rgba(243, 156, 18, 0.3);
        animation: rotate-logo 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
        margin-bottom: 20px;
      }
      .loader-logo span { color: white; font-size: 3rem; font-weight: 900; pointer-events: none; }
    </style>
    <div class="loader-logo"><span>M</span></div>
    <div style="font-weight: 800; color: #2c3e50; font-size: 1.2rem;">Cargando MatePlay...</div>
  `;
  document.body.appendChild(loader);

  try {
    const response = await fetch(RUTAS_JSON[tipoJuego]);
    const data = await response.json();

    const pool = tipoJuego === 'pizza_rush' ? data.pedidos : 
                 tipoJuego === 'tetris' ? data.fichas : 
                 tipoJuego === 'chef_fraccion' ? data.recetas :
                 data.ejercicios;

    const ejerciciosFiltrados = pool
      .filter(e => e.curso_minimo === cursoSeleccionado)
      .filter(e => {
        // Para arquitecto, solo incluir items con el formato correcto (parte_fraccion + correcta_idx)
        if (tipoJuego === 'arquitecto') return e.parte_fraccion !== undefined && e.correcta_idx !== undefined;
        return true;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    // Simular un tiempo mínimo de carga para que se vea la animación
    await new Promise(r => setTimeout(r, 1000));

    history.pushState({ view: 'juego' }, '');
    trackMP('game_start', { 'tipo_juego': tipoJuego });

    mostrarJuego(data, ejerciciosFiltrados, cursoSeleccionado);
  } catch (err) {
    mostrarMensaje('Error al cargar datos', 'error');
  } finally {
    // Quitar el loader al terminar (éxito o error)
    if (loader) loader.remove();
  }
}

window.exportarCSV = function() {
  let csv = 'Juego;Curso;Alumno;Puntaje;Nota;Fecha\n';
  let hayDatos = false;

  Object.keys(localStorage).forEach(key => {
    const match = key.match(/^ranking_(.+)_([^_]+)$/);
    if (match) {
      hayDatos = true;
      const juego = match[1].replace(/_/g, ' ').toUpperCase();
      const curso = match[2];
      try {
        const data = JSON.parse(localStorage.getItem(key));
        data.forEach(r => {
          const notaVal = (r.nota !== undefined) ? r.nota : '-';
          csv += juego + ';' + curso + ';' + r.nombre + ';' + r.puntaje + ';' + notaVal + ';' + r.fecha + '\n';
        });
      } catch(e) {}
    }
  });

  if (!hayDatos) return mostrarMensaje('No hay puntajes guardados', 'error');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'notas_MatePlay_' + new Date().toLocaleDateString('es-AR').replace(/\//g,'-') + '.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

window.abrirPanelDocente = function() {
  const menu = document.getElementById('menu');
  const panel = document.getElementById('panel-docente-container');
  const contenido = document.getElementById('contenido-panel');
  const filtro = document.getElementById('filtro-curso-panel') ? document.getElementById('filtro-curso-panel').value : 'todos';

  history.pushState({ view: 'docente' }, '');
  let resultados = [];
  Object.keys(localStorage).forEach(key => {
    const match = key.match(/^ranking_(.+)_([^_]+)$/);
    if (match) {
      const juego = match[1].replace(/_/g, ' ').toUpperCase();
      const curso = match[2];
      try {
        const data = JSON.parse(localStorage.getItem(key));
        data.forEach((r, idx) => resultados.push({ ...r, juego, curso, key, idx }));
      } catch(e) {}
    }
  });

  // Aplicar filtro si no es "todos"
  if (filtro !== 'todos') resultados = resultados.filter(r => r.curso === filtro);

  // Ordenar por fecha (más reciente primero)
  resultados.sort((a, b) => {
    const da = (a.fecha || '').split('/').reverse().join('');
    const db = (b.fecha || '').split('/').reverse().join('');
    return db.localeCompare(da);
  });

  if (resultados.length === 0) {
    contenido.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:20px;">No hay evaluaciones registradas aún.</p>';
  } else {
    contenido.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <tr style="background:#f0f4f8; border-bottom:2px solid #dfe6e9;">
            <th style="padding:10px 4px; text-align:left;">Alumno / Juego</th>
            <th style="padding:10px 4px;">Curso</th>
            <th style="padding:10px 4px;">Nota</th>
            <th style="padding:10px 4px;"></th>
          </tr>
          ${resultados.map(r => {
            const n = parseFloat(r.nota);
            let medalla = '';
            if (n >= 9) medalla = '🥇 ';
            else if (n >= 7) medalla = '🥈 ';
            else if (n >= 6) medalla = '🥉 ';
            return `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 4px;"><strong>${r.nombre}</strong><br><small style="color:#7f8c8d;">${r.juego}</small></td>
              <td style="padding:10px 4px; text-align:center;">${r.curso}</td>
              <td style="padding:10px 4px; text-align:center;"><span style="background:${n>=6?'#d5f4e6':'#fadbd8'}; color:${n>=6?'#27ae60':'#c0392b'}; padding:4px 10px; border-radius:12px; font-weight:700;">${medalla}${r.nota || '-'}</span></td>
              <td style="padding:10px 4px; text-align:center;"><button onclick="eliminarRegistro('${r.key}', ${r.idx})" style="width:auto; background:none; box-shadow:none; color:var(--rojo); padding:4px; margin:0; font-size:1.1rem; border:none; display:inline;">🗑️</button></td>
            </tr>
          `}).join('')}
        </table>
      </div>`;
  }
  menu.classList.add('oculto');
  panel.classList.remove('oculto');
};

window.cerrarPanelDocente = function() {
  if (history.state) history.back(); else volverMenu();
};

window.eliminarRegistro = function(key, idx) {
  if (!confirm('¿Eliminar este registro de evaluación?')) return;
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (!data) return;
    data.splice(idx, 1);
    if (data.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(data));
    abrirPanelDocente(); // Refresca la tabla automáticamente
    mostrarMensaje('Registro eliminado', 'exito');
  } catch(e) {}
};

// ── Sistema de XP y Logros ────────────────────────────────────
const NIVELES_XP = [
  { nivel: 1,  nombre: 'Aprendiz',       xpMin: 0,    emoji: '🌱' },
  { nivel: 2,  nombre: 'Explorador',     xpMin: 100,  emoji: '🔭' },
  { nivel: 3,  nombre: 'Calculador',     xpMin: 250,  emoji: '🧮' },
  { nivel: 4,  nombre: 'Fraccionista',   xpMin: 500,  emoji: '🍕' },
  { nivel: 5,  nombre: 'Algebrista',     xpMin: 800,  emoji: '📐' },
  { nivel: 6,  nombre: 'Estratega',      xpMin: 1200, emoji: '♟️' },
  { nivel: 7,  nombre: 'Matemático',     xpMin: 1700, emoji: '📚' },
  { nivel: 8,  nombre: 'Genio',          xpMin: 2300, emoji: '🧠' },
  { nivel: 9,  nombre: 'Maestro',        xpMin: 3000, emoji: '🏆' },
  { nivel: 10, nombre: 'Leyenda',        xpMin: 4000, emoji: '⭐' }
];

const DEFINICION_LOGROS = [
  { id: 'primer_juego',   emoji: '🎮', nombre: 'Primera Misión',        desc: 'Completá tu primer juego', tipo: 'partidas', umbral: 1 },
  { id: 'xp_100',        emoji: '💪', nombre: 'Despegando',             desc: 'Alcanzá 100 XP totales', tipo: 'xp', umbral: 100 },
  { id: 'xp_250',        emoji: '🔥', nombre: 'En Llamas',             desc: 'Alcanzá 250 XP totales', tipo: 'xp', umbral: 250 },
  { id: 'xp_500',        emoji: '⚡', nombre: 'Energía Pura',          desc: 'Alcanzá 500 XP totales', tipo: 'xp', umbral: 500 },
  { id: 'xp_1000',       emoji: '💎', nombre: 'Diamante Bruto',         desc: 'Alcanzá 1000 XP totales', tipo: 'xp', umbral: 1000 },
  { id: 'xp_2000',       emoji: '🌟', nombre: 'Supernova',             desc: 'Alcanzá 2000 XP totales', tipo: 'xp', umbral: 2000 },
  { id: 'nota_10',       emoji: '🎯', nombre: 'Tiro Perfecto',         desc: 'Sacate un 10 en cualquier juego', tipo: 'nota_perfecta', umbral: 1 },
  { id: 'nota_10_x3',    emoji: '🎯🎯🎯', nombre: 'Triple 10',        desc: 'Sacate un 10 tres veces', tipo: 'nota_perfecta', umbral: 3 },
  { id: 'sin_errores',   emoji: '✨', nombre: 'Impecable',             desc: 'Terminá un juego sin ningún error', tipo: 'sin_errores', umbral: 1 },
  { id: 'racha_3',       emoji: '🔥', nombre: 'En Racha',              desc: 'Jugá 3 partidas seguidas (en sesión)', tipo: 'partidas_sesion', umbral: 3 },
  { id: 'partidas_10',   emoji: '🏅', nombre: 'Veterano',              desc: 'Completá 10 partidas en total', tipo: 'partidas', umbral: 10 },
  { id: 'partidas_25',   emoji: '🥇', nombre: 'Héroe MatePlay',        desc: 'Completá 25 partidas en total', tipo: 'partidas', umbral: 25 },
  { id: 'todos_fracs',   emoji: '🍕', nombre: 'Rey de Fracciones',     desc: 'Jugá todos los juegos del Módulo Fracciones', tipo: 'modulo_fracciones', umbral: 1 },
  { id: 'todos_enteros', emoji: '🔢', nombre: 'Rey de Enteros',        desc: 'Jugá todos los juegos del Módulo Enteros', tipo: 'modulo_enteros', umbral: 1 },
  { id: 'maestro',       emoji: '👑', nombre: 'Gran Maestro MatePlay', desc: 'Jugá TODOS los juegos de la app', tipo: 'todos_juegos', umbral: 1 }
];

const JUEGOS_FRACCIONES = ['pizza_rush', 'tetris', 'arquitecto', 'porcentajes', 'chef_fraccion', 'combinados_fracciones'];
const JUEGOS_ENTEROS = ['ascensor_extremo', 'clima_loco', 'saldo_inteligente', 'zona_impacto', 'combinados_enteros'];

function xpKey() { return `xp_${nombreAlumno}_${cursoSeleccionado}`; }
function logrosKey() { return `logros2_${nombreAlumno}_${cursoSeleccionado}`; }
function partidasKey() { return `partidas_${nombreAlumno}_${cursoSeleccionado}`; }

function getXPData() {
  return JSON.parse(localStorage.getItem(xpKey())) || { total: 0, notasPerfectas: 0, sinErrores: 0 };
}
function getLogrosDesbloqueados() {
  return JSON.parse(localStorage.getItem(logrosKey())) || [];
}
function getPartidas() {
  return JSON.parse(localStorage.getItem(partidasKey())) || { total: 0, jugados: [] };
}

function calcularNivel(xp) {
  let nivelActual = NIVELES_XP[0];
  for (const n of NIVELES_XP) { if (xp >= n.xpMin) nivelActual = n; }
  return nivelActual;
}
function calcularProgresoNivel(xp) {
  const nivelActual = calcularNivel(xp);
  const idx = NIVELES_XP.indexOf(nivelActual);
  const siguiente = NIVELES_XP[idx + 1];
  if (!siguiente) return { pct: 100, xpEnNivel: xp - nivelActual.xpMin, xpParaSiguiente: 0 };
  const xpEnNivel = xp - nivelActual.xpMin;
  const xpParaSiguiente = siguiente.xpMin - nivelActual.xpMin;
  return { pct: Math.round((xpEnNivel / xpParaSiguiente) * 100), xpEnNivel, xpParaSiguiente };
}

function ganarXP(juego, notaNum, totalErrores, puntaje) {
  const xpData = getXPData();
  const partidas = getPartidas();
  const logrosAnteriores = getLogrosDesbloqueados();

  // Calcular XP ganada en esta partida
  let xpGanada = 10; // base por completar
  xpGanada += Math.round(notaNum * 5); // hasta 50 XP por nota (10 * 5)
  if (totalErrores === 0) xpGanada += 20; // bonus sin errores
  if (notaNum >= 9) xpGanada += 15; // bonus nota alta
  xpGanada += Math.min(20, Math.round(puntaje / 10)); // hasta 20 XP extra por puntaje

  const xpAnterior = xpData.total;
  xpData.total += xpGanada;
  if (notaNum >= 9.9) xpData.notasPerfectas = (xpData.notasPerfectas || 0) + 1;
  if (totalErrores === 0) xpData.sinErrores = (xpData.sinErrores || 0) + 1;
  localStorage.setItem(xpKey(), JSON.stringify(xpData));

  // Registrar partida
  partidas.total = (partidas.total || 0) + 1;
  if (!partidas.jugados.includes(juego)) partidas.jugados.push(juego);
  // Racha de sesión
  const ahora = Date.now();
  const ultima = partidas.ultimaPartida || 0;
  const esMismaSesion = (ahora - ultima) < 30 * 60 * 1000; // 30 min
  partidas.rachaSession = esMismaSesion ? (partidas.rachaSession || 0) + 1 : 1;
  partidas.ultimaPartida = ahora;
  localStorage.setItem(partidasKey(), JSON.stringify(partidas));

  // Evaluar logros
  const nuevosLogros = [];
  for (const logro of DEFINICION_LOGROS) {
    if (logrosAnteriores.includes(logro.id)) continue;
    let desbloqueado = false;
    if      (logro.tipo === 'xp'             && xpData.total >= logro.umbral) desbloqueado = true;
    else if (logro.tipo === 'partidas'       && partidas.total >= logro.umbral) desbloqueado = true;
    else if (logro.tipo === 'nota_perfecta'  && xpData.notasPerfectas >= logro.umbral) desbloqueado = true;
    else if (logro.tipo === 'sin_errores'    && xpData.sinErrores >= logro.umbral) desbloqueado = true;
    else if (logro.tipo === 'partidas_sesion'&& partidas.rachaSession >= logro.umbral) desbloqueado = true;
    else if (logro.tipo === 'modulo_fracciones' && JUEGOS_FRACCIONES.every(j => partidas.jugados.includes(j))) desbloqueado = true;
    else if (logro.tipo === 'modulo_enteros'    && JUEGOS_ENTEROS.every(j => partidas.jugados.includes(j))) desbloqueado = true;
    else if (logro.tipo === 'todos_juegos'   && [...JUEGOS_FRACCIONES, ...JUEGOS_ENTEROS].every(j => partidas.jugados.includes(j))) desbloqueado = true;
    if (desbloqueado) nuevosLogros.push(logro.id);
  }
  if (nuevosLogros.length > 0) {
    const actualizados = [...logrosAnteriores, ...nuevosLogros];
    localStorage.setItem(logrosKey(), JSON.stringify(actualizados));
    nuevosLogros.forEach((id, i) => {
      const l = DEFINICION_LOGROS.find(x => x.id === id);
      setTimeout(() => mostrarMensaje(`${l.emoji} ¡Logro desbloqueado: ${l.nombre}!`, 'exito'), i * 2500);
    });
  }

  const nivelAnterior = calcularNivel(xpAnterior);
  const nivelNuevo = calcularNivel(xpData.total);
  const subiNivel = nivelNuevo.nivel > nivelAnterior.nivel;
  if (subiNivel) {
    setTimeout(() => {
      lanzarConfeti();
      mostrarMensaje(`🆙 ¡SUBISTE AL NIVEL ${nivelNuevo.nivel}: ${nivelNuevo.emoji} ${nivelNuevo.nombre}!`, 'exito');
    }, 1500);
  }

  return { xpGanada, xpTotal: xpData.total, nivel: nivelNuevo, subiNivel };
}

window.verLogros = function() {
  const container = document.getElementById('logros-container');
  const contenido = document.getElementById('contenido-logros');
  document.getElementById('menu').classList.add('oculto');
  history.pushState({ view: 'logros' }, '');
  container.classList.remove('oculto');

  const xpData = getXPData();
  const nivel = calcularNivel(xpData.total);
  const progreso = calcularProgresoNivel(xpData.total);
  const logrosDesbloqueados = getLogrosDesbloqueados();
  const partidas = getPartidas();

  const xpBarColor = nivel.nivel >= 8 ? 'linear-gradient(90deg,#f1c40f,#e67e22)' :
                     nivel.nivel >= 5 ? 'linear-gradient(90deg,#3498db,#9b59b6)' :
                     'linear-gradient(90deg,#2ecc71,#1abc9c)';

  let html = `
    <div style="background:linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.6));border-radius:20px;padding:20px;margin-bottom:20px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.08);border:2px solid rgba(255,255,255,0.9);">
      <div style="font-size:3.5rem;line-height:1;margin-bottom:6px;">${nivel.emoji}</div>
      <div style="font-size:1.5rem;font-weight:900;color:#2c3e50;">Nivel ${nivel.nivel}: ${nivel.nombre}</div>
      <div style="font-size:0.9rem;color:#7f8c8d;margin:4px 0 14px;">⭐ ${xpData.total} XP totales · ${partidas.total} partidas</div>
      <div style="background:rgba(0,0,0,0.08);border-radius:10px;height:14px;overflow:hidden;margin-bottom:6px;">
        <div style="height:100%;border-radius:10px;background:${xpBarColor};width:${progreso.pct}%;transition:width 1s ease;"></div>
      </div>
      ${ progreso.xpParaSiguiente > 0
        ? `<div style="font-size:0.8rem;color:#95a5a6;">${progreso.xpEnNivel} / ${progreso.xpParaSiguiente} XP para nivel ${nivel.nivel+1}</div>`
        : `<div style="font-size:0.85rem;color:#f1c40f;font-weight:800;">👑 ¡Nivel máximo alcanzado!</div>`
      }
    </div>
    <h3 style="font-weight:800;font-size:1rem;color:#7f8c8d;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">🏅 Logros (${logrosDesbloqueados.length}/${DEFINICION_LOGROS.length})</h3>
  `;

  html += DEFINICION_LOGROS.map(logro => {
    const ok = logrosDesbloqueados.includes(logro.id);
    return `<div class="logro-item ${ok ? 'completado' : ''}">
      <span class="logro-icon" style="font-size:1.6rem;">${logro.emoji}</span>
      <div style="flex:1;">
        <strong style="font-size:0.95rem;">${logro.nombre}</strong><br>
        <small style="color:#95a5a6;">${logro.desc}</small>
      </div>
      <span class="logro-check">${ok ? '✅' : '🔒'}</span>
    </div>`;
  }).join('');

  contenido.innerHTML = html;
};

function registrarCompletitud(juegoId, curso, nombre) {
  // Compatibilidad con sistema anterior
  const key = `logros_${nombre}_${curso}`;
  let completados = JSON.parse(localStorage.getItem(key)) || [];
  if (!completados.includes(juegoId)) {
    completados.push(juegoId);
    localStorage.setItem(key, JSON.stringify(completados));
  }
}

window.resetearTodo = function() {
  if (confirm('¿Borrar todo el historial y reiniciar para un nuevo curso?')) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ranking_') || key.startsWith('logros_') || 
          key.startsWith('logros2_') || key.startsWith('xp_') || key.startsWith('partidas_')) {
        localStorage.removeItem(key);
      }
    });
    document.getElementById('input-nombre-menu').value = '';
    document.getElementById('select-curso').value = '';
    comboActual = 0;
    cursoSeleccionado = '';
    nombreAlumno = '';
    validarMenu();
    mostrarMensaje('¡Sistema reiniciado!', 'exito');
  }
};

function volverMenu() {
  if (history.state) {
    history.back();
  } else {
    // Fallback por si se llama manualmente sin historial
    document.getElementById('menu').classList.remove('oculto');
    document.getElementById('juego-container').classList.add('oculto');
    document.getElementById('logros-container').classList.add('oculto');
    document.getElementById('panel-docente-container').classList.add('oculto');
    document.getElementById('contenido-juego').innerHTML = '';
    comboActual = 0;
    clearInterval(window.timerID);
  }
}

window.addEventListener('popstate', () => {
  // Esta función se activa cuando el usuario toca el botón "atrás" del celular
  const juegoContainer = document.getElementById('juego-container');
  const juegoActivo = !juegoContainer.classList.contains('oculto');
  const finalizado = document.getElementById('tabla-ranking') !== null;

  if (juegoActivo && !finalizado) {
    if (!confirm('¿Deseas salir del juego? Perderás el progreso de esta misión.')) {
      // Si el usuario cancela, volvemos a empujar el estado para quedarnos en el juego
      history.pushState({ view: 'juego' }, '');
      return;
    }
  }

  document.getElementById('menu').classList.remove('oculto');
  document.getElementById('juego-container').classList.add('oculto');
  document.getElementById('logros-container').classList.add('oculto');
  document.getElementById('panel-docente-container').classList.add('oculto');
  document.getElementById('contenido-juego').innerHTML = '';
  comboActual = 0;
  clearInterval(window.timerID);
});

// ── Matemática de fracciones ───────────────────────────────────
const GLIFOS_FRACCION = { 
  '⅓':[1,3],'⅔':[2,3],'¼':[1,4],'¾':[3,4],'⅕':[1,5],'⅖':[2,5],'⅗':[3,5],'⅘':[4,5],'⅙':[1,6],'⅚':[5,6],'⅛':[1,8],'⅜':[3,8],'⅝':[5,8],'⅞':[7,8] 
};

function parsearFraccion(str) {
  if (typeof str !== 'string') return { num: Number(str), den: 1 };
  str = str.trim().replace(/\s+/g, ' ');
  const mixto = str.match(/^(\d+)\s*[⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/) || str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  
  if (mixto) {
    const entero = parseInt(mixto[1]);
    const glifoMatch = Object.keys(GLIFOS_FRACCION).find(g => mixto[0].includes(g));
    if (glifoMatch) {
      const [n, d] = GLIFOS_FRACCION[glifoMatch];
      return { num: entero * d + n, den: d };
    }
    return { num: entero * parseInt(mixto[3]) + parseInt(mixto[2]), den: parseInt(mixto[3]) };
  }
  
  const partes = str.split('/');
  if (partes.length === 2) return { num: parseInt(partes[0]), den: parseInt(partes[1]) };
  if (!isNaN(str)) return { num: parseInt(str), den: 1 };
  throw new Error('Fraccion invalida: ' + str);
}
function mcd(a, b) { while (b) { let t = b; b = a % b; a = t; } return a; }
function simplificarFraccion(f) {
  if (f.num === 0) return "0";
  const d = mcd(Math.abs(f.num), Math.abs(f.den));
  const num = f.num / d, den = f.den / d;
  return den === 1 ? String(num) : num + '/' + den;
}
function sumarFracciones(...strs) {
  if (strs.length === 0) return "0";
  let r = parsearFraccion(strs[0]);
  for (let i = 1; i < strs.length; i++) {
    const f = parsearFraccion(strs[i]);
    r = { num: r.num * f.den + f.num * r.den, den: r.den * f.den };
  }
  return simplificarFraccion(r);
}
function sonEquivalentes(a, b) {
  const fa = parsearFraccion(a), fb = parsearFraccion(b);
  return fa.num * fb.den === fa.den * fb.num;
}
function comparar(aStr, bStr) {
  const a = parsearFraccion(aStr), b = parsearFraccion(bStr);
  return a.num * b.den - b.num * a.den;
}

// ── Matemática de Enteros ─────────────────────────────────────
function sumaEnteros(inicio, cambios) {
  return cambios.reduce((acc, val) => acc + val, inicio);
}

// ── Puntajes (localStorage) ────────────────────────────────────
function obtenerRanking(juego, curso) {
  try { return JSON.parse(localStorage.getItem('ranking_' + juego + '_' + curso)) || []; }
  catch (e) { return []; }
}
function guardarPuntaje(juego, curso, nombre, puntaje, nota) {
  const ranking = obtenerRanking(juego, curso);
  ranking.push({ nombre: nombre, puntaje: puntaje, nota: nota, fecha: new Date().toLocaleDateString('es-AR') });
  ranking.sort(function(a, b) { return b.puntaje - a.puntaje; });
  ranking.splice(50); // Guardamos hasta 50 puntajes para evaluar todo el curso
  localStorage.setItem('ranking_' + juego + '_' + curso, JSON.stringify(ranking));
}
function htmlRanking(juego, curso) {
  const ranking = obtenerRanking(juego, curso);
  if (ranking.length === 0) return '<p style="color:#7f8c8d;text-align:center;margin-top:8px;">Sin puntajes todavia</p>';
  const medallas = ['🥇','🥈','🥉','4°','5°'];
  return '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">' +
    '<tr style="background:#f0f4f8;"><th style="padding:6px 4px;text-align:left;">Nombre</th><th style="padding:6px 4px;">Puntaje</th><th style="padding:6px 4px;">Fecha</th></tr>' +
    ranking.map(function(r, i) {
      return '<tr style="background:' + (i===0?'#fff9c4':'white') + ';border-bottom:1px solid #eee;">' +
        '<td style="padding:6px 4px;">' + medallas[i] + ' ' + r.nombre + '</td>' +
        '<td style="padding:6px 4px;text-align:center;font-weight:700;">' + r.puntaje + '</td>' +
        '<td style="padding:6px 4px;text-align:center;color:#7f8c8d;">' + r.fecha + '</td>' +
        '</tr>';
    }).join('') + '</table>';
}

// ── Pantalla final ─────────────────────────────────────────────
function mostrarPantallaFinal(contenedor, juego, curso, puntaje, aciertos, total, erroresPorTema = {}) {
  const totalErrores = Object.values(erroresPorTema).reduce((a, b) => a + b, 0);
  let notaBruta = (aciertos / total) * 10;
  // Penalizar 1 punto de la nota final por cada error cometido durante los intentos
  let notaFinal = Math.max(1, notaBruta - totalErrores);
  if (notaFinal > 10) notaFinal = 10;
  
  const nota = notaFinal.toFixed(1);
  const porcentaje = total > 0 ? Math.round((notaFinal / 10) * 100) : 0;
  const notaAnim = nota === "10.0" ? 'nota-perfecta' : '';

  guardarPuntaje(juego, curso, nombreAlumno, puntaje, nota);
  registrarCompletitud(juego, curso, nombreAlumno);

  trackMP('game_complete', { 'id_juego': juego, 'puntaje': puntaje, 'nota': nota, 'aciertos': aciertos });

  // Efecto de billetes si termina Saldo Inteligente con nota aprobada
  if (juego === 'saldo_inteligente' && parseFloat(nota) >= 6) {
    lanzarBilletes();
  } else if (parseFloat(nota) >= 8) {
    lanzarConfeti();
  }

  const estrella = porcentaje >= 80 ? '🌟' : porcentaje >= 50 ? '⭐' : '💪';

  // Procesar temas con más errores para feedback pedagógico
  const temasOrdenados = Object.entries(erroresPorTema)
    .sort((a, b) => b[1] - a[1])
    .filter(t => t[1] > 0);

  let resumenHTML = '';
  if (temasOrdenados.length > 0) {
    resumenHTML = '<div style="background:#fff3cd; border:1px solid #ffeeba; border-radius:12px; padding:12px; margin-bottom:20px; text-align:left;">' +
      '<h3 style="font-size:0.95rem; color:#856404; margin-bottom:5px;">📊 Temas a reforzar:</h3>' +
      '<ul style="margin:0; padding-left:20px; font-size:0.85rem; color:#666;">' +
        temasOrdenados.slice(0, 2).map(t => `<li><strong>${t[0]}</strong></li>`).join('') +
      '</ul>' +
    '</div>';
  }

  // Ganar XP y evaluar logros
  const totalErrores2 = Object.values(erroresPorTema).reduce((a, b) => a + b, 0);
  const xpResult = ganarXP(juego, parseFloat(nota), totalErrores2, puntaje);

  const xpProgressColor = xpResult.nivel.nivel >= 8
    ? 'linear-gradient(90deg,#f1c40f,#e67e22)'
    : xpResult.nivel.nivel >= 5
    ? 'linear-gradient(90deg,#3498db,#9b59b6)'
    : 'linear-gradient(90deg,#2ecc71,#1abc9c)';
  const progresoXP = calcularProgresoNivel(xpResult.xpTotal);

  const xpBannerHTML = `
    <div style="background:linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.6));border-radius:16px;padding:16px;margin-bottom:20px;border:2px solid rgba(255,255,255,0.9);box-shadow:0 8px 20px rgba(0,0,0,0.06);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="font-size:2rem;">${xpResult.nivel.emoji}</span>
        <div>
          <div style="font-weight:900;font-size:1rem;color:#2c3e50;">Nv.${xpResult.nivel.nivel} ${xpResult.nivel.nombre}</div>
          <div style="font-size:0.8rem;color:#27ae60;font-weight:700;">+${xpResult.xpGanada} XP ganados · Total: ${xpResult.xpTotal} XP</div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.08);border-radius:8px;height:10px;overflow:hidden;">
        <div style="height:100%;border-radius:8px;background:${xpProgressColor};width:${progresoXP.pct}%;"></div>
      </div>
      <div style="font-size:0.75rem;color:#95a5a6;margin-top:4px;text-align:right;">${progresoXP.xpParaSiguiente > 0 ? progresoXP.xpEnNivel+'/'+progresoXP.xpParaSiguiente+' XP para siguiente nivel' : '👑 Nivel máximo'}</div>
    </div>`;

  contenedor.innerHTML =
    '<div style="text-align:center;padding:8px;">' +
      '<div style="font-size:3rem;margin-bottom:8px;">' + estrella + '</div>' +
      '<h2 style="color:#2c3e50;margin-bottom:4px;">¡Evaluación terminada, ' + nombreAlumno + '!</h2>' +
      '<p style="color:#7f8c8d;margin-bottom:16px;">' + aciertos + ' de ' + total + ' correctas · ' + porcentaje + '%</p>' +
      '<div style="display:flex; gap:10px; margin-bottom:16px;">' +
        '<div style="flex:1; background:var(--azul); border-radius:16px; padding:15px; color:white;">' +
          '<div style="font-size:0.8rem;opacity:0.85;">Nota</div>' +
          '<div class="' + notaAnim + '" style="font-size:2.2rem;font-weight:700;">' + nota + '</div>' +
        '</div>' +
        '<div style="flex:1; background:var(--verde); border-radius:16px; padding:15px; color:white;">' +
          '<div style="font-size:0.8rem;opacity:0.85;">Puntaje</div>' +
          '<div style="font-size:2.2rem;font-weight:700;">' + puntaje + '</div>' +
        '</div>' +
      '</div>' +
      xpBannerHTML +
      resumenHTML +
      '<div id="tabla-ranking">' + htmlRanking(juego, curso) + '</div>' +
      '<button onclick="volverMenu()" style="margin-top:16px;" class="secundario">← Menu</button>' +
    '</div>';
}

// ── Cronometro con barra ───────────────────────────────────────
let cronometroRestante = 0;
let cronometroTotal = 0;
let tiempoExtraUsado = 0;
const LIMITE_TIEMPO_EXTRA = 2;

function crearHTMLCronometro(segundos) {
  return '<div class="cronometro-wrap" style="display:flex; align-items:center; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:10px;">' +
    '<div class="timer" id="timer-display">⏱️ ' + segundos + 's</div>' +
    '<button id="btn-extra-tiempo" onclick="window.agregarTiempo()" class="secundario" style="margin:0; padding:2px 8px; font-size:0.75rem; background:#f39c12; color:white; border:none; height:auto; line-height:1; border-radius:4px; cursor:pointer;">+15s ⏱️ (' + LIMITE_TIEMPO_EXTRA + ')</button>' +
    '<div class="barra-tiempo-fondo" style="flex: 1 1 100%;"><div class="barra-tiempo" id="barra-timer" style="width:100%"></div></div>' +
  '</div>';
}
function actualizarCronometro(restante, total) {
  const el = document.getElementById('timer-display');
  const barra = document.getElementById('barra-timer');
  if (el) el.textContent = '⏱️ ' + restante + 's';
  if (barra) {
    const pct = Math.max(0, Math.min(100, (restante / total) * 100));
    barra.style.width = pct + '%';
    barra.style.background = restante <= 10 ? '#e74c3c' : restante <= 30 ? '#ff9800' : '#ffc107';
  }
}
function iniciarCronometro(segundos, onFin) {
  cronometroRestante = segundos;
  cronometroTotal = segundos;
  tiempoExtraUsado = 0;
  clearInterval(window.timerID);
  window.timerID = setInterval(function() {
    cronometroRestante--;
    actualizarCronometro(cronometroRestante, cronometroTotal);
    if (cronometroRestante <= 0) { 
      clearInterval(window.timerID); 
      onFin(); 
    }
  }, 1000);
}

window.agregarTiempo = function() {
  if (tiempoExtraUsado >= LIMITE_TIEMPO_EXTRA) {
    mostrarMensaje('Máximo 2 veces por ejercicio 🛑', 'error');
    return;
  }

  cronometroRestante += 15;
  tiempoExtraUsado++;
  actualizarCronometro(cronometroRestante, cronometroTotal);

  trackMP('use_extra_time', { 'usos': tiempoExtraUsado });
  
  const btn = document.getElementById('btn-extra-tiempo');
  if (btn) {
    const usosRestantes = LIMITE_TIEMPO_EXTRA - tiempoExtraUsado;
    btn.textContent = '+15s ⏱️ (' + usosRestantes + ')';
    if (usosRestantes === 0) {
      btn.style.opacity = '0.5';
      btn.style.background = '#95a5a6';
    }
  }
  mostrarMensaje('¡+15 segundos! Usos: ' + tiempoExtraUsado + '/' + LIMITE_TIEMPO_EXTRA + ' ⏳', 'exito');
};

// ── Arrastre (tactil y mouse) ──────────────────────────────────
function hacerArrastrable(elemento, tipo) {
  elemento.draggable = false;
  elemento.dataset.tipo = tipo;
  elemento.addEventListener('touchstart', iniciarArrastre, { passive: false });
  elemento.addEventListener('mousedown', iniciarArrastre);
}
function iniciarArrastre(e) {
  e.preventDefault();
  elementoArrastrado = e.currentTarget;
  if (elementoArrastrado.classList.contains('usada')) return;
  reproducirSonido('grab');
  const touch = e.touches ? e.touches[0] : e;

  // Guardamos estilos de posición para restaurar al soltar
  elementoArrastrado._estilosOriginales = {
    position:     elementoArrastrado.style.position     || '',
    left:         elementoArrastrado.style.left         || '',
    top:          elementoArrastrado.style.top          || '',
    zIndex:       elementoArrastrado.style.zIndex       || '',
    pointerEvents:elementoArrastrado.style.pointerEvents|| '',
    width:        elementoArrastrado.style.width        || ''
  };

  // Fijamos el tamaño ANTES de pasar a fixed para que no colapsen
  const naturalW = elementoArrastrado.offsetWidth;
  const naturalH = elementoArrastrado.offsetHeight;

  // Usamos el centro del elemento como punto de agarre para evitar
  // que el transform de :active distorsione el cálculo del offset
  offsetX = naturalW / 2;
  offsetY = naturalH / 2;

  elementoArrastrado.classList.add('arrastrando');
  elementoArrastrado.style.position = 'fixed';
  elementoArrastrado.style.width = naturalW + 'px';
  elementoArrastrado.style.zIndex = '1000';
  elementoArrastrado.style.pointerEvents = 'none';
  moverElemento(touch.clientX, touch.clientY);
  document.addEventListener('touchmove', arrastrar, { passive: false });
  document.addEventListener('touchend', soltar);
  document.addEventListener('mousemove', arrastrar);
  document.addEventListener('mouseup', soltar);
}
function arrastrar(e) {
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  moverElemento(touch.clientX, touch.clientY);
  const elemDebajo = document.elementFromPoint(touch.clientX, touch.clientY);
  zonaDestino = elemDebajo && (elemDebajo.closest('.caja-pizza') || elemDebajo.closest('.bowl'));
  document.querySelectorAll('.caja-pizza,.bowl').forEach(function(zona) {
    zona.style.outline = zona === zonaDestino ? '3px solid #2ecc71' : 'none';
  });
}
function moverElemento(x, y) {
  if (!elementoArrastrado) return;
  elementoArrastrado.style.left = (x - offsetX) + 'px';
  elementoArrastrado.style.top = (y - offsetY) + 'px';
}
function soltar(e) {
  document.removeEventListener('touchmove', arrastrar);
  document.removeEventListener('touchend', soltar);
  document.removeEventListener('mousemove', arrastrar);
  document.removeEventListener('mouseup', soltar);
  if (!elementoArrastrado) return;
  // Restaurar solo los estilos de posicionamiento, no borrar todo
  const orig = elementoArrastrado._estilosOriginales || {};
  elementoArrastrado.style.position     = orig.position     || '';
  elementoArrastrado.style.left         = orig.left         || '';
  elementoArrastrado.style.top          = orig.top          || '';
  elementoArrastrado.style.zIndex       = orig.zIndex       || '';
  elementoArrastrado.style.pointerEvents = orig.pointerEvents || '';
  elementoArrastrado.style.width         = orig.width        || '';
  elementoArrastrado.classList.remove('arrastrando');
  document.querySelectorAll('.caja-pizza,.bowl').forEach(function(z) { z.style.outline = 'none'; });
  if (zonaDestino) {
    reproducirSonido('drop');
    const tipo = elementoArrastrado.dataset.tipo;
    const valor = elementoArrastrado.dataset.valor || elementoArrastrado.textContent.trim();
    if (tipo === 'porcion') window.agregarPorcionAPizza(valor, elementoArrastrado, zonaDestino);
    else if (tipo === 'jarra') window.agregarJarraABowl(valor, elementoArrastrado);
  }
  elementoArrastrado = null; zonaDestino = null;
}

// ── Mostrar juego ──────────────────────────────────────────────
function mostrarJuego(dataCompleta, ejercicios, curso) {
  const epico = {
    pizza_rush: { n: 'Pizza Express: ¡Súper Reparto!', m: '¡La ciudad tiene hambre! Conviértete en el repartidor legendario dominando las porciones perfectas antes de que se enfríe el pedido.' },
    equivalencia_tetris: { n: 'Tetris Galáctico: Alianza de Fracciones', m: '¡Fragmentos de energía caen del cosmos! Estabiliza la galaxia uniendo fracciones equivalentes en esta batalla espacial de ingenio.' },
    arquitecto: { n: 'Arquitecto Supremo: ¡Crea tu Mundo!', m: '¡Diseña la ciudad del futuro! Usa tu sabiduría para completar estructuras maestras basadas en la unidad sagrada y proporciones divinas.' },
    porcentajes: { n: 'Radar de Porcentajes: El Círculo Mágico', m: '¡Sincroniza el Círculo Mágico! Transforma la energía de los porcentajes en conocimiento puro para iluminar el radar arcano.' },
    chef_fraccion: { n: 'Super Chef: Sabores Fraccionados', m: '¡Alerta en la cocina real! Fusiona ingredientes prohibidos con precisión absoluta para crear el banquete de la victoria definitiva.' },
    ascensor_extremo: { n: 'Rascacielos Extremo: ¡Ascensor al Infinito!', m: '¡Desafía a la gravedad! Pilota el ascensor infinito a través de tormentas y megas-picos en busca de la mítica planta final.' },
    clima_loco: { n: 'Héroe del Clima: Desafío Térmico', m: '¡El equilibrio térmico del mundo depende de ti! Enfrenta cambios extremos de temperatura y sobrevive a las tormentas de hielo y fuego.' },
    saldo_inteligente: { n: 'Magnate de la Isla: ¡Cuentas Millonarias!', m: '¡De náufrago a trillonario! Gestiona los tesoros de la isla y construye tu imperio financiero con cálculos de precisión milimétrica.' },
    zona_impacto: { n: 'Zona de Impacto: El Poder de los Signos', m: '¡Fuego en el hoyo! Lanza proyectiles matemáticos devastadores para derribar las fortalezas de la ignorancia en un choque explosivo.' },
    combinados_fracciones: { n: '🔬 Cálculos Combinados: Fracciones', m: '¡El verdadero desafío comienza aquí! Resolvé en tu carpeta con calma y precisión: potencias, raíces y fracciones combinadas. Solo los más valientes completan la hoja.' },
    combinados_enteros: { n: '⚡ Cálculos Combinados: Enteros', m: '¡Números enteros, potencias y raíces se fusionan en el desafío definitivo! Sacá tu carpeta, lápiz y usá todas tus estrategias para conquistar cada cálculo.' }
  };

  const idJuego = dataCompleta.juego;
  const override = epico[idJuego];

  document.getElementById('menu').classList.add('oculto');
  document.getElementById('juego-container').classList.remove('oculto');

  const tituloFinal = (override ? override.n : dataCompleta.metadata.descripcion.replace(/fracciones/gi, 'MatePlay')) + ' - ' + curso;
  document.getElementById('titulo-juego').textContent = tituloFinal;
  document.getElementById('desc-juego').textContent = override ? override.m : dataCompleta.metadata.mecanica;

  const contenedor = document.getElementById('contenido-juego');
  let erroresPorTema = {};

  let progresoNivel = 0;
  const getProgresoHTML = () => `
    <div class="progreso-container">
      <div class="progreso-barra" id="progreso-nivel-barra" style="width: ${progresoNivel}%"></div>
      <div class="progreso-texto">Nivel de Maestría</div>
    </div>`;

  function actProgreso(esCorrecto) {
    const previo = progresoNivel;
    if (esCorrecto) {
      const base = 100 / ejercicios.length;
      const bonus = comboActual > 1 ? (comboActual - 1) * (base * 0.3) : 0;
      progresoNivel = Math.min(100, progresoNivel + base + bonus);
    }
    const b = document.getElementById('progreso-nivel-barra');
    if (b) b.style.width = progresoNivel + '%';
    if (progresoNivel >= 100 && previo < 100) {
      reproducirSonido('fanfarria');
    }
    return progresoNivel >= 100;
  }

  const categorizar = (fracStr) => {
    const f = parsearFraccion(fracStr);
    if (f.num < f.den) return "Fracciones Propias (<1)";
    if (f.num === f.den) return "Enteros (=1)";
    return "Impropias / Mixtas (>1)";
  };

  // ── PIZZA RUSH ──────────────────────────────────────────────
  if (dataCompleta.juego === 'pizza_rush') {
    let pedidoActual = 0, puntaje = 0, aciertos = 0, fraccionesEnCaja = [];

    function generarPorciones(necesarias) {
      const extras = ["1/8","1/4","1/2","1/3","1/6","1","2/3"].filter(function(f) { return necesarias.indexOf(f) === -1; });
      const pool = necesarias.concat(extras.slice(0, Math.max(2, 5 - necesarias.length)));
      return pool.sort(function() { return Math.random() - 0.5; });
    }

    function renderizarPedido() {
      const ej = ejercicios[pedidoActual];
      fraccionesEnCaja = [];
      const porciones = generarPorciones([...ej.fracciones_necesarias]);
      const sumaCorrectaStr = sumarFracciones(...ej.fracciones_necesarias);
      const fObj = parsearFraccion(sumaCorrectaStr);
      const cantCajas = Math.ceil(fObj.num / fObj.den); // Calcula cajas necesarias
      
      let cajasHTML = '';
      for (let i = 0; i < cantCajas; i++) cajasHTML += '<div class="caja-pizza"></div>';

      const tiempoPedido = ej.tiempo_seg || TIEMPO_DEFECTO;
      contenedor.innerHTML = getProgresoHTML() + // Usar TIEMPO_POR_EJERCICIO
        '<div class="header-juego">' + crearHTMLCronometro(tiempoPedido) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div style="text-align:right;color:#7f8c8d;font-size:0.85rem;margin-bottom:6px;">Pedido ' + (pedidoActual+1) + '/' + ejercicios.length + '</div>' +
        '<div class="zona-pedido">' + ej.texto_pedido + '</div>' +
        '<div class="contenedor-cajas" data-suma-correcta="' + sumaCorrectaStr + '">' + cajasHTML + '</div>' +
        '<button onclick="window.limpiarCajas()" class="secundario btn-limpiar">🗑️ Limpiar Cajas</button>' +
        '<div class="jarras-container">' + porciones.map(function(p) { 
          return '<div class="porcion" data-valor="' + p + '"><span class="txt-porcion">🍕<br>' + p + '</span></div>'; 
        }).join('') + '</div>'; // Usar TIEMPO_POR_EJERCICIO
      contenedor.querySelectorAll('.porcion').forEach(function(p) { hacerArrastrable(p, 'porcion'); });
      iniciarCronometro(tiempoPedido, function() { terminarPedido(false); });
    }

    window.limpiarCajas = function() {
      reproducirSonido('drop');
      fraccionesEnCaja = [];
      document.querySelectorAll('.caja-pizza').forEach(c => c.innerHTML = '');
      document.querySelectorAll('.porcion').forEach(p => p.classList.remove('usada'));
    };

    window.agregarPorcionAPizza = function(fraccion, elemento, cajaTarget) {
      elemento.classList.add('usada');
      const container = document.querySelector('.contenedor-cajas');
      const sumaCorrecta = container.dataset.sumaCorrecta;
      
      // Si se soltó en una caja válida, la usamos; si no, buscamos la primera disponible
      const target = (cajaTarget && cajaTarget.classList.contains('caja-pizza')) ? cajaTarget : container.querySelector('.caja-pizza');

      const clon = elemento.cloneNode(true); clon.style.cursor = 'default'; target.appendChild(clon);
      fraccionesEnCaja.push(fraccion);
      const sumaAlumno = sumarFracciones(...fraccionesEnCaja);
      if (sumaAlumno === sumaCorrecta) { clearInterval(window.timerID); terminarPedido(true); }
      else if (comparar(sumaAlumno, sumaCorrecta) > 0) { clearInterval(window.timerID); terminarPedido(false, true); }
    };

    function terminarPedido(correcto, excedido) {
      const ej = ejercicios[pedidoActual];
      const sumaCorrecta = document.querySelector('.contenedor-cajas').dataset.sumaCorrecta;
      const tema = categorizar(sumaCorrecta);
      const nivelCompleto = actProgreso(correcto);
      if (correcto) { 
        aciertos++; 
        comboActual++;
        let bonusBase = 10 * (ejercicios[pedidoActual].dificultad || 1);
        if (tiempoExtraUsado === 0) {
          puntaje += (bonusBase + 5);
          mostrarMensaje('¡Pedido perfecto! +5 Bonus 🍕', 'exito');
        } else {
          puntaje += bonusBase;
          mostrarMensaje('Pedido correcto! 🍕', 'exito');
        }
        document.querySelectorAll('.caja-pizza').forEach(caja => {
          const r = caja.getBoundingClientRect();
          crearParticulas(r.left + r.width/2, r.top + r.height/2, '#f1c40f');
        });
      }
      else {
        comboActual = 0;
        erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
        if (excedido) { mostrarMensaje('Te pasaste. Era ' + sumaCorrecta, 'error'); }
        else { mostrarMensaje('Tiempo agotado. Era ' + sumaCorrecta, 'error'); }
      }
      setTimeout(function() {
        pedidoActual++;
        if (pedidoActual < ejercicios.length && !nivelCompleto) renderizarPedido();
        else mostrarPantallaFinal(contenedor, 'pizza_rush', curso, puntaje, aciertos, pedidoActual, erroresPorTema);
      }, 2000);
    }
    renderizarPedido();

  // ── EQUIVALENCIA TETRIS ─────────────────────────────────────
  } else if (dataCompleta.juego === 'equivalencia_tetris') {
    let fichaActual = 0, puntaje = 0, aciertos = 0;
    const incorrectasPool = ["1/3","2/5","3/8","5/6","1/4","4/10","3/9","2/6"];

    function renderizarFicha() {
      const ej = ejercicios[fichaActual];
      const correctas = ej.equivalentes_validos;
      const incorrectas = incorrectasPool.filter(function(f) {
        return correctas.indexOf(f) === -1 && !sonEquivalentes(f, ej.fraccion_visible);
      });
      const fichas = correctas.concat(incorrectas.slice(0, Math.max(3, 5 - correctas.length))).sort(function() { return Math.random() - 0.5; });
      contenedor.innerHTML = getProgresoHTML() +
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_POR_EJERCICIO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div style="text-align:right;color:#7f8c8d;font-size:0.85rem;margin-bottom:6px;">Ficha ' + (fichaActual+1) + '/' + ejercicios.length + '</div>' +
        '<div class="ficha-tetris ficha-base">' + ej.fraccion_visible + '</div>' +
        '<p style="text-align:center;margin:16px 0;color:#7f8c8d;">Toca solo las equivalentes</p>' +
        '<div class="tablero-tetris" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 100%; margin: 10px auto; padding: 10px; box-sizing: border-box;">' + fichas.map(function(f) { return '<div class="ficha-tetris" data-valor="' + f + '">' + f + '</div>'; }).join('') + '</div>';

      contenedor.querySelectorAll('.ficha-tetris[data-valor]').forEach(function(ficha) {
        ficha.onclick = function() {
          const val = ficha.dataset.valor;
          if (sonEquivalentes(val, ej.fraccion_visible)) {
            ficha.classList.add('correcta'); puntaje += 10;
            reproducirSonido('encaje');
            const rect = ficha.getBoundingClientRect();
            crearParticulas(rect.left + rect.width/2, rect.top + rect.height/2, '#ffc107');
          } else {
            comboActual = 0;
            const tema = ej.familia ? ej.familia.charAt(0).toUpperCase() + ej.familia.slice(1) : "Equivalencias";
            erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
            ficha.classList.add('incorrecta'); puntaje = Math.max(0, puntaje - 5);
            reproducirSonido('error');
          }
          document.querySelector('.puntaje').textContent = '⭐ ' + puntaje;
          ficha.onclick = null;
          const quedan = Array.from(contenedor.querySelectorAll('.ficha-tetris[data-valor]'))
            .some(function(f) { return sonEquivalentes(f.dataset.valor, ej.fraccion_visible) && !f.classList.contains('correcta'); });
          if (!quedan) { 
            clearInterval(window.timerID); 
            aciertos++; 
            comboActual++;
            if (tiempoExtraUsado === 0) {
              puntaje += 5;
              mostrarMensaje('¡Todo equivalente! +5 Bonus 🧩', 'exito');
            }
            const nivelCompleto = actProgreso(true);
            avanzarFicha(nivelCompleto); 
          }
        }; // Usar TIEMPO_POR_EJERCICIO
      });
      iniciarCronometro(TIEMPO_POR_EJERCICIO, function() {
        comboActual = 0;
        actProgreso(false);
        const tema = ej.familia ? ej.familia.charAt(0).toUpperCase() + ej.familia.slice(1) : "Equivalencias";
        erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
        mostrarMensaje('Tiempo! Siguiente...', 'error');
        avanzarFicha(false);
      });
    }

    function avanzarFicha(nivelCompleto) {
      setTimeout(function() {
        fichaActual++;
        if (fichaActual < ejercicios.length && !nivelCompleto) renderizarFicha();
        else mostrarPantallaFinal(contenedor, 'equivalencia_tetris', curso, puntaje, aciertos, fichaActual, erroresPorTema);
      }, 1000);
    }
    renderizarFicha();

  // ── CHEF FRACCION ───────────────────────────────────────────
  } else if (dataCompleta.juego === 'chef_fraccion') {
    let recetaActual = 0, totalEnBowl = "0", puntaje = 0, aciertos = 0;

    const obtenerColorLiquido = (texto) => {
      const t = texto.toLowerCase();
      if (t.includes('chocolate') || t.includes('esencia') || t.includes('jarabe')) return '121, 85, 72'; // Marrón
      if (t.includes('harina') || t.includes('azúcar') || t.includes('leche') || t.includes('crema') || t.includes('masa') || t.includes('sal')) return '255, 255, 255'; // Blanco
      if (t.includes('aceite') || t.includes('miel') || t.includes('queso') || t.includes('caldo')) return '241, 196, 15'; // Amarillo/Oro
      if (t.includes('jugo')) return '230, 126, 34'; // Naranja
      return '52, 152, 219'; // Azul (Default: agua, soda, etc.)
    };

    function renderizarReceta() {
      const ej = ejercicios[recetaActual];
      contenedor.style.setProperty('--color-liquido-rgb', obtenerColorLiquido(ej.objetivo_texto));
      totalEnBowl = "0";
      const fObj = parsearFraccion(ej.cantidad_objetivo);
      const cantBowls = Math.ceil(fObj.num / fObj.den);
      
      const t = ej.objetivo_texto.toLowerCase();
      const esCaliente = t.includes('caldo') || t.includes('sopa');
      const vaporHTML = `<div class="vapor-container ${esCaliente ? '' : 'oculto'}"><div class="vapor-particula"></div><div class="vapor-particula"></div><div class="vapor-particula"></div></div>`;

      // Nuevo CSS para el efecto de desbordamiento
      const overflowEstilo = `
        <style>
          .bowl.desbordado {
            border-color: var(--bolivia-red);
            box-shadow: 0 0 15px var(--bolivia-red);
            animation: shake-bowl 0.5s ease-in-out;
          }
          .bowl.desbordado::after {
            content: '💧'; /* Emoji para simular el derrame */
            position: absolute;
            top: -10px; /* Posición inicial por encima del bowl */
            right: 5px;
            font-size: 1.5rem;
            animation: spill-drop 0.8s forwards;
          }
          @keyframes shake-bowl {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
          }
          @keyframes spill-drop {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(20px) rotate(30deg); opacity: 0; }
          }
        </style>`;

      let bowlsHTML = '';
      for (let i = 0; i < cantBowls; i++) bowlsHTML += `<div style="position:relative;">${vaporHTML}<div class="bowl" data-total="0">0</div></div>`;
      // Usar TIEMPO_POR_EJERCICIO
      contenedor.innerHTML = getProgresoHTML() + overflowEstilo +
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_POR_EJERCICIO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div style="text-align:right;color:#7f8c8d;font-size:0.85rem;margin-bottom:6px;">Receta ' + (recetaActual+1) + '/' + ejercicios.length + '</div>' +
        '<div class="objetivo-chef" data-objetivo="' + ej.cantidad_objetivo + '">' + ej.objetivo_texto + '</div>' +
        '<div class="contenedor-bowls">' + bowlsHTML + '</div>' +
        '<div id="total-chef-display" style="text-align:center; font-weight:bold; font-size:1.2rem; margin-bottom:10px; color:var(--azul-oscuro);">Total: 0</div>' +
        '<button onclick="window.limpiarBowl()" class="secundario btn-limpiar">🗑️ Limpiar Bowl</button>' +
        '<div class="jarras-container">' + ej.jarras_disponibles.map(function(j) { return '<div class="jarra" data-valor="' + j + '">' + j + '</div>'; }).join('') + '</div>' + // Usar TIEMPO_POR_EJERCICIO
        '<p style="text-align:center;color:#7f8c8d;margin-top:8px;">💡 ' + ej.pista_opcional + '</p>';
      contenedor.querySelectorAll('.jarra').forEach(function(j) { hacerArrastrable(j, 'jarra'); });
      
      // Asegurarse de que no haya bowls con la clase 'desbordado' al iniciar una nueva receta
      document.querySelectorAll('.bowl').forEach(b => b.classList.remove('desbordado'));

      iniciarCronometro(TIEMPO_POR_EJERCICIO, function() {
        const ejFin = ejercicios[recetaActual];
        comboActual = 0;
        actProgreso(false);
        const tema = categorizar(ejFin.cantidad_objetivo);
        erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
        const obj = ejFin.cantidad_objetivo;
        mostrarMensaje('Tiempo. Era ' + obj, 'error');
        setTimeout(renderizarReceta, 1500);
      });
    }

    window.limpiarBowl = function() {
      comboActual = 0;
      reproducirSonido('drop');
      totalEnBowl = "0";
      const display = document.getElementById('total-chef-display');
      if (display) display.textContent = "Total: 0";
      document.querySelectorAll('.bowl').forEach(bowl => {
        bowl.textContent = "0";
        bowl.style.setProperty('--nivel-liquido', '0%');
        bowl.classList.remove('lleno');
        bowl.classList.remove('peligro');
      });
      document.querySelectorAll('.bowl').forEach(b => b.classList.remove('desbordado')); // Eliminar clase de desbordamiento
      document.querySelectorAll('.jarra').forEach(j => j.classList.remove('usada'));
    };

    window.agregarJarraABowl = function(fraccion, elemento) {
      elemento.classList.add('usada');
      reproducirSonido('bubbling');
      const bowlElements = document.querySelectorAll('.bowl');
      totalEnBowl = sumarFracciones(totalEnBowl, fraccion);
      
      const display = document.getElementById('total-chef-display');
      if (display) display.textContent = "Total: " + totalEnBowl;

      const totalF = parsearFraccion(totalEnBowl);
      const totalNum = totalF.num / totalF.den;

      bowlElements.forEach((bowl, idx) => {
        let nivel = 0;
        if (totalNum >= idx + 1) {
          nivel = 100;
          bowl.textContent = "1";
          bowl.classList.add('lleno');
        } else if (totalNum > idx) {
          nivel = (totalNum - idx) * 100;
          const nVal = totalF.num - (idx * totalF.den);
          bowl.textContent = simplificarFraccion({num: nVal, den: totalF.den});
          bowl.classList.remove('lleno');
        } else {
          nivel = 0;
          bowl.textContent = "0";
          bowl.classList.remove('lleno');
        }
        bowl.style.setProperty('--nivel-liquido', nivel + '%');
      });

      const objetivo = document.querySelector('.objetivo-chef').dataset.objetivo;
      const fTarget = parsearFraccion(objetivo);
      const ratio = totalNum / (fTarget.num / fTarget.den);

      // Si está al 85% o más de desbordarse, vibra
      bowlElements.forEach(b => {
        if (ratio >= 0.85 && ratio < 1) b.classList.add('peligro');
        else b.classList.remove('peligro');
      });

      if (totalEnBowl === objetivo) {
        clearInterval(window.timerID);
        comboActual++;
        aciertos++;
        if (tiempoExtraUsado === 0) {
          puntaje += 20; // 15 base + 5 bonus
          mostrarMensaje('¡Receta perfecta! +5 Bonus 👨‍🍳', 'exito');
        } else {
          puntaje += 15;
          mostrarMensaje('Receta perfecta! 👨‍🍳', 'exito');
        }
        const r = bowlElements[0].getBoundingClientRect();
        crearParticulas(r.left + r.width / 2, r.top + r.height / 2, '#f1c40f');
        const nivelCompleto = actProgreso(true);
        setTimeout(function() {
          recetaActual++;
          if (recetaActual < ejercicios.length && !nivelCompleto) renderizarReceta();
          else mostrarPantallaFinal(contenedor, 'chef_fraccion', curso, puntaje, aciertos, recetaActual, erroresPorTema);
        }, 1500);
      } else if (comparar(totalEnBowl, objetivo) > 0) {
        comboActual = 0;
        const tema = categorizar(objetivo);
        erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
        actProgreso(false);
        clearInterval(window.timerID);

        // Si se pasa por más de 1/2, se quema, de lo contrario solo se desborda
        if (comparar(totalEnBowl, sumarFracciones(objetivo, "1/2")) > 0) {
          document.querySelectorAll('.vapor-container').forEach(v => { v.classList.remove('oculto'); v.classList.add('quemado'); });
          mostrarMensaje('¡Se quemó! Te pasaste demasiado. Era ' + objetivo, 'error');
        } else {
          mostrarMensaje('¡Se desbordó! Te pasaste. Era ' + objetivo, 'error'); // Nuevo mensaje para desbordamiento
        }

        setTimeout(renderizarReceta, 1500);
      }
    };
    renderizarReceta();

  // ── ARQUITECTO ──────────────────────────────────────────────
  } else if (dataCompleta.juego === 'arquitecto') {
    let ejActual = 0, puntaje = 0, aciertos = 0;

    function renderizarEjercicio() {
      const ej = ejercicios[ejActual];
      const fRef = parsearFraccion(ej.parte_fraccion);
      const baseWidth = 150; // px que representan la unidad (1)
      const refWidth = baseWidth * (fRef.num / fRef.den);

      // Generar segmentos para la muestra (numerador)
      let segmentsHTML = '';
      for(let i=0; i<fRef.num; i++) segmentsHTML += '<div class="cuerda-segmento aparecer" style="background:#d35400; border-color:rgba(255,255,255,0.2)"></div>';
      // Usar TIEMPO_POR_EJERCICIO
      contenedor.innerHTML = getProgresoHTML() +
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_DEFECTO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div class="zona-pedido">' + ej.texto + '</div>' +
        '<div style="text-align:center;"><div class="cuerda-ref" style="width:' + refWidth + 'px">' + segmentsHTML + '</div>' +
        '<small style="color:#e67e22; font-weight:bold;">MUESTRA: ' + ej.parte_fraccion + '</small></div>' +
        '<div class="opciones-arquitecto">' + 
          ej.opciones.map((op, i) => `<div class="cuerda-opcion" data-idx="${i}" style="width:${baseWidth * op.proporcion}px"></div>`).join('') + 
        '</div>' + '<p style="text-align:center; margin-top:15px; color:#7f8c8d;">¿Cuál es el entero (1)?</p>'; // Usar TIEMPO_POR_EJERCICIO

      contenedor.querySelectorAll('.cuerda-opcion').forEach(el => {
        el.onclick = function() {
          const idx = parseInt(this.dataset.idx);
          if (idx === ej.correcta_idx) {
            this.classList.add('correcta');
            comboActual++;
            aciertos++;
            if (tiempoExtraUsado === 0) {
              puntaje += 15; // 10 base + 5 bonus
              mostrarMensaje('¡Construcción perfecta! +5 Bonus 📏', 'exito');
            } else {
              puntaje += 10; reproducirSonido('exito');
            }
            
            // Animación de ensamblaje en la respuesta correcta (denominador)
            const f = parsearFraccion(ej.parte_fraccion);
            this.innerHTML = '';
            for(let k=0; k < f.den; k++) {
              const seg = document.createElement('div');
              seg.className = 'cuerda-segmento';
              seg.style.background = '#27ae60';
              this.appendChild(seg);
              setTimeout(() => {
                seg.classList.add('aparecer');
                if (f.den <= 10) reproducirSonido('drop');
                const r = seg.getBoundingClientRect();
                crearParticulas(r.left + r.width/2, r.top + r.height/2, '#f1c40f');
              }, k * 80);
            }
          } else {
            comboActual = 0;
            this.classList.add('incorrecta');
            const ref = contenedor.querySelector('.cuerda-ref');
            if (ref) ref.classList.add('incorrecta');
            reproducirSonido('error');
            erroresPorTema["Noción de Entero"] = (erroresPorTema["Noción de Entero"] || 0) + 1;
          }
          const nivelCompleto = actProgreso(idx === ej.correcta_idx);
          contenedor.querySelectorAll('.cuerda-opcion').forEach(b => b.onclick = null);
          setTimeout(() => {
            ejActual++;
            if (ejActual < ejercicios.length && !nivelCompleto) renderizarEjercicio();
            else mostrarPantallaFinal(contenedor, 'arquitecto', curso, puntaje, aciertos, ejActual, erroresPorTema);
          }, 1500);
        };
      });
      iniciarCronometro(TIEMPO_POR_EJERCICIO, () => { comboActual = 0; actProgreso(false); ejActual++; if(ejActual < ejercicios.length) renderizarEjercicio(); else mostrarPantallaFinal(contenedor, 'arquitecto', curso, puntaje, aciertos, ejActual, erroresPorTema); });
    }
    renderizarEjercicio();

  // ── PORCENTAJES ─────────────────────────────────────────────
  } else if (dataCompleta.juego === 'porcentajes') {
    let ejActual = 0, puntaje = 0, aciertos = 0;

    function renderizarEjercicio() {
      const ej = ejercicios[ejActual];
      contenedor.innerHTML = getProgresoHTML() + // Usar TIEMPO_POR_EJERCICIO
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_POR_EJERCICIO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div style="text-align:right;color:#7f8c8d;font-size:0.85rem;margin-bottom:6px;">Desafío ' + (ejActual+1) + '/10</div>' +
        '<div class="percent-label-big">' + ej.porcentaje + '%</div>' +
        '<div class="percent-visual-circle" id="pie-chart"></div>' +
        '<p style="text-align:center; color:#7f8c8d; font-weight:bold;">¿Qué fracción representa este porcentaje?</p>' +
        '<div class="btn-grid-porcentaje">' + 
          ej.opciones.map(op => `<button class="ficha-tetris" data-val="${op}">${op}</button>`).join('') + 
        '</div>'; // Usar TIEMPO_POR_EJERCICIO

      // Añadir marcas de graduación
      const chartEl = document.getElementById('pie-chart');
      const marks = [
        { p: 25, t: 'quarter' }, { p: 50, t: 'quarter' }, { p: 75, t: 'quarter' }, { p: 100, t: 'quarter' },
        { p: 33.33, t: 'third' }, { p: 66.66, t: 'third' }
      ];
      marks.forEach(m => {
        const mark = document.createElement('div');
        mark.className = 'percent-mark ' + m.t;
        mark.style.transform = `rotate(${(m.p / 100) * 360}deg)`;
        chartEl.appendChild(mark);
      });

      // Animación del gráfico circular
      setTimeout(() => { 
        const chart = document.getElementById('pie-chart');
        if (!chart) return;
        const p = ej.porcentaje;

        let colorFill;
        if (p > 100) {
          colorFill = '#9b59b6'; // Púrpura para porcentajes que superan la unidad
        } else {
          // Interpolación lineal entre Azul (52, 152, 219) y Verde (46, 204, 113)
          const ratio = p / 100;
          const r = Math.round(52 + (46 - 52) * ratio);
          const g = Math.round(152 + (204 - 152) * ratio);
          const b = Math.round(219 + (113 - 219) * ratio);
          colorFill = `rgb(${r}, ${g}, ${b})`;
        }
        chart.style.background = `conic-gradient(${colorFill} ${p}%, #ecf0f1 0%)`;
      }, 100);

      contenedor.querySelectorAll('.ficha-tetris').forEach(btn => {
        btn.onclick = function() {
          const esCorrecto = this.dataset.val === ej.correcta;
          if (esCorrecto) {
            this.classList.add('correcta'); aciertos++; comboActual++;
            if (tiempoExtraUsado === 0) {
              puntaje += 20; // 15 base + 5 bonus
              mostrarMensaje('¡Porcentaje exacto! +5 Bonus 📊', 'exito');
            } else {
              puntaje += 15; reproducirSonido('exito');
            }
            const r = this.getBoundingClientRect(); crearParticulas(r.left + r.width/2, r.top + r.height/2, '#ffc107');
          } else {
            this.classList.add('incorrecta'); comboActual = 0; reproducirSonido('error');
            erroresPorTema["Conversión Porcentaje"] = (erroresPorTema["Conversión Porcentaje"] || 0) + 1;
          }
          const nivelCompleto = actProgreso(esCorrecto);
          contenedor.querySelectorAll('.ficha-tetris').forEach(b => b.onclick = null);
          setTimeout(() => {
            ejActual++;
            if (ejActual < ejercicios.length && !nivelCompleto) renderizarEjercicio();
            else mostrarPantallaFinal(contenedor, 'porcentajes', curso, puntaje, aciertos, ejActual, erroresPorTema);
          }, 1500);
        };
      });
      iniciarCronometro(TIEMPO_POR_EJERCICIO, () => { comboActual = 0; actProgreso(false); ejActual++; if(ejActual < ejercicios.length) renderizarEjercicio(); else mostrarPantallaFinal(contenedor, 'porcentajes', curso, puntaje, aciertos, ejActual, erroresPorTema); });
    }
    renderizarEjercicio();

  // ── ASCENSOR EXTREMO ────────────────────────────────────────
  } else if (dataCompleta.juego === 'ascensor_extremo') {
    let ejActual = 0, puntaje = 0, aciertos = 0;
    let movActual = 0, pisoActual = 0, ultimoPisoPos = 0;

    function renderizarEjercicio() { // This function will now only render the static parts and initial state
      const ej = ejercicios[ejActual];
      movActual = 0;
      pisoActual = ej.inicio; // Reset pisoActual for new exercise
      ultimoPisoPos = ej.inicio;
      
      const esNoche = ejActual >= 5; // Cambia a noche a partir del 6to ejercicio

      // Generar indicadores de luces para los pisos (del -12 al 12)
      let lucesHTML = '';
      for(let i = -12; i <= 12; i++) {
        const pct = 50 + (i * 4);
        lucesHTML += `<div class="luz-piso" id="luz-piso-${i}" style="bottom:${pct}%"></div>`;
      }

      const ascensorEstilo = `
        <style>
          .mov-item { display: inline-block; padding: 4px 8px; margin: 0 4px; border-radius: 4px; background: #eee; font-family: monospace; }
          .mov-item.actual { background: var(--azul); color: white; transform: scale(1.2); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
          .mov-item.pasado { opacity: 0.4; text-decoration: line-through; }
          .vibrar { animation: shake-edificio 0.5s linear; }
          .edificio-visual { 
            width: 100px; height: 180px; background: #ecf0f1; 
            margin: 20px auto; border: 4px solid #34495e; 
            position: relative; border-radius: 8px; overflow: hidden;
            background-image: linear-gradient(#bdc3c7 1px, transparent 1px);
            background-size: 100% 20px;
            transition: background-color 2s ease, border-color 2s ease;
          }
          .edificio-visual.noche { background-color: #2c3e50; border-color: #1a252f; background-image: linear-gradient(#34495e 1px, transparent 1px); }
          .edificio-visual.noche .piso-cero { background: #fff; opacity: 0.2; }
          .luz-piso { width: 4px; height: 4px; background: #95a5a6; border-radius: 50%; position: absolute; left: 4px; transition: background 0.3s, box-shadow 0.3s; z-index: 5; }
          .luz-piso.activa { background: #2ecc71; box-shadow: 0 0 5px #2ecc71; width: 6px; height: 6px; left: 3px; }
          .edificio-visual.noche .luz-piso:not(.activa) { background: #34495e; }
          .ventanas-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; grid-template-columns: repeat(2, 20px); justify-content: center; gap: 20px 15px; padding-top: 15px; box-sizing: border-box; pointer-events: none; }
          .ventana { background: #95a5a6; height: 15px; border-radius: 1px; transition: background 2s ease, box-shadow 2s ease; }
          .edificio-visual.noche .ventana { background: #f1c40f; box-shadow: 0 0 10px rgba(241, 196, 15, 0.8); }
          .ascensor-caja { 
            width: 100%; height: 25px; background: #e74c3c; 
            position: absolute; left: 0; bottom: 50%;
            transition: bottom 0.8s ease-in-out;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: bold; font-size: 0.9rem;
            box-shadow: inset 0 0 8px rgba(0,0,0,0.4);
            border-top: 2px solid #ff7675;
          }
          .piso-cero { 
            position: absolute; width: 100%; height: 2px; 
            background: #2c3e50; bottom: 50%; opacity: 0.3; 
          }
          @keyframes shake-edificio {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
        </style>`;

      contenedor.innerHTML = getProgresoHTML() + ascensorEstilo +
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_POR_EJERCICIO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div id="ascensor-info" class="zona-pedido"></div>' + // Dynamic info here
        '<div class="edificio-visual ' + (esNoche ? 'noche' : '') + '">' +
          lucesHTML + 
          '<div class="ventanas-grid">' +
            '<div class="ventana"></div><div class="ventana"></div>' +
            '<div class="ventana"></div><div class="ventana"></div>' +
            '<div class="ventana"></div><div class="ventana"></div>' +
            '<div class="ventana"></div><div class="ventana"></div>' +
          '</div>' +
          '<div class="piso-cero"></div>' +
          '<div id="ascensor-visual" class="ascensor-caja"></div>' + // Content updated dynamically
        '</div>' +
        '<div id="movimientos-display" style="text-align:center; margin: 15px 0;"></div>' + // Dynamic movements here
        '<div id="instruccion-paso" style="text-align:center; font-weight:bold; color:var(--azul-oscuro); margin-bottom:10px;"></div>' + // Dynamic instruction here
        '<div style="text-align:center;">' +
          '<div style="display:flex; justify-content:center; gap:5px; margin-bottom:10px;">' +
            '<button onclick="window.cambiarSigno(\'input-ascensor\', \'-\')" style="padding:10px; width:45px; background:#e74c3c; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">-</button>' +
            '<input type="number" id="input-ascensor" placeholder="Piso" style="width:100px; text-align:center; font-size:1.5rem; margin:0;">' +
            '<button onclick="window.cambiarSigno(\'input-ascensor\', \'+\')" style="padding:10px; width:45px; background:#2ecc71; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">+</button>' +
          '</div>' +
          '<button onclick="window.comprobarPiso()" style="width:100%; max-width:200px;">¡MOVER!</button>' +
        '</div>';
      
      function updateAscensorStateUI() { // New function to update dynamic parts
        document.getElementById('ascensor-info').innerHTML = 'Ejercicio ' + (ejActual+1) + '/10: El ascensor está en el piso <strong>' + pisoActual + '</strong>';
        document.getElementById('movimientos-display').innerHTML = ej.movimientos.map((m, i) => {
          const cls = i < movActual ? 'pasado' : (i === movActual ? 'actual' : '');
          return `<span class="mov-item ${cls}">${m > 0 ? '+' : ''}${m}</span>`;
        }).join('');
        document.getElementById('instruccion-paso').innerHTML = 
            (ej.movimientos[movActual] > 0 ? '🔼 SUBIR ' : '🔽 BAJAR ') + Math.abs(ej.movimientos[movActual]) + ' pisos';
      }

      const moverAscensorVisual = (piso, sonarDing = false) => {
        const el = document.getElementById('ascensor-visual');
        const edificio = document.querySelector('.edificio-visual');
        if (!el || !edificio) return;

        // Actualizar luces indicadoras
        document.querySelectorAll('.luz-piso').forEach(l => l.classList.remove('activa'));
        const luzActual = document.getElementById('luz-piso-' + piso);
        if (luzActual) luzActual.classList.add('activa');

        // Vibración si el desplazamiento es brusco (más de 10 pisos)
        if (Math.abs(piso - ultimoPisoPos) > 10) {
          edificio.classList.remove('vibrar');
          void edificio.offsetWidth; // Truco para reiniciar la animación CSS
          edificio.classList.add('vibrar');
        }
        ultimoPisoPos = piso;
        
        reproducirSonido('elevator');
        // Detenemos el sonido tras 800ms, coincidiendo con la transición CSS
        setTimeout(() => {
          if (SONIDOS.elevator) {
            SONIDOS.elevator.pause();
            SONIDOS.elevator.currentTime = 0;
          }
          if (sonarDing) {
            reproducirSonido('ding');
          }
        }, 800);

        // Mapeo: El piso 0 está al 50%. Cada piso sube/baja un 4%
        let pct = 50 + (piso * 4);
        pct = Math.max(0, Math.min(85, pct)); // Limitar para que no salga del edificio
        el.style.bottom = pct + '%';
        el.textContent = piso;
      };

      // Initial update of dynamic parts
      updateAscensorStateUI();
      
      document.getElementById('input-ascensor').focus();
      moverAscensorVisual(pisoActual, false); // Initial elevator position
      iniciarCronometro(TIEMPO_POR_EJERCICIO, () => {
         comboActual = 0; mostrarMensaje('¡Tiempo agotado!', 'error');
         ejActual++; 
         if(ejActual < ejercicios.length) renderizarEjercicio();
         else mostrarPantallaFinal(contenedor, 'ascensor_extremo', curso, puntaje, aciertos, ejActual, erroresPorTema);
      });

      window.comprobarPiso = function() {
        const resp = parseInt(document.getElementById('input-ascensor').value);
        const correcta = pisoActual + ej.movimientos[movActual];
        const esCorrecto = resp === correcta;
        
        if (esCorrecto) {
          pisoActual = correcta;
          moverAscensorVisual(pisoActual, true);
          movActual++;
          puntaje += 5;

          if (movActual < ej.movimientos.length) {
            mostrarMensaje('¡Piso correcto! 🏢', 'exito');
            setTimeout(updateAscensorStateUI, 1000); // Update the text elements after the animation
          } else {
            // Ejercicio terminado completamente
            aciertos++;
            comboActual++;
            if (tiempoExtraUsado === 0) {
              puntaje += 10; // 5 base + 5 bonus
              mostrarMensaje('¡Secuencia perfecta! +5 Bonus 🏁', 'exito');
            } else {
              puntaje += 5; // Bonus por terminar secuencia
              mostrarMensaje('¡Secuencia completada! 🏁', 'exito');
            }
            const nivelCompleto = actProgreso(true);
            clearInterval(window.timerID);
            setTimeout(() => {
              ejActual++;
              if (ejActual < ejercicios.length && !nivelCompleto) renderizarEjercicio();
              else mostrarPantallaFinal(contenedor, 'ascensor_extremo', curso, puntaje, aciertos, ejActual, erroresPorTema);
            }, 1500);
          }
        } else {
          reproducirSonido('error');
          comboActual = 0;
          mostrarMensaje('¡Piso equivocado!', 'error');
          erroresPorTema["Suma de Enteros"] = (erroresPorTema["Suma de Enteros"] || 0) + 1;
        }
      };
    }
    renderizarEjercicio();

  // ── CLIMA LOCO ──────────────────────────────────────────────
  } else if (dataCompleta.juego === 'clima_loco') {
    let ejActual = 0, puntaje = 0, aciertos = 0;
    let consecutivosBajoCero = 0;
    let consecutivosCalor = 0;

    function renderizarEjercicio() {
      const ej = ejercicios[ejActual];

      // Estilos locales para el termómetro y el efecto de burbujeo
      const termostilo = `
        <style>
          .term-layout { display: flex; align-items: center; justify-content: center; gap: 30px; margin: 20px 0; }
          .thermometer-v { width: 35px; height: 180px; background: #eee; border-radius: 20px; border: 4px solid #333; position: relative; overflow: hidden; }
          .mercury-v { position: absolute; bottom: 0; width: 100%; transition: height 0.6s ease, background 0.6s ease; border-top: 2px solid rgba(255,255,255,0.3); }
          .bubbles-wrap { position: absolute; bottom: 0; width: 100%; height: 100%; pointer-events: none; }
          .bubble-particle { position: absolute; bottom: 0; background: rgba(255,255,255,0.5); border-radius: 50%; animation: bubble-clima 1.5s infinite ease-in; }
          @keyframes bubble-clima { 0% { transform: translateY(0) scale(0.3); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-120px) scale(1.2); opacity: 0; } }
        </style>`;

      contenedor.innerHTML = getProgresoHTML() + termostilo +
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_DEFECTO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div class="term-layout">' +
          '<div class="thermometer-v">' +
            '<div id="mercurio-v" class="mercury-v"></div>' +
            '<div id="bubbles-v" class="bubbles-wrap"></div>' +
          '</div>' +
          '<div>' +
            '<div class="zona-pedido">Temperatura inicial: ' + ej.temp_inicial + '°C</div>' +
            '<div class="objetivo-chef">' + ej.cambios.map(c => (c > 0 ? '🔺 +' : '❄️ ') + c + '°C').join(' ') + '</div>' +
            '<div style="text-align:center; margin-top:20px;">' +
              '<div style="display:flex; justify-content:center; gap:5px; margin-bottom:10px;">' +
                '<button onclick="window.cambiarSigno(\'input-clima\', \'-\')" style="padding:10px; width:45px; background:#3498db; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">-</button>' +
                '<input type="number" id="input-clima" placeholder="Temp" style="width:100px; text-align:center; font-size:1.5rem; margin:0;">' +
                '<button onclick="window.cambiarSigno(\'input-clima\', \'+\')" style="padding:10px; width:45px; background:#f1c40f; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">+</button>' +
              '</div>' +
              '<button onclick="window.comprobarClima()" style="width:100%; max-width:200px;">Confirmar</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      const actualizarTermometro = (t) => {
        const merc = document.getElementById('mercurio-v');
        const bwrap = document.getElementById('bubbles-v');
        if (!merc) return;
        const pct = Math.max(5, Math.min(100, ((t + 25) / 75) * 100)); // Rango de -25°C a 50°C
        merc.style.height = pct + '%';
        merc.style.background = t < 0 ? '#3498db' : (t > 35 ? '#e74c3c' : '#f1c40f');
        
        if (t > 35) {
          bwrap.innerHTML = Array.from({length: 5}).map(() => 
            `<div class="bubble-particle" style="left:${Math.random()*60+20}%; width:${Math.random()*8+4}px; height:${Math.random()*8+4}px; animation-delay:${Math.random()*1.5}s"></div>`
          ).join('');
        } else { bwrap.innerHTML = ''; } // Usar TIEMPO_POR_EJERCICIO
      };

      actualizarTermometro(ej.temp_inicial);

      window.comprobarClima = function() {
        const resp = parseInt(document.getElementById('input-clima').value);
        const correcta = sumaEnteros(ej.temp_inicial, ej.cambios);
        const esCorrecto = resp === correcta;

        if (esCorrecto) { 
          aciertos++;
          let bonusExtra = (tiempoExtraUsado === 0 ? 5 : 0);
          puntaje += (10 + bonusExtra);
          let msg = bonusExtra > 0 ? '¡Temperatura perfecta! +5 Bonus 🌡️' : '¡Temperatura exacta! 🌡️';

          // Lógica de racha bajo cero
          if (correcta < 0) {
            consecutivosBajoCero++;
            consecutivosCalor = 0;
            if (consecutivosBajoCero === 5) {
              msg = '¡Superviviente del Ártico! ❄️🏔️';
              // Disparar efecto visual de congelado
              const frost = document.createElement('div');
              frost.className = 'frost-overlay';
              document.body.appendChild(frost);
              setTimeout(() => frost.remove(), 4500);
            }
          } else if (correcta > 30) {
            consecutivosCalor++;
            consecutivosBajoCero = 0;
            if (consecutivosCalor === 5) {
              msg = '¡Maestro del Desierto! 🔥🌵';
              // Disparar efecto visual de calor
              const heat = document.createElement('div');
              heat.className = 'heat-overlay';
              document.body.appendChild(heat);
              setTimeout(() => heat.remove(), 4500);
            }
          } else {
            consecutivosBajoCero = 0; // Se rompe la racha si la temp es >= 0
            consecutivosCalor = 0;
          }
          mostrarMensaje(msg, 'exito');
        } else { 
          reproducirSonido('error'); 
          erroresPorTema["Contexto Clima"] = (erroresPorTema["Contexto Clima"] || 0) + 1; 
          consecutivosBajoCero = 0; // Se rompe la racha en caso de error
          consecutivosCalor = 0;
        }

        const nivelCompleto = actProgreso(esCorrecto);
        setTimeout(() => {
          ejActual++;
          if (ejActual < ejercicios.length && !nivelCompleto) renderizarEjercicio();
          else mostrarPantallaFinal(contenedor, 'clima_loco', curso, puntaje, aciertos, ejActual, erroresPorTema);
        }, 1500);
      };
    } // Usar TIEMPO_POR_EJERCICIO
    renderizarEjercicio();

  // ── SALDO INTELIGENTE ───────────────────────────────────────
  } else if (dataCompleta.juego === 'saldo_inteligente') {
    let ejActual = 0, puntaje = 0, aciertos = 0;

    function renderizarEjercicio() {
      const ej = ejercicios[ejActual];
      const ticketEstilo = `
        <style>
          .saldo-ticket {
            background: #fff; border-radius: 12px; padding: 20px; margin: 20px auto 30px;
            max-width: 320px; color: #2c3e50;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1), 0 0 0 10px rgba(255,255,255,0.4);
            position: relative;
          }
          .saldo-ticket::before {
            content: ''; position: absolute; top: -10px; left: 0; right: 0; height: 10px;
            background: radial-gradient(circle, #fff 5px, transparent 6px) repeat-x;
            background-size: 20px 20px;
          }
          .ticket-header {
            text-align: center; font-weight: 900; font-size: 1.3rem; margin-bottom: 15px; 
            border-bottom: 2px dashed #bdc3c7; padding-bottom: 10px; color: #d35400;
          }
          .ticket-row {
            display: flex; justify-content: space-between; font-size: 1.1rem; 
            margin-bottom: 10px; font-weight: 600; align-items: center;
          }
          .ticket-total {
            border-top: 2px dashed #bdc3c7; padding-top: 15px; margin-top: 15px; 
            font-weight: 900; font-size: 1.3rem;
          }
          .monto-pos { color: #27ae60; background: rgba(39, 174, 96, 0.1); padding: 2px 8px; border-radius: 6px; }
          .monto-neg { color: #e74c3c; background: rgba(231, 76, 60, 0.1); padding: 2px 8px; border-radius: 6px; }
          .saldo-monto { font-family: 'Outfit', monospace; font-size: 1.25rem; font-weight: 800; }
        </style>`;

      let txtHtml = `<div class="saldo-ticket">`;
      txtHtml += `<div class="ticket-header">🌴 BANCO ISLA 🌴</div>`;
      if (ej.modo === 'A') {
        txtHtml += `<div class="ticket-row"><span>Saldo Inicial:</span> <span class="saldo-monto">$${ej.saldo_inicial}</span></div>`;
        ej.movimientos.forEach((m, i) => {
          const colorClass = m > 0 ? 'monto-pos' : 'monto-neg';
          const signo = m > 0 ? '+' : '';
          txtHtml += `<div class="ticket-row"><span>Movimiento ${i+1}:</span> <span class="saldo-monto ${colorClass}">${signo}$${m}</span></div>`;
        });
        txtHtml += `<div class="ticket-row ticket-total"><span>Saldo Final:</span> <span class="saldo-monto">???</span></div>`;
      } else {
        txtHtml += `<div class="ticket-row ticket-total" style="border-top:none; border-bottom:2px dashed #bdc3c7; padding-top:0; padding-bottom:15px; margin-top:0;"><span>Saldo Inicial:</span> <span class="saldo-monto">???</span></div>`;
        ej.movimientos.forEach((m, i) => {
          const colorClass = m > 0 ? 'monto-pos' : 'monto-neg';
          const signo = m > 0 ? '+' : '';
          txtHtml += `<div class="ticket-row"><span>Movimiento ${i+1}:</span> <span class="saldo-monto ${colorClass}">${signo}$${m}</span></div>`;
        });
        txtHtml += `<div class="ticket-row ticket-total"><span>Saldo Final:</span> <span class="saldo-monto">$${ej.saldo_final}</span></div>`;
      }
      txtHtml += `</div>`;

      const calcEstilo = `
        <style>
          .calc-wrap { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2000; width: 220px; background: #2c3e50; padding: 12px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); cursor: move; touch-action: none; user-select: none; opacity: 0.6; transition: opacity 0.3s ease; }
          .calc-wrap:hover, .calc-wrap:focus-within, .calc-wrap.interacting { opacity: 1; box-shadow: 0 8px 25px rgba(0,0,0,0.7); }
          .calc-screen { background: #ecf0f1; padding: 10px; text-align: right; margin-bottom: 12px; font-family: monospace; min-height: 30px; border-radius: 6px; font-size: 1.2rem; color: #2c3e50; font-weight: bold; overflow: hidden; }
          .calc-keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .calc-keys button { padding: 10px 0; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1.1rem; }
          .btn-n { background: #95a5a6; color: white; }
          .btn-o { background: #f39c12; color: white; }
          .btn-c { background: #e74c3c; color: white; }
          .btn-e { background: #2ecc71; color: white; grid-column: span 2; }
          .calc-header { display: flex; justify-content: flex-end; margin-bottom: 5px; }
          .btn-close-calc { background: none; border: none; color: #ecf0f1; font-size: 1.4rem; cursor: pointer; line-height: 1; padding: 0 5px; transition: color 0.2s; }
          .btn-close-calc:hover { color: #e74c3c; }
        </style>`;

      contenedor.innerHTML = getProgresoHTML() + ticketEstilo + calcEstilo +
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_DEFECTO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        '<div class="zona-pedido">' + (ej.modo === 'A' ? '¿Cuál es el saldo final de tu cuenta?' : '¿Cuál era tu saldo inicial?') + '</div>' +
        txtHtml +
        '<div style="text-align:center; margin-bottom: 20px;">' +
          '<div style="display:flex; justify-content:center; gap:5px; margin-bottom:10px;">' +
            '<button onclick="window.cambiarSigno(\'input-saldo\', \'-\')" style="padding:10px; width:45px; background:#e67e22; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">-</button>' +
            '<input type="number" id="input-saldo" placeholder="Respuesta" style="width:130px; text-align:center; font-size:1.5rem; margin:0; border: 4px solid #3498db; border-radius:12px;">' +
            '<button onclick="window.cambiarSigno(\'input-saldo\', \'+\')" style="padding:10px; width:45px; background:#27ae60; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">+</button>' +
          '</div>' +
          '<button onclick="window.comprobarSaldo()" style="width:100%; max-width:230px;">Verificar</button>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<button class="secundario" style="background:#f1c40f; color:#2c3e50; border:none;" onclick="const c=document.getElementById(\'calc-app\'); c.style.display=(c.style.display===\'block\'?\'none\':\'block\')">🧮 Calculadora de apoyo</button>' +
        '</div>' +
        '<div id="calc-app" class="calc-wrap">' +
          '<div class="calc-header"><button class="btn-close-calc" onclick="document.getElementById(\'calc-app\').style.display=\'none\'" title="Cerrar">×</button></div>' +
          '<div id="calc-res" class="calc-screen"></div>' +
          '<div class="calc-keys">' +
            ['7','8','9','+','4','5','6','-','1','2','3','C','0','←'].map(k => `<button class="${isNaN(k)?(k==='C'||k==='←'?'btn-c':'btn-o'):'btn-n'}" onclick="window.calcClick('${k}')">${k}</button>`).join('') +
            '<button class="btn-e" onclick="window.calcEval()">=</button>' +
          '</div>' +
        '</div>';

      window.calcClick = (k) => { // Usar TIEMPO_POR_EJERCICIO
        const res = document.getElementById('calc-res');
        if (k === 'C') res.textContent = '';
        else if (k === '←') res.textContent = res.textContent.slice(0, -1);
        else res.textContent += k;
      };

      window.calcEval = () => {
        const res = document.getElementById('calc-res');
        try {
          const val = res.textContent.replace(/[^-+0-9]/g, '');
          if (!val) return;
          res.textContent = Function('"use strict";return (' + val + ')')();
        } catch(e) { res.textContent = 'Error'; }
      }; // Usar TIEMPO_POR_EJERCICIO

      window.comprobarSaldo = function() {
        const resp = parseInt(document.getElementById('input-saldo').value);
        const correcta = ej.modo === 'A' ? 
          sumaEnteros(ej.saldo_inicial, ej.movimientos) : 
          ej.saldo_final - ej.movimientos.reduce((a, b) => a + b, 0);

        const esCorrecto = resp === correcta;
        if (esCorrecto) { 
          aciertos++;
          if (tiempoExtraUsado === 0) { puntaje += 20; mostrarMensaje('¡Cuenta perfecta! +5 Bonus 💰', 'exito'); }
          else { puntaje += 15; mostrarMensaje('¡Cuenta perfecta! 💰', 'exito'); }
        }
        else { reproducirSonido('error'); erroresPorTema["Ecuaciones de Saldo"] = (erroresPorTema["Ecuaciones de Saldo"] || 0) + 1; }
        const nivelCompleto = actProgreso(esCorrecto);
        setTimeout(() => {
          ejActual++;
          if (ejActual < ejercicios.length && !nivelCompleto) renderizarEjercicio();
          else mostrarPantallaFinal(contenedor, 'saldo_inteligente', curso, puntaje, aciertos, ejActual, erroresPorTema);
        }, 1500);
      };
    } // Usar TIEMPO_POR_EJERCICIO
    renderizarEjercicio();

  // ── ZONA DE IMPACTO ─────────────────────────────────────────
  } else if (dataCompleta.juego === 'zona_impacto') {
    let ejActual = 0, puntaje = 0, aciertos = 0;

    function renderizarEjercicio() {
      const ej = ejercicios[ejActual];
      const estilosImpacto = `
        <style>
          .expresion-impacto { font-size: 2.5rem; font-weight: 800; text-align: center; margin: 30px 0; color: #2c3e50; text-shadow: 2px 2px 0px #bdc3c7; animation: bounceIn 0.5s cubic-bezier(0.36, 0, 0.66, -0.56) both; }
          .grid-signos { display: flex; justify-content: center; gap: 20px; margin-bottom: 25px; }
          .btn-signo { width: 100px; height: 100px; font-size: 2.5rem; border-radius: 50%; border: 6px solid #34495e; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; background: white; }
          .btn-signo:active { transform: scale(0.9); }
          .btn-positivo { color: #27ae60; border-color: #27ae60; }
          .btn-negativo { color: #c0392b; border-color: #c0392b; }
          .input-valor-impacto { width: 150px; font-size: 1.8rem; text-align: center; padding: 10px; border: 4px solid var(--azul); border-radius: 12px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
          @keyframes bounceIn { 0% { opacity: 0; transform: scale(.3); } 50% { opacity: 1; transform: scale(1.05); } 70% { transform: scale(.9); } 100% { transform: scale(1); } }
        </style>`;

      const esNivel1 = curso === '1ro';
      const esNivel2 = curso === '2do';
      const esNivel3 = curso === '3ro';

      let interfaceHTML = `<div class="expresion-impacto">${ej.expresion}</div>`;

      if (esNivel1 || esNivel2) {
        interfaceHTML += `
          <p style="text-align:center; font-weight:bold; color:#7f8c8d; margin-bottom:10px;">¿Qué signo tiene el resultado?</p>
          <div class="grid-signos">
            <button class="btn-signo btn-positivo" onclick="window.checkSigno('+')">+</button>
            <button class="btn-signo btn-negativo" onclick="window.checkSigno('-')">-</button>
          </div>
          <div id="paso-valor" class="oculto">
            <p style="text-align:center; font-weight:bold; color:#7f8c8d; margin-bottom:10px;">¡Bien! Ahora el valor numérico:</p>
            <input type="number" id="input-valor" class="input-valor-impacto" placeholder="?">
            <button onclick="window.checkValor()" style="width:100%;">¡IMPACTO!</button>
          </div>`;
      } else {
        // Nivel 3: Selección múltiple tipo arcade
        interfaceHTML += `
          <p style="text-align:center; font-weight:bold; color:#7f8c8d; margin-bottom:10px;">Elegí el resultado correcto:</p>
          <div class="btn-grid-porcentaje">
            ${ej.opciones.map(op => `<button class="ficha-tetris" onclick="window.checkOpcion('${op}')">${op}</button>`).join('')}
          </div>`;
      }

      contenedor.innerHTML = getProgresoHTML() + estilosImpacto + // Usar TIEMPO_POR_EJERCICIO
        '<div class="header-juego">' + crearHTMLCronometro(TIEMPO_DEFECTO) + '<div class="puntaje">⭐ ' + puntaje + '</div></div>' +
        interfaceHTML;

      // Funciones de validación
      window.checkSigno = function(s) {
        if (s === ej.signo) {
          if (!esNivel1) reproducirSonido('exito');
          if (esNivel1) {
            procesarAcierto();
          } else {
            document.querySelector('.grid-signos').classList.add('oculto');
            document.getElementById('paso-valor').classList.remove('oculto');
            document.getElementById('input-valor').focus();
          }
        } else {
          procesarError(ej.explicacion);
        }
      };

      window.checkValor = function() {
        const v = parseInt(document.getElementById('input-valor').value);
        if (v === Math.abs(ej.valor)) {
          procesarAcierto();
        } else {
          procesarError(`Casi... el valor absoluto era ${Math.abs(ej.valor)}`);
        }
      };

      window.checkOpcion = function(op) {
        const correcta = ej.valor === null ? "No real" : String(ej.valor);
        if (op === correcta) {
          procesarAcierto();
        } else {
          procesarError(ej.explicacion);
        }
      };

      function procesarAcierto() {
        aciertos++; comboActual++;
        if (tiempoExtraUsado === 0) {
          puntaje += 20;
          mostrarMensaje('¡Impacto certero! +5 Bonus', 'exito');
        } else {
          puntaje += 15;
          mostrarMensaje('¡Impacto certero!', 'exito');
        }
        const el = document.querySelector('.expresion-impacto');
        const rect = el.getBoundingClientRect();
        crearParticulas(rect.left + rect.width/2, rect.top + rect.height/2, '#ffc107');
        const nivelCompleto = actProgreso(true);
        setTimeout(() => {
          ejActual++;
          if (ejActual < ejercicios.length && !nivelCompleto) renderizarEjercicio();
          else mostrarPantallaFinal(contenedor, 'zona_impacto', curso, puntaje, aciertos, ejActual, erroresPorTema);
        }, 1500);
      }

      function procesarError(msg) {
        reproducirSonido('error');
        comboActual = 0;
        mostrarMensaje(msg, 'error');
        erroresPorTema[ej.tipo === 'raiz' ? 'Radicación' : (ej.tipo === 'potencia' ? 'Potenciación' : 'Regla de Signos')] = (erroresPorTema[ej.tipo] || 0) + 1;
        actProgreso(false);
        setTimeout(() => {
          ejActual++;
          if (ejActual < ejercicios.length) renderizarEjercicio();
          else mostrarPantallaFinal(contenedor, 'zona_impacto', curso, puntaje, aciertos, ejActual, erroresPorTema);
        }, 2500);
      }

      iniciarCronometro(TIEMPO_POR_EJERCICIO, () => {
        procesarError("¡Se acabó el tiempo!");
      });
    }
    renderizarEjercicio();

  // ── CÁLCULOS COMBINADOS (Fracciones y Enteros) ─────────────
  } else if (dataCompleta.juego === 'calculos_combinados') {
    const esModuloFracciones = idJuego === 'combinados_fracciones';
    let ejActual = 0, puntaje = 0, aciertos = 0;

    function renderizarEjercicio() {
      const ej = ejercicios[ejActual];

      const estilosCalc = `<style>
        .combinado-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
          border-radius: 20px; padding: 28px 24px; text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 2px solid rgba(255,255,255,0.9); margin-bottom: 20px;
        }
        .combinado-num { 
          font-size: 0.8rem; font-weight: 700; color: #95a5a6; 
          text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;
        }
        .combinado-expr {
          font-size: 2rem; font-weight: 800; color: #2c3e50;
          line-height: 1.4; margin: 12px 0;
          font-family: 'Courier New', monospace;
          word-break: break-word;
        }
        .combinado-nivel {
          display: inline-block;
          background: ${ej.dificultad === 1 ? 'linear-gradient(135deg,#2ecc71,#1abc9c)' : ej.dificultad === 2 ? 'linear-gradient(135deg,#f39c12,#e67e22)' : 'linear-gradient(135deg,#e74c3c,#c0392b)'};
          color: white; font-size: 0.75rem; font-weight: 900;
          padding: 3px 12px; border-radius: 20px; letter-spacing: 1px;
        }
        .combinado-instruccion {
          background: rgba(255, 243, 205, 0.9); border: 2px dashed #ffca28;
          border-radius: 14px; padding: 14px; margin-bottom: 20px;
          font-size: 0.95rem; color: #7f5200; font-weight: 600; text-align: center;
        }
        .combinado-input-wrap {
          display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;
        }
        .combinado-input {
          width: 160px; text-align: center; font-size: 1.6rem; font-weight: 800;
          border: 4px solid #3498db; border-radius: 14px; padding: 12px;
          font-family: 'Outfit', sans-serif; margin: 0;
          transition: border-color 0.3s ease;
        }
        .combinado-input:focus { border-color: #ff9800; outline: none; }

        /* Recordatorio Jerarquía */
        .recordatorio-wrap {
          margin-top: 20px;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid rgba(52, 152, 219, 0.3);
        }
        .recordatorio-toggle {
          width: 100%; background: rgba(52, 152, 219, 0.12);
          border: none; padding: 12px 16px; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem;
          color: #2980b9; text-align: left; display: flex; 
          justify-content: space-between; align-items: center;
          transition: background 0.2s ease;
        }
        .recordatorio-toggle:hover { background: rgba(52, 152, 219, 0.2); }
        .recordatorio-toggle .arr { transition: transform 0.3s ease; font-size: 1rem; }
        .recordatorio-toggle.abierto .arr { transform: rotate(180deg); }
        .recordatorio-body {
          display: none; padding: 16px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(6px);
          animation: fadeDown 0.25s ease;
        }
        .recordatorio-body.visible { display: block; }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .jerarquia-lista { list-style: none; padding: 0; margin: 0 0 12px; }
        .jerarquia-lista li {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.06);
          font-size: 0.9rem; color: #2c3e50;
        }
        .jerarquia-lista li:last-child { border-bottom: none; }
        .jer-num {
          background: linear-gradient(135deg, #ff9800, #ff5722);
          color: white; font-weight: 900; font-size: 0.75rem;
          min-width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .signos-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px; margin-top: 4px;
        }
        .signo-pill {
          background: rgba(255,255,255,0.8); border-radius: 10px;
          padding: 8px 10px; text-align: center;
          font-weight: 700; font-size: 0.9rem; border: 2px solid;
        }
        .signo-pos { border-color: #2ecc71; color: #1a8a50; }
        .signo-neg { border-color: #e74c3c; color: #c0392b; }
        .recordatorio-title { font-weight: 800; font-size: 0.85rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; margin-top: 8px; }
      </style>`;

      const nivelLabel = ej.dificultad === 1 ? '⭐ Nivel Básico' : ej.dificultad === 2 ? '⭐⭐ Nivel Medio' : '⭐⭐⭐ Nivel Avanzado';
      const instruccion = esModuloFracciones
        ? '📓 Resolvé en tu carpeta, paso a paso.<br>Escribí el resultado como <strong>fracción</strong> (ej: <code>3/4</code>) o entero.'
        : '📓 Resolvé en tu carpeta, paso a paso.<br>Escribí el resultado final (puede ser negativo, ej: <code>-12</code>).';

      const cheatSheetHTML = esModuloFracciones ? `
        <div class="recordatorio-wrap">
          <button class="recordatorio-toggle" onclick="window.toggleRecordatorio(this)">
            📋 Recordatorio: Jerarquía y Reglas &nbsp;<span class="arr">▼</span>
          </button>
          <div class="recordatorio-body" id="recordatorio-body">
            <p class="recordatorio-title">📌 Orden de Operaciones (de 1° a 4°)</p>
            <ol class="jerarquia-lista">
              <li><span class="jer-num">1</span><span><strong>( ) Paréntesis</strong> — Resolvé primero lo que está adentro</span></li>
              <li><span class="jer-num">2</span><span><strong>Potencias y Raíces</strong> — (ej: (1/2)² = 1/4 &nbsp;|&nbsp; √(1/4) = 1/2)</span></li>
              <li><span class="jer-num">3</span><span><strong>× Multiplicación y ÷ División</strong> — de izquierda a derecha</span></li>
              <li><span class="jer-num">4</span><span><strong>+ Suma y − Resta</strong> — de izquierda a derecha</span></li>
            </ol>
            <p class="recordatorio-title">🔢 Potencias de Fracciones</p>
            <ol class="jerarquia-lista">
              <li><span class="jer-num">★</span><span><strong>(a/b)²</strong> = a² / b² &nbsp;→ &nbsp;(2/3)² = 4/9</span></li>
              <li><span class="jer-num">★</span><span><strong>√(a/b)</strong> = √a / √b &nbsp;→ &nbsp;√(4/9) = 2/3</span></li>
              <li><span class="jer-num">★</span><span><strong>(a/b)⁻¹</strong> = b/a (invertís) &nbsp;→ &nbsp;(1/3)⁻¹ = 3</span></li>
            </ol>
          </div>
        </div>` : `
        <div class="recordatorio-wrap">
          <button class="recordatorio-toggle" onclick="window.toggleRecordatorio(this)">
            📋 Recordatorio: Jerarquía y Regla de Signos &nbsp;<span class="arr">▼</span>
          </button>
          <div class="recordatorio-body" id="recordatorio-body">
            <p class="recordatorio-title">📌 Orden de Operaciones (de 1° a 4°)</p>
            <ol class="jerarquia-lista">
              <li><span class="jer-num">1</span><span><strong>( ) Paréntesis</strong> — Resolvé primero lo que está adentro</span></li>
              <li><span class="jer-num">2</span><span><strong>Potencias y Raíces</strong> — (ej: (-3)² = 9 &nbsp;|&nbsp; ∛(-8) = -2)</span></li>
              <li><span class="jer-num">3</span><span><strong>× Multiplicación y ÷ División</strong> — de izquierda a derecha</span></li>
              <li><span class="jer-num">4</span><span><strong>+ Suma y − Resta</strong> — de izquierda a derecha</span></li>
            </ol>
            <p class="recordatorio-title">⚡ Regla de Signos (× y ÷)</p>
            <div class="signos-grid">
              <div class="signo-pill signo-pos">(+) × (+) = <strong>+</strong></div>
              <div class="signo-pill signo-neg">(+) × (−) = <strong>−</strong></div>
              <div class="signo-pill signo-neg">(−) × (+) = <strong>−</strong></div>
              <div class="signo-pill signo-pos">(−) × (−) = <strong>+</strong></div>
            </div>
            <p class="recordatorio-title" style="margin-top:12px;">🔢 Potencias con base negativa</p>
            <ol class="jerarquia-lista">
              <li><span class="jer-num">★</span><span><strong>Exponente PAR</strong> → resultado <strong style="color:#27ae60">positivo</strong> &nbsp;|&nbsp; (-3)² = +9</span></li>
              <li><span class="jer-num">★</span><span><strong>Exponente IMPAR</strong> → resultado <strong style="color:#e74c3c">negativo</strong> &nbsp;|&nbsp; (-2)³ = -8</span></li>
              <li><span class="jer-num">★</span><span><strong>Raíz de negativo</strong> solo existe si es ∛ (raíz cúbica) &nbsp;|&nbsp; ∛(-27) = -3</span></li>
            </ol>
          </div>
        </div>`;

      contenedor.innerHTML = getProgresoHTML() + estilosCalc +
        `<div style="text-align:right; color:#95a5a6; font-size:0.85rem; margin-bottom:10px;">
          Ejercicio ${ejActual + 1} / ${ejercicios.length} &nbsp;|&nbsp; ⭐ ${puntaje} pts
        </div>
        <div class="combinado-card">
          <div class="combinado-num">Cálculo Combinado</div>
          <div class="combinado-expr">${ej.expresion}</div>
          <span class="combinado-nivel">${nivelLabel}</span>
        </div>
        <div class="combinado-instruccion">${instruccion}</div>
        <div class="combinado-input-wrap">
          <input type="text" id="input-combinado" class="combinado-input" 
            placeholder="?" autocomplete="off" autocorrect="off" spellcheck="false">
          <button onclick="window.verificarCombinado()" style="width:auto; padding:16px 28px; font-size:1.1rem;">
            ✅ Verificar
          </button>
        </div>
        <div style="text-align:center; margin-top:16px;">
          <button class="secundario" onclick="window.saltarCombinado()" 
            style="width:auto; padding:10px 20px; font-size:0.9rem; opacity:0.8;">
            ⏭️ No sé / Saltar
          </button>
        </div>
        ${cheatSheetHTML}`;

      window.toggleRecordatorio = function(btn) {
        btn.classList.toggle('abierto');
        const body = document.getElementById('recordatorio-body');
        if (body) body.classList.toggle('visible');
      };

      setTimeout(() => { const inp = document.getElementById('input-combinado'); if (inp) inp.focus(); }, 100);

      document.getElementById('input-combinado').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') window.verificarCombinado();
      });

      window.verificarCombinado = function() {
        const inp = document.getElementById('input-combinado');
        if (!inp) return;
        const respAlumno = inp.value.trim().replace(/\s+/g, '');
        if (!respAlumno) { mostrarMensaje('Escribí una respuesta primero ✏️', 'error'); return; }

        let esCorrecta = false;
        try {
          if (esModuloFracciones) {
            esCorrecta = sonEquivalentes(respAlumno, ej.respuesta);
          } else {
            esCorrecta = parseInt(respAlumno) === parseInt(ej.respuesta);
          }
        } catch(err) {
          esCorrecta = respAlumno === String(ej.respuesta);
        }

        const tema = esModuloFracciones ? 'Fracciones Combinadas' : 'Enteros Combinados';
        if (esCorrecta) {
          aciertos++; comboActual++;
          puntaje += 20;
          reproducirSonido('encaje');
          const rect = inp.getBoundingClientRect();
          crearParticulas(rect.left + rect.width / 2, rect.top + rect.height / 2, '#2ecc71');
          mostrarMensaje('¡Cálculo correcto! 🎯', 'exito');
          actProgreso(true);
        } else {
          comboActual = 0;
          puntaje = Math.max(0, puntaje - 5);
          reproducirSonido('error');
          mostrarMensaje('Incorrecto. La respuesta era: ' + ej.respuesta, 'error');
          erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
          actProgreso(false);
        }

        setTimeout(() => {
          ejActual++;
          if (ejActual < ejercicios.length) renderizarEjercicio();
          else mostrarPantallaFinal(contenedor, idJuego, curso, puntaje, aciertos, ejActual, erroresPorTema);
        }, 2000);
      };

      window.saltarCombinado = function() {
        comboActual = 0;
        const tema = esModuloFracciones ? 'Fracciones Combinadas' : 'Enteros Combinados';
        erroresPorTema[tema] = (erroresPorTema[tema] || 0) + 1;
        actProgreso(false);
        mostrarMensaje('Saltado. La respuesta era: ' + ej.respuesta, 'error');
        setTimeout(() => {
          ejActual++;
          if (ejActual < ejercicios.length) renderizarEjercicio();
          else mostrarPantallaFinal(contenedor, idJuego, curso, puntaje, aciertos, ejActual, erroresPorTema);
        }, 2000);
      };
    }
    renderizarEjercicio();
  }
}

function crearParticulas(x, y, color) {
  const multiplicador = Math.min(3, 1 + (comboActual * 0.5));
  const cantidad = Math.floor(6 * multiplicador);
  for (let i = 0; i < cantidad; i++) {
    const p = document.createElement('div');
    p.className = 'particula';
    p.style.background = color;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    const angulo = Math.random() * Math.PI * 2;
    const dist = (20 + Math.random() * 40) * multiplicador;
    p.style.setProperty('--dx', (Math.cos(angulo) * dist) + 'px');
    p.style.setProperty('--dy', (Math.sin(angulo) * dist) + 'px');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

function lanzarBilletes() {
  reproducirSonido('caja');
  const emojis = ['💵', '💸', '💰', '🪙'];
  for (let i = 0; i < 40; i++) {
    const b = document.createElement('div');
    b.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    b.style.cssText = `
      position: fixed;
      bottom: -50px;
      left: ${Math.random() * 100}vw;
      font-size: ${Math.random() * 20 + 24}px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      animation: volar-billete ${Math.random() * 2 + 3}s linear forwards;
      animation-delay: ${Math.random() * 3}s;
    `;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 7000);
  }
  
  if (!document.getElementById('style-billetes')) {
    const s = document.createElement('style');
    s.id = 'style-billetes';
    s.textContent = `
      @keyframes volar-billete {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}

function lanzarConfeti() {
  reproducirSonido('fanfarria');
  const colores = ['#ff9800', '#ff4757', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f'];
  for (let i = 0; i < 150; i++) {
    const c = document.createElement('div');
    c.style.cssText = `
      position: fixed;
      top: -20px;
      left: ${Math.random() * 100}vw;
      width: ${Math.random() * 10 + 6}px;
      height: ${Math.random() * 18 + 8}px;
      background-color: ${colores[Math.floor(Math.random() * colores.length)]};
      z-index: 10000;
      pointer-events: none;
      opacity: 1;
      transform: rotate(${Math.random() * 360}deg);
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: caer-confeti ${Math.random() * 2 + 2.5}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      animation-delay: ${Math.random() * 1.5}s;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 6000);
  }
  
  if (!document.getElementById('style-confeti')) {
    const s = document.createElement('style');
    s.id = 'style-confeti';
    s.textContent = `
      @keyframes caer-confeti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(120vh) rotate(1080deg); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── Mensaje flotante ───────────────────────────────────────────
function mostrarMensaje(texto, tipo) {
  const container = document.getElementById('msj-container');
  if (!container) return;

  let textoFinal = texto;
  if (tipo === 'exito' && comboActual > 1) {
    textoFinal += ` ¡Combo x${comboActual}! 🔥`;
  }

  if (tipo === 'error') {
    trackMP('game_error', { 'mensaje_error': texto });
  }

  container.textContent = textoFinal;
  container.className = 'notificacion-toast visible ' + tipo;

  reproducirSonido(tipo);

  if (window.msjTimeout) clearTimeout(window.msjTimeout);
  window.msjTimeout = setTimeout(() => {
    container.classList.remove('visible');
  }, 2500);
}

window.cambiarSigno = function(id, signo) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = el.value;
  if (signo === '-') {
    if (!val.startsWith('-')) el.value = '-' + val;
  } else {
    if (val.startsWith('-')) el.value = val.substring(1);
  }
  el.focus();
};

window.cambiarUsuario = function() {
  localStorage.removeItem('mateplay_nombre');
  const inputNombre = document.getElementById('input-nombre-menu');
  if (inputNombre) {
    inputNombre.value = '';
    validarMenu();
    mostrarMensaje('Nombre borrado. ¡Ingresá uno nuevo!', 'exito');
  }
};

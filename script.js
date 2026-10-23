'use strict';

const $ = id => document.getElementById(id);

// ======================================
// 1. TEMAS DE LA CREDENCIAL
// ======================================

const themes = [
  {
    name: 'Rosa',
    accent: '#f65ac5',
    bg1: '#401c49',
    bg2: '#170d2c',
    panel: '#512950',
    footer: '#502b59',
    text: '#ffffff',
    secondary: '#ffd2f0'
  },
  {
    name: 'Celeste',
    accent: '#47d9ff',
    bg1: '#e0faff',
    bg2: '#8bd8f2',
    panel: '#c6f0fc',
    footer: '#b4e5f6',
    text: '#103d68',
    secondary: '#145d83'
  },
  {
    name: 'Violeta',
    accent: '#a877ff',
    bg1: '#30205a',
    bg2: '#100e2d',
    panel: '#35285e',
    footer: '#382b68',
    text: '#ffffff',
    secondary: '#dfcaff'
  },
  {
    name: 'Verde',
    accent: '#48e6ac',
    bg1: '#e2fff0',
    bg2: '#90e4c0',
    panel: '#cbf5df',
    footer: '#b4e9d0',
    text: '#14533e',
    secondary: '#226d52'
  },
  {
    name: 'Naranja',
    accent: '#ffae4f',
    bg1: '#fff0d5',
    bg2: '#ffc17d',
    panel: '#ffe2b8',
    footer: '#ffdaaa',
    text: '#693d16',
    secondary: '#86531f'
  },
  {
    name: 'Coral',
    accent: '#ff6a79',
    bg1: '#ffe8e7',
    bg2: '#ffa9ae',
    panel: '#ffd2d3',
    footer: '#ffc2c5',
    text: '#702b3b',
    secondary: '#944254'
  }
];

const colors = themes.map(t => t.accent);

const state = {
  alias: '',
  role: '',
  accent: colors[0]
};

function currentTheme() {
  return themes.find(t => t.accent === state.accent) || themes[0];
}

// ======================================
// 2. VARIABLES GENERALES
// ======================================

let photo = null;
let stream = null;

const video = $('camera');

// ======================================
// 3. ACTUALIZAR LA CREDENCIAL
// ======================================

function render() {
  state.alias = state.alias.slice(0, 30);

  $('displayAlias').textContent =
    state.alias.trim() || 'TU NOMBRE';

  $('displayRole').textContent =
    state.role.trim() || 'TU PROFESIÓN O GRUPO';

  const theme = currentTheme();
  const card = $('card');

  card.style.setProperty('--accent', theme.accent);
  card.style.setProperty('--bg1', theme.bg1);
  card.style.setProperty('--bg2', theme.bg2);
  card.style.setProperty('--panel', theme.panel);
  card.style.setProperty('--footer', theme.footer);
  card.style.setProperty('--card-text', theme.text);
  card.style.setProperty('--card-secondary', theme.secondary);

  document.querySelectorAll('.swatch').forEach(btn => {
    btn.classList.toggle(
      'active',
      btn.dataset.color === state.accent
    );
  });
}

// ======================================
// 4. BOTONES DE TEMAS
// ======================================

for (const theme of themes) {
  const btn = document.createElement('button');

  btn.className = 'swatch';
  btn.type = 'button';
  btn.style.background = theme.accent;
  btn.dataset.color = theme.accent;
  btn.title = theme.name;

  btn.setAttribute(
    'aria-label',
    'Elegir tema ' + theme.name
  );

  btn.onclick = () => {
    state.accent = theme.accent;
    render();
  };

  $('palette').append(btn);
}

// ======================================
// 5. NOMBRE Y PROFESIÓN
// ======================================

for (const id of ['alias', 'role']) {
  $(id).addEventListener('input', e => {
    state[id] = e.target.value;
    render();
  });
}

// ======================================
// 6. CÁMARA
// ======================================

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.srcObject = null;
  $('capture').disabled = true;
  $('cameraModal').hidden = true;
}

$('closeCamera').onclick = stopCamera;

$('cameraModal').addEventListener('click', e => {
  if (e.target === $('cameraModal')) {
    stopCamera();
  }
});

$('startCamera').onclick = async () => {
  try {
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'La cámara requiere HTTPS o localhost.'
      );
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });

    $('cameraModal').hidden = false;

    video.srcObject = stream;

    await video.play();

    $('capture').disabled = false;

    $('status').textContent =
      'Cámara lista. Tocá Capturar foto.';

  } catch (e) {
    stopCamera();

    $('status').textContent =
      'No se pudo abrir la cámara. ' + e.message;
  }
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ======================================
// 7. CAPTURAR FOTO
// ======================================

$('capture').onclick = async () => {
  if (!stream || !video.videoWidth) return;

  const btn = $('capture');
  btn.disabled = true;

  for (let n = 3; n >= 1; n--) {
    $('countdown').hidden = false;
    $('countdown').textContent = n;

    await wait(650);
  }

  $('countdown').textContent = '✦';

  await wait(200);

  $('countdown').hidden = true;

  if (!stream) return;

  const canvas = document.createElement('canvas');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');

  // Efecto espejo para cámara frontal
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(video, 0, 0);

  setPhoto(canvas.toDataURL('image/jpeg', 0.93));

  stopCamera();
};

// ======================================
// 8. SUBIR FOTO DESDE GALERÍA
// ======================================

$('upload').onchange = e => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    $('status').textContent =
      'Seleccioná una imagen válida.';
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    stopCamera();
    setPhoto(reader.result);
  };

  reader.readAsDataURL(file);
};

function setPhoto(src) {
  photo = src;

  $('avatar').src = src;
  $('avatar').style.display = 'block';

  $('loading').hidden = true;

  $('status').textContent =
    '¡Foto lista! Personalizá y descargá tu credencial.';
}

// ======================================
// 9. REINICIAR
// ======================================

$('reset').onclick = () => {
  stopCamera();

  photo = null;

  state.alias = '';
  state.role = '';
  state.accent = colors[0];

  $('alias').value = '';
  $('role').value = '';
  $('upload').value = '';

  $('avatar').removeAttribute('src');
  $('avatar').style.display = 'none';

  $('loading').hidden = false;

  $('status').textContent =
    'Listo para la próxima persona.';

  render();
};

// ======================================
// 10. FUNCIONES PARA DIBUJAR
// ======================================

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () =>
      reject(new Error('No se pudo abrir la foto'));

    img.src = url;
  });
}

function cover(ctx, img, x, y, w, h) {
  const scale = Math.max(
    w / img.width,
    h / img.height
  );

  const iw = img.width * scale;
  const ih = img.height * scale;

  ctx.drawImage(
    img,
    x + (w - iw) / 2,
    y + (h - ih) / 2,
    iw,
    ih
  );
}

// ======================================
// 11. GENERAR CREDENCIAL PNG
// ======================================

async function drawCard() {
  if (!photo) {
    throw new Error(
      'Primero sacate o subí una foto.'
    );
  }

  const theme = currentTheme();

  const canvas = document.createElement('canvas');

  canvas.width = 900;
  canvas.height = 1320;

  const c = canvas.getContext('2d');

  // FONDO DEGRADADO DEL TEMA
  const bg = c.createLinearGradient(
    0, 0, 900, 1320
  );

  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(1, theme.bg2);

  c.fillStyle = bg;
  c.fillRect(0, 0, 900, 1320);

  // BORDE
  c.strokeStyle = theme.accent;
  c.lineWidth = 9;
  c.strokeRect(22, 22, 856, 1276);

  // ENCABEZADO
  c.textAlign = 'center';

  c.fillStyle = theme.secondary;
  c.font = 'bold 25px Arial';

  c.fillText(
    'INSTITUTO DE EDUCACIÓN SUPERIOR SAN PÍO DE PIETRELCINA',
    450, 95, 790
  );

  c.fillStyle = theme.text;
  c.font = 'bold 55px Arial';

  c.fillText(
    'FERIA DE CIENCIAS 2026',
    450, 167, 790
  );

  c.textAlign = 'left';

  // PANEL DE FOTOGRAFÍA
  roundRect(
    c, 65, 205, 770, 715, 28,
    theme.panel
  );

  const img = await loadImage(photo);

  c.save();

  c.beginPath();
  c.roundRect(92, 228, 716, 665, 20);
  c.clip();

  cover(c, img, 92, 228, 716, 665);

  c.restore();

  // BORDE DE LA FOTO
  c.strokeStyle = theme.accent;
  c.lineWidth = 6;
  c.strokeRect(92, 228, 716, 665);

  // NOMBRE
  const alias =
    state.alias.trim() || 'TU NOMBRE';

  c.fillStyle = theme.text;

  c.font = `bold ${
    alias.length > 17 ? 42 : 56
  }px Arial`;

  c.fillText(alias, 70, 1030, 750);

  // PROFESIÓN O GRUPO
  c.fillStyle = theme.secondary;
  c.font = 'bold 27px Arial';

  c.fillText(
    state.role.trim() || 'TU PROFESIÓN O GRUPO',
    70, 1080, 750
  );

//   // PANEL INFERIOR
//   roundRect(
//     c, 65, 1110, 770, 135, 18,
//     theme.footer
//   );

//   c.fillStyle = theme.text;
//   c.font = 'bold 25px Arial';

//   c.fillText(
//     '¡YO PARTICIPÉ EN LA FERIA DE CIENCIAS 2026!',
//     93, 1159, 720
//   );

//   // NOMBRE DE LA CARRERA
//   c.fillStyle = theme.secondary;
//   c.font = 'bold 26px Arial';

//   c.fillText(
//     'TECNICATURA SUPERIOR EN',
//     93, 1190, 720
//   );

//   c.fillText(
//     'DESARROLLO DE SOFTWARE',
//     93, 1219, 720
//   );

//   // LEMA
//   c.fillStyle = theme.secondary;
//   c.font = 'bold 17px Arial';

//   c.fillText(
//     'LO QUE IMAGINÁS, PODÉS PROGRAMARLO.',
//     93, 1241, 720
//   );

  // =====================================
  // PANEL INFERIOR DE LA CREDENCIAL
  // =====================================

  // =====================================
  // PANEL INFERIOR DE LA CREDENCIAL
  // =====================================

  // Fondo del recuadro
  roundRect(
    c, 65, 1100, 770, 170, 18,
    theme.footer
  );

  // CENTRAR TODOS LOS TEXTOS
  c.textAlign = 'center';

  // Participación en la feria
  c.fillStyle = theme.text;
  c.font = 'bold 23px Arial';

  c.fillText(
    '¡YO PARTICIPÉ EN LA FERIA DE CIENCIAS 2026!',
    450, 1140, 710
  );

  // Nombre de la carrera
  c.fillStyle = theme.text;
  c.font = 'bold 26px Arial';

  c.fillText(
    'TECNICATURA SUPERIOR EN',
    450, 1180, 710
  );

  c.fillText(
    'DESARROLLO DE SOFTWARE',
    450, 1210, 710
  );

  // Lema
  c.fillStyle = theme.secondary;
  c.font = 'bold 19px Arial';

  c.fillText(
    'LO QUE IMAGINÁS, PODÉS PROGRAMARLO.',
    450, 1247, 710
  );

  // Recuadro más alto para que entre todo
//   roundRect(
//     c, 65, 1100, 770, 170, 18,
//     theme.footer
//   );

//   c.textAlign = 'left';

//   // Participación en la feria
//   c.fillStyle = theme.text;
//   c.font = 'bold 23px Arial';

//   c.fillText(
//     '¡YO PARTICIPÉ EN LA FERIA DE CIENCIAS 2026!',
//     93, 1140, 710
//   );

//   // Nombre de la carrera
//   c.fillStyle = theme.text;
//   c.font = 'bold 26px Arial';

//   c.fillText(
//     'TECNICATURA SUPERIOR EN',
//     93, 1180, 710
//   );

//   c.fillText(
//     'DESARROLLO DE SOFTWARE',
//     93, 1210, 710
//   );

//   // Lema, con separación inferior
//   c.fillStyle = theme.secondary;
//   c.font = 'bold 19px Arial';

//   c.fillText(
//     'LO QUE IMAGINÁS, PODÉS PROGRAMARLO.',
//     93, 1247, 710
//   );

  return canvas;
}

// ======================================
// 12. DESCARGAR CREDENCIAL
// ======================================

$('download').onclick = async () => {
  try {
    $('status').textContent =
      'Preparando credencial…';

    const canvas = await drawCard();

    const a = document.createElement('a');

    a.download =
      'Foto_Digital_San_Pio_2026.png';

    a.href = canvas.toDataURL('image/png');

    a.click();

    $('status').textContent =
      '¡Credencial descargada!';

  } catch (e) {
    $('status').textContent = e.message;
    console.error(e);
  }
};

// ======================================
// 13. GENERAR QR DEL SITIO
// ======================================

function shareUrl() {
  if (location.protocol === 'file:') {
    return null;
  }

  const url = new URL(location.href);

  url.search = '';
  url.hash = '';

  return url.href;
}

function initQR() {
  const url = shareUrl();

  if (!url) {
    $('qrHelp').textContent =
      'El QR aparecerá cuando publiques el sitio.';
    return;
  }

  if (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
  ) {
    $('qrHelp').textContent =
      'Publicá la web en GitHub Pages para usar el QR desde otro celular.';
    return;
  }

  const qr =
    'https://api.qrserver.com/v1/create-qr-code/' +
    '?size=280x280&data=' +
    encodeURIComponent(url);

  $('qr').src = qr;
  $('qr').hidden = false;
  $('copy').hidden = false;

  $('qrHelp').textContent =
    'Escaneá con tu celular para crear tu credencial.';
}

// ======================================
// 14. COPIAR ENLACE
// ======================================

$('copy').onclick = async () => {
  const url = shareUrl();

  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);

    $('copy').textContent =
      '✓ Enlace copiado';

  } catch {
    prompt('Copiá el enlace:', url);
  }
};

// ======================================
// 15. INICIAR SISTEMA
// ======================================

window.addEventListener('pagehide', stopCamera);

render();
initQR();

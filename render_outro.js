const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Configurar ruta del binario estático de FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Constantes de Renderizado
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 60;
const DURATION = 6; // 6 segundos
const TOTAL_FRAMES = DURATION * FPS + 1; // 361 frames (de t=0.0s a t=6.0s inclusive)
const TMP_DIR = path.join(__dirname, 'tmp_frames');
const OUTPUT_DIR = path.join(__dirname, 'output_local');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'outro_rescuechip.mp4');

// Ruta absoluta del generador HTML de outro
const HTML_PATH = 'file:///' + path.resolve(__dirname, '..', 'Videos Ads', 'outro_generator.html').replace(/\\/g, '/');

// Asegurar existencia de directorios
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Función principal
async function main() {
  console.log('==================================================');
  console.log('   RESCUECHIP - AUTOMATED TIKTOK OUTRO RENDERER   ');
  console.log('==================================================');
  console.log(`Resolución: ${WIDTH}x${HEIGHT} | FPS: ${FPS} | Duración: ${DURATION}s`);
  console.log(`Frames a capturar: ${TOTAL_FRAMES}`);
  console.log(`Ruta origen: ${HTML_PATH}`);
  console.log(`Ruta destino: ${OUTPUT_FILE}`);
  console.log('--------------------------------------------------');

  let browser = null;

  try {
    // 1. Lanzar Puppeteer
    console.log('Lanzando navegador...');
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          `--window-size=${WIDTH},${HEIGHT}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--hide-scrollbars'
        ],
        defaultViewport: {
          width: WIDTH,
          height: HEIGHT,
          deviceScaleFactor: 1
        }
      });
    } catch (err) {
      console.warn('Fallo al lanzar Puppeteer ordinario. Intentando con Puppeteer-Core y Chrome local...');
      const puppeteerCore = require('puppeteer-core');
      
      // Rutas típicas de Chrome en Windows
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
      ];
      
      let executablePath = null;
      for (const p of chromePaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
      
      if (!executablePath) {
        throw new Error('No se encontró una instalación local de Google Chrome. Por favor, instala Chrome o puppeteer de forma manual.');
      }
      
      console.log(`Chrome local encontrado en: ${executablePath}`);
      browser = await puppeteerCore.launch({
        executablePath: executablePath,
        headless: 'new',
        args: [
          `--window-size=${WIDTH},${HEIGHT}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--hide-scrollbars'
        ],
        defaultViewport: {
          width: WIDTH,
          height: HEIGHT,
          deviceScaleFactor: 1
        }
      });
    }

    const page = await browser.newPage();
    
    // Configurar viewport robusto
    await page.setViewport({
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1
    });

    // 2. Cargar página
    console.log('Abriendo HTML de animación...');
    await page.goto(HTML_PATH, { waitUntil: 'networkidle0' });

    // 3. Esperar que carguen fuentes
    console.log('Esperando carga completa de fuentes...');
    await page.evaluateHandle('document.fonts.ready');

    // 4. Activar modo grabación limpia (oculta controles y centra lienzo 1080x1920)
    console.log('Configurando lienzo en Modo Grabación...');
    await page.evaluate(() => {
      if (typeof window.toggleRecordingMode === 'function') {
        window.toggleRecordingMode(true);
      } else {
        document.body.classList.add('recording-mode');
      }
    });

    const canvasHandle = await page.$('#canvas');
    if (!canvasHandle) {
      throw new Error('No se pudo encontrar el contenedor de animación (#canvas) en el documento.');
    }

    // 5. Capturar fotogramas
    console.log('Iniciando captura de fotogramas deterministas...');
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const t = i / FPS;
      
      // Actualizar posición de la animación
      await page.evaluate((tVal) => {
        if (typeof window.setTime === 'function') {
          window.setTime(tVal);
        } else {
          const canvasEl = document.getElementById('canvas');
          if (canvasEl) canvasEl.style.setProperty('--time', tVal.toString());
        }
      }, t);

      // Esperar brevemente a que el navegador refresque la propiedad de estilos
      await new Promise(r => setTimeout(r, 5));

      const fileName = `frame_${String(i).padStart(3, '0')}.png`;
      const filePath = path.join(TMP_DIR, fileName);

      // Screenshot exclusivo del canvas (evita controles laterales)
      await canvasHandle.screenshot({
        path: filePath,
        type: 'png',
        omitBackground: true
      });

      if (i % 30 === 0 || i === TOTAL_FRAMES - 1) {
        console.log(`  [Frame ${String(i).padStart(3, '0')}/${TOTAL_FRAMES - 1}] Capturado en t = ${t.toFixed(2)}s`);
      }
    }

    console.log('Captura de fotogramas completada.');
    
    // Cerrar navegador antes de iniciar FFmpeg para liberar memoria
    await browser.close();
    browser = null;

    // 6. Compilar video con FFmpeg
    console.log('Lanzando proceso de compilación con FFmpeg...');
    await compileVideo();

  } catch (error) {
    console.error('ERROR CRÍTICO EN EL PROCESO:', error);
    process.exit(1);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    // 7. Limpieza
    cleanup();
  }
}

// Envoltura de fluent-ffmpeg en una Promesa
function compileVideo() {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(TMP_DIR, 'frame_%03d.png'))
      .inputFPS(FPS)
      .output(OUTPUT_FILE)
      .outputFPS(FPS)
      .videoCodec('libx264')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-crf 18',       // Factor de calidad excelente (18-23 es estándar, menor es mejor)
        '-preset slow'   // Compresión lenta para mejor compresión/calidad
      ])
      .on('start', (commandLine) => {
        console.log('-> Comando FFmpeg ejecutado:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`-> Procesando video: ${Math.round(progress.percent)}% completado.`);
        }
      })
      .on('end', () => {
        console.log('--------------------------------------------------');
        console.log('¡Video compilado con éxito!');
        
        if (fs.existsSync(OUTPUT_FILE)) {
          const stats = fs.statSync(OUTPUT_FILE);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`Resultado: ${OUTPUT_FILE}`);
          console.log(`Tamaño final: ${sizeMB} MB`);
        }
        console.log('==================================================');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error en el compilador de FFmpeg:', err);
        reject(err);
      })
      .run();
  });
}

// Eliminar directorio de frames temporales
function cleanup() {
  console.log('Iniciando limpieza de frames temporales...');
  try {
    if (fs.existsSync(TMP_DIR)) {
      const files = fs.readdirSync(TMP_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TMP_DIR, file));
      }
      fs.rmdirSync(TMP_DIR);
      console.log('Directorio temporal de frames eliminado con éxito.');
    }
  } catch (err) {
    console.error('Error al realizar la limpieza de frames:', err.message);
  }
}

// Ejecutar script
main();

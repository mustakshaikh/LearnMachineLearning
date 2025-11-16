const fileInput = document.getElementById('file-input');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');
const finalCanvas = document.getElementById('final-canvas');
const finalCtx = finalCanvas.getContext('2d');
const generateBtn = document.getElementById('generate');
const downloadBtn = document.getElementById('download');

const scaleInput = document.getElementById('scale');
const offsetXInput = document.getElementById('offset-x');
const offsetYInput = document.getElementById('offset-y');
const exposureInput = document.getElementById('exposure');

const DPI = 300;
const PHOTO_SIZE = 2 * DPI; // 600 px
const SHEET_WIDTH = 4 * DPI; // 1200 px
const SHEET_HEIGHT = 6 * DPI; // 1800 px

const state = {
  image: null,
  scale: parseFloat(scaleInput.value),
  offsetX: parseFloat(offsetXInput.value),
  offsetY: parseFloat(offsetYInput.value),
  exposure: parseFloat(exposureInput.value)
};

fileInput.addEventListener('change', handleFile);
[scaleInput, offsetXInput, offsetYInput, exposureInput].forEach((input) =>
  input.addEventListener('input', () => {
    state.scale = parseFloat(scaleInput.value);
    state.offsetX = parseFloat(offsetXInput.value);
    state.offsetY = parseFloat(offsetYInput.value);
    state.exposure = parseFloat(exposureInput.value);
    drawPreview();
  })
);

generateBtn.addEventListener('click', () => {
  generateSheet();
  downloadBtn.disabled = false;
});

downloadBtn.addEventListener('click', () => {
  const url = finalCanvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'us-passport-4x6.jpg';
  link.click();
});

function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const img = new Image();
    img.onload = () => {
      state.image = img;
      resetControls();
      drawPreview();
      generateBtn.disabled = false;
    };
    img.src = loadEvent.target.result;
  };
  reader.readAsDataURL(file);
}

function resetControls() {
  scaleInput.value = '1.1';
  offsetXInput.value = '0';
  offsetYInput.value = '0';
  exposureInput.value = '0';
  state.scale = parseFloat(scaleInput.value);
  state.offsetX = 0;
  state.offsetY = 0;
  state.exposure = 0;
}

function drawPreview() {
  const { width, height } = previewCanvas;
  previewCtx.save();
  previewCtx.clearRect(0, 0, width, height);
  previewCtx.fillStyle = '#ffffff';
  previewCtx.fillRect(0, 0, width, height);

  if (state.image) {
    renderPassportPhoto(previewCtx, width, height);
  } else {
    previewCtx.fillStyle = '#a8b1c7';
    previewCtx.font = '600 1.1rem Inter, system-ui';
    previewCtx.textAlign = 'center';
    previewCtx.fillText('Upload an image to begin', width / 2, height / 2);
  }

  drawGuides();
  previewCtx.restore();
}

function drawGuides() {
  const { width, height } = previewCanvas;
  previewCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  previewCtx.lineWidth = 4;
  previewCtx.strokeRect(10, 10, width - 20, height - 20);

  previewCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  previewCtx.lineWidth = 2;

  const eyeLineY = height - (1.25 * DPI);
  previewCtx.beginPath();
  previewCtx.moveTo(0, eyeLineY);
  previewCtx.lineTo(width, eyeLineY);
  previewCtx.stroke();

  const chinGuide = height - (1 * DPI);
  const crownGuide = height - (1.375 * DPI);
  [chinGuide, crownGuide].forEach((y) => {
    previewCtx.beginPath();
    previewCtx.moveTo(0, y);
    previewCtx.lineTo(width, y);
    previewCtx.stroke();
  });
}

function renderPassportPhoto(ctx, targetWidth, targetHeight, originX = 0, originY = 0) {
  if (!state.image) return;
  const { image, scale, offsetX, offsetY, exposure } = state;

  const baseScale = Math.max(targetWidth / image.width, targetHeight / image.height);
  const actualScale = baseScale * scale;
  const drawWidth = image.width * actualScale;
  const drawHeight = image.height * actualScale;

  const offsetXPixels = (offsetX / 100) * targetWidth;
  const offsetYPixels = (offsetY / 100) * targetHeight;

  const x = (targetWidth - drawWidth) / 2 + offsetXPixels;
  const y = (targetHeight - drawHeight) / 2 + offsetYPixels;

  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const offCtx = offscreen.getContext('2d');

  offCtx.fillStyle = '#ffffff';
  offCtx.fillRect(0, 0, targetWidth, targetHeight);

  offCtx.save();
  const brightness = Math.max(0.6, 1 + exposure / 100);
  offCtx.filter = `brightness(${brightness})`;
  offCtx.drawImage(image, x, y, drawWidth, drawHeight);
  offCtx.restore();

  const imageData = offCtx.getImageData(0, 0, targetWidth, targetHeight);
  const bgColor = estimateBackgroundColor(imageData);
  whitenBackground(imageData, bgColor);
  offCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(offscreen, originX, originY);
}

function estimateBackgroundColor(imageData) {
  const { data, width, height } = imageData;
  let r = 255;
  let g = 255;
  let b = 255;
  let count = 0;

  const sampleEdgePixel = (x, y) => {
    const idx = (y * width + x) * 4;
    const alpha = data[idx + 3];
    if (alpha > 200) {
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count += 1;
    }
  };

  const step = Math.max(1, Math.floor(Math.min(width, height) / 60));
  for (let x = 0; x < width; x += step) {
    sampleEdgePixel(x, 0);
    sampleEdgePixel(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    sampleEdgePixel(0, y);
    sampleEdgePixel(width - 1, y);
  }

  if (count === 0) return { r: 255, g: 255, b: 255 };
  return { r: r / count, g: g / count, b: b / count };
}

function whitenBackground(imageData, bgColor) {
  const { data } = imageData;
  const threshold = 45;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - bgColor.r;
    const dg = data[i + 1] - bgColor.g;
    const db = data[i + 2] - bgColor.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance < threshold) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
}

function generateSheet() {
  if (!state.image) return;
  finalCtx.save();
  finalCtx.clearRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      finalCtx.save();
      const originX = col * PHOTO_SIZE;
      const originY = row * PHOTO_SIZE;
      finalCtx.beginPath();
      finalCtx.rect(originX, originY, PHOTO_SIZE, PHOTO_SIZE);
      finalCtx.clip();
      renderPassportPhoto(finalCtx, PHOTO_SIZE, PHOTO_SIZE, originX, originY);
      finalCtx.restore();

      finalCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      finalCtx.lineWidth = 2;
      finalCtx.strokeRect(originX + 5, originY + 5, PHOTO_SIZE - 10, PHOTO_SIZE - 10);
    }
  }

  finalCtx.restore();
}

drawPreview();

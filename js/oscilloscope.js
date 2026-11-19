// Realistic Benchtop Digital Oscilloscope Engine (Clean Classic Waveforms)
export function initOscilloscope() {
  const canvas = document.getElementById("scope-canvas");
  if (!canvas) return { updateLanguage: () => {} };
  const ctx = canvas.getContext("2d");

  const timebaseInput = document.getElementById("scope-timebase");
  const timebaseVal = document.getElementById("scope-timebase-val");
  const gainInput = document.getElementById("scope-gain");
  const gainVal = document.getElementById("scope-gain-val");
  const holdBtn = document.getElementById("scope-hold-btn");
  const autoBtn = document.getElementById("scope-auto-btn");
  const trigStatus = document.getElementById("scope-trig-status");
  const presetSelect = document.getElementById("scope-preset");
  const pageSelect = document.getElementById("scope-page");
  const chBtns = document.querySelectorAll(".hw-ch-btn");
  const knobTime = document.getElementById("knob-time");
  const knobVolt = document.getElementById("knob-volt");

  let preset = "sine";
  let timebase = 1.0;
  let gain = 1.0;
  let held = false;
  let phase = 0;

  const chEnabled = [true, true, false, false];
  const colors = ["#facc15", "#22d3ee", "#e879f9", "#4ade80"]; // Keysight/Rigol classic CH1-CH4 colors

  const PRESET_META = {
    sine: { freq: "1.00 kHz", vpp: "3.30 Vpp", duty: "50.0%", timeDiv: "500 us/" },
    square: { freq: "10.0 kHz", vpp: "5.00 Vpp", duty: "50.0%", timeDiv: "50.0 us/" },
    triangle: { freq: "2.50 kHz", vpp: "2.40 Vpp", duty: "50.0%", timeDiv: "200 us/" },
    am: { freq: "455 kHz", vpp: "2.80 Vpp", duty: "MOD 75%", timeDiv: "1.00 ms/" },
  };

  function updateKnobs() {
    if (knobTime) {
      const deg = ((timebase - 0.4) / 2.1) * 240 - 120;
      knobTime.style.transform = `rotate(${deg}deg)`;
    }
    if (knobVolt) {
      const deg = ((gain - 0.5) / 1.1) * 240 - 120;
      knobVolt.style.transform = `rotate(${deg}deg)`;
    }
  }

  presetSelect.addEventListener("change", () => { preset = presetSelect.value; });
  pageSelect.addEventListener("change", () => {
    document.querySelectorAll("[data-panel]").forEach(panel => {
      panel.hidden = panel.dataset.panel !== pageSelect.value;
    });
  });

  chBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.ch, 10);
      chEnabled[idx] = !chEnabled[idx];
      btn.classList.toggle("active", chEnabled[idx]);
      btn.setAttribute("aria-pressed", String(chEnabled[idx]));
    });
  });

  timebaseInput?.addEventListener("input", () => {
    timebase = parseFloat(timebaseInput.value);
    if (timebaseVal) timebaseVal.textContent = `${timebase.toFixed(1)}x`;
    updateKnobs();
  });

  gainInput?.addEventListener("input", () => {
    gain = parseFloat(gainInput.value);
    if (gainVal) gainVal.textContent = `${gain.toFixed(1)}x`;
    updateKnobs();
  });

  holdBtn?.addEventListener("click", () => {
    held = !held;
    holdBtn.classList.toggle("stopped", held);
    holdBtn.setAttribute("aria-pressed", String(held));
    holdBtn.textContent = held ? "STOP" : "RUN";
    if (trigStatus) {
      trigStatus.textContent = held ? "STOP" : "TRIG'D";
      trigStatus.classList.toggle("stopped", held);
    }
  });

  autoBtn?.addEventListener("click", () => {
    timebase = 1.0;
    gain = 1.0;
    held = false;
    if (timebaseInput) timebaseInput.value = "1.0";
    if (gainInput) gainInput.value = "1.0";
    if (timebaseVal) timebaseVal.textContent = "1.0x";
    if (gainVal) gainVal.textContent = "1.0x";
    holdBtn?.classList.remove("stopped");
    holdBtn.setAttribute("aria-pressed", "false");
    if (holdBtn) holdBtn.textContent = "RUN";
    if (trigStatus) {
      trigStatus.textContent = "TRIG'D";
      trigStatus.classList.remove("stopped");
    }
    updateKnobs();
  });

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  new ResizeObserver(resize).observe(canvas.parentElement);

  function drawGraticule(w, h) {
    ctx.fillStyle = "#060b10";
    ctx.fillRect(0, 0, w, h);

    const cols = 10;
    const rows = 8;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
    ctx.lineWidth = 1;

    for (let i = 1; i < cols; i++) {
      const x = Math.round((w / cols) * i) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = Math.round((h / rows) * j) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center axes with fine ticks
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    const cx = w / 2;
    const cy = h / 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
  }

  function sampleWave(ch, xNorm, t) {
    const x = xNorm * Math.PI * 2 * (2.5 * timebase) + t * 2.2;
    if (preset === "sine") {
      if (ch === 0) return Math.sin(x) * 0.65;
      if (ch === 1) return Math.sin(x - Math.PI / 2) * 0.5;
      if (ch === 2) return Math.sin(x * 2) * 0.35;
      return Math.cos(x * 0.5) * 0.45;
    }
    if (preset === "square") {
      const s = Math.sin(x + ch * 0.8) >= 0 ? 1 : -1;
      const offset = (ch - 0.5) * 0.18;
      return s * 0.48 - offset;
    }
    if (preset === "triangle") {
      const p = ((x / (Math.PI * 2)) + ch * 0.25) % 1;
      const frac = p < 0 ? p + 1 : p;
      if (ch % 2 === 0) {
        return (frac < 0.5 ? frac * 4 - 1 : 3 - frac * 4) * 0.6;
      }
      return (frac * 2 - 1) * 0.52;
    }
    // AM modulated RF wave
    const env = 0.55 + 0.45 * Math.sin(x * 0.35);
    if (ch === 0) return env * Math.sin(x * 7.5) * 0.72;
    if (ch === 1) return env * 0.72;
    if (ch === 2) return -env * 0.72;
    return Math.sin(x * 0.35) * 0.4;
  }

  function drawMeasurements(w, h) {
    const m = PRESET_META[preset] || PRESET_META.sine;
    if (w < 260) {
      ctx.font = "9px monospace";
      ctx.fillStyle = colors[0];
      ctx.fillText(`${held ? "STOP" : "RUN"}   ${m.freq}`, w * 0.08, h - 6);
      return;
    }
    ctx.fillStyle = "rgba(6, 11, 16, 0.92)";
    ctx.fillRect(0, h - 26, w, 26);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, h - 26);
    ctx.lineTo(w, h - 26);
    ctx.stroke();

    ctx.font = "600 10.5px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#facc15";
    ctx.fillText(`CH1 ${m.vpp}`, 10, h - 9);

    if (w >= 400) {
      ctx.fillStyle = "#22d3ee";
      ctx.fillText(`FREQ ${m.freq}`, 118, h - 9);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(`DUTY ${m.duty}`, 232, h - 9);
    } else if (w >= 260) {
      ctx.fillStyle = "#22d3ee";
      ctx.fillText(m.freq, 112, h - 9);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "#4ade80";
    ctx.fillText(`H ${m.timeDiv}`, w - 10, h - 9);
    ctx.textAlign = "left";
  }

  let frame = null;
  function render() {
    frame = requestAnimationFrame(render);
    if (!held) phase += 0.014;

    const w = canvas.parentElement.clientWidth || 640;
    const h = canvas.parentElement.clientHeight || 300;
    drawGraticule(w, h);

    const plotH = h - (w < 260 ? 16 : 26);
    for (let ch = 0; ch < 4; ch++) {
      if (!chEnabled[ch]) continue;
      ctx.strokeStyle = colors[ch];
      ctx.lineWidth = w < 260 ? 1 : 1.5;
      ctx.shadowColor = colors[ch];
      ctx.shadowBlur = 0;
      ctx.beginPath();

      const steps = 260;
      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps;
        const x = xNorm * (w - 2) + 1;
        const val = sampleWave(ch, xNorm, phase) * gain;
        const y = Math.max(12, Math.min(plotH - 12, plotH / 2 - val * (plotH * 0.36)));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    drawMeasurements(w, h);
  }

  updateKnobs();
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && frame === null) render();
    else if (!entry.isIntersecting && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  }).observe(canvas);
  return { updateLanguage: () => {} };
}
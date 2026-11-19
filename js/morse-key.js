const symbols = {
  ".-":"A", "-...":"B", "-.-.":"C", "-..":"D", ".":"E", "..-.":"F", "--.":"G",
  "....":"H", "..":"I", ".---":"J", "-.-":"K", ".-..":"L", "--":"M", "-.":"N",
  "---":"O", ".--.":"P", "--.-":"Q", ".-.":"R", "...":"S", "-":"T", "..-":"U",
  "...-":"V", ".--":"W", "-..-":"X", "-.--":"Y", "--..":"Z",
  "-----":"0", ".----":"1", "..---":"2", "...--":"3", "....-":"4", ".....":"5",
  "-....":"6", "--...":"7", "---..":"8", "----.":"9",
  ".-.-.-":".", "--..--":",", "---...":":", "-.-.-.":";", "..--..":"?", "-..-.":"/",
  ".----.":"'", ".-..-.":'"', "-....-":"-", "-.--.":"(", "-.--.-":")",
  "-...-":"=", ".-.-.":"+", ".--.-.":"@", "...---...":"SOS",
};

export function initMorseKey({alwaysConnected = false} = {}) {
  const get = id => document.getElementById(id);
  const key = get("cw-key"), connect = get("cw-connect"), screen = get("cw-screen");
  const text = get("cw-text"), marks = get("cw-marks"), accessory = get("cw-accessory");
  const unit = 160;
  let paintKey, modelAttempted = false;
  let start, released, timer, dashTimer, source, pending = "", history = "", message = "", wordBreak = false;
  function draw(live = "") {
    marks.textContent = (history + pending + live).replaceAll(".", "·").replaceAll("-", "−");
    marks.scrollTop = marks.scrollHeight;
    text.textContent = message;
    text.scrollTop = text.scrollHeight;
  }
  function commit() {
    if (!pending) return;
    const symbol = symbols[pending];
    accessory.toggleAttribute("data-unreadable", !symbol);
    if (symbol) {
      message += (wordBreak ? " " : "") + symbol;
      wordBreak = false;
    }
    history += symbol ? `${pending} ` : `[${pending}] `;
    pending = "";
    draw();
  }
  function press(id) {
    if (alwaysConnected && screen.hidden) mode(true, false);
    if (screen.hidden || source !== undefined) return;
    start = performance.now();
    clearTimeout(timer);
    if (released !== undefined && start - released >= 3 * unit) commit();
    if (released !== undefined && start - released >= 7 * unit && history) {
      wordBreak = Boolean(message);
      history += "/ ";
    }
    released = undefined;
    source = id;
    key.setAttribute("aria-pressed", "true");
    paintKey?.(true);
    draw(".");
    dashTimer = setTimeout(() => draw("-"), 2 * unit);
  }
  function release(id) {
    if (id !== source || source === undefined) return;
    released = performance.now();
    pending += released - start >= 2 * unit ? "-" : ".";
    source = undefined;
    key.setAttribute("aria-pressed", "false");
    paintKey?.(false);
    clearTimeout(dashTimer);
    draw();
    timer = setTimeout(commit, 3 * unit);
  }
  function reset() {
    clearTimeout(timer); clearTimeout(dashTimer);
    released = source = undefined;
    history = pending = message = "";
    wordBreak = false;
    accessory.removeAttribute("data-unreadable");
    key.setAttribute("aria-pressed", "false");
    paintKey?.(false);
    draw();
  }
  async function loadModel() {
    if (modelAttempted) return;
    modelAttempted = true;
    const canvas = get("cw-key-model"), fallback = key.querySelector("span");
    try {
      const {createStraightKey} = await import("./straight-key.js");
      paintKey = createStraightKey(canvas);
      paintKey(source !== undefined);
      canvas.hidden = false; fallback.hidden = true;
    } catch (error) {
      console.error("CW key model could not initialize", error);
      canvas.hidden = true; fallback.hidden = false;
    }
  }
  function mode(on, focus = true) {
    if (alwaysConnected) {
      if (!on) { release(source); clearTimeout(timer); commit(); released = undefined; }
    } else {
      reset();
      if (on) loadModel();
    }
    screen.hidden = !on;
    accessory.hidden = !alwaysConnected && !on;
    for (const selector of [".scope-display", ".touch-strip", "#scope-hold-btn", "#scope-auto-btn"]) {
      document.querySelector(selector).hidden = on;
    }
    if (focus) (on ? key : connect).focus({preventScroll:true});
  }
  connect.addEventListener("click", () => mode(true));
  get("cw-unplug").addEventListener("click", () => mode(false));
  get("cw-clear").addEventListener("click", () => {reset(); key.focus({preventScroll:true});});
  key.addEventListener("pointerdown", e => {
    if (e.button !== 0 || !e.isPrimary) return;
    key.setPointerCapture(e.pointerId);
    press(e.pointerId);
  });
  for (const event of ["pointerup","lostpointercapture","pointercancel"]) {
    key.addEventListener(event, e => release(e.pointerId));
  }
  key.addEventListener("keydown", e => {
    if (!["Space","Enter"].includes(e.code)) return;
    e.preventDefault();
    if (!e.repeat) press(e.code);
  });
  key.addEventListener("keyup", e => { e.preventDefault(); release(e.code); });
  key.addEventListener("blur", () => release(source));
  window.addEventListener("blur", () => release(source));
  if (alwaysConnected) {
    mode(true, false);
    const nearby = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { nearby.disconnect(); loadModel(); }
    }, {rootMargin:"400px"});
    nearby.observe(key);
  }
}

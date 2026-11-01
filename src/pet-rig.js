/**
 * 小墨看板娘驱动层。
 *
 * 只需要两张 4:5 的透明 PNG：睁眼帧 + 闭眼帧。
 * 负责眨眼、呼吸、互动反馈；大动作（上下浮、走路、摇摆）仍然交给
 * style.css 里的 @keyframes，由 data-pet-state 驱动，互不干扰。
 */

const CANVAS_W = 520; // 舞台最大 260 CSS px 的 2 倍
const CANVAS_H = 650;
const BREATH_MS = 3600;
const CLOSED_MS = 110; // 闭眼停留时长
const BLINK_TAIL_MS = 110; // 一次眨眼结束后的收尾
const BLINK_GAP_MS = [2000, 7000];
const DOUBLE_BLINK_CHANCE = 0.15;
const BOUNCE_MS = 320;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`pet rig: cannot load ${src}`));
    img.src = src;
  });
}

export function createPetRig({ canvas, image, placeholder }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // 调试用：?rig=blink 固定闭眼，?rig=still 静止不眨眼
  const debugMode = new URLSearchParams(window.location.search).get("rig");
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  let frames = null;
  let petState = "idle";
  let rafId = 0;
  let startedAt = 0;
  let nextBlinkAt = 0;
  let blinkStartedAt = -1;
  let doubleBlinkQueued = false;
  let bounceAt = -1;
  let visible = true;
  let destroyed = false;

  const frozen = debugMode === "blink" || debugMode === "still" || prefersReducedMotion;
  const staticFrame = debugMode === "blink" ? "blink" : "open";

  function scheduleNextBlink(from) {
    nextBlinkAt = from + randomBetween(...BLINK_GAP_MS);
  }

  function draw(now) {
    if (!frames) return;

    const blinking = !frozen && blinkStartedAt >= 0 && now - blinkStartedAt < CLOSED_MS;
    let source = blinking ? frames.blink : frames.open;
    if (frozen) source = staticFrame === "blink" ? frames.blink : frames.open;

    // 呼吸：3.6s 一个周期，幅度 0.6%，锚定底部
    let scaleY = 1;
    if (!frozen) {
      const phase = ((now - startedAt) % BREATH_MS) / BREATH_MS;
      const breath = Math.sin(phase * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
      scaleY = 1 + breath * 0.006;
    }

    // 互动时轻轻弹一下
    if (bounceAt >= 0) {
      const progress = (now - bounceAt) / BOUNCE_MS;
      if (progress >= 1) {
        bounceAt = -1;
      } else {
        scaleY *= 1 + Math.sin(Math.PI * progress) * 0.03;
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.translate(CANVAS_W / 2, CANVAS_H);
    ctx.scale(1, scaleY);
    ctx.translate(-CANVAS_W / 2, -CANVAS_H);
    ctx.drawImage(source, 0, 0, CANVAS_W, CANVAS_H);
  }

  function tick(now) {
    if (destroyed) return;

    if (!frozen) {
      if (blinkStartedAt < 0 && now >= nextBlinkAt) {
        blinkStartedAt = now;
        doubleBlinkQueued = Math.random() < DOUBLE_BLINK_CHANCE;
      }
      if (blinkStartedAt >= 0 && now - blinkStartedAt >= CLOSED_MS + BLINK_TAIL_MS) {
        blinkStartedAt = -1;
        if (doubleBlinkQueued) {
          doubleBlinkQueued = false;
          nextBlinkAt = now + 90;
        } else {
          scheduleNextBlink(now);
        }
      }
    }

    draw(now);
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (destroyed || rafId || !frames) return;
    const now = performance.now();
    if (!startedAt) startedAt = now;
    if (!nextBlinkAt) scheduleNextBlink(now);
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  async function setSkin(skin) {
    const rig = skin?.rig;
    if (!rig?.open) throw new Error("pet rig: skin has no rig frames");
    const open = await loadImage(rig.open);
    const blink = rig.blink ? ((await loadImage(rig.blink).catch(() => null)) || open) : open;
    if (destroyed) return;

    frames = { open, blink };
    blinkStartedAt = -1;
    doubleBlinkQueued = false;
    bounceAt = -1;
    nextBlinkAt = 0;
    startedAt = 0;

    canvas.style.display = "block";
    if (image) {
      image.style.display = "none";
      image.removeAttribute("src");
    }
    if (placeholder) placeholder.style.display = "none";

    if (frozen) draw(performance.now());
    start();
  }

  function clear() {
    frames = null;
    stop();
    canvas.style.display = "none";
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }

  function setState(next) {
    if (next === petState) return;
    petState = next;
    if (next === "interact" && frames && !frozen) {
      bounceAt = performance.now();
      // 被戳一下就眨一下，反馈更明显
      if (blinkStartedAt < 0) blinkStartedAt = performance.now();
    }
  }

  function onVisibilityChange() {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  }

  let observer = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !document.hidden) start();
      else stop();
    });
    observer.observe(canvas);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  function destroy() {
    destroyed = true;
    stop();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  return { setSkin, setState, clear, destroy, get state() { return petState; } };
}

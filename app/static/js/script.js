(() => {
  const left = document.getElementById("agents-left");
  const sep = document.getElementById("agents-separator");

  if (!left || !sep) return;

  const min = 180;
  const max = 500;

  // restore width from cookie
  const m = document.cookie.match(/agents_left_width=(\d+)/);
  if (m) left.style.width = m[1] + "px";

  let dragging = false;

  sep.addEventListener("mousedown", () => {
    dragging = true;
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = "";
    document.cookie = `agents_left_width=${left.offsetWidth}; path=/; max-age=31536000`;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const w = Math.min(max, Math.max(min, e.clientX));
    left.style.width = w + "px";
  });

  // keyboard support
  sep.addEventListener("keydown", (e) => {
    const step = 10;
    let w = left.offsetWidth;

    if (e.key === "ArrowLeft") w -= step;
    if (e.key === "ArrowRight") w += step;

    w = Math.min(max, Math.max(min, w));
    left.style.width = w + "px";
    document.cookie = `agents_left_width=${w}; path=/; max-age=31536000`;
  });
})();

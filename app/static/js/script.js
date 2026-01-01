/* ========= VERTICAL SPLITTER ========= */
(() => {
  const left = document.getElementById("agents-left");
  const sep = document.getElementById("agents-separator");
  if (!left || !sep) return;

  const minLeft = 180;
  const minRight = 180;
  const sepWidth = sep.offsetWidth || 6;

  const saved = document.cookie.match(/agents_left_width=(\d+)/);
  if (saved) left.style.width = saved[1] + "px";

  let dragging = false;

  const setWidth = (w) => {
    const max = window.innerWidth - minRight - sepWidth;
    const v = Math.min(max, Math.max(minLeft, w));
    left.style.width = v + "px";
    document.cookie = `agents_left_width=${v}; path=/; max-age=31536000`;
  };

  sep.addEventListener("mousedown", () => {
    dragging = true;
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.cursor = "";
  });

  document.addEventListener("mousemove", (e) => {
    if (dragging) setWidth(e.clientX);
  });

  sep.addEventListener("keydown", (e) => {
    let w = left.offsetWidth;
    if (e.key === "ArrowLeft") w -= 10;
    if (e.key === "ArrowRight") w += 10;
    setWidth(w);
  });

  window.addEventListener("resize", () => {
    setWidth(left.offsetWidth);
  });
})();

/* ========= HORIZONTAL SPLITTER ========= */
(() => {
  const top = document.getElementById("agents-top");
  const sep = document.getElementById("agents-h-separator");
  if (!top || !sep) return;

  const minTop = 120;
  const minBottom = 120;
  const sepHeight = sep.offsetHeight || 6;

  const saved = document.cookie.match(/agents_top_height=(\d+)/);
  if (saved) top.style.height = saved[1] + "px";

  let dragging = false;

  const setHeight = (h) => {
    const topOffset = top.getBoundingClientRect().top;
    const max = window.innerHeight - topOffset - minBottom - sepHeight;
    const v = Math.min(max, Math.max(minTop, h));
    top.style.height = v + "px";
    document.cookie = `agents_top_height=${v}; path=/; max-age=31536000`;
  };

  sep.addEventListener("mousedown", () => {
    dragging = true;
    document.body.style.cursor = "row-resize";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.cursor = "";
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const topOffset = top.getBoundingClientRect().top;
    setHeight(e.clientY - topOffset);
  });

  sep.addEventListener("keydown", (e) => {
    let h = top.offsetHeight;
    if (e.key === "ArrowUp") h -= 10;
    if (e.key === "ArrowDown") h += 10;
    setHeight(h);
  });

  window.addEventListener("resize", () => {
    setHeight(top.offsetHeight);
  });
})();

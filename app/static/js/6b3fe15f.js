import { u as d, bl as f, r as p, w as S } from "./ec0ef80e.js";
import { getBaseUrl as C } from "./780fb64b.js";
function v(o, n) {
  return `wss://${C().split("://")[1]}/ws/${o}/?access_token=${n}`;
}
let c;
function W() {
  const o = d();
  if (c === void 0) {
    const t = v("dashinfo", o.token);
    c = f(t, { autoReconnect: !0 });
  }
  const { status: n, data: e, send: a, open: r, close: u } = c,
    s = p({ action: "", data: {} });
  S(e, (t) => {
    t && (s.value = JSON.parse(t));
  });
  function l() {
    (c = void 0), u();
  }
  return { status: n, data: s, send: a, open: r, close: l };
}
let i;
function k() {
  const o = d();
  if (i === void 0) {
    const t = v("trmmcli", o.token);
    i = f(t);
  }
  const { status: n, data: e, send: a, open: r, close: u } = i,
    s = p({ action: "", data: {} });
  S(e, (t) => {
    t && (s.value = JSON.parse(t));
  });
  function l() {
    (i = void 0), u();
  }
  return { status: n, data: s, send: a, open: r, close: l };
}
export { k as a, W as u };

import {
  N as c,
  a as e,
  b9 as f,
  b as l,
  d as i,
  h as u,
  aO as g,
  V as m,
  W as b,
  e as v,
  X as y,
} from "./ec0ef80e.js";
import { o as d } from "./6269c2dc.js";
function p(t, a = 2e3) {
  c.create({ type: "positive", message: t, timeout: a });
}
function q(t, a = 2e3) {
  c.create({ type: "negative", message: t, timeout: a });
}
function B(t, a = 2e3) {
  c.create({ type: "warning", message: t, timeout: a });
}
const n = "/core";
async function S(t = {}) {
  const { data: a } = await e.get(`${n}/dashinfo/`, { params: t });
  return a;
}
async function x(t = {}) {
  try {
    const { data: a } = await e.get(`${n}/customfields/`, { params: t });
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function L(t = {}) {
  const { data: a } = await e.get(`${n}/urlaction/`, { params: t });
  return a;
}
async function U(t) {
  const { data: a } = await e.post(`${n}/urlaction/`, t);
  return a;
}
async function A(t, a) {
  const { data: o } = await e.put(`${n}/urlaction/${t}/`, a);
  return o;
}
async function Q(t) {
  const { data: a } = await e.delete(`${n}/urlaction/${t}/`);
  return a;
}
async function R(t) {
  const { data: a } = await e.patch(`${n}/urlaction/run/`, t);
  d(a);
}
async function k(t) {
  const { data: a } = await e.post(`${n}/urlaction/run/test/`, t);
  return a;
}
async function C() {
  const t = await e.post(`${n}/webtermperms/`);
  return { message: t.data, status: t.status };
}
function D() {
  const t = f.resolve("/webterm").href;
  d(t, void 0, {
    popup: !0,
    scrollbars: !1,
    location: !1,
    status: !1,
    toolbar: !1,
    menubar: !1,
    width: 1280,
    height: 720,
  });
}
async function W(t) {
  const { data: a } = await e.post(`${n}/openai/generate/`, t);
  return a;
}
const $ = ["top", "middle", "bottom"];
var N = l({
    name: "QBadge",
    props: {
      color: String,
      textColor: String,
      floating: Boolean,
      transparent: Boolean,
      multiLine: Boolean,
      outline: Boolean,
      rounded: Boolean,
      label: [Number, String],
      align: { type: String, validator: (t) => $.includes(t) },
    },
    setup(t, { slots: a }) {
      const o = i(() =>
          t.align !== void 0 ? { verticalAlign: t.align } : null
        ),
        r = i(() => {
          const s = (t.outline === !0 && t.color) || t.textColor;
          return (
            `q-badge flex inline items-center no-wrap q-badge--${
              t.multiLine === !0 ? "multi" : "single"
            }-line` +
            (t.outline === !0
              ? " q-badge--outline"
              : t.color !== void 0
              ? ` bg-${t.color}`
              : "") +
            (s !== void 0 ? ` text-${s}` : "") +
            (t.floating === !0 ? " q-badge--floating" : "") +
            (t.rounded === !0 ? " q-badge--rounded" : "") +
            (t.transparent === !0 ? " q-badge--transparent" : "")
          );
        });
      return () =>
        u(
          "div",
          {
            class: r.value,
            style: o.value,
            role: "status",
            "aria-label": t.label,
          },
          g(a.default, t.label !== void 0 ? [t.label] : [])
        );
    },
  }),
  T = l({
    name: "QSpace",
    setup() {
      const t = u("div", { class: "q-space" });
      return () => t;
    },
  }),
  I = l({
    name: "QBar",
    props: { ...m, dense: Boolean },
    setup(t, { slots: a }) {
      const {
          proxy: { $q: o },
        } = y(),
        r = b(t, o),
        s = i(
          () =>
            `q-bar row no-wrap items-center q-bar--${
              t.dense === !0 ? "dense" : "standard"
            }  q-bar--${r.value === !0 ? "dark" : "light"}`
        );
      return () => u("div", { class: s.value, role: "toolbar" }, v(a.default));
    },
  });
export {
  I as Q,
  T as a,
  N as b,
  C as c,
  q as d,
  L as e,
  x as f,
  B as g,
  W as h,
  k as i,
  A as j,
  Q as k,
  S as l,
  p as n,
  D as o,
  R as r,
  U as s,
};

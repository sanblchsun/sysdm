import {
  b as y,
  V as k,
  W as L,
  d as f,
  h as q,
  e as E,
  X as x,
  r as w,
  aS as D,
  P as c,
  R as v,
  az as P,
  a0 as h,
  a3 as b,
  aT as _,
  aU as O,
  aV as T,
  Z as R,
} from "./ec0ef80e.js";
const B = ["ul", "ol"];
var Q = y({
  name: "QList",
  props: {
    ...k,
    bordered: Boolean,
    dense: Boolean,
    separator: Boolean,
    padding: Boolean,
    tag: { type: String, default: "div" },
  },
  setup(e, { slots: r }) {
    const t = x(),
      n = L(e, t.proxy.$q),
      i = f(() => (B.includes(e.tag) ? null : "list")),
      a = f(
        () =>
          "q-list" +
          (e.bordered === !0 ? " q-list--bordered" : "") +
          (e.dense === !0 ? " q-list--dense" : "") +
          (e.separator === !0 ? " q-list--separator" : "") +
          (n.value === !0 ? " q-list--dark" : "") +
          (e.padding === !0 ? " q-list--padding" : "")
      );
    return () => q(e.tag, { class: a.value, role: i.value }, E(r.default));
  },
});
function C() {
  const e = w(!D.value);
  return (
    e.value === !1 &&
      c(() => {
        e.value = !0;
      }),
    { isHydrated: e }
  );
}
const z = typeof ResizeObserver < "u",
  m =
    z === !0
      ? {}
      : {
          style:
            "display:block;position:absolute;top:0;left:0;right:0;bottom:0;height:100%;width:100%;overflow:hidden;pointer-events:none;z-index:-1;",
          url: "about:blank",
        };
var S = y({
  name: "QResizeObserver",
  props: { debounce: { type: [String, Number], default: 100 } },
  emits: ["resize"],
  setup(e, { emit: r }) {
    let t = null,
      n,
      i = { width: -1, height: -1 };
    function a(o) {
      o === !0 || e.debounce === 0 || e.debounce === "0"
        ? d()
        : t === null && (t = setTimeout(d, e.debounce));
    }
    function d() {
      if ((t !== null && (clearTimeout(t), (t = null)), n)) {
        const { offsetWidth: o, offsetHeight: s } = n;
        (o !== i.width || s !== i.height) &&
          ((i = { width: o, height: s }), r("resize", i));
      }
    }
    const { proxy: l } = x();
    if (((l.trigger = a), z === !0)) {
      let o;
      const s = (u) => {
        (n = l.$el.parentNode),
          n
            ? ((o = new ResizeObserver(a)), o.observe(n), d())
            : u !== !0 &&
              h(() => {
                s(!0);
              });
      };
      return (
        c(() => {
          s();
        }),
        v(() => {
          t !== null && clearTimeout(t),
            o !== void 0 &&
              (o.disconnect !== void 0 ? o.disconnect() : n && o.unobserve(n));
        }),
        P
      );
    } else {
      let u = function () {
          t !== null && (clearTimeout(t), (t = null)),
            s !== void 0 &&
              (s.removeEventListener !== void 0 &&
                s.removeEventListener("resize", a, b.passive),
              (s = void 0));
        },
        p = function () {
          u(),
            n?.contentDocument &&
              ((s = n.contentDocument.defaultView),
              s.addEventListener("resize", a, b.passive),
              d());
        };
      const { isHydrated: o } = C();
      let s;
      return (
        c(() => {
          h(() => {
            (n = l.$el), n && p();
          });
        }),
        v(u),
        () => {
          if (o.value === !0)
            return q("object", {
              class: "q--avoid-card-border",
              style: m.style,
              tabindex: -1,
              type: "text/html",
              data: m.url,
              "aria-hidden": "true",
              onLoad: p,
            });
        }
      );
    }
  },
});
function g(e) {
  if (e === !1) return 0;
  if (e === !0 || e === void 0) return 1;
  const r = parseInt(e, 10);
  return isNaN(r) ? 0 : r;
}
var K = _({
  name: "close-popup",
  beforeMount(e, { value: r }) {
    const t = {
      depth: g(r),
      handler(n) {
        t.depth !== 0 &&
          setTimeout(() => {
            const i = O(e);
            i !== void 0 && T(i, n, t.depth);
          });
      },
      handlerKey(n) {
        R(n, 13) === !0 && t.handler(n);
      },
    };
    (e.__qclosepopup = t),
      e.addEventListener("click", t.handler),
      e.addEventListener("keyup", t.handlerKey);
  },
  updated(e, { value: r, oldValue: t }) {
    r !== t && (e.__qclosepopup.depth = g(r));
  },
  beforeUnmount(e) {
    const r = e.__qclosepopup;
    e.removeEventListener("click", r.handler),
      e.removeEventListener("keyup", r.handlerKey),
      delete e.__qclosepopup;
  },
});
export { K as C, Q, S as a };

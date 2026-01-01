import {
  b as L,
  aZ as j,
  a_ as $,
  b2 as O,
  d as c,
  h as d,
  e as A,
  X as R,
  a$ as M,
  b3 as K,
  a9 as N,
  w as C,
  P as U,
  R as V,
  az as _,
  ag as D,
  a3 as I,
  b4 as X,
  b5 as Z,
  r as m,
  aS as k,
  a6 as P,
  b6 as x,
  b7 as G,
  aO as J,
} from "./ec0ef80e.js";
import { a as E } from "./bf4a8154.js";
var ne = L({
  name: "QPageContainer",
  setup(e, { slots: b }) {
    const {
        proxy: { $q: n },
      } = R(),
      o = j(M, $);
    if (o === $)
      return console.error("QPageContainer needs to be child of QLayout"), $;
    O(K, !0);
    const a = c(() => {
      const r = {};
      return (
        o.header.space === !0 && (r.paddingTop = `${o.header.size}px`),
        o.right.space === !0 &&
          (r[
            `padding${n.lang.rtl === !0 ? "Left" : "Right"}`
          ] = `${o.right.size}px`),
        o.footer.space === !0 && (r.paddingBottom = `${o.footer.size}px`),
        o.left.space === !0 &&
          (r[
            `padding${n.lang.rtl === !0 ? "Right" : "Left"}`
          ] = `${o.left.size}px`),
        r
      );
    });
    return () =>
      d("div", { class: "q-page-container", style: a.value }, A(b.default));
  },
});
const { passive: F } = I,
  Y = ["both", "horizontal", "vertical"];
var ee = L({
    name: "QScrollObserver",
    props: {
      axis: {
        type: String,
        validator: (e) => Y.includes(e),
        default: "vertical",
      },
      debounce: [String, Number],
      scrollTarget: N,
    },
    emits: ["scroll"],
    setup(e, { emit: b }) {
      const n = {
        position: { top: 0, left: 0 },
        direction: "down",
        directionChanged: !1,
        delta: { top: 0, left: 0 },
        inflectionPoint: { top: 0, left: 0 },
      };
      let o = null,
        a,
        r;
      C(
        () => e.scrollTarget,
        () => {
          f(), p();
        }
      );
      function u() {
        o?.();
        const v = Math.max(0, X(a)),
          h = Z(a),
          s = { top: v - n.position.top, left: h - n.position.left };
        if (
          (e.axis === "vertical" && s.top === 0) ||
          (e.axis === "horizontal" && s.left === 0)
        )
          return;
        const w =
          Math.abs(s.top) >= Math.abs(s.left)
            ? s.top < 0
              ? "up"
              : "down"
            : s.left < 0
            ? "left"
            : "right";
        (n.position = { top: v, left: h }),
          (n.directionChanged = n.direction !== w),
          (n.delta = s),
          n.directionChanged === !0 &&
            ((n.direction = w), (n.inflectionPoint = n.position)),
          b("scroll", { ...n });
      }
      function p() {
        (a = D(r, e.scrollTarget)), a.addEventListener("scroll", l, F), l(!0);
      }
      function f() {
        a !== void 0 && (a.removeEventListener("scroll", l, F), (a = void 0));
      }
      function l(v) {
        if (v === !0 || e.debounce === 0 || e.debounce === "0") u();
        else if (o === null) {
          const [h, s] = e.debounce
            ? [setTimeout(u, e.debounce), clearTimeout]
            : [requestAnimationFrame(u), cancelAnimationFrame];
          o = () => {
            s(h), (o = null);
          };
        }
      }
      const { proxy: y } = R();
      return (
        C(() => y.$q.lang.rtl, u),
        U(() => {
          (r = y.$el.parentNode), p();
        }),
        V(() => {
          o?.(), f();
        }),
        Object.assign(y, { trigger: l, getPosition: () => n }),
        _
      );
    },
  }),
  ie = L({
    name: "QLayout",
    props: {
      container: Boolean,
      view: {
        type: String,
        default: "hhh lpr fff",
        validator: (e) => /^(h|l)h(h|r) lpr (f|l)f(f|r)$/.test(e.toLowerCase()),
      },
      onScroll: Function,
      onScrollHeight: Function,
      onResize: Function,
    },
    setup(e, { slots: b, emit: n }) {
      const {
          proxy: { $q: o },
        } = R(),
        a = m(null),
        r = m(o.screen.height),
        u = m(e.container === !0 ? 0 : o.screen.width),
        p = m({ position: 0, direction: "down", inflectionPoint: 0 }),
        f = m(0),
        l = m(k.value === !0 ? 0 : P()),
        y = c(
          () =>
            "q-layout q-layout--" +
            (e.container === !0 ? "containerized" : "standard")
        ),
        v = c(() =>
          e.container === !1 ? { minHeight: o.screen.height + "px" } : null
        ),
        h = c(() =>
          l.value !== 0
            ? { [o.lang.rtl === !0 ? "left" : "right"]: `${l.value}px` }
            : null
        ),
        s = c(() =>
          l.value !== 0
            ? {
                [o.lang.rtl === !0 ? "right" : "left"]: 0,
                [o.lang.rtl === !0 ? "left" : "right"]: `-${l.value}px`,
                width: `calc(100% + ${l.value}px)`,
              }
            : null
        );
      function w(t) {
        if (e.container === !0 || document.qScrollPrevented !== !0) {
          const i = {
            position: t.position.top,
            direction: t.direction,
            directionChanged: t.directionChanged,
            inflectionPoint: t.inflectionPoint.top,
            delta: t.delta.top,
          };
          (p.value = i), e.onScroll !== void 0 && n("scroll", i);
        }
      }
      function W(t) {
        const { height: i, width: g } = t;
        let S = !1;
        r.value !== i &&
          ((S = !0),
          (r.value = i),
          e.onScrollHeight !== void 0 && n("scrollHeight", i),
          q()),
          u.value !== g && ((S = !0), (u.value = g)),
          S === !0 && e.onResize !== void 0 && n("resize", t);
      }
      function B({ height: t }) {
        f.value !== t && ((f.value = t), q());
      }
      function q() {
        if (e.container === !0) {
          const t = r.value > f.value ? P() : 0;
          l.value !== t && (l.value = t);
        }
      }
      let z = null;
      const Q = {
        instances: {},
        view: c(() => e.view),
        isContainer: c(() => e.container),
        rootRef: a,
        height: r,
        containerHeight: f,
        scrollbarWidth: l,
        totalWidth: c(() => u.value + l.value),
        rows: c(() => {
          const t = e.view.toLowerCase().split(" ");
          return {
            top: t[0].split(""),
            middle: t[1].split(""),
            bottom: t[2].split(""),
          };
        }),
        header: x({ size: 0, offset: 0, space: !1 }),
        right: x({ size: 300, offset: 0, space: !1 }),
        footer: x({ size: 0, offset: 0, space: !1 }),
        left: x({ size: 300, offset: 0, space: !1 }),
        scroll: p,
        animate() {
          z !== null
            ? clearTimeout(z)
            : document.body.classList.add("q-body--layout-animate"),
            (z = setTimeout(() => {
              (z = null),
                document.body.classList.remove("q-body--layout-animate");
            }, 155));
        },
        update(t, i, g) {
          Q[t][i] = g;
        },
      };
      if ((O(M, Q), P() > 0)) {
        let g = function () {
            (t = null), i.classList.remove("hide-scrollbar");
          },
          S = function () {
            if (t === null) {
              if (i.scrollHeight > o.screen.height) return;
              i.classList.add("hide-scrollbar");
            } else clearTimeout(t);
            t = setTimeout(g, 300);
          },
          T = function (H) {
            t !== null && H === "remove" && (clearTimeout(t), g()),
              window[`${H}EventListener`]("resize", S);
          },
          t = null;
        const i = document.body;
        C(() => (e.container !== !0 ? "add" : "remove"), T),
          e.container !== !0 && T("add"),
          G(() => {
            T("remove");
          });
      }
      return () => {
        const t = J(b.default, [d(ee, { onScroll: w }), d(E, { onResize: W })]),
          i = d(
            "div",
            {
              class: y.value,
              style: v.value,
              ref: e.container === !0 ? void 0 : a,
              tabindex: -1,
            },
            t
          );
        return e.container === !0
          ? d("div", { class: "q-layout-container overflow-hidden", ref: a }, [
              d(E, { onResize: B }),
              d("div", { class: "absolute-full", style: h.value }, [
                d("div", { class: "scroll", style: s.value }, [i]),
              ]),
            ])
          : i;
      };
    },
  });
export { ne as Q, ie as a, ee as b };

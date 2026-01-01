import {
  Y as bl,
  r as I,
  Z as Ot,
  $ as Oe,
  a0 as se,
  a1 as We,
  w as X,
  P as wl,
  R as Se,
  X as Te,
  a2 as nt,
  a3 as ot,
  a4 as pt,
  a5 as xl,
  a6 as Cl,
  b as Be,
  a7 as Bt,
  a8 as _e,
  a9 as Ft,
  aa as Lt,
  d as x,
  ab as It,
  ac as Pt,
  ad as Rt,
  ae as _t,
  af as Dt,
  ag as Wt,
  h as q,
  ah as $t,
  e as jt,
  ai as ce,
  V as Kt,
  aj as pl,
  W as Nt,
  ak as kl,
  al as Vl,
  t as De,
  am as ql,
  U as Tl,
  an as El,
  ao as Al,
  ap as Ml,
  aq as kt,
  ar as Hl,
  as as zl,
  at as Ol,
  au as Bl,
  av as at,
  aw as Qt,
  ax as Ut,
  ay as Xt,
  az as Fl,
  aA as Ll,
  aB as Il,
  aC as Pl,
  aD as Rl,
  aE as _l,
  aF as Dl,
  aG as Wl,
  aH as $l,
  aI as Vt,
  aJ as He,
  aK as qt,
  aL as Ve,
  aM as jl,
  z as Kl,
  aN as Nl,
  aO as Ql,
} from "./ec0ef80e.js";
import { a as Ul, b as Xl, Q as Yl } from "./8ccb46ba.js";
function it() {
  if (window.getSelection !== void 0) {
    const e = window.getSelection();
    e.empty !== void 0
      ? e.empty()
      : e.removeAllRanges !== void 0 &&
        (e.removeAllRanges(),
        bl.is.mobile !== !0 && e.addRange(document.createRange()));
  } else document.selection !== void 0 && document.selection.empty();
}
const Yt = {
    target: { type: [Boolean, String, Element], default: !0 },
    noParentEvent: Boolean,
  },
  Gl = { ...Yt, contextMenu: Boolean };
function Gt({ showing: e, avoidEmit: l, configureAnchorEl: n }) {
  const { props: i, proxy: r, emit: u } = Te(),
    f = I(null);
  let v = null;
  function g(a) {
    return f.value === null
      ? !1
      : a === void 0 || a.touches === void 0 || a.touches.length <= 1;
  }
  const S = {};
  n === void 0 &&
    (Object.assign(S, {
      hide(a) {
        r.hide(a);
      },
      toggle(a) {
        r.toggle(a), (a.qAnchorHandled = !0);
      },
      toggleKey(a) {
        Ot(a, 13) === !0 && S.toggle(a);
      },
      contextClick(a) {
        r.hide(a),
          Oe(a),
          se(() => {
            r.show(a), (a.qAnchorHandled = !0);
          });
      },
      prevent: Oe,
      mobileTouch(a) {
        if ((S.mobileCleanup(a), g(a) !== !0)) return;
        r.hide(a), f.value.classList.add("non-selectable");
        const y = a.target;
        We(S, "anchor", [
          [y, "touchmove", "mobileCleanup", "passive"],
          [y, "touchend", "mobileCleanup", "passive"],
          [y, "touchcancel", "mobileCleanup", "passive"],
          [f.value, "contextmenu", "prevent", "notPassive"],
        ]),
          (v = setTimeout(() => {
            (v = null), r.show(a), (a.qAnchorHandled = !0);
          }, 300));
      },
      mobileCleanup(a) {
        f.value.classList.remove("non-selectable"),
          v !== null && (clearTimeout(v), (v = null)),
          e.value === !0 && a !== void 0 && it();
      },
    }),
    (n = function (a = i.contextMenu) {
      if (i.noParentEvent === !0 || f.value === null) return;
      let y;
      a === !0
        ? r.$q.platform.is.mobile === !0
          ? (y = [[f.value, "touchstart", "mobileTouch", "passive"]])
          : (y = [
              [f.value, "mousedown", "hide", "passive"],
              [f.value, "contextmenu", "contextClick", "notPassive"],
            ])
        : (y = [
            [f.value, "click", "toggle", "passive"],
            [f.value, "keyup", "toggleKey", "passive"],
          ]),
        We(S, "anchor", y);
    }));
  function s() {
    nt(S, "anchor");
  }
  function C(a) {
    for (f.value = a; f.value.classList.contains("q-anchor--skip"); )
      f.value = f.value.parentNode;
    n();
  }
  function p() {
    if (i.target === !1 || i.target === "" || r.$el.parentNode === null)
      f.value = null;
    else if (i.target === !0) C(r.$el.parentNode);
    else {
      let a = i.target;
      if (typeof i.target == "string")
        try {
          a = document.querySelector(i.target);
        } catch {
          a = void 0;
        }
      a != null
        ? ((f.value = a.$el || a), n())
        : ((f.value = null),
          console.error(`Anchor: target "${i.target}" not found`));
    }
  }
  return (
    X(
      () => i.contextMenu,
      (a) => {
        f.value !== null && (s(), n(a));
      }
    ),
    X(
      () => i.target,
      () => {
        f.value !== null && s(), p();
      }
    ),
    X(
      () => i.noParentEvent,
      (a) => {
        f.value !== null && (a === !0 ? s() : n());
      }
    ),
    wl(() => {
      p(),
        l !== !0 &&
          i.modelValue === !0 &&
          f.value === null &&
          u("update:modelValue", !1);
    }),
    Se(() => {
      v !== null && clearTimeout(v), s();
    }),
    { anchorEl: f, canShow: g, anchorEvents: S }
  );
}
function Jt(e, l) {
  const n = I(null);
  let i;
  function r(v, g) {
    const S = `${g !== void 0 ? "add" : "remove"}EventListener`,
      s = g !== void 0 ? g : i;
    v !== window && v[S]("scroll", s, ot.passive),
      window[S]("scroll", s, ot.passive),
      (i = g);
  }
  function u() {
    n.value !== null && (r(n.value), (n.value = null));
  }
  const f = X(
    () => e.noParentEvent,
    () => {
      n.value !== null && (u(), l());
    }
  );
  return (
    Se(f),
    { localScrollTarget: n, unconfigureScrollTarget: u, changeScrollEvent: r }
  );
}
const { notPassiveCapture: $e } = ot,
  ge = [];
function je(e) {
  const l = e.target;
  if (
    l === void 0 ||
    l.nodeType === 8 ||
    l.classList.contains("no-pointer-events") === !0
  )
    return;
  let n = pt.length - 1;
  for (; n >= 0; ) {
    const i = pt[n].$;
    if (i.type.name === "QTooltip") {
      n--;
      continue;
    }
    if (i.type.name !== "QDialog") break;
    if (i.props.seamless !== !0) return;
    n--;
  }
  for (let i = ge.length - 1; i >= 0; i--) {
    const r = ge[i];
    if (
      (r.anchorEl.value === null || r.anchorEl.value.contains(l) === !1) &&
      (l === document.body ||
        (r.innerRef.value !== null && r.innerRef.value.contains(l) === !1))
    )
      (e.qClickOutside = !0), r.onClickOutside(e);
    else return;
  }
}
function Zt(e) {
  ge.push(e),
    ge.length === 1 &&
      (document.addEventListener("mousedown", je, $e),
      document.addEventListener("touchstart", je, $e));
}
function Ke(e) {
  const l = ge.findIndex((n) => n === e);
  l !== -1 &&
    (ge.splice(l, 1),
    ge.length === 0 &&
      (document.removeEventListener("mousedown", je, $e),
      document.removeEventListener("touchstart", je, $e)));
}
let Tt, Et;
function Ne(e) {
  const l = e.split(" ");
  return l.length !== 2
    ? !1
    : ["top", "center", "bottom"].includes(l[0]) !== !0
    ? (console.error(
        "Anchor/Self position must start with one of top/center/bottom"
      ),
      !1)
    : ["left", "middle", "right", "start", "end"].includes(l[1]) !== !0
    ? (console.error(
        "Anchor/Self position must end with one of left/middle/right/start/end"
      ),
      !1)
    : !0;
}
function el(e) {
  return e
    ? !(e.length !== 2 || typeof e[0] != "number" || typeof e[1] != "number")
    : !0;
}
const ut = {
  "start#ltr": "left",
  "start#rtl": "right",
  "end#ltr": "right",
  "end#rtl": "left",
};
["left", "middle", "right"].forEach((e) => {
  (ut[`${e}#ltr`] = e), (ut[`${e}#rtl`] = e);
});
function Qe(e, l) {
  const n = e.split(" ");
  return {
    vertical: n[0],
    horizontal: ut[`${n[1]}#${l === !0 ? "rtl" : "ltr"}`],
  };
}
function Jl(e, l) {
  let {
    top: n,
    left: i,
    right: r,
    bottom: u,
    width: f,
    height: v,
  } = e.getBoundingClientRect();
  return (
    l !== void 0 &&
      ((n -= l[1]),
      (i -= l[0]),
      (u += l[1]),
      (r += l[0]),
      (f += l[0]),
      (v += l[1])),
    {
      top: n,
      bottom: u,
      height: v,
      left: i,
      right: r,
      width: f,
      middle: i + (r - i) / 2,
      center: n + (u - n) / 2,
    }
  );
}
function Zl(e, l, n) {
  let { top: i, left: r } = e.getBoundingClientRect();
  return (
    (i += l.top),
    (r += l.left),
    n !== void 0 && ((i += n[1]), (r += n[0])),
    {
      top: i,
      bottom: i + 1,
      height: 1,
      left: r,
      right: r + 1,
      width: 1,
      middle: r,
      center: i,
    }
  );
}
function en(e, l) {
  return { top: 0, center: l / 2, bottom: l, left: 0, middle: e / 2, right: e };
}
function At(e, l, n, i) {
  return {
    top: e[n.vertical] - l[i.vertical],
    left: e[n.horizontal] - l[i.horizontal],
  };
}
function rt(e, l = 0) {
  if (e.targetEl === null || e.anchorEl === null || l > 5) return;
  if (e.targetEl.offsetHeight === 0 || e.targetEl.offsetWidth === 0) {
    setTimeout(() => {
      rt(e, l + 1);
    }, 10);
    return;
  }
  const {
    targetEl: n,
    offset: i,
    anchorEl: r,
    anchorOrigin: u,
    selfOrigin: f,
    absoluteOffset: v,
    fit: g,
    cover: S,
    maxHeight: s,
    maxWidth: C,
  } = e;
  if (xl.is.ios === !0 && window.visualViewport !== void 0) {
    const L = document.body.style,
      { offsetLeft: B, offsetTop: W } = window.visualViewport;
    B !== Tt && (L.setProperty("--q-pe-left", B + "px"), (Tt = B)),
      W !== Et && (L.setProperty("--q-pe-top", W + "px"), (Et = W));
  }
  const { scrollLeft: p, scrollTop: a } = n,
    y = v === void 0 ? Jl(r, S === !0 ? [0, 0] : i) : Zl(r, v, i);
  Object.assign(n.style, {
    top: 0,
    left: 0,
    minWidth: null,
    minHeight: null,
    maxWidth: C,
    maxHeight: s,
    visibility: "visible",
  });
  const { offsetWidth: P, offsetHeight: w } = n,
    { elWidth: D, elHeight: U } =
      g === !0 || S === !0
        ? {
            elWidth: Math.max(y.width, P),
            elHeight: S === !0 ? Math.max(y.height, w) : w,
          }
        : { elWidth: P, elHeight: w };
  let z = { maxWidth: C, maxHeight: s };
  (g === !0 || S === !0) &&
    ((z.minWidth = y.width + "px"),
    S === !0 && (z.minHeight = y.height + "px")),
    Object.assign(n.style, z);
  const A = en(D, U);
  let E = At(y, A, u, f);
  if (v === void 0 || i === void 0) et(E, y, A, u, f);
  else {
    const { top: L, left: B } = E;
    et(E, y, A, u, f);
    let W = !1;
    if (E.top !== L) {
      W = !0;
      const $ = 2 * i[1];
      (y.center = y.top -= $), (y.bottom -= $ + 2);
    }
    if (E.left !== B) {
      W = !0;
      const $ = 2 * i[0];
      (y.middle = y.left -= $), (y.right -= $ + 2);
    }
    W === !0 && ((E = At(y, A, u, f)), et(E, y, A, u, f));
  }
  (z = { top: E.top + "px", left: E.left + "px" }),
    E.maxHeight !== void 0 &&
      ((z.maxHeight = E.maxHeight + "px"),
      y.height > E.maxHeight && (z.minHeight = z.maxHeight)),
    E.maxWidth !== void 0 &&
      ((z.maxWidth = E.maxWidth + "px"),
      y.width > E.maxWidth && (z.minWidth = z.maxWidth)),
    Object.assign(n.style, z),
    n.scrollTop !== a && (n.scrollTop = a),
    n.scrollLeft !== p && (n.scrollLeft = p);
}
function et(e, l, n, i, r) {
  const u = n.bottom,
    f = n.right,
    v = Cl(),
    g = window.innerHeight - v,
    S = document.body.clientWidth;
  if (e.top < 0 || e.top + u > g)
    if (r.vertical === "center")
      (e.top = l[i.vertical] > g / 2 ? Math.max(0, g - u) : 0),
        (e.maxHeight = Math.min(u, g));
    else if (l[i.vertical] > g / 2) {
      const s = Math.min(
        g,
        i.vertical === "center"
          ? l.center
          : i.vertical === r.vertical
          ? l.bottom
          : l.top
      );
      (e.maxHeight = Math.min(u, s)), (e.top = Math.max(0, s - u));
    } else
      (e.top = Math.max(
        0,
        i.vertical === "center"
          ? l.center
          : i.vertical === r.vertical
          ? l.top
          : l.bottom
      )),
        (e.maxHeight = Math.min(u, g - e.top));
  if (e.left < 0 || e.left + f > S)
    if (((e.maxWidth = Math.min(f, S)), r.horizontal === "middle"))
      e.left = l[i.horizontal] > S / 2 ? Math.max(0, S - f) : 0;
    else if (l[i.horizontal] > S / 2) {
      const s = Math.min(
        S,
        i.horizontal === "middle"
          ? l.middle
          : i.horizontal === r.horizontal
          ? l.right
          : l.left
      );
      (e.maxWidth = Math.min(f, s)), (e.left = Math.max(0, s - e.maxWidth));
    } else
      (e.left = Math.max(
        0,
        i.horizontal === "middle"
          ? l.middle
          : i.horizontal === r.horizontal
          ? l.left
          : l.right
      )),
        (e.maxWidth = Math.min(f, S - e.left));
}
var vn = Be({
  name: "QTooltip",
  inheritAttrs: !1,
  props: {
    ...Yt,
    ...Bt,
    ..._e,
    maxHeight: { type: String, default: null },
    maxWidth: { type: String, default: null },
    transitionShow: { ..._e.transitionShow, default: "jump-down" },
    transitionHide: { ..._e.transitionHide, default: "jump-up" },
    anchor: { type: String, default: "bottom middle", validator: Ne },
    self: { type: String, default: "top middle", validator: Ne },
    offset: { type: Array, default: () => [14, 14], validator: el },
    scrollTarget: Ft,
    delay: { type: Number, default: 0 },
    hideDelay: { type: Number, default: 0 },
    persistent: Boolean,
  },
  emits: [...Lt],
  setup(e, { slots: l, emit: n, attrs: i }) {
    let r, u;
    const f = Te(),
      {
        proxy: { $q: v },
      } = f,
      g = I(null),
      S = I(!1),
      s = x(() => Qe(e.anchor, v.lang.rtl)),
      C = x(() => Qe(e.self, v.lang.rtl)),
      p = x(() => e.persistent !== !0),
      { registerTick: a, removeTick: y } = It(),
      { registerTimeout: P } = Pt(),
      { transitionProps: w, transitionStyle: D } = Rt(e),
      {
        localScrollTarget: U,
        changeScrollEvent: z,
        unconfigureScrollTarget: A,
      } = Jt(e, oe),
      {
        anchorEl: E,
        canShow: L,
        anchorEvents: B,
      } = Gt({ showing: S, configureAnchorEl: J }),
      { show: W, hide: $ } = _t({
        showing: S,
        canShow: L,
        handleShow: Z,
        handleHide: ae,
        hideOnRouteChange: p,
        processOnMount: !0,
      });
    Object.assign(B, { delayShow: de, delayHide: ne });
    const {
      showPortal: Y,
      hidePortal: le,
      renderPortal: K,
    } = Dt(f, g, c, "tooltip");
    if (v.platform.is.mobile === !0) {
      const b = {
          anchorEl: E,
          innerRef: g,
          onClickOutside(H) {
            return (
              $(H),
              H.target.classList.contains("q-dialog__backdrop") && ce(H),
              !0
            );
          },
        },
        M = x(
          () => e.modelValue === null && e.persistent !== !0 && S.value === !0
        );
      X(M, (H) => {
        (H === !0 ? Zt : Ke)(b);
      }),
        Se(() => {
          Ke(b);
        });
    }
    function Z(b) {
      Y(),
        a(() => {
          (u = new MutationObserver(() => j())),
            u.observe(g.value, {
              attributes: !1,
              childList: !0,
              characterData: !0,
              subtree: !0,
            }),
            j(),
            oe();
        }),
        r === void 0 &&
          (r = X(
            () =>
              v.screen.width +
              "|" +
              v.screen.height +
              "|" +
              e.self +
              "|" +
              e.anchor +
              "|" +
              v.lang.rtl,
            j
          )),
        P(() => {
          Y(!0), n("show", b);
        }, e.transitionDuration);
    }
    function ae(b) {
      y(),
        le(),
        ee(),
        P(() => {
          le(!0), n("hide", b);
        }, e.transitionDuration);
    }
    function ee() {
      u !== void 0 && (u.disconnect(), (u = void 0)),
        r !== void 0 && (r(), (r = void 0)),
        A(),
        nt(B, "tooltipTemp");
    }
    function j() {
      rt({
        targetEl: g.value,
        offset: e.offset,
        anchorEl: E.value,
        anchorOrigin: s.value,
        selfOrigin: C.value,
        maxHeight: e.maxHeight,
        maxWidth: e.maxWidth,
      });
    }
    function de(b) {
      if (v.platform.is.mobile === !0) {
        it(), document.body.classList.add("non-selectable");
        const M = E.value,
          H = ["touchmove", "touchcancel", "touchend", "click"].map((V) => [
            M,
            V,
            "delayHide",
            "passiveCapture",
          ]);
        We(B, "tooltipTemp", H);
      }
      P(() => {
        W(b);
      }, e.delay);
    }
    function ne(b) {
      v.platform.is.mobile === !0 &&
        (nt(B, "tooltipTemp"),
        it(),
        setTimeout(() => {
          document.body.classList.remove("non-selectable");
        }, 10)),
        P(() => {
          $(b);
        }, e.hideDelay);
    }
    function J() {
      if (e.noParentEvent === !0 || E.value === null) return;
      const b =
        v.platform.is.mobile === !0
          ? [[E.value, "touchstart", "delayShow", "passive"]]
          : [
              [E.value, "mouseenter", "delayShow", "passive"],
              [E.value, "mouseleave", "delayHide", "passive"],
            ];
      We(B, "anchor", b);
    }
    function oe() {
      if (E.value !== null || e.scrollTarget !== void 0) {
        U.value = Wt(E.value, e.scrollTarget);
        const b = e.noParentEvent === !0 ? j : $;
        z(U.value, b);
      }
    }
    function o() {
      return S.value === !0
        ? q(
            "div",
            {
              ...i,
              ref: g,
              class: [
                "q-tooltip q-tooltip--style q-position-engine no-pointer-events",
                i.class,
              ],
              style: [i.style, D.value],
              role: "tooltip",
            },
            jt(l.default)
          )
        : null;
    }
    function c() {
      return q($t, w.value, o);
    }
    return Se(ee), Object.assign(f.proxy, { updatePosition: j }), K;
  },
});
const tn = { xs: 8, sm: 10, md: 14, lg: 20, xl: 24 };
var ln = Be({
    name: "QChip",
    props: {
      ...Kt,
      ...pl,
      dense: Boolean,
      icon: String,
      iconRight: String,
      iconRemove: String,
      iconSelected: String,
      label: [String, Number],
      color: String,
      textColor: String,
      modelValue: { type: Boolean, default: !0 },
      selected: { type: Boolean, default: null },
      square: Boolean,
      outline: Boolean,
      clickable: Boolean,
      removable: Boolean,
      removeAriaLabel: String,
      tabindex: [String, Number],
      disable: Boolean,
      ripple: { type: [Boolean, Object], default: !0 },
    },
    emits: ["update:modelValue", "update:selected", "remove", "click"],
    setup(e, { slots: l, emit: n }) {
      const {
          proxy: { $q: i },
        } = Te(),
        r = Nt(e, i),
        u = kl(e, tn),
        f = x(() => e.selected === !0 || e.icon !== void 0),
        v = x(() =>
          e.selected === !0 ? e.iconSelected || i.iconSet.chip.selected : e.icon
        ),
        g = x(() => e.iconRemove || i.iconSet.chip.remove),
        S = x(
          () => e.disable === !1 && (e.clickable === !0 || e.selected !== null)
        ),
        s = x(() => {
          const w = (e.outline === !0 && e.color) || e.textColor;
          return (
            "q-chip row inline no-wrap items-center" +
            (e.outline === !1 && e.color !== void 0 ? ` bg-${e.color}` : "") +
            (w ? ` text-${w} q-chip--colored` : "") +
            (e.disable === !0 ? " disabled" : "") +
            (e.dense === !0 ? " q-chip--dense" : "") +
            (e.outline === !0 ? " q-chip--outline" : "") +
            (e.selected === !0 ? " q-chip--selected" : "") +
            (S.value === !0
              ? " q-chip--clickable cursor-pointer non-selectable q-hoverable"
              : "") +
            (e.square === !0 ? " q-chip--square" : "") +
            (r.value === !0 ? " q-chip--dark q-dark" : "")
          );
        }),
        C = x(() => {
          const w =
              e.disable === !0
                ? { tabindex: -1, "aria-disabled": "true" }
                : { tabindex: e.tabindex || 0 },
            D = {
              ...w,
              role: "button",
              "aria-hidden": "false",
              "aria-label": e.removeAriaLabel || i.lang.label.remove,
            };
          return { chip: w, remove: D };
        });
      function p(w) {
        w.keyCode === 13 && a(w);
      }
      function a(w) {
        e.disable || (n("update:selected", !e.selected), n("click", w));
      }
      function y(w) {
        (w.keyCode === void 0 || w.keyCode === 13) &&
          (ce(w),
          e.disable === !1 && (n("update:modelValue", !1), n("remove")));
      }
      function P() {
        const w = [];
        S.value === !0 && w.push(q("div", { class: "q-focus-helper" })),
          f.value === !0 &&
            w.push(
              q(De, { class: "q-chip__icon q-chip__icon--left", name: v.value })
            );
        const D =
          e.label !== void 0
            ? [q("div", { class: "ellipsis" }, [e.label])]
            : void 0;
        return (
          w.push(
            q(
              "div",
              {
                class:
                  "q-chip__content col row no-wrap items-center q-anchor--skip",
              },
              ql(l.default, D)
            )
          ),
          e.iconRight &&
            w.push(
              q(De, {
                class: "q-chip__icon q-chip__icon--right",
                name: e.iconRight,
              })
            ),
          e.removable === !0 &&
            w.push(
              q(De, {
                class: "q-chip__icon q-chip__icon--remove cursor-pointer",
                name: g.value,
                ...C.value.remove,
                onClick: y,
                onKeyup: y,
              })
            ),
          w
        );
      }
      return () => {
        if (e.modelValue === !1) return;
        const w = { class: s.value, style: u.value };
        return (
          S.value === !0 &&
            Object.assign(w, C.value.chip, { onClick: a, onKeyup: p }),
          Vl(
            "div",
            w,
            P(),
            "ripple",
            e.ripple !== !1 && e.disable !== !0,
            () => [[Tl, e.ripple]]
          )
        );
      };
    },
  }),
  nn = Be({
    name: "QMenu",
    inheritAttrs: !1,
    props: {
      ...Gl,
      ...Bt,
      ...Kt,
      ..._e,
      persistent: Boolean,
      autoClose: Boolean,
      separateClosePopup: Boolean,
      noEscDismiss: Boolean,
      noRouteDismiss: Boolean,
      noRefocus: Boolean,
      noFocus: Boolean,
      fit: Boolean,
      cover: Boolean,
      square: Boolean,
      anchor: { type: String, validator: Ne },
      self: { type: String, validator: Ne },
      offset: { type: Array, validator: el },
      scrollTarget: Ft,
      touchPosition: Boolean,
      maxHeight: { type: String, default: null },
      maxWidth: { type: String, default: null },
    },
    emits: [...Lt, "click", "escapeKey"],
    setup(e, { slots: l, emit: n, attrs: i }) {
      let r = null,
        u,
        f,
        v;
      const g = Te(),
        { proxy: S } = g,
        { $q: s } = S,
        C = I(null),
        p = I(!1),
        a = x(() => e.persistent !== !0 && e.noRouteDismiss !== !0),
        y = Nt(e, s),
        { registerTick: P, removeTick: w } = It(),
        { registerTimeout: D } = Pt(),
        { transitionProps: U, transitionStyle: z } = Rt(e),
        {
          localScrollTarget: A,
          changeScrollEvent: E,
          unconfigureScrollTarget: L,
        } = Jt(e, b),
        { anchorEl: B, canShow: W } = Gt({ showing: p }),
        { hide: $ } = _t({
          showing: p,
          canShow: W,
          handleShow: oe,
          handleHide: o,
          hideOnRouteChange: a,
          processOnMount: !0,
        }),
        {
          showPortal: Y,
          hidePortal: le,
          renderPortal: K,
        } = Dt(g, C, R, "menu"),
        Z = {
          anchorEl: B,
          innerRef: C,
          onClickOutside(d) {
            if (e.persistent !== !0 && p.value === !0)
              return (
                $(d),
                (d.type === "touchstart" ||
                  d.target.classList.contains("q-dialog__backdrop")) &&
                  ce(d),
                !0
              );
          },
        },
        ae = x(() =>
          Qe(
            e.anchor || (e.cover === !0 ? "center middle" : "bottom start"),
            s.lang.rtl
          )
        ),
        ee = x(() =>
          e.cover === !0 ? ae.value : Qe(e.self || "top start", s.lang.rtl)
        ),
        j = x(
          () =>
            (e.square === !0 ? " q-menu--square" : "") +
            (y.value === !0 ? " q-menu--dark q-dark" : "")
        ),
        de = x(() => (e.autoClose === !0 ? { onClick: M } : {})),
        ne = x(() => p.value === !0 && e.persistent !== !0);
      X(ne, (d) => {
        d === !0 ? (zl(V), Zt(Z)) : (kt(V), Ke(Z));
      });
      function J() {
        Ol(() => {
          let d = C.value;
          d &&
            d.contains(document.activeElement) !== !0 &&
            ((d =
              d.querySelector(
                "[autofocus][tabindex], [data-autofocus][tabindex]"
              ) ||
              d.querySelector(
                "[autofocus] [tabindex], [data-autofocus] [tabindex]"
              ) ||
              d.querySelector("[autofocus], [data-autofocus]") ||
              d),
            d.focus({ preventScroll: !0 }));
        });
      }
      function oe(d) {
        if (
          ((r = e.noRefocus === !1 ? document.activeElement : null),
          El(H),
          Y(),
          b(),
          (u = void 0),
          d !== void 0 && (e.touchPosition || e.contextMenu))
        ) {
          const N = Al(d);
          if (N.left !== void 0) {
            const { top: ie, left: ye } = B.value.getBoundingClientRect();
            u = { left: N.left - ye, top: N.top - ie };
          }
        }
        f === void 0 &&
          (f = X(
            () =>
              s.screen.width +
              "|" +
              s.screen.height +
              "|" +
              e.self +
              "|" +
              e.anchor +
              "|" +
              s.lang.rtl,
            k
          )),
          e.noFocus !== !0 && document.activeElement.blur(),
          P(() => {
            k(), e.noFocus !== !0 && J();
          }),
          D(() => {
            s.platform.is.ios === !0 && ((v = e.autoClose), C.value.click()),
              k(),
              Y(!0),
              n("show", d);
          }, e.transitionDuration);
      }
      function o(d) {
        w(),
          le(),
          c(!0),
          r !== null &&
            (d === void 0 || d.qClickOutside !== !0) &&
            ((
              (d?.type.indexOf("key") === 0
                ? r.closest('[tabindex]:not([tabindex^="-"])')
                : void 0) || r
            ).focus(),
            (r = null)),
          D(() => {
            le(!0), n("hide", d);
          }, e.transitionDuration);
      }
      function c(d) {
        (u = void 0),
          f !== void 0 && (f(), (f = void 0)),
          (d === !0 || p.value === !0) && (Ml(H), L(), Ke(Z), kt(V)),
          d !== !0 && (r = null);
      }
      function b() {
        (B.value !== null || e.scrollTarget !== void 0) &&
          ((A.value = Wt(B.value, e.scrollTarget)), E(A.value, k));
      }
      function M(d) {
        v !== !0 ? (Hl(S, d), n("click", d)) : (v = !1);
      }
      function H(d) {
        ne.value === !0 &&
          e.noFocus !== !0 &&
          Bl(C.value, d.target) !== !0 &&
          J();
      }
      function V(d) {
        e.noEscDismiss !== !0 && (n("escapeKey"), $(d));
      }
      function k() {
        rt({
          targetEl: C.value,
          offset: e.offset,
          anchorEl: B.value,
          anchorOrigin: ae.value,
          selfOrigin: ee.value,
          absoluteOffset: u,
          fit: e.fit,
          cover: e.cover,
          maxHeight: e.maxHeight,
          maxWidth: e.maxWidth,
        });
      }
      function R() {
        return q($t, U.value, () =>
          p.value === !0
            ? q(
                "div",
                {
                  role: "menu",
                  ...i,
                  ref: C,
                  tabindex: -1,
                  class: ["q-menu q-position-engine scroll" + j.value, i.class],
                  style: [i.style, z.value],
                  ...de.value,
                },
                jt(l.default)
              )
            : null
        );
      }
      return Se(c), Object.assign(S, { focus: J, updatePosition: k }), K;
    },
  }),
  on = Be({
    name: "QField",
    inheritAttrs: !1,
    props: { ...at, tag: { type: String, default: "label" } },
    emits: Qt,
    setup() {
      return Ut(Xt({ tagProp: !0 }));
    },
  });
let Ue = !1;
{
  const e = document.createElement("div");
  e.setAttribute("dir", "rtl"),
    Object.assign(e.style, { width: "1px", height: "1px", overflow: "auto" });
  const l = document.createElement("div");
  Object.assign(l.style, { width: "1000px", height: "1px" }),
    document.body.appendChild(e),
    e.appendChild(l),
    (e.scrollLeft = -1e3),
    (Ue = e.scrollLeft >= 0),
    e.remove();
}
const te = 1e3,
  un = ["start", "center", "end", "start-force", "center-force", "end-force"],
  tl = Array.prototype.filter,
  an =
    window.getComputedStyle(document.body).overflowAnchor === void 0
      ? Fl
      : function (e, l) {
          e !== null &&
            (e._qOverflowAnimationFrame !== void 0 &&
              cancelAnimationFrame(e._qOverflowAnimationFrame),
            (e._qOverflowAnimationFrame = requestAnimationFrame(() => {
              if (e === null) return;
              e._qOverflowAnimationFrame = void 0;
              const n = e.children || [];
              tl.call(
                n,
                (r) => r.dataset && r.dataset.qVsAnchor !== void 0
              ).forEach((r) => {
                delete r.dataset.qVsAnchor;
              });
              const i = n[l];
              i?.dataset && (i.dataset.qVsAnchor = "");
            })));
        };
function qe(e, l) {
  return e + l;
}
function tt(e, l, n, i, r, u, f, v) {
  const g =
      e === window ? document.scrollingElement || document.documentElement : e,
    S = r === !0 ? "offsetWidth" : "offsetHeight",
    s = {
      scrollStart: 0,
      scrollViewSize: -f - v,
      scrollMaxSize: 0,
      offsetStart: -f,
      offsetEnd: -v,
    };
  if (
    (r === !0
      ? (e === window
          ? ((s.scrollStart =
              window.pageXOffset ||
              window.scrollX ||
              document.body.scrollLeft ||
              0),
            (s.scrollViewSize += document.documentElement.clientWidth))
          : ((s.scrollStart = g.scrollLeft),
            (s.scrollViewSize += g.clientWidth)),
        (s.scrollMaxSize = g.scrollWidth),
        u === !0 &&
          (s.scrollStart =
            (Ue === !0 ? s.scrollMaxSize - s.scrollViewSize : 0) -
            s.scrollStart))
      : (e === window
          ? ((s.scrollStart =
              window.pageYOffset ||
              window.scrollY ||
              document.body.scrollTop ||
              0),
            (s.scrollViewSize += document.documentElement.clientHeight))
          : ((s.scrollStart = g.scrollTop),
            (s.scrollViewSize += g.clientHeight)),
        (s.scrollMaxSize = g.scrollHeight)),
    n !== null)
  )
    for (
      let C = n.previousElementSibling;
      C !== null;
      C = C.previousElementSibling
    )
      C.classList.contains("q-virtual-scroll--skip") === !1 &&
        (s.offsetStart += C[S]);
  if (i !== null)
    for (let C = i.nextElementSibling; C !== null; C = C.nextElementSibling)
      C.classList.contains("q-virtual-scroll--skip") === !1 &&
        (s.offsetEnd += C[S]);
  if (l !== e) {
    const C = g.getBoundingClientRect(),
      p = l.getBoundingClientRect();
    r === !0
      ? ((s.offsetStart += p.left - C.left), (s.offsetEnd -= p.width))
      : ((s.offsetStart += p.top - C.top), (s.offsetEnd -= p.height)),
      e !== window && (s.offsetStart += s.scrollStart),
      (s.offsetEnd += s.scrollMaxSize - s.offsetStart);
  }
  return s;
}
function Mt(e, l, n, i) {
  l === "end" &&
    (l = (e === window ? document.body : e)[
      n === !0 ? "scrollWidth" : "scrollHeight"
    ]),
    e === window
      ? n === !0
        ? (i === !0 &&
            (l =
              (Ue === !0
                ? document.body.scrollWidth -
                  document.documentElement.clientWidth
                : 0) - l),
          window.scrollTo(
            l,
            window.pageYOffset || window.scrollY || document.body.scrollTop || 0
          ))
        : window.scrollTo(
            window.pageXOffset ||
              window.scrollX ||
              document.body.scrollLeft ||
              0,
            l
          )
      : n === !0
      ? (i === !0 && (l = (Ue === !0 ? e.scrollWidth - e.offsetWidth : 0) - l),
        (e.scrollLeft = l))
      : (e.scrollTop = l);
}
function ze(e, l, n, i) {
  if (n >= i) return 0;
  const r = l.length,
    u = Math.floor(n / te),
    f = Math.floor((i - 1) / te) + 1;
  let v = e.slice(u, f).reduce(qe, 0);
  return (
    n % te !== 0 && (v -= l.slice(u * te, n).reduce(qe, 0)),
    i % te !== 0 && i !== r && (v -= l.slice(i, f * te).reduce(qe, 0)),
    v
  );
}
const ll = {
    virtualScrollSliceSize: { type: [Number, String], default: 10 },
    virtualScrollSliceRatioBefore: { type: [Number, String], default: 1 },
    virtualScrollSliceRatioAfter: { type: [Number, String], default: 1 },
    virtualScrollItemSize: { type: [Number, String], default: 24 },
    virtualScrollStickySizeStart: { type: [Number, String], default: 0 },
    virtualScrollStickySizeEnd: { type: [Number, String], default: 0 },
    tableColspan: [Number, String],
  },
  mn = Object.keys(ll),
  Ht = { virtualScrollHorizontal: Boolean, onVirtualScroll: Function, ...ll };
function rn({
  virtualScrollLength: e,
  getVirtualScrollTarget: l,
  getVirtualScrollEl: n,
  virtualScrollItemSizeComputed: i,
}) {
  const r = Te(),
    { props: u, emit: f, proxy: v } = r,
    { $q: g } = v;
  let S,
    s,
    C,
    p = [],
    a;
  const y = I(0),
    P = I(0),
    w = I({}),
    D = I(null),
    U = I(null),
    z = I(null),
    A = I({ from: 0, to: 0 }),
    E = x(() => (u.tableColspan !== void 0 ? u.tableColspan : 100));
  i === void 0 && (i = x(() => u.virtualScrollItemSize));
  const L = x(() => i.value + ";" + u.virtualScrollHorizontal),
    B = x(
      () =>
        L.value +
        ";" +
        u.virtualScrollSliceRatioBefore +
        ";" +
        u.virtualScrollSliceRatioAfter
    );
  X(B, () => {
    j();
  }),
    X(L, W);
  function W() {
    ee(s, !0);
  }
  function $(o) {
    ee(o === void 0 ? s : o);
  }
  function Y(o, c) {
    const b = l();
    if (b == null || b.nodeType === 8) return;
    const M = tt(
      b,
      n(),
      D.value,
      U.value,
      u.virtualScrollHorizontal,
      g.lang.rtl,
      u.virtualScrollStickySizeStart,
      u.virtualScrollStickySizeEnd
    );
    C !== M.scrollViewSize && j(M.scrollViewSize),
      K(
        b,
        M,
        Math.min(e.value - 1, Math.max(0, parseInt(o, 10) || 0)),
        0,
        un.indexOf(c) !== -1 ? c : s !== -1 && o > s ? "end" : "start"
      );
  }
  function le() {
    const o = l();
    if (o == null || o.nodeType === 8) return;
    const c = tt(
        o,
        n(),
        D.value,
        U.value,
        u.virtualScrollHorizontal,
        g.lang.rtl,
        u.virtualScrollStickySizeStart,
        u.virtualScrollStickySizeEnd
      ),
      b = e.value - 1,
      M = c.scrollMaxSize - c.offsetStart - c.offsetEnd - P.value;
    if (S === c.scrollStart) return;
    if (c.scrollMaxSize <= 0) {
      K(o, c, 0, 0);
      return;
    }
    C !== c.scrollViewSize && j(c.scrollViewSize), Z(A.value.from);
    const H = Math.floor(
      c.scrollMaxSize -
        Math.max(c.scrollViewSize, c.offsetEnd) -
        Math.min(a[b], c.scrollViewSize / 2)
    );
    if (H > 0 && Math.ceil(c.scrollStart) >= H) {
      K(o, c, b, c.scrollMaxSize - c.offsetEnd - p.reduce(qe, 0));
      return;
    }
    let V = 0,
      k = c.scrollStart - c.offsetStart,
      R = k;
    if (k <= M && k + c.scrollViewSize >= y.value)
      (k -= y.value), (V = A.value.from), (R = k);
    else for (let d = 0; k >= p[d] && V < b; d++) (k -= p[d]), (V += te);
    for (; k > 0 && V < b; )
      (k -= a[V]), k > -c.scrollViewSize ? (V++, (R = k)) : (R = a[V] + k);
    K(o, c, V, R);
  }
  function K(o, c, b, M, H) {
    const V = typeof H == "string" && H.indexOf("-force") !== -1,
      k = V === !0 ? H.replace("-force", "") : H,
      R = k !== void 0 ? k : "start";
    let d = Math.max(0, b - w.value[R]),
      N = d + w.value.total;
    N > e.value && ((N = e.value), (d = Math.max(0, N - w.value.total))),
      (S = c.scrollStart);
    const ie = d !== A.value.from || N !== A.value.to;
    if (ie === !1 && k === void 0) {
      ne(b);
      return;
    }
    const { activeElement: ye } = document,
      re = z.value;
    ie === !0 &&
      re !== null &&
      re !== ye &&
      re.contains(ye) === !0 &&
      (re.addEventListener("focusout", ae),
      setTimeout(() => {
        re?.removeEventListener("focusout", ae);
      })),
      an(re, b - d);
    const Fe = k !== void 0 ? a.slice(d, b).reduce(qe, 0) : 0;
    if (ie === !0) {
      const fe = N >= A.value.from && d <= A.value.to ? A.value.to : N;
      (A.value = { from: d, to: fe }),
        (y.value = ze(p, a, 0, d)),
        (P.value = ze(p, a, N, e.value)),
        requestAnimationFrame(() => {
          A.value.to !== N &&
            S === c.scrollStart &&
            ((A.value = { from: A.value.from, to: N }),
            (P.value = ze(p, a, N, e.value)));
        });
    }
    requestAnimationFrame(() => {
      if (S !== c.scrollStart) return;
      ie === !0 && Z(d);
      const fe = a.slice(d, b).reduce(qe, 0),
        ve = fe + c.offsetStart + y.value,
        Le = ve + a[b];
      let Ee = ve + M;
      if (k !== void 0) {
        const Xe = fe - Fe,
          Ae = c.scrollStart + Xe;
        Ee =
          V !== !0 && Ae < ve && Le < Ae + c.scrollViewSize
            ? Ae
            : k === "end"
            ? Le - c.scrollViewSize
            : ve -
              (k === "start" ? 0 : Math.round((c.scrollViewSize - a[b]) / 2));
      }
      (S = Ee), Mt(o, Ee, u.virtualScrollHorizontal, g.lang.rtl), ne(b);
    });
  }
  function Z(o) {
    const c = z.value;
    if (c) {
      const b = tl.call(
          c.children,
          (d) =>
            d.classList && d.classList.contains("q-virtual-scroll--skip") === !1
        ),
        M = b.length,
        H =
          u.virtualScrollHorizontal === !0
            ? (d) => d.getBoundingClientRect().width
            : (d) => d.offsetHeight;
      let V = o,
        k,
        R;
      for (let d = 0; d < M; ) {
        for (
          k = H(b[d]), d++;
          d < M &&
          b[d].classList.contains("q-virtual-scroll--with-prev") === !0;

        )
          (k += H(b[d])), d++;
        (R = k - a[V]),
          R !== 0 && ((a[V] += R), (p[Math.floor(V / te)] += R)),
          V++;
      }
    }
  }
  function ae() {
    z.value?.focus();
  }
  function ee(o, c) {
    const b = 1 * i.value;
    (c === !0 || Array.isArray(a) === !1) && (a = []);
    const M = a.length;
    a.length = e.value;
    for (let V = e.value - 1; V >= M; V--) a[V] = b;
    const H = Math.floor((e.value - 1) / te);
    p = [];
    for (let V = 0; V <= H; V++) {
      let k = 0;
      const R = Math.min((V + 1) * te, e.value);
      for (let d = V * te; d < R; d++) k += a[d];
      p.push(k);
    }
    (s = -1),
      (S = void 0),
      (y.value = ze(p, a, 0, A.value.from)),
      (P.value = ze(p, a, A.value.to, e.value)),
      o >= 0
        ? (Z(A.value.from),
          se(() => {
            Y(o);
          }))
        : J();
  }
  function j(o) {
    if (o === void 0 && typeof window < "u") {
      const k = l();
      k != null &&
        k.nodeType !== 8 &&
        (o = tt(
          k,
          n(),
          D.value,
          U.value,
          u.virtualScrollHorizontal,
          g.lang.rtl,
          u.virtualScrollStickySizeStart,
          u.virtualScrollStickySizeEnd
        ).scrollViewSize);
    }
    C = o;
    const c = parseFloat(u.virtualScrollSliceRatioBefore) || 0,
      b = parseFloat(u.virtualScrollSliceRatioAfter) || 0,
      M = 1 + c + b,
      H = o === void 0 || o <= 0 ? 1 : Math.ceil(o / i.value),
      V = Math.max(
        1,
        H,
        Math.ceil(
          (u.virtualScrollSliceSize > 0 ? u.virtualScrollSliceSize : 10) / M
        )
      );
    w.value = {
      total: Math.ceil(V * M),
      start: Math.ceil(V * c),
      center: Math.ceil(V * (0.5 + c)),
      end: Math.ceil(V * (1 + c)),
      view: H,
    };
  }
  function de(o, c) {
    const b = u.virtualScrollHorizontal === !0 ? "width" : "height",
      M = { ["--q-virtual-scroll-item-" + b]: i.value + "px" };
    return [
      o === "tbody"
        ? q(o, { class: "q-virtual-scroll__padding", key: "before", ref: D }, [
            q("tr", [
              q("td", {
                style: { [b]: `${y.value}px`, ...M },
                colspan: E.value,
              }),
            ]),
          ])
        : q(o, {
            class: "q-virtual-scroll__padding",
            key: "before",
            ref: D,
            style: { [b]: `${y.value}px`, ...M },
          }),
      q(
        o,
        {
          class: "q-virtual-scroll__content",
          key: "content",
          ref: z,
          tabindex: -1,
        },
        c.flat()
      ),
      o === "tbody"
        ? q(o, { class: "q-virtual-scroll__padding", key: "after", ref: U }, [
            q("tr", [
              q("td", {
                style: { [b]: `${P.value}px`, ...M },
                colspan: E.value,
              }),
            ]),
          ])
        : q(o, {
            class: "q-virtual-scroll__padding",
            key: "after",
            ref: U,
            style: { [b]: `${P.value}px`, ...M },
          }),
    ];
  }
  function ne(o) {
    s !== o &&
      (u.onVirtualScroll !== void 0 &&
        f("virtualScroll", {
          index: o,
          from: A.value.from,
          to: A.value.to - 1,
          direction: o < s ? "decrease" : "increase",
          ref: v,
        }),
      (s = o));
  }
  j();
  const J = Ll(le, g.platform.is.ios === !0 ? 120 : 35);
  Il(() => {
    j();
  });
  let oe = !1;
  return (
    Pl(() => {
      oe = !0;
    }),
    Rl(() => {
      if (oe !== !0) return;
      const o = l();
      S !== void 0 && o !== void 0 && o !== null && o.nodeType !== 8
        ? Mt(o, S, u.virtualScrollHorizontal, g.lang.rtl)
        : Y(s);
    }),
    Se(() => {
      J.cancel();
    }),
    Object.assign(v, { scrollTo: Y, reset: W, refresh: $ }),
    {
      virtualScrollSliceRange: A,
      virtualScrollSliceSizeComputed: w,
      setVirtualScrollSize: j,
      onVirtualScrollEvt: J,
      localResetVirtualScroll: ee,
      padVirtualScroll: de,
      scrollTo: Y,
      reset: W,
      refresh: $,
    }
  );
}
const zt = (e) => ["add", "add-unique", "toggle"].includes(e),
  sn = ".*+?^${}()|[]\\",
  cn = Object.keys(at);
function lt(e, l) {
  if (typeof e == "function") return e;
  const n = e !== void 0 ? e : l;
  return (i) => (i !== null && typeof i == "object" && n in i ? i[n] : i);
}
var hn = Be({
  name: "QSelect",
  inheritAttrs: !1,
  props: {
    ...Ht,
    ..._l,
    ...at,
    modelValue: { required: !0 },
    multiple: Boolean,
    displayValue: [String, Number],
    displayValueHtml: Boolean,
    dropdownIcon: String,
    options: { type: Array, default: () => [] },
    optionValue: [Function, String],
    optionLabel: [Function, String],
    optionDisable: [Function, String],
    hideSelected: Boolean,
    hideDropdownIcon: Boolean,
    fillInput: Boolean,
    maxValues: [Number, String],
    optionsDense: Boolean,
    optionsDark: { type: Boolean, default: null },
    optionsSelectedClass: String,
    optionsHtml: Boolean,
    optionsCover: Boolean,
    menuShrink: Boolean,
    menuAnchor: String,
    menuSelf: String,
    menuOffset: Array,
    popupContentClass: String,
    popupContentStyle: [String, Array, Object],
    popupNoRouteDismiss: Boolean,
    useInput: Boolean,
    useChips: Boolean,
    newValueMode: { type: String, validator: zt },
    mapOptions: Boolean,
    emitValue: Boolean,
    disableTabSelection: Boolean,
    inputDebounce: { type: [Number, String], default: 500 },
    inputClass: [Array, String, Object],
    inputStyle: [Array, String, Object],
    tabindex: { type: [String, Number], default: 0 },
    autocomplete: String,
    transitionShow: {},
    transitionHide: {},
    transitionDuration: {},
    behavior: {
      type: String,
      validator: (e) => ["default", "menu", "dialog"].includes(e),
      default: "default",
    },
    virtualScrollItemSize: Ht.virtualScrollItemSize.type,
    onNewValue: Function,
    onFilter: Function,
  },
  emits: [
    ...Qt,
    "add",
    "remove",
    "inputValue",
    "keyup",
    "keypress",
    "keydown",
    "popupShow",
    "popupHide",
    "filterAbort",
  ],
  setup(e, { slots: l, emit: n }) {
    const { proxy: i } = Te(),
      { $q: r } = i,
      u = I(!1),
      f = I(!1),
      v = I(-1),
      g = I(""),
      S = I(!1),
      s = I(!1);
    let C = null,
      p = null,
      a,
      y,
      P,
      w = null,
      D,
      U,
      z,
      A;
    const E = I(null),
      L = I(null),
      B = I(null),
      W = I(null),
      $ = I(null),
      Y = Dl(e),
      le = Nl(yt),
      K = x(() => (Array.isArray(e.options) ? e.options.length : 0)),
      Z = x(() =>
        e.virtualScrollItemSize === void 0
          ? e.optionsDense === !0
            ? 24
            : 48
          : e.virtualScrollItemSize
      ),
      {
        virtualScrollSliceRange: ae,
        virtualScrollSliceSizeComputed: ee,
        localResetVirtualScroll: j,
        padVirtualScroll: de,
        onVirtualScrollEvt: ne,
        scrollTo: J,
        setVirtualScrollSize: oe,
      } = rn({
        virtualScrollLength: K,
        getVirtualScrollTarget: ul,
        getVirtualScrollEl: gt,
        virtualScrollItemSizeComputed: Z,
      }),
      o = Xt(),
      c = x(() => {
        const t = e.mapOptions === !0 && e.multiple !== !0,
          m =
            e.modelValue !== void 0 && (e.modelValue !== null || t === !0)
              ? e.multiple === !0 && Array.isArray(e.modelValue)
                ? e.modelValue
                : [e.modelValue]
              : [];
        if (e.mapOptions === !0 && Array.isArray(e.options) === !0) {
          const h = e.mapOptions === !0 && a !== void 0 ? a : [],
            T = m.map((F) => il(F, h));
          return e.modelValue === null && t === !0
            ? T.filter((F) => F !== null)
            : T;
        }
        return m;
      }),
      b = x(() => {
        const t = {};
        return (
          cn.forEach((m) => {
            const h = e[m];
            h !== void 0 && (t[m] = h);
          }),
          t
        );
      }),
      M = x(() => (e.optionsDark === null ? o.isDark.value : e.optionsDark)),
      H = x(() => Vt(c.value)),
      V = x(() => {
        let t = "q-field__input q-placeholder col";
        return e.hideSelected === !0 || c.value.length === 0
          ? [t, e.inputClass]
          : ((t += " q-field__input--padding"),
            e.inputClass === void 0 ? t : [t, e.inputClass]);
      }),
      k = x(
        () =>
          (e.virtualScrollHorizontal === !0
            ? "q-virtual-scroll--horizontal"
            : "") + (e.popupContentClass ? " " + e.popupContentClass : "")
      ),
      R = x(() => K.value === 0),
      d = x(() => c.value.map((t) => G.value(t)).join(", ")),
      N = x(() => (e.displayValue !== void 0 ? e.displayValue : d.value)),
      ie = x(() => (e.optionsHtml === !0 ? () => !0 : (t) => t?.html === !0)),
      ye = x(
        () =>
          e.displayValueHtml === !0 ||
          (e.displayValue === void 0 &&
            (e.optionsHtml === !0 || c.value.some(ie.value)))
      ),
      re = x(() => (o.focused.value === !0 ? e.tabindex : -1)),
      Fe = x(() => {
        const t = {
          tabindex: e.tabindex,
          role: "combobox",
          "aria-label": e.label,
          "aria-readonly": e.readonly === !0 ? "true" : "false",
          "aria-autocomplete": e.useInput === !0 ? "list" : "none",
          "aria-expanded": u.value === !0 ? "true" : "false",
          "aria-controls": `${o.targetUid.value}_lb`,
        };
        return (
          v.value >= 0 &&
            (t["aria-activedescendant"] = `${o.targetUid.value}_${v.value}`),
          t
        );
      }),
      fe = x(() => ({
        id: `${o.targetUid.value}_lb`,
        role: "listbox",
        "aria-multiselectable": e.multiple === !0 ? "true" : "false",
      })),
      ve = x(() =>
        c.value.map((t, m) => ({
          index: m,
          opt: t,
          html: ie.value(t),
          selected: !0,
          removeAtIndex: ol,
          toggleOption: me,
          tabindex: re.value,
        }))
      ),
      Le = x(() => {
        if (K.value === 0) return [];
        const { from: t, to: m } = ae.value;
        return e.options.slice(t, m).map((h, T) => {
          const F = be.value(h) === !0,
            O = Ge(h) === !0,
            Q = t + T,
            _ = {
              clickable: !0,
              active: O,
              activeClass: Ae.value,
              manualFocus: !0,
              focused: !1,
              disable: F,
              tabindex: -1,
              dense: e.optionsDense,
              dark: M.value,
              role: "option",
              "aria-selected": O === !0 ? "true" : "false",
              id: `${o.targetUid.value}_${Q}`,
              onClick: () => {
                me(h);
              },
            };
          return (
            F !== !0 &&
              (v.value === Q && (_.focused = !0),
              r.platform.is.desktop === !0 &&
                (_.onMousemove = () => {
                  u.value === !0 && we(Q);
                })),
            {
              index: Q,
              opt: h,
              html: ie.value(h),
              label: G.value(h),
              selected: _.active,
              focused: _.focused,
              toggleOption: me,
              setOptionIndex: we,
              itemProps: _,
            }
          );
        });
      }),
      Ee = x(() =>
        e.dropdownIcon !== void 0 ? e.dropdownIcon : r.iconSet.arrow.dropdown
      ),
      Xe = x(
        () =>
          e.optionsCover === !1 &&
          e.outlined !== !0 &&
          e.standout !== !0 &&
          e.borderless !== !0 &&
          e.rounded !== !0
      ),
      Ae = x(() =>
        e.optionsSelectedClass !== void 0
          ? e.optionsSelectedClass
          : e.color !== void 0
          ? `text-${e.color}`
          : ""
      ),
      ue = x(() => lt(e.optionValue, "value")),
      G = x(() => lt(e.optionLabel, "label")),
      be = x(() => lt(e.optionDisable, "disable")),
      Ie = x(() => c.value.map(ue.value)),
      nl = x(() => {
        const t = {
          onInput: yt,
          onChange: le,
          onKeydown: ht,
          onKeyup: vt,
          onKeypress: mt,
          onFocus: dt,
          onClick(m) {
            y === !0 && Ve(m);
          },
        };
        return (
          (t.onCompositionstart =
            t.onCompositionupdate =
            t.onCompositionend =
              le),
          t
        );
      });
    X(
      c,
      (t) => {
        (a = t),
          e.useInput === !0 &&
            e.fillInput === !0 &&
            e.multiple !== !0 &&
            o.innerLoading.value !== !0 &&
            ((f.value !== !0 && u.value !== !0) || H.value !== !0) &&
            (P !== !0 && ke(), (f.value === !0 || u.value === !0) && xe(""));
      },
      { immediate: !0 }
    ),
      X(() => e.fillInput, ke),
      X(u, Je),
      X(K, yl);
    function st(t) {
      return e.emitValue === !0 ? ue.value(t) : t;
    }
    function Ye(t) {
      if (t !== -1 && t < c.value.length)
        if (e.multiple === !0) {
          const m = e.modelValue.slice();
          n("remove", { index: t, value: m.splice(t, 1)[0] }),
            n("update:modelValue", m);
        } else n("update:modelValue", null);
    }
    function ol(t) {
      Ye(t), o.focus();
    }
    function ct(t, m) {
      const h = st(t);
      if (e.multiple !== !0) {
        e.fillInput === !0 && Me(G.value(t), !0, !0), n("update:modelValue", h);
        return;
      }
      if (c.value.length === 0) {
        n("add", { index: 0, value: h }),
          n("update:modelValue", e.multiple === !0 ? [h] : h);
        return;
      }
      if (
        (m === !0 && Ge(t) === !0) ||
        (e.maxValues !== void 0 && e.modelValue.length >= e.maxValues)
      )
        return;
      const T = e.modelValue.slice();
      n("add", { index: T.length, value: h }),
        T.push(h),
        n("update:modelValue", T);
    }
    function me(t, m) {
      if (o.editable.value !== !0 || t === void 0 || be.value(t) === !0) return;
      const h = ue.value(t);
      if (e.multiple !== !0) {
        m !== !0 && (Me(e.fillInput === !0 ? G.value(t) : "", !0, !0), he()),
          L.value?.focus(),
          (c.value.length === 0 || He(ue.value(c.value[0]), h) !== !0) &&
            n("update:modelValue", e.emitValue === !0 ? h : t);
        return;
      }
      if (
        ((y !== !0 || S.value === !0) && o.focus(), dt(), c.value.length === 0)
      ) {
        const O = e.emitValue === !0 ? h : t;
        n("add", { index: 0, value: O }),
          n("update:modelValue", e.multiple === !0 ? [O] : O);
        return;
      }
      const T = e.modelValue.slice(),
        F = Ie.value.findIndex((O) => He(O, h));
      if (F !== -1) n("remove", { index: F, value: T.splice(F, 1)[0] });
      else {
        if (e.maxValues !== void 0 && T.length >= e.maxValues) return;
        const O = e.emitValue === !0 ? h : t;
        n("add", { index: T.length, value: O }), T.push(O);
      }
      n("update:modelValue", T);
    }
    function we(t) {
      if (r.platform.is.desktop !== !0) return;
      const m = t !== -1 && t < K.value ? t : -1;
      v.value !== m && (v.value = m);
    }
    function Pe(t = 1, m) {
      if (u.value === !0) {
        let h = v.value;
        do h = qt(h + t, -1, K.value - 1);
        while (h !== -1 && h !== v.value && be.value(e.options[h]) === !0);
        v.value !== h &&
          (we(h),
          J(h),
          m !== !0 &&
            e.useInput === !0 &&
            e.fillInput === !0 &&
            Re(h >= 0 ? G.value(e.options[h]) : D, !0));
      }
    }
    function il(t, m) {
      const h = (T) => He(ue.value(T), t);
      return e.options.find(h) || m.find(h) || t;
    }
    function Ge(t) {
      const m = ue.value(t);
      return Ie.value.find((h) => He(h, m)) !== void 0;
    }
    function dt(t) {
      e.useInput === !0 &&
        L.value !== null &&
        (t === void 0 ||
          (L.value === t.target && t.target.value === d.value)) &&
        L.value.select();
    }
    function ft(t) {
      Ot(t, 27) === !0 && u.value === !0 && (Ve(t), he(), ke()), n("keyup", t);
    }
    function vt(t) {
      const { value: m } = t.target;
      if (t.keyCode !== void 0) {
        ft(t);
        return;
      }
      if (
        ((t.target.value = ""),
        C !== null && (clearTimeout(C), (C = null)),
        p !== null && (clearTimeout(p), (p = null)),
        ke(),
        typeof m == "string" && m.length !== 0)
      ) {
        const h = m.toLocaleLowerCase(),
          T = (O) => {
            const Q = e.options.find(
              (_) => String(O.value(_)).toLocaleLowerCase() === h
            );
            return Q === void 0
              ? !1
              : (c.value.indexOf(Q) === -1 ? me(Q) : he(), !0);
          },
          F = (O) => {
            T(ue) !== !0 && O !== !0 && T(G) !== !0 && xe(m, !0, () => F(!0));
          };
        F();
      } else o.clearValue(t);
    }
    function mt(t) {
      n("keypress", t);
    }
    function ht(t) {
      if ((n("keydown", t), jl(t) === !0)) return;
      const m =
          g.value.length !== 0 &&
          (e.newValueMode !== void 0 || e.onNewValue !== void 0),
        h =
          t.shiftKey !== !0 &&
          e.disableTabSelection !== !0 &&
          e.multiple !== !0 &&
          (v.value !== -1 || m === !0);
      if (t.keyCode === 27) {
        Oe(t);
        return;
      }
      if (t.keyCode === 9 && h === !1) {
        Ce();
        return;
      }
      if (
        t.target === void 0 ||
        t.target.id !== o.targetUid.value ||
        o.editable.value !== !0
      )
        return;
      if (t.keyCode === 40 && o.innerLoading.value !== !0 && u.value === !1) {
        ce(t), pe();
        return;
      }
      if (
        t.keyCode === 8 &&
        (e.useChips === !0 || e.clearable === !0) &&
        e.hideSelected !== !0 &&
        g.value.length === 0
      ) {
        e.multiple === !0 && Array.isArray(e.modelValue) === !0
          ? Ye(e.modelValue.length - 1)
          : e.multiple !== !0 &&
            e.modelValue !== null &&
            n("update:modelValue", null);
        return;
      }
      (t.keyCode === 35 || t.keyCode === 36) &&
        (typeof g.value != "string" || g.value.length === 0) &&
        (ce(t), (v.value = -1), Pe(t.keyCode === 36 ? 1 : -1, e.multiple)),
        (t.keyCode === 33 || t.keyCode === 34) &&
          ee.value !== void 0 &&
          (ce(t),
          (v.value = Math.max(
            -1,
            Math.min(
              K.value,
              v.value + (t.keyCode === 33 ? -1 : 1) * ee.value.view
            )
          )),
          Pe(t.keyCode === 33 ? 1 : -1, e.multiple)),
        (t.keyCode === 38 || t.keyCode === 40) &&
          (ce(t), Pe(t.keyCode === 38 ? -1 : 1, e.multiple));
      const T = K.value;
      if (
        ((z === void 0 || A < Date.now()) && (z = ""),
        T > 0 &&
          e.useInput !== !0 &&
          t.key !== void 0 &&
          t.key.length === 1 &&
          t.altKey === !1 &&
          t.ctrlKey === !1 &&
          t.metaKey === !1 &&
          (t.keyCode !== 32 || z.length !== 0))
      ) {
        u.value !== !0 && pe(t);
        const F = t.key.toLocaleLowerCase(),
          O = z.length === 1 && z[0] === F;
        (A = Date.now() + 1500), O === !1 && (ce(t), (z += F));
        const Q = new RegExp(
          "^" +
            z
              .split("")
              .map((Ze) => (sn.indexOf(Ze) !== -1 ? "\\" + Ze : Ze))
              .join(".*"),
          "i"
        );
        let _ = v.value;
        if (O === !0 || _ < 0 || Q.test(G.value(e.options[_])) !== !0)
          do _ = qt(_ + 1, -1, T - 1);
          while (
            _ !== v.value &&
            (be.value(e.options[_]) === !0 ||
              Q.test(G.value(e.options[_])) !== !0)
          );
        v.value !== _ &&
          se(() => {
            we(_),
              J(_),
              _ >= 0 &&
                e.useInput === !0 &&
                e.fillInput === !0 &&
                Re(G.value(e.options[_]), !0);
          });
        return;
      }
      if (
        !(
          t.keyCode !== 13 &&
          (t.keyCode !== 32 || e.useInput === !0 || z !== "") &&
          (t.keyCode !== 9 || h === !1)
        )
      ) {
        if ((t.keyCode !== 9 && ce(t), v.value !== -1 && v.value < T)) {
          me(e.options[v.value]);
          return;
        }
        if (m === !0) {
          const F = (O, Q) => {
            if (Q) {
              if (zt(Q) !== !0) return;
            } else Q = e.newValueMode;
            if ((Me("", e.multiple !== !0, !0), O == null)) return;
            (Q === "toggle" ? me : ct)(O, Q === "add-unique"),
              e.multiple !== !0 && (L.value?.focus(), he());
          };
          if (
            (e.onNewValue !== void 0 ? n("newValue", g.value, F) : F(g.value),
            e.multiple !== !0)
          )
            return;
        }
        u.value === !0 ? Ce() : o.innerLoading.value !== !0 && pe();
      }
    }
    function gt() {
      return y === !0
        ? $.value
        : B.value !== null && B.value.contentEl !== null
        ? B.value.contentEl
        : void 0;
    }
    function ul() {
      return gt();
    }
    function al() {
      return e.hideSelected === !0
        ? []
        : l["selected-item"] !== void 0
        ? ve.value.map((t) => l["selected-item"](t)).slice()
        : l.selected !== void 0
        ? [].concat(l.selected())
        : e.useChips === !0
        ? ve.value.map((t, m) =>
            q(
              ln,
              {
                key: "option-" + m,
                removable: o.editable.value === !0 && be.value(t.opt) !== !0,
                dense: !0,
                textColor: e.color,
                tabindex: re.value,
                onRemove() {
                  t.removeAtIndex(m);
                },
              },
              () =>
                q("span", {
                  class: "ellipsis",
                  [t.html === !0 ? "innerHTML" : "textContent"]: G.value(t.opt),
                })
            )
          )
        : [
            q("span", {
              class: "ellipsis",
              [ye.value === !0 ? "innerHTML" : "textContent"]: N.value,
            }),
          ];
    }
    function St() {
      if (R.value === !0)
        return l["no-option"] !== void 0
          ? l["no-option"]({ inputValue: g.value })
          : void 0;
      const t =
        l.option !== void 0
          ? l.option
          : (h) =>
              q(Yl, { key: h.index, ...h.itemProps }, () =>
                q(Ul, () =>
                  q(Xl, () =>
                    q("span", {
                      [h.html === !0 ? "innerHTML" : "textContent"]: h.label,
                    })
                  )
                )
              );
      let m = de("div", Le.value.map(t));
      return (
        l["before-options"] !== void 0 && (m = l["before-options"]().concat(m)),
        Ql(l["after-options"], m)
      );
    }
    function rl(t, m) {
      const h =
          m === !0 ? { ...Fe.value, ...o.splitAttrs.attributes.value } : void 0,
        T = {
          ref: m === !0 ? L : void 0,
          key: "i_t",
          class: V.value,
          style: e.inputStyle,
          value: g.value !== void 0 ? g.value : "",
          type: "search",
          ...h,
          id: m === !0 ? o.targetUid.value : void 0,
          maxlength: e.maxlength,
          autocomplete: e.autocomplete,
          "data-autofocus": t === !0 || e.autofocus === !0 || void 0,
          disabled: e.disable === !0,
          readonly: e.readonly === !0,
          ...nl.value,
        };
      return (
        t !== !0 &&
          y === !0 &&
          (Array.isArray(T.class) === !0
            ? (T.class = [...T.class, "no-pointer-events"])
            : (T.class += " no-pointer-events")),
        q("input", T)
      );
    }
    function yt(t) {
      C !== null && (clearTimeout(C), (C = null)),
        p !== null && (clearTimeout(p), (p = null)),
        !(t && t.target && t.target.qComposing === !0) &&
          (Re(t.target.value || ""),
          (P = !0),
          (D = g.value),
          o.focused.value !== !0 && (y !== !0 || S.value === !0) && o.focus(),
          e.onFilter !== void 0 &&
            (C = setTimeout(() => {
              (C = null), xe(g.value);
            }, e.inputDebounce)));
    }
    function Re(t, m) {
      g.value !== t &&
        ((g.value = t),
        m === !0 || e.inputDebounce === 0 || e.inputDebounce === "0"
          ? n("inputValue", t)
          : (p = setTimeout(() => {
              (p = null), n("inputValue", t);
            }, e.inputDebounce)));
    }
    function Me(t, m, h) {
      (P = h !== !0),
        e.useInput === !0 &&
          (Re(t, !0), (m === !0 || h !== !0) && (D = t), m !== !0 && xe(t));
    }
    function xe(t, m, h) {
      if (e.onFilter === void 0 || (m !== !0 && o.focused.value !== !0)) return;
      o.innerLoading.value === !0
        ? n("filterAbort")
        : ((o.innerLoading.value = !0), (s.value = !0)),
        t !== "" &&
          e.multiple !== !0 &&
          c.value.length !== 0 &&
          P !== !0 &&
          t === G.value(c.value[0]) &&
          (t = "");
      const T = setTimeout(() => {
        u.value === !0 && (u.value = !1);
      }, 10);
      w !== null && clearTimeout(w),
        (w = T),
        n(
          "filter",
          t,
          (F, O) => {
            (m === !0 || o.focused.value === !0) &&
              w === T &&
              (clearTimeout(w),
              typeof F == "function" && F(),
              (s.value = !1),
              se(() => {
                (o.innerLoading.value = !1),
                  o.editable.value === !0 &&
                    (m === !0
                      ? u.value === !0 && he()
                      : u.value === !0
                      ? Je(!0)
                      : (u.value = !0)),
                  typeof O == "function" &&
                    se(() => {
                      O(i);
                    }),
                  typeof h == "function" &&
                    se(() => {
                      h(i);
                    });
              }));
          },
          () => {
            o.focused.value === !0 &&
              w === T &&
              (clearTimeout(w), (o.innerLoading.value = !1), (s.value = !1)),
              u.value === !0 && (u.value = !1);
          }
        );
    }
    function sl() {
      return q(
        nn,
        {
          ref: B,
          class: k.value,
          style: e.popupContentStyle,
          modelValue: u.value,
          fit: e.menuShrink !== !0,
          cover: e.optionsCover === !0 && R.value !== !0 && e.useInput !== !0,
          anchor: e.menuAnchor,
          self: e.menuSelf,
          offset: e.menuOffset,
          dark: M.value,
          noParentEvent: !0,
          noRefocus: !0,
          noFocus: !0,
          noRouteDismiss: e.popupNoRouteDismiss,
          square: Xe.value,
          transitionShow: e.transitionShow,
          transitionHide: e.transitionHide,
          transitionDuration: e.transitionDuration,
          separateClosePopup: !0,
          ...fe.value,
          onScrollPassive: ne,
          onBeforeShow: wt,
          onBeforeHide: cl,
          onShow: dl,
        },
        St
      );
    }
    function cl(t) {
      xt(t), Ce();
    }
    function dl() {
      oe();
    }
    function fl(t) {
      Ve(t),
        L.value?.focus(),
        (S.value = !0),
        window.scrollTo(
          window.pageXOffset || window.scrollX || document.body.scrollLeft || 0,
          0
        );
    }
    function vl(t) {
      Ve(t),
        se(() => {
          S.value = !1;
        });
    }
    function ml() {
      const t = [
        q(
          on,
          {
            class: `col-auto ${o.fieldClass.value}`,
            ...b.value,
            for: o.targetUid.value,
            dark: M.value,
            square: !0,
            loading: s.value,
            itemAligned: !1,
            filled: !0,
            stackLabel: g.value.length !== 0,
            ...o.splitAttrs.listeners.value,
            onFocus: fl,
            onBlur: vl,
          },
          {
            ...l,
            rawControl: () => o.getControl(!0),
            before: void 0,
            after: void 0,
          }
        ),
      ];
      return (
        u.value === !0 &&
          t.push(
            q(
              "div",
              {
                ref: $,
                class: k.value + " scroll",
                style: e.popupContentStyle,
                ...fe.value,
                onClick: Oe,
                onScrollPassive: ne,
              },
              St()
            )
          ),
        q(
          Kl,
          {
            ref: W,
            modelValue: f.value,
            position: e.useInput === !0 ? "top" : void 0,
            transitionShow: U,
            transitionHide: e.transitionHide,
            transitionDuration: e.transitionDuration,
            noRouteDismiss: e.popupNoRouteDismiss,
            onBeforeShow: wt,
            onBeforeHide: hl,
            onHide: gl,
            onShow: Sl,
          },
          () =>
            q(
              "div",
              {
                class:
                  "q-select__dialog" +
                  (M.value === !0 ? " q-select__dialog--dark q-dark" : "") +
                  (S.value === !0 ? " q-select__dialog--focused" : ""),
              },
              t
            )
        )
      );
    }
    function hl(t) {
      xt(t),
        W.value !== null &&
          W.value.__updateRefocusTarget(
            o.rootRef.value.querySelector(
              ".q-field__native > [tabindex]:last-child"
            )
          ),
        (o.focused.value = !1);
    }
    function gl(t) {
      he(), o.focused.value === !1 && n("blur", t), ke();
    }
    function Sl() {
      const t = document.activeElement;
      (t === null || t.id !== o.targetUid.value) &&
        L.value !== null &&
        L.value !== t &&
        L.value.focus(),
        oe();
    }
    function Ce() {
      f.value !== !0 &&
        ((v.value = -1),
        u.value === !0 && (u.value = !1),
        o.focused.value === !1 &&
          (w !== null && (clearTimeout(w), (w = null)),
          o.innerLoading.value === !0 &&
            (n("filterAbort"), (o.innerLoading.value = !1), (s.value = !1))));
    }
    function pe(t) {
      o.editable.value === !0 &&
        (y === !0
          ? (o.onControlFocusin(t),
            (f.value = !0),
            se(() => {
              o.focus();
            }))
          : o.focus(),
        e.onFilter !== void 0
          ? xe(g.value)
          : (R.value !== !0 || l["no-option"] !== void 0) && (u.value = !0));
    }
    function he() {
      (f.value = !1), Ce();
    }
    function ke() {
      e.useInput === !0 &&
        Me(
          (e.multiple !== !0 &&
            e.fillInput === !0 &&
            c.value.length !== 0 &&
            G.value(c.value[0])) ||
            "",
          !0,
          !0
        );
    }
    function Je(t) {
      let m = -1;
      if (t === !0) {
        if (c.value.length !== 0) {
          const h = ue.value(c.value[0]);
          m = e.options.findIndex((T) => He(ue.value(T), h));
        }
        j(m);
      }
      we(m);
    }
    function yl(t, m) {
      u.value === !0 &&
        o.innerLoading.value === !1 &&
        (j(-1, !0),
        se(() => {
          u.value === !0 &&
            o.innerLoading.value === !1 &&
            (t > m ? j() : Je(!0));
        }));
    }
    function bt() {
      f.value === !1 && B.value !== null && B.value.updatePosition();
    }
    function wt(t) {
      t !== void 0 && Ve(t),
        n("popupShow", t),
        (o.hasPopupOpen = !0),
        o.onControlFocusin(t);
    }
    function xt(t) {
      t !== void 0 && Ve(t),
        n("popupHide", t),
        (o.hasPopupOpen = !1),
        o.onControlFocusout(t);
    }
    function Ct() {
      (y =
        r.platform.is.mobile !== !0 && e.behavior !== "dialog"
          ? !1
          : e.behavior !== "menu" &&
            (e.useInput === !0
              ? l["no-option"] !== void 0 ||
                e.onFilter !== void 0 ||
                R.value === !1
              : !0)),
        (U =
          r.platform.is.ios === !0 && y === !0 && e.useInput === !0
            ? "fade"
            : e.transitionShow);
    }
    return (
      Wl(Ct),
      $l(bt),
      Ct(),
      Se(() => {
        C !== null && clearTimeout(C), p !== null && clearTimeout(p);
      }),
      Object.assign(i, {
        showPopup: pe,
        hidePopup: he,
        removeAtIndex: Ye,
        add: ct,
        toggleOption: me,
        getOptionIndex: () => v.value,
        setOptionIndex: we,
        moveOptionSelection: Pe,
        filter: xe,
        updateMenuPosition: bt,
        updateInputValue: Me,
        isOptionSelected: Ge,
        getEmittingOptionValue: st,
        isOptionDisabled: (...t) => be.value.apply(null, t) === !0,
        getOptionValue: (...t) => ue.value.apply(null, t),
        getOptionLabel: (...t) => G.value.apply(null, t),
      }),
      Object.assign(o, {
        innerValue: c,
        fieldClass: x(
          () =>
            `q-select q-field--auto-height q-select--with${
              e.useInput !== !0 ? "out" : ""
            }-input q-select--with${
              e.useChips !== !0 ? "out" : ""
            }-chips q-select--${e.multiple === !0 ? "multiple" : "single"}`
        ),
        inputRef: E,
        targetRef: L,
        hasValue: H,
        showPopup: pe,
        floatingLabel: x(
          () =>
            (e.hideSelected !== !0 && H.value === !0) ||
            typeof g.value == "number" ||
            g.value.length !== 0 ||
            Vt(e.displayValue)
        ),
        getControlChild: () => {
          if (
            o.editable.value !== !1 &&
            (f.value === !0 || R.value !== !0 || l["no-option"] !== void 0)
          )
            return y === !0 ? ml() : sl();
          o.hasPopupOpen === !0 && (o.hasPopupOpen = !1);
        },
        controlEvents: {
          onFocusin(t) {
            o.onControlFocusin(t);
          },
          onFocusout(t) {
            o.onControlFocusout(t, () => {
              ke(), Ce();
            });
          },
          onClick(t) {
            if ((Oe(t), y !== !0 && u.value === !0)) {
              Ce(), L.value?.focus();
              return;
            }
            pe(t);
          },
        },
        getControl: (t) => {
          const m = al(),
            h = t === !0 || f.value !== !0 || y !== !0;
          if (e.useInput === !0) m.push(rl(t, h));
          else if (o.editable.value === !0) {
            const F = h === !0 ? Fe.value : void 0;
            m.push(
              q("input", {
                ref: h === !0 ? L : void 0,
                key: "d_t",
                class: "q-select__focus-target",
                id: h === !0 ? o.targetUid.value : void 0,
                value: N.value,
                readonly: !0,
                "data-autofocus": t === !0 || e.autofocus === !0 || void 0,
                ...F,
                onKeydown: ht,
                onKeyup: ft,
                onKeypress: mt,
              })
            ),
              h === !0 &&
                typeof e.autocomplete == "string" &&
                e.autocomplete.length !== 0 &&
                m.push(
                  q("input", {
                    class: "q-select__autocomplete-input",
                    autocomplete: e.autocomplete,
                    tabindex: -1,
                    onKeyup: vt,
                  })
                );
          }
          if (Y.value !== void 0 && e.disable !== !0 && Ie.value.length !== 0) {
            const F = Ie.value.map((O) =>
              q("option", { value: O, selected: !0 })
            );
            m.push(
              q(
                "select",
                { class: "hidden", name: Y.value, multiple: e.multiple },
                F
              )
            );
          }
          const T =
            e.useInput === !0 || h !== !0
              ? void 0
              : o.splitAttrs.attributes.value;
          return q(
            "div",
            {
              class: "q-field__native row items-center",
              ...T,
              ...o.splitAttrs.listeners.value,
            },
            m
          );
        },
        getInnerAppend: () =>
          e.loading !== !0 && s.value !== !0 && e.hideDropdownIcon !== !0
            ? [
                q(De, {
                  class:
                    "q-select__dropdown-icon" +
                    (u.value === !0 ? " rotate-180" : ""),
                  name: Ee.value,
                }),
              ]
            : null,
      }),
      Ut(o)
    );
  },
});
export {
  vn as Q,
  hn as a,
  nn as b,
  ln as c,
  it as d,
  rn as e,
  mn as f,
  on as g,
  Ue as r,
  Ht as u,
};

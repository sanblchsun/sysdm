import {
  b as N,
  aW as oe,
  a8 as re,
  r as V,
  aX as se,
  d as b,
  w as D,
  P as ue,
  h as q,
  t as ie,
  e as Q,
  Q as z,
  X as Y,
  aY as de,
  aL as R,
  aZ as ce,
  a_ as L,
  R as fe,
  aR as ve,
  a$ as me,
  a as w,
  M as be,
  o as E,
  E as U,
  n as S,
  x as $,
  k as _,
  j as A,
  l as k,
  _ as he,
  g as ye,
  C as pe,
  i as K,
  m as W,
  s as ge,
  q as G,
  v as Z,
  L as we,
  y as Ce,
  z as _e,
  aT as qe,
  a5 as O,
  az as Se,
  b0 as Be,
  a1 as I,
  b1 as F,
  $ as J,
  ao as X,
  a2 as j,
  ai as Me,
  V as Ae,
  W as De,
  al as Ve,
  aO as Pe,
  a0 as xe,
} from "./ec0ef80e.js";
import { f as $e, g as ke, u as ee, h as te, s as ae } from "./aab2a0d1.js";
import { b as ze, Q as le, d as Oe } from "./c7c9b8ae.js";
import { a as Ee, C as ne } from "./bf4a8154.js";
import { Q as Ie, a as Qe } from "./16cf54aa.js";
const Re = Object.keys(oe);
function He(e) {
  return Re.reduce((a, o) => {
    const u = e[o];
    return u !== void 0 && (a[o] = u), a;
  }, {});
}
var at = N({
    name: "QBtnDropdown",
    props: {
      ...oe,
      ...re,
      modelValue: Boolean,
      split: Boolean,
      dropdownIcon: String,
      contentClass: [Array, String, Object],
      contentStyle: [Array, String, Object],
      cover: Boolean,
      persistent: Boolean,
      noEscDismiss: Boolean,
      noRouteDismiss: Boolean,
      autoClose: Boolean,
      noRefocus: Boolean,
      noFocus: Boolean,
      menuAnchor: { type: String, default: "bottom end" },
      menuSelf: { type: String, default: "top end" },
      menuOffset: Array,
      disableMainBtn: Boolean,
      disableDropdown: Boolean,
      noIconAnimation: Boolean,
      toggleAriaLabel: String,
    },
    emits: [
      "update:modelValue",
      "click",
      "beforeShow",
      "show",
      "beforeHide",
      "hide",
    ],
    setup(e, { slots: a, emit: o }) {
      const { proxy: u } = Y(),
        t = V(e.modelValue),
        n = V(null),
        l = se(),
        c = b(() => {
          const i = {
            "aria-expanded": t.value === !0 ? "true" : "false",
            "aria-haspopup": "true",
            "aria-controls": l.value,
            "aria-label":
              e.toggleAriaLabel ||
              u.$q.lang.label[t.value === !0 ? "collapse" : "expand"](e.label),
          };
          return (
            (e.disable === !0 ||
              (e.split === !1 && e.disableMainBtn === !0) ||
              e.disableDropdown === !0) &&
              (i["aria-disabled"] = "true"),
            i
          );
        }),
        d = b(
          () =>
            "q-btn-dropdown__arrow" +
            (t.value === !0 && e.noIconAnimation === !1 ? " rotate-180" : "") +
            (e.split === !1 ? " q-btn-dropdown__arrow-container" : "")
        ),
        s = b(() => de(e)),
        m = b(() => He(e));
      D(
        () => e.modelValue,
        (i) => {
          n.value?.[i ? "show" : "hide"]();
        }
      ),
        D(() => e.split, p);
      function h(i) {
        (t.value = !0), o("beforeShow", i);
      }
      function y(i) {
        o("show", i), o("update:modelValue", !0);
      }
      function f(i) {
        (t.value = !1), o("beforeHide", i);
      }
      function v(i) {
        o("hide", i), o("update:modelValue", !1);
      }
      function M(i) {
        o("click", i);
      }
      function P(i) {
        R(i), p(), o("click", i);
      }
      function B(i) {
        n.value?.toggle(i);
      }
      function r(i) {
        n.value?.show(i);
      }
      function p(i) {
        n.value?.hide(i);
      }
      return (
        Object.assign(u, { show: r, hide: p, toggle: B }),
        ue(() => {
          e.modelValue === !0 && r();
        }),
        () => {
          const i = [
            q(ie, {
              class: d.value,
              name: e.dropdownIcon || u.$q.iconSet.arrow.dropdown,
            }),
          ];
          return (
            e.disableDropdown !== !0 &&
              i.push(
                q(
                  ze,
                  {
                    ref: n,
                    id: l.value,
                    class: e.contentClass,
                    style: e.contentStyle,
                    cover: e.cover,
                    fit: !0,
                    persistent: e.persistent,
                    noEscDismiss: e.noEscDismiss,
                    noRouteDismiss: e.noRouteDismiss,
                    autoClose: e.autoClose,
                    noFocus: e.noFocus,
                    noRefocus: e.noRefocus,
                    anchor: e.menuAnchor,
                    self: e.menuSelf,
                    offset: e.menuOffset,
                    separateClosePopup: !0,
                    transitionShow: e.transitionShow,
                    transitionHide: e.transitionHide,
                    transitionDuration: e.transitionDuration,
                    onBeforeShow: h,
                    onShow: y,
                    onBeforeHide: f,
                    onHide: v,
                  },
                  a.default
                )
              ),
            e.split === !1
              ? q(
                  z,
                  {
                    class: "q-btn-dropdown q-btn-dropdown--simple",
                    ...m.value,
                    ...c.value,
                    disable: e.disable === !0 || e.disableMainBtn === !0,
                    noWrap: !0,
                    round: !1,
                    onClick: M,
                  },
                  {
                    default: () => Q(a.label, []).concat(i),
                    loading: a.loading,
                  }
                )
              : q(
                  $e,
                  {
                    class:
                      "q-btn-dropdown q-btn-dropdown--split no-wrap q-btn-item",
                    rounded: e.rounded,
                    square: e.square,
                    ...s.value,
                    glossy: e.glossy,
                    stretch: e.stretch,
                  },
                  () => [
                    q(
                      z,
                      {
                        class: "q-btn-dropdown--current",
                        ...m.value,
                        disable: e.disable === !0 || e.disableMainBtn === !0,
                        noWrap: !0,
                        round: !1,
                        onClick: P,
                      },
                      { default: a.label, loading: a.loading }
                    ),
                    q(
                      z,
                      {
                        class: "q-btn-dropdown__arrow-container q-anchor--skip",
                        ...c.value,
                        ...s.value,
                        disable: e.disable === !0 || e.disableDropdown === !0,
                        rounded: e.rounded,
                        color: e.color,
                        textColor: e.textColor,
                        dense: e.dense,
                        size: e.size,
                        padding: e.padding,
                        ripple: e.ripple,
                      },
                      () => i
                    ),
                  ]
                )
          );
        }
      );
    },
  }),
  nt = N({
    name: "QHeader",
    props: {
      modelValue: { type: Boolean, default: !0 },
      reveal: Boolean,
      revealOffset: { type: Number, default: 250 },
      bordered: Boolean,
      elevated: Boolean,
      heightHint: { type: [String, Number], default: 50 },
    },
    emits: ["reveal", "focusin"],
    setup(e, { slots: a, emit: o }) {
      const {
          proxy: { $q: u },
        } = Y(),
        t = ce(me, L);
      if (t === L)
        return console.error("QHeader needs to be child of QLayout"), L;
      const n = V(parseInt(e.heightHint, 10)),
        l = V(!0),
        c = b(
          () =>
            e.reveal === !0 ||
            t.view.value.indexOf("H") !== -1 ||
            (u.platform.is.ios && t.isContainer.value === !0)
        ),
        d = b(() => {
          if (e.modelValue !== !0) return 0;
          if (c.value === !0) return l.value === !0 ? n.value : 0;
          const r = n.value - t.scroll.value.position;
          return r > 0 ? r : 0;
        }),
        s = b(() => e.modelValue !== !0 || (c.value === !0 && l.value !== !0)),
        m = b(() => e.modelValue === !0 && s.value === !0 && e.reveal === !0),
        h = b(
          () =>
            "q-header q-layout__section--marginal " +
            (c.value === !0 ? "fixed" : "absolute") +
            "-top" +
            (e.bordered === !0 ? " q-header--bordered" : "") +
            (s.value === !0 ? " q-header--hidden" : "") +
            (e.modelValue !== !0 ? " q-layout--prevent-focus" : "")
        ),
        y = b(() => {
          const r = t.rows.value.top,
            p = {};
          return (
            r[0] === "l" &&
              t.left.space === !0 &&
              (p[u.lang.rtl === !0 ? "right" : "left"] = `${t.left.size}px`),
            r[2] === "r" &&
              t.right.space === !0 &&
              (p[u.lang.rtl === !0 ? "left" : "right"] = `${t.right.size}px`),
            p
          );
        });
      function f(r, p) {
        t.update("header", r, p);
      }
      function v(r, p) {
        r.value !== p && (r.value = p);
      }
      function M({ height: r }) {
        v(n, r), f("size", r);
      }
      function P(r) {
        m.value === !0 && v(l, !0), o("focusin", r);
      }
      D(
        () => e.modelValue,
        (r) => {
          f("space", r), v(l, !0), t.animate();
        }
      ),
        D(d, (r) => {
          f("offset", r);
        }),
        D(
          () => e.reveal,
          (r) => {
            r === !1 && v(l, e.modelValue);
          }
        ),
        D(l, (r) => {
          t.animate(), o("reveal", r);
        }),
        D(t.scroll, (r) => {
          e.reveal === !0 &&
            v(
              l,
              r.direction === "up" ||
                r.position <= e.revealOffset ||
                r.position - r.inflectionPoint < 100
            );
        });
      const B = {};
      return (
        (t.instances.header = B),
        e.modelValue === !0 && f("size", n.value),
        f("space", e.modelValue),
        f("offset", d.value),
        fe(() => {
          t.instances.header === B &&
            ((t.instances.header = void 0),
            f("size", 0),
            f("offset", 0),
            f("space", !1));
        }),
        () => {
          const r = ve(a.default, []);
          return (
            e.elevated === !0 &&
              r.push(
                q("div", {
                  class:
                    "q-layout__shadow absolute-full overflow-hidden no-pointer-events",
                })
              ),
            r.push(q(Ee, { debounce: 0, onResize: M })),
            q("header", { class: h.value, style: y.value, onFocusin: P }, r)
          );
        }
      );
    },
  });
const C = "/accounts";
async function ot(e = {}) {
  try {
    const { data: a } = await w.get(`${C}/users/`, { params: e });
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function lt(e) {
  const a = { password: e };
  try {
    const { data: o } = await w.put(`${C}/resetpw/`, a);
    return o;
  } catch (o) {
    console.error(o);
  }
}
async function rt() {
  try {
    const { data: e } = await w.put(`${C}/reset2fa/`);
    return e;
  } catch (e) {
    console.error(e);
  }
}
async function st(e) {
  try {
    const { data: a } = await w.get(`${C}/users/${e}/sessions/`);
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function ut(e) {
  try {
    const { data: a } = await w.delete(`${C}/users/${e}/sessions/`);
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function it(e) {
  try {
    const { data: a } = await w.delete(`${C}/sessions/${e}/`);
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function dt(e = {}) {
  try {
    const { data: a } = await w.get(`${C}/roles/`, { params: e });
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function ct(e) {
  const { data: a } = await w.delete(`${C}/roles/${e}/`);
  return a;
}
async function ft(e) {
  const { data: a } = await w.post(`${C}/roles/`, e);
  return a;
}
async function vt(e, a) {
  const { data: o } = await w.put(`${C}/roles/${e}/`, a);
  return o;
}
async function mt(e = {}) {
  try {
    const { data: a } = await w.get(`${C}/apikeys/`, { params: e });
    return a;
  } catch (a) {
    console.error(a);
  }
}
async function bt(e) {
  const { data: a } = await w.post(`${C}/apikeys/`, e);
  return a;
}
async function ht(e, a) {
  const { data: o } = await w.put(`${C}/apikeys/${e}/`, a);
  return o;
}
async function yt(e) {
  const { data: a } = await w.delete(`${C}/apikeys/${e}/`);
  return a;
}
const Le = { class: "row q-gutter-sm items-center" },
  Fe = { class: "col-auto" },
  je = { class: "col-auto" },
  Te = be({
    __name: "ScriptOutputCopyClip",
    props: { label: String, data: { type: String, required: !0 } },
    setup(e) {
      const a = e,
        o = () => {
          ke(a.data);
        };
      return (u, t) => (
        E(),
        U("div", Le, [
          S("div", Fe, $(e.label), 1),
          S("div", je, [
            _(
              z,
              {
                dense: "",
                flat: "",
                size: "md",
                icon: "content_copy",
                onClick: o,
              },
              {
                default: A(() => [
                  _(le, null, {
                    default: A(() => t[0] || (t[0] = [k("Copy to Clipboard")])),
                    _: 1,
                  }),
                ]),
                _: 1,
              }
            ),
          ]),
        ])
      );
    },
  }),
  Ue = {
    name: "ScriptOutput",
    components: { ScriptOutputCopyClip: Te },
    emits: [...ee.emits],
    props: { scriptInfo: !Object },
    setup() {
      const e = ye(),
        a = b(() => e.getters.formatDate),
        { dialogRef: o, onDialogHide: u } = ee();
      return { formatDate: a, dialogRef: o, onDialogHide: u };
    },
  },
  Xe = { key: 0 },
  Ne = { key: 1 };
function Ye(e, a, o, u, t, n) {
  const l = pe("script-output-copy-clip");
  return (
    E(),
    K(
      _e,
      { ref: "dialogRef", onHide: u.onDialogHide },
      {
        default: A(() => [
          _(
            Ce,
            { class: "q-dialog-plugin", style: { "min-width": "70vw" } },
            {
              default: A(() => [
                _(Ie, null, {
                  default: A(() => [
                    a[1] || (a[1] = k(" Script Output ")),
                    _(Qe),
                    W(
                      (E(),
                      K(
                        z,
                        { dense: "", flat: "", icon: "close" },
                        {
                          default: A(() => [
                            _(
                              le,
                              { class: "bg-white text-primary" },
                              {
                                default: A(() => a[0] || (a[0] = [k("Close")])),
                                _: 1,
                              }
                            ),
                          ]),
                          _: 1,
                        }
                      )),
                      [[ne]]
                    ),
                  ]),
                  _: 1,
                }),
                _(
                  ge,
                  { style: { height: "70vh" }, class: "scroll" },
                  {
                    default: A(() => [
                      S("div", null, [
                        a[2] || (a[2] = k(" Last Run: ")),
                        S(
                          "code",
                          null,
                          $(u.formatDate(o.scriptInfo.last_run)),
                          1
                        ),
                        a[3] || (a[3] = S("br", null, null, -1)),
                        a[4] || (a[4] = k("Run Time: ")),
                        S(
                          "code",
                          null,
                          $(o.scriptInfo.execution_time) + " seconds",
                          1
                        ),
                        a[5] || (a[5] = S("br", null, null, -1)),
                        a[6] || (a[6] = k("Return Code: ")),
                        S("code", null, $(o.scriptInfo.retcode), 1),
                        a[7] || (a[7] = S("br", null, null, -1)),
                      ]),
                      a[8] || (a[8] = S("br", null, null, -1)),
                      o.scriptInfo.stdout
                        ? (E(),
                          U("div", Xe, [
                            _(
                              l,
                              {
                                label: "Standard Output",
                                data: o.scriptInfo.stdout,
                              },
                              null,
                              8,
                              ["data"]
                            ),
                            _(G),
                            S("pre", null, $(o.scriptInfo.stdout), 1),
                          ]))
                        : Z("", !0),
                      o.scriptInfo.stderr
                        ? (E(),
                          U("div", Ne, [
                            _(
                              l,
                              {
                                label: "Standard Error",
                                data: o.scriptInfo.stderr,
                              },
                              null,
                              8,
                              ["data"]
                            ),
                            _(G),
                            S("pre", null, $(o.scriptInfo.stderr), 1),
                          ]))
                        : Z("", !0),
                    ]),
                    _: 1,
                  }
                ),
                _(
                  we,
                  { align: "right" },
                  {
                    default: A(() => [
                      W(
                        _(
                          z,
                          { flat: "", dense: "", push: "", label: "Cancel" },
                          null,
                          512
                        ),
                        [[ne]]
                      ),
                    ]),
                    _: 1,
                  }
                ),
              ]),
              _: 1,
            }
          ),
        ]),
        _: 1,
      },
      8,
      ["onHide"]
    )
  );
}
var pt = he(Ue, [["render", Ye]]);
function T(e, a, o) {
  const u = X(e);
  let t,
    n = u.left - a.event.x,
    l = u.top - a.event.y,
    c = Math.abs(n),
    d = Math.abs(l);
  const s = a.direction;
  s.horizontal === !0 && s.vertical !== !0
    ? (t = n < 0 ? "left" : "right")
    : s.horizontal !== !0 && s.vertical === !0
    ? (t = l < 0 ? "up" : "down")
    : s.up === !0 && l < 0
    ? ((t = "up"),
      c > d &&
        (s.left === !0 && n < 0
          ? (t = "left")
          : s.right === !0 && n > 0 && (t = "right")))
    : s.down === !0 && l > 0
    ? ((t = "down"),
      c > d &&
        (s.left === !0 && n < 0
          ? (t = "left")
          : s.right === !0 && n > 0 && (t = "right")))
    : s.left === !0 && n < 0
    ? ((t = "left"),
      c < d &&
        (s.up === !0 && l < 0
          ? (t = "up")
          : s.down === !0 && l > 0 && (t = "down")))
    : s.right === !0 &&
      n > 0 &&
      ((t = "right"),
      c < d &&
        (s.up === !0 && l < 0
          ? (t = "up")
          : s.down === !0 && l > 0 && (t = "down")));
  let m = !1;
  if (t === void 0 && o === !1) {
    if (a.event.isFirst === !0 || a.event.lastDir === void 0) return {};
    (t = a.event.lastDir),
      (m = !0),
      t === "left" || t === "right"
        ? ((u.left -= n), (c = 0), (n = 0))
        : ((u.top -= l), (d = 0), (l = 0));
  }
  return {
    synthetic: m,
    payload: {
      evt: e,
      touch: a.event.mouse !== !0,
      mouse: a.event.mouse === !0,
      position: u,
      direction: t,
      isFirst: a.event.isFirst,
      isFinal: o === !0,
      duration: Date.now() - a.event.time,
      distance: { x: c, y: d },
      offset: { x: n, y: l },
      delta: { x: u.left - a.event.lastX, y: u.top - a.event.lastY },
    },
  };
}
let Ke = 0;
var We = qe({
    name: "touch-pan",
    beforeMount(e, { value: a, modifiers: o }) {
      if (o.mouse !== !0 && O.has.touch !== !0) return;
      function u(n, l) {
        o.mouse === !0 && l === !0
          ? Me(n)
          : (o.stop === !0 && R(n), o.prevent === !0 && J(n));
      }
      const t = {
        uid: "qvtp_" + Ke++,
        handler: a,
        modifiers: o,
        direction: te(o),
        noop: Se,
        mouseStart(n) {
          ae(n, t) &&
            Be(n) &&
            (I(t, "temp", [
              [document, "mousemove", "move", "notPassiveCapture"],
              [document, "mouseup", "end", "passiveCapture"],
            ]),
            t.start(n, !0));
        },
        touchStart(n) {
          if (ae(n, t)) {
            const l = n.target;
            I(t, "temp", [
              [l, "touchmove", "move", "notPassiveCapture"],
              [l, "touchcancel", "end", "passiveCapture"],
              [l, "touchend", "end", "passiveCapture"],
            ]),
              t.start(n);
          }
        },
        start(n, l) {
          if (
            (O.is.firefox === !0 && F(e, !0),
            (t.lastEvt = n),
            l === !0 || o.stop === !0)
          ) {
            if (
              t.direction.all !== !0 &&
              (l !== !0 ||
                (t.modifiers.mouseAllDir !== !0 &&
                  t.modifiers.mousealldir !== !0))
            ) {
              const s =
                n.type.indexOf("mouse") !== -1
                  ? new MouseEvent(n.type, n)
                  : new TouchEvent(n.type, n);
              n.defaultPrevented === !0 && J(s),
                n.cancelBubble === !0 && R(s),
                Object.assign(s, {
                  qKeyEvent: n.qKeyEvent,
                  qClickOutside: n.qClickOutside,
                  qAnchorHandled: n.qAnchorHandled,
                  qClonedBy:
                    n.qClonedBy === void 0
                      ? [t.uid]
                      : n.qClonedBy.concat(t.uid),
                }),
                (t.initialEvent = { target: n.target, event: s });
            }
            R(n);
          }
          const { left: c, top: d } = X(n);
          t.event = {
            x: c,
            y: d,
            time: Date.now(),
            mouse: l === !0,
            detected: !1,
            isFirst: !0,
            isFinal: !1,
            lastX: c,
            lastY: d,
          };
        },
        move(n) {
          if (t.event === void 0) return;
          const l = X(n),
            c = l.left - t.event.x,
            d = l.top - t.event.y;
          if (c === 0 && d === 0) return;
          t.lastEvt = n;
          const s = t.event.mouse === !0,
            m = () => {
              u(n, s);
              let f;
              o.preserveCursor !== !0 &&
                o.preservecursor !== !0 &&
                ((f = document.documentElement.style.cursor || ""),
                (document.documentElement.style.cursor = "grabbing")),
                s === !0 &&
                  document.body.classList.add("no-pointer-events--children"),
                document.body.classList.add("non-selectable"),
                Oe(),
                (t.styleCleanup = (v) => {
                  if (
                    ((t.styleCleanup = void 0),
                    f !== void 0 && (document.documentElement.style.cursor = f),
                    document.body.classList.remove("non-selectable"),
                    s === !0)
                  ) {
                    const M = () => {
                      document.body.classList.remove(
                        "no-pointer-events--children"
                      );
                    };
                    v !== void 0
                      ? setTimeout(() => {
                          M(), v();
                        }, 50)
                      : M();
                  } else v !== void 0 && v();
                });
            };
          if (t.event.detected === !0) {
            t.event.isFirst !== !0 && u(n, t.event.mouse);
            const { payload: f, synthetic: v } = T(n, t, !1);
            f !== void 0 &&
              (t.handler(f) === !1
                ? t.end(n)
                : (t.styleCleanup === void 0 && t.event.isFirst === !0 && m(),
                  (t.event.lastX = f.position.left),
                  (t.event.lastY = f.position.top),
                  (t.event.lastDir = v === !0 ? void 0 : f.direction),
                  (t.event.isFirst = !1)));
            return;
          }
          if (
            t.direction.all === !0 ||
            (s === !0 &&
              (t.modifiers.mouseAllDir === !0 ||
                t.modifiers.mousealldir === !0))
          ) {
            m(), (t.event.detected = !0), t.move(n);
            return;
          }
          const h = Math.abs(c),
            y = Math.abs(d);
          h !== y &&
            ((t.direction.horizontal === !0 && h > y) ||
            (t.direction.vertical === !0 && h < y) ||
            (t.direction.up === !0 && h < y && d < 0) ||
            (t.direction.down === !0 && h < y && d > 0) ||
            (t.direction.left === !0 && h > y && c < 0) ||
            (t.direction.right === !0 && h > y && c > 0)
              ? ((t.event.detected = !0), t.move(n))
              : t.end(n, !0));
        },
        end(n, l) {
          if (t.event !== void 0) {
            if ((j(t, "temp"), O.is.firefox === !0 && F(e, !1), l === !0))
              t.styleCleanup?.(),
                t.event.detected !== !0 &&
                  t.initialEvent !== void 0 &&
                  t.initialEvent.target.dispatchEvent(t.initialEvent.event);
            else if (t.event.detected === !0) {
              t.event.isFirst === !0 &&
                t.handler(T(n === void 0 ? t.lastEvt : n, t).payload);
              const { payload: c } = T(n === void 0 ? t.lastEvt : n, t, !0),
                d = () => {
                  t.handler(c);
                };
              t.styleCleanup !== void 0 ? t.styleCleanup(d) : d();
            }
            (t.event = void 0), (t.initialEvent = void 0), (t.lastEvt = void 0);
          }
        },
      };
      if (((e.__qtouchpan = t), o.mouse === !0)) {
        const n =
          o.mouseCapture === !0 || o.mousecapture === !0 ? "Capture" : "";
        I(t, "main", [[e, "mousedown", "mouseStart", `passive${n}`]]);
      }
      O.has.touch === !0 &&
        I(t, "main", [
          [
            e,
            "touchstart",
            "touchStart",
            `passive${o.capture === !0 ? "Capture" : ""}`,
          ],
          [e, "touchmove", "noop", "notPassiveCapture"],
        ]);
    },
    updated(e, a) {
      const o = e.__qtouchpan;
      o !== void 0 &&
        (a.oldValue !== a.value &&
          (typeof value != "function" && o.end(), (o.handler = a.value)),
        (o.direction = te(a.modifiers)));
    },
    beforeUnmount(e) {
      const a = e.__qtouchpan;
      a !== void 0 &&
        (a.event !== void 0 && a.end(),
        j(a, "main"),
        j(a, "temp"),
        O.is.firefox === !0 && F(e, !1),
        a.styleCleanup?.(),
        delete e.__qtouchpan);
    },
  }),
  gt = N({
    name: "QSplitter",
    props: {
      ...Ae,
      modelValue: { type: Number, required: !0 },
      reverse: Boolean,
      unit: {
        type: String,
        default: "%",
        validator: (e) => ["%", "px"].includes(e),
      },
      limits: {
        type: Array,
        validator: (e) =>
          e.length !== 2 || typeof e[0] != "number" || typeof e[1] != "number"
            ? !1
            : e[0] >= 0 && e[0] <= e[1],
      },
      emitImmediately: Boolean,
      horizontal: Boolean,
      disable: Boolean,
      beforeClass: [Array, String, Object],
      afterClass: [Array, String, Object],
      separatorClass: [Array, String, Object],
      separatorStyle: [Array, String, Object],
    },
    emits: ["update:modelValue"],
    setup(e, { slots: a, emit: o }) {
      const {
          proxy: { $q: u },
        } = Y(),
        t = De(e, u),
        n = V(null),
        l = { before: V(null), after: V(null) },
        c = b(
          () =>
            `q-splitter no-wrap ${
              e.horizontal === !0
                ? "q-splitter--horizontal column"
                : "q-splitter--vertical row"
            } q-splitter--${e.disable === !0 ? "disabled" : "workable"}` +
            (t.value === !0 ? " q-splitter--dark" : "")
        ),
        d = b(() => (e.horizontal === !0 ? "height" : "width")),
        s = b(() => (e.reverse !== !0 ? "before" : "after")),
        m = b(() =>
          e.limits !== void 0
            ? e.limits
            : e.unit === "%"
            ? [10, 90]
            : [50, 1 / 0]
        );
      function h(g) {
        return (e.unit === "%" ? g : Math.round(g)) + e.unit;
      }
      const y = b(() => ({ [s.value]: { [d.value]: h(e.modelValue) } }));
      let f, v, M, P, B;
      function r(g) {
        if (g.isFirst === !0) {
          const H = n.value.getBoundingClientRect()[d.value];
          (f = e.horizontal === !0 ? "up" : "left"),
            (v = e.unit === "%" ? 100 : H),
            (M = Math.min(v, m.value[1], Math.max(m.value[0], e.modelValue))),
            (P =
              (e.reverse !== !0 ? 1 : -1) *
              (e.horizontal === !0 ? 1 : u.lang.rtl === !0 ? -1 : 1) *
              (e.unit === "%" ? (H === 0 ? 0 : 100 / H) : 1)),
            n.value.classList.add("q-splitter--active");
          return;
        }
        if (g.isFinal === !0) {
          B !== e.modelValue && o("update:modelValue", B),
            n.value.classList.remove("q-splitter--active");
          return;
        }
        const x =
          M +
          P *
            (g.direction === f ? -1 : 1) *
            g.distance[e.horizontal === !0 ? "y" : "x"];
        (B = Math.min(v, m.value[1], Math.max(m.value[0], x))),
          (l[s.value].value.style[d.value] = h(B)),
          e.emitImmediately === !0 &&
            e.modelValue !== B &&
            o("update:modelValue", B);
      }
      const p = b(() => [
        [
          We,
          r,
          void 0,
          {
            [e.horizontal === !0 ? "vertical" : "horizontal"]: !0,
            prevent: !0,
            stop: !0,
            mouse: !0,
            mouseAllDir: !0,
          },
        ],
      ]);
      function i(g, x) {
        g < x[0]
          ? o("update:modelValue", x[0])
          : g > x[1] && o("update:modelValue", x[1]);
      }
      return (
        D(
          () => e.modelValue,
          (g) => {
            i(g, m.value);
          }
        ),
        D(
          () => e.limits,
          () => {
            xe(() => {
              i(e.modelValue, m.value);
            });
          }
        ),
        () => {
          const g = [
            q(
              "div",
              {
                ref: l.before,
                class: [
                  "q-splitter__panel q-splitter__before" +
                    (e.reverse === !0 ? " col" : ""),
                  e.beforeClass,
                ],
                style: y.value.before,
              },
              Q(a.before)
            ),
            q(
              "div",
              {
                class: ["q-splitter__separator", e.separatorClass],
                style: e.separatorStyle,
                "aria-disabled": e.disable === !0 ? "true" : void 0,
              },
              [
                Ve(
                  "div",
                  { class: "q-splitter__separator-area absolute-full" },
                  Q(a.separator),
                  "sep",
                  e.disable !== !0,
                  () => p.value
                ),
              ]
            ),
            q(
              "div",
              {
                ref: l.after,
                class: [
                  "q-splitter__panel q-splitter__after" +
                    (e.reverse === !0 ? "" : " col"),
                  e.afterClass,
                ],
                style: y.value.after,
              },
              Q(a.after)
            ),
          ];
          return q("div", { class: c.value, ref: n }, Pe(a.default, g));
        }
      );
    },
  });
const wt = [
    { label: "12 AM", value: 0 },
    { label: "1 AM", value: 1 },
    { label: "2 AM", value: 2 },
    { label: "3 AM", value: 3 },
    { label: "4 AM", value: 4 },
    { label: "5 AM", value: 5 },
    { label: "6 AM", value: 6 },
    { label: "7 AM", value: 7 },
    { label: "8 AM", value: 8 },
    { label: "9 AM", value: 9 },
    { label: "10 AM", value: 10 },
    { label: "11 AM", value: 11 },
    { label: "12 PM", value: 12 },
    { label: "1 PM", value: 13 },
    { label: "2 PM", value: 14 },
    { label: "3 PM", value: 15 },
    { label: "4 PM", value: 16 },
    { label: "5 PM", value: 17 },
    { label: "6 PM", value: 18 },
    { label: "7 PM", value: 19 },
    { label: "8 PM", value: 20 },
    { label: "9 PM", value: 21 },
    { label: "10 PM", value: 22 },
    { label: "11 PM", value: 23 },
  ],
  Ct = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
  ],
  _t = [
    "red",
    "pink",
    "purple",
    "deep-purple",
    "indigo",
    "blue",
    "light-blue",
    "cyan",
    "teal",
    "green",
    "light-green",
    "lime",
    "yellow",
    "amber",
    "orange",
    "deep-orange",
    "brown",
    "grey",
    "blue-grey",
  ];
export {
  at as Q,
  pt as S,
  We as T,
  Te as _,
  gt as a,
  nt as b,
  rt as c,
  dt as d,
  ht as e,
  ot as f,
  bt as g,
  mt as h,
  yt as i,
  st as j,
  it as k,
  _t as l,
  Ct as m,
  ut as n,
  vt as o,
  ft as p,
  ct as q,
  lt as r,
  wt as s,
};

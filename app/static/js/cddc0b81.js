import {
  b as c,
  V as b,
  W as v,
  d as s,
  h as n,
  e as t,
  X as q,
} from "./ec0ef80e.js";
var p = c({
    name: "QBanner",
    props: { ...b, inlineActions: Boolean, dense: Boolean, rounded: Boolean },
    setup(e, { slots: a }) {
      const {
          proxy: { $q: o },
        } = q(),
        i = v(e, o),
        d = s(
          () =>
            "q-banner row items-center" +
            (e.dense === !0 ? " q-banner--dense" : "") +
            (i.value === !0 ? " q-banner--dark q-dark" : "") +
            (e.rounded === !0 ? " rounded-borders" : "")
        ),
        u = s(
          () =>
            `q-banner__actions row items-center justify-end col-${
              e.inlineActions === !0 ? "auto" : "all"
            }`
        );
      return () => {
        const l = [
            n(
              "div",
              {
                class: "q-banner__avatar col-auto row items-center self-start",
              },
              t(a.avatar)
            ),
            n(
              "div",
              { class: "q-banner__content col text-body2" },
              t(a.default)
            ),
          ],
          r = t(a.action);
        return (
          r !== void 0 && l.push(n("div", { class: u.value }, r)),
          n(
            "div",
            {
              class:
                d.value +
                (e.inlineActions === !1 && r !== void 0
                  ? " q-banner--top-padding"
                  : ""),
              role: "alert",
            },
            l
          )
        );
      };
    },
  }),
  f = c({
    name: "QToolbar",
    props: { inset: Boolean },
    setup(e, { slots: a }) {
      const o = s(
        () =>
          "q-toolbar row no-wrap items-center" +
          (e.inset === !0 ? " q-toolbar--inset" : "")
      );
      return () => n("div", { class: o.value, role: "toolbar" }, t(a.default));
    },
  });
export { p as Q, f as a };

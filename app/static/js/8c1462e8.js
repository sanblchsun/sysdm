import { Q as O, b as p, a as c } from "./8ccb46ba.js";
import { a as b } from "./c7c9b8ae.js";
import {
  _ as k,
  r as g,
  d as V,
  o as s,
  i as m,
  cd as w,
  G as x,
  j as n,
  cK as B,
  bV as L,
  co as S,
  cB as y,
  k as _,
  l as v,
  x as h,
  E as C,
  v as u,
  bW as Q,
} from "./ec0ef80e.js";
const T = {
    name: "tactical-dropdown",
    inheritAttrs: !1,
    props: {
      modelValue: !String,
      mapOptions: { type: Boolean, default: !1 },
      multiple: { type: Boolean, default: !1 },
      filterable: { type: Boolean, default: !1 },
      options: !Array,
    },
    setup(a) {
      const o = g(!1),
        t = g(a.options);
      function l(d, e) {
        e(() => {
          if (d === "") o.value = !1;
          else {
            o.value = !0;
            const r = d.toLowerCase();
            a.mapOptions
              ? (t.value = a.options.filter((i) =>
                  i.category ? !1 : i.label.toLowerCase().indexOf(r) > -1
                ))
              : (t.value = a.options.filter(
                  (i) => i.toLowerCase().indexOf(r) > -1
                ));
          }
        });
      }
      const f = V(() => (a.filterable ? "filter" : null));
      return { filtered: o, filteredOptions: t, filterFn: l, filterEvent: f };
    },
  },
  E = ["src"];
function P(a, o, t, l, f, d) {
  return (
    s(),
    m(
      b,
      y(
        {
          dense: "",
          "options-dense": "",
          "onUpdate:modelValue":
            o[0] || (o[0] = (e) => a.$emit("update:modelValue", e)),
          options: l.filtered ? l.filteredOptions : t.options,
          "model-value": t.modelValue,
          "map-options": t.mapOptions,
          "emit-value": t.mapOptions,
          multiple: t.multiple,
          "use-chips": t.multiple,
          "use-input": t.filterable,
        },
        { [Q(l.filterEvent)]: l.filterFn },
        a.$attrs
      ),
      w(
        {
          option: n((e) => [
            e.opt.category
              ? u("", !0)
              : (s(),
                m(
                  O,
                  y({ key: 0 }, e.itemProps, {
                    class: "q-pl-lg",
                    key: t.mapOptions ? e.opt.value : e.opt,
                  }),
                  {
                    default: n(() => [
                      _(
                        c,
                        null,
                        {
                          default: n(() => [
                            _(
                              p,
                              { innerHTML: t.mapOptions ? e.opt.label : e.opt },
                              null,
                              8,
                              ["innerHTML"]
                            ),
                          ]),
                          _: 2,
                        },
                        1024
                      ),
                      (l.filtered && t.mapOptions && e.opt.cat) ||
                      e.opt.img_right
                        ? (s(),
                          m(
                            c,
                            { key: 0, side: "" },
                            {
                              default: n(() => [
                                v(h(e.opt.cat || "") + " ", 1),
                                e.opt.img_right
                                  ? (s(),
                                    C(
                                      "img",
                                      {
                                        key: 0,
                                        src: e.opt.img_right,
                                        style: {
                                          height: "20px",
                                          "max-width": "20px",
                                        },
                                      },
                                      null,
                                      8,
                                      E
                                    ))
                                  : u("", !0),
                              ]),
                              _: 2,
                            },
                            1024
                          ))
                        : u("", !0),
                    ]),
                    _: 2,
                  },
                  1040
                )),
            e.opt.category
              ? (s(),
                m(
                  p,
                  { header: "", class: "q-pa-sm", key: e.opt.category },
                  { default: n(() => [v(h(e.opt.category), 1)]), _: 2 },
                  1024
                ))
              : u("", !0),
          ]),
          _: 2,
        },
        [
          x(a.$slots, (e, r) => ({
            name: r,
            fn: n((i) => [B(a.$slots, r, L(S(i || {})))]),
          })),
        ]
      ),
      1040,
      [
        "options",
        "model-value",
        "map-options",
        "emit-value",
        "multiple",
        "use-chips",
        "use-input",
      ]
    )
  );
}
var q = k(T, [["render", P]]);
export { q as T };

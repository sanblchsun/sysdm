import {
  b as h,
  d as w,
  h as Q,
  e as D,
  i as x,
  j as i,
  K as f,
  z as O,
  o as C,
  k as s,
  s as m,
  n as g,
  x as y,
  Q as u,
  l as k,
  L as j,
  D as B,
  y as q,
  N as L,
  _ as R,
} from "./ec0ef80e.js";
import { Q as S } from "./c7c9b8ae.js";
import { u as _, g as V } from "./aab2a0d1.js";
var M = h({
  name: "QTr",
  props: { props: Object, noHover: Boolean },
  setup(e, { slots: o }) {
    const t = w(
      () =>
        "q-tr" +
        (e.props === void 0 || e.props.header === !0
          ? ""
          : " " + e.props.__trClass) +
        (e.noHover === !0 ? " q-tr--no-hover" : "")
    );
    return () =>
      Q("tr", { style: e.props?.__trStyle, class: t.value }, D(o.default));
  },
});
const $ = { class: "text-h6" },
  A = { class: "q-pa-sm" },
  F = {
    __name: "PreDialog",
    props: {
      title: { type: String, required: !0 },
      dialogStyle: { type: [String, Object], default: () => ({}) },
      message: { type: String, default: "" },
    },
    emits: [..._.emits],
    setup(e) {
      const {
        dialogRef: o,
        onDialogHide: t,
        onDialogOK: l,
        onDialogCancel: r,
      } = _();
      function a() {
        l();
      }
      return (c, d) => (
        C(),
        x(
          O,
          { ref_key: "dialogRef", ref: o, onHide: f(t) },
          {
            default: i(() => [
              s(
                q,
                { class: "q-dialog-plugin", style: B(e.dialogStyle) },
                {
                  default: i(() => [
                    s(m, null, {
                      default: i(() => [
                        g("div", $, y(e.title), 1),
                        s(
                          u,
                          {
                            dense: "",
                            flat: "",
                            size: "md",
                            icon: "content_copy",
                            onClick: d[0] || (d[0] = (p) => f(V)(e.message)),
                          },
                          {
                            default: i(() => [
                              s(S, null, {
                                default: i(
                                  () =>
                                    d[1] || (d[1] = [k("Copy to Clipboard")])
                                ),
                                _: 1,
                              }),
                            ]),
                            _: 1,
                          }
                        ),
                      ]),
                      _: 1,
                    }),
                    s(
                      m,
                      { class: "q-pt-none" },
                      { default: i(() => [g("pre", A, y(e.message), 1)]), _: 1 }
                    ),
                    s(
                      j,
                      { align: "right" },
                      {
                        default: i(() => [s(u, { label: "OK", onClick: a })]),
                        _: 1,
                      }
                    ),
                  ]),
                  _: 1,
                },
                8,
                ["style"]
              ),
            ]),
            _: 1,
          },
          8,
          ["onHide"]
        )
      );
    },
  };
function b(e) {
  setTimeout(() => {
    window.URL.revokeObjectURL(e.href);
  }, 1e4),
    e.remove();
}
function E(e, o, t = {}) {
  const {
      mimeType: l,
      byteOrderMark: r,
      encoding: a,
    } = typeof t == "string" ? { mimeType: t } : t,
    c = a !== void 0 ? new TextEncoder(a).encode([o]) : o,
    d = r !== void 0 ? [r, c] : [c],
    p = new Blob(d, { type: l || "application/octet-stream" }),
    n = document.createElement("a");
  (n.href = window.URL.createObjectURL(p)),
    n.setAttribute("download", e),
    typeof n.download > "u" && n.setAttribute("target", "_blank"),
    n.classList.add("hidden"),
    (n.style.position = "fixed"),
    document.body.appendChild(n);
  try {
    return n.click(), b(n), !0;
  } catch (T) {
    return b(n), T;
  }
}
function v(e, o) {
  let t = o !== void 0 ? o(e) : e;
  return (
    (t = t == null ? "" : String(t)), (t = t.split('"').join('""')), `"${t}"`
  );
}
function H(e, o) {
  const t = [o.map((r) => v(r.label))].concat(
    e.map((r) =>
      o
        .map((a) =>
          v(
            typeof a.field == "function"
              ? a.field(r)
              : r[a.field === void 0 ? a.name : a.field],
            a.format
          )
        )
        .join(",")
    )
  ).join(`\r
`);
  E("export.csv", t, "text/csv") !== !0 &&
    L({
      message: "Browser denied file download...",
      color: "negative",
      icon: "warning",
    });
}
const N = {
  name: "export-table-btn",
  props: { columns: !Array, data: !Array },
  setup(e) {
    return { exportTable: () => H(e.data, e.columns) };
  },
};
function K(e, o, t, l, r, a) {
  return (
    C(),
    x(
      u,
      {
        dense: "",
        color: "primary",
        "icon-right": "archive",
        onClick: l.exportTable,
      },
      {
        default: i(() => [
          s(S, null, {
            default: i(() => o[0] || (o[0] = [k("Export table as CSV")])),
            _: 1,
          }),
        ]),
        _: 1,
      },
      8,
      ["onClick"]
    )
  );
}
var G = R(N, [["render", K]]);
export { G as E, M as Q, F as _, E as e };

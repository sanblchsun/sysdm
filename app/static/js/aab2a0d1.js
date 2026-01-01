import {
  b as ae,
  d,
  h as s,
  e as re,
  X as le,
  aR as $t,
  t as qe,
  V as Ne,
  W as Qe,
  a9 as At,
  r as N,
  w as K,
  aB as mt,
  P as at,
  aD as ht,
  aC as yt,
  R as ze,
  ag as Ot,
  a3 as rt,
  aO as lt,
  aj as Mt,
  ak as Dt,
  ba as Et,
  bb as it,
  bc as et,
  bd as ut,
  be as jt,
  a0 as St,
  bf as Vt,
  p as Xe,
  bg as xe,
  Q as je,
  q as It,
  an as Nt,
  ap as Qt,
  aZ as zt,
  a_ as Ge,
  bh as wt,
  m as Ht,
  U as Ut,
  ai as Le,
  Z as Wt,
  aM as Kt,
  aJ as Xt,
  bi as Gt,
  ab as Ye,
  ac as tt,
  b2 as Yt,
  aT as Zt,
  a5 as Re,
  az as Jt,
  b0 as ea,
  a1 as Ve,
  b1 as Ze,
  ao as st,
  a2 as Je,
  ah as ta,
  bj as aa,
  bk as la,
  al as na,
} from "./ec0ef80e.js";
import { Q as oa, a as ra } from "./bf4a8154.js";
import {
  u as ia,
  e as ua,
  f as Ct,
  a as sa,
  r as ca,
  d as da,
} from "./c7c9b8ae.js";
import { n as va } from "./16cf54aa.js";
var cl = ae({
    name: "QBtnGroup",
    props: {
      unelevated: Boolean,
      outline: Boolean,
      flat: Boolean,
      rounded: Boolean,
      square: Boolean,
      push: Boolean,
      stretch: Boolean,
      glossy: Boolean,
      spread: Boolean,
    },
    setup(e, { slots: t }) {
      const n = d(() => {
        const u = [
          "unelevated",
          "outline",
          "flat",
          "rounded",
          "square",
          "push",
          "stretch",
          "glossy",
        ]
          .filter((o) => e[o] === !0)
          .map((o) => `q-btn-group--${o}`)
          .join(" ");
        return (
          `q-btn-group row no-wrap${u.length !== 0 ? " " + u : ""}` +
          (e.spread === !0 ? " q-btn-group--spread" : " inline")
        );
      });
      return () => s("div", { class: n.value }, re(t.default));
    },
  }),
  dl = ae({
    name: "QTd",
    props: { props: Object, autoWidth: Boolean, noHover: Boolean },
    setup(e, { slots: t }) {
      const n = le(),
        u = d(
          () =>
            "q-td" +
            (e.autoWidth === !0 ? " q-table--col-auto-width" : "") +
            (e.noHover === !0 ? " q-td--no-hover" : "") +
            " "
        );
      return () => {
        if (e.props === void 0)
          return s("td", { class: u.value }, re(t.default));
        const o = n.vnode.key,
          l =
            (e.props.colsMap !== void 0 ? e.props.colsMap[o] : null) ||
            e.props.col;
        if (l === void 0) return;
        const { row: i } = e.props;
        return s(
          "td",
          { class: u.value + l.__tdClass(i), style: l.__tdStyle(i) },
          re(t.default)
        );
      };
    },
  }),
  fa = ae({
    name: "QTh",
    props: { props: Object, autoWidth: Boolean },
    emits: ["click"],
    setup(e, { slots: t, emit: n }) {
      const u = le(),
        {
          proxy: { $q: o },
        } = u,
        l = (i) => {
          n("click", i);
        };
      return () => {
        if (e.props === void 0)
          return s(
            "th",
            {
              class: e.autoWidth === !0 ? "q-table--col-auto-width" : "",
              onClick: l,
            },
            re(t.default)
          );
        let i, c;
        const f = u.vnode.key;
        if (f) {
          if (((i = e.props.colsMap[f]), i === void 0)) return;
        } else i = e.props.col;
        if (i.sortable === !0) {
          const r = i.align === "right" ? "unshift" : "push";
          (c = $t(t.default, [])),
            c[r](
              s(qe, { class: i.__iconClass, name: o.iconSet.table.arrowUp })
            );
        } else c = re(t.default);
        const S = {
          class:
            i.__thClass +
            (e.autoWidth === !0 ? " q-table--col-auto-width" : ""),
          style: i.headerStyle,
          onClick: (r) => {
            i.sortable === !0 && e.props.sort(i), l(r);
          },
        };
        return s("th", S, c);
      };
    },
  });
const ba = ["horizontal", "vertical", "cell", "none"];
var ga = ae({
  name: "QMarkupTable",
  props: {
    ...Ne,
    dense: Boolean,
    flat: Boolean,
    bordered: Boolean,
    square: Boolean,
    wrapCells: Boolean,
    separator: {
      type: String,
      default: "horizontal",
      validator: (e) => ba.includes(e),
    },
  },
  setup(e, { slots: t }) {
    const n = le(),
      u = Qe(e, n.proxy.$q),
      o = d(
        () =>
          `q-markup-table q-table__container q-table__card q-table--${e.separator}-separator` +
          (u.value === !0 ? " q-table--dark q-table__card--dark q-dark" : "") +
          (e.dense === !0 ? " q-table--dense" : "") +
          (e.flat === !0 ? " q-table--flat" : "") +
          (e.bordered === !0 ? " q-table--bordered" : "") +
          (e.square === !0 ? " q-table--square" : "") +
          (e.wrapCells === !1 ? " q-table--no-wrap" : "")
      );
    return () =>
      s("div", { class: o.value }, [
        s("table", { class: "q-table" }, re(t.default)),
      ]);
  },
});
function qt(e, t) {
  return s("div", e, [s("table", { class: "q-table" }, t)]);
}
const ma = { list: oa, table: ga },
  ha = ["list", "table", "__qtable"];
var ya = ae({
  name: "QVirtualScroll",
  props: {
    ...ia,
    type: { type: String, default: "list", validator: (e) => ha.includes(e) },
    items: { type: Array, default: () => [] },
    itemsFn: Function,
    itemsSize: Number,
    scrollTarget: At,
  },
  setup(e, { slots: t, attrs: n }) {
    let u;
    const o = N(null),
      l = d(() =>
        e.itemsSize >= 0 && e.itemsFn !== void 0
          ? parseInt(e.itemsSize, 10)
          : Array.isArray(e.items)
          ? e.items.length
          : 0
      ),
      {
        virtualScrollSliceRange: i,
        localResetVirtualScroll: c,
        padVirtualScroll: f,
        onVirtualScrollEvt: S,
      } = ua({
        virtualScrollLength: l,
        getVirtualScrollTarget: T,
        getVirtualScrollEl: C,
      }),
      r = d(() => {
        if (l.value === 0) return [];
        const I = (y, R) => ({ index: i.value.from + R, item: y });
        return e.itemsFn === void 0
          ? e.items.slice(i.value.from, i.value.to).map(I)
          : e.itemsFn(i.value.from, i.value.to - i.value.from).map(I);
      }),
      h = d(
        () =>
          "q-virtual-scroll q-virtual-scroll" +
          (e.virtualScrollHorizontal === !0 ? "--horizontal" : "--vertical") +
          (e.scrollTarget !== void 0 ? "" : " scroll")
      ),
      m = d(() => (e.scrollTarget !== void 0 ? {} : { tabindex: 0 }));
    K(l, () => {
      c();
    }),
      K(
        () => e.scrollTarget,
        () => {
          w(), q();
        }
      );
    function C() {
      return o.value.$el || o.value;
    }
    function T() {
      return u;
    }
    function q() {
      (u = Ot(C(), e.scrollTarget)),
        u.addEventListener("scroll", S, rt.passive);
    }
    function w() {
      u !== void 0 &&
        (u.removeEventListener("scroll", S, rt.passive), (u = void 0));
    }
    function M() {
      let I = f(e.type === "list" ? "div" : "tbody", r.value.map(t.default));
      return t.before !== void 0 && (I = t.before().concat(I)), lt(t.after, I);
    }
    return (
      mt(() => {
        c();
      }),
      at(() => {
        q();
      }),
      ht(() => {
        q();
      }),
      yt(() => {
        w();
      }),
      ze(() => {
        w();
      }),
      () => {
        if (t.default === void 0) {
          console.error(
            "QVirtualScroll: default scoped slot is required for rendering"
          );
          return;
        }
        return e.type === "__qtable"
          ? qt({ ref: o, class: "q-table__middle " + h.value }, M())
          : s(
              ma[e.type],
              { ...n, ref: o, class: [n.class, h.value], ...m.value },
              M
            );
      }
    );
  },
});
const Sa = { xs: 2, sm: 4, md: 6, lg: 10, xl: 14 };
function ct(e, t, n) {
  return {
    transform:
      t === !0
        ? `translateX(${n.lang.rtl === !0 ? "-" : ""}100%) scale3d(${-e},1,1)`
        : `scale3d(${e},1,1)`,
  };
}
var wa = ae({
  name: "QLinearProgress",
  props: {
    ...Ne,
    ...Mt,
    value: { type: Number, default: 0 },
    buffer: Number,
    color: String,
    trackColor: String,
    reverse: Boolean,
    stripe: Boolean,
    indeterminate: Boolean,
    query: Boolean,
    rounded: Boolean,
    animationSpeed: { type: [String, Number], default: 2100 },
    instantFeedback: Boolean,
  },
  setup(e, { slots: t }) {
    const { proxy: n } = le(),
      u = Qe(e, n.$q),
      o = Dt(e, Sa),
      l = d(() => e.indeterminate === !0 || e.query === !0),
      i = d(() => e.reverse !== e.query),
      c = d(() => ({
        ...(o.value !== null ? o.value : {}),
        "--q-linear-progress-speed": `${e.animationSpeed}ms`,
      })),
      f = d(
        () =>
          "q-linear-progress" +
          (e.color !== void 0 ? ` text-${e.color}` : "") +
          (e.reverse === !0 || e.query === !0
            ? " q-linear-progress--reverse"
            : "") +
          (e.rounded === !0 ? " rounded-borders" : "")
      ),
      S = d(() => ct(e.buffer !== void 0 ? e.buffer : 1, i.value, n.$q)),
      r = d(() => `with${e.instantFeedback === !0 ? "out" : ""}-transition`),
      h = d(
        () =>
          `q-linear-progress__track absolute-full q-linear-progress__track--${
            r.value
          } q-linear-progress__track--${u.value === !0 ? "dark" : "light"}` +
          (e.trackColor !== void 0 ? ` bg-${e.trackColor}` : "")
      ),
      m = d(() => ct(l.value === !0 ? 1 : e.value, i.value, n.$q)),
      C = d(
        () =>
          `q-linear-progress__model absolute-full q-linear-progress__model--${
            r.value
          } q-linear-progress__model--${l.value === !0 ? "in" : ""}determinate`
      ),
      T = d(() => ({ width: `${e.value * 100}%` })),
      q = d(
        () =>
          `q-linear-progress__stripe absolute-${
            e.reverse === !0 ? "right" : "left"
          } q-linear-progress__stripe--${r.value}`
      );
    return () => {
      const w = [
        s("div", { class: h.value, style: S.value }),
        s("div", { class: C.value, style: m.value }),
      ];
      return (
        e.stripe === !0 &&
          l.value === !1 &&
          w.push(s("div", { class: q.value, style: T.value })),
        s(
          "div",
          {
            class: f.value,
            style: c.value,
            role: "progressbar",
            "aria-valuemin": 0,
            "aria-valuemax": 1,
            "aria-valuenow": e.indeterminate === !0 ? void 0 : e.value,
          },
          lt(t.default, w)
        )
      );
    };
  },
});
let Be = 0;
const Ca = { fullscreen: Boolean, noRouteFullscreenExit: Boolean },
  qa = ["update:fullscreen", "fullscreen"];
function _a() {
  const e = le(),
    { props: t, emit: n, proxy: u } = e;
  let o, l, i;
  const c = N(!1);
  Et(e) === !0 &&
    K(
      () => u.$route.fullPath,
      () => {
        t.noRouteFullscreenExit !== !0 && r();
      }
    ),
    K(
      () => t.fullscreen,
      (h) => {
        c.value !== h && f();
      }
    ),
    K(c, (h) => {
      n("update:fullscreen", h), n("fullscreen", h);
    });
  function f() {
    c.value === !0 ? r() : S();
  }
  function S() {
    c.value !== !0 &&
      ((c.value = !0),
      (i = u.$el.parentNode),
      i.replaceChild(l, u.$el),
      document.body.appendChild(u.$el),
      Be++,
      Be === 1 && document.body.classList.add("q-body--fullscreen-mixin"),
      (o = { handler: r }),
      it.add(o));
  }
  function r() {
    c.value === !0 &&
      (o !== void 0 && (it.remove(o), (o = void 0)),
      i.replaceChild(u.$el, l),
      (c.value = !1),
      (Be = Math.max(0, Be - 1)),
      Be === 0 &&
        (document.body.classList.remove("q-body--fullscreen-mixin"),
        u.$el.scrollIntoView !== void 0 &&
          setTimeout(() => {
            u.$el.scrollIntoView();
          })));
  }
  return (
    mt(() => {
      l = document.createElement("span");
    }),
    at(() => {
      t.fullscreen === !0 && S();
    }),
    ze(r),
    Object.assign(u, {
      toggleFullscreen: f,
      setFullscreen: S,
      exitFullscreen: r,
    }),
    { inFullscreen: c, toggleFullscreen: f }
  );
}
function Pa(e, t) {
  return new Date(e) - new Date(t);
}
const Ta = {
  sortMethod: Function,
  binaryStateSort: Boolean,
  columnSortOrder: {
    type: String,
    validator: (e) => e === "ad" || e === "da",
    default: "ad",
  },
};
function ka(e, t, n, u) {
  const o = d(() => {
      const { sortBy: c } = t.value;
      return (c && n.value.find((f) => f.name === c)) || null;
    }),
    l = d(() =>
      e.sortMethod !== void 0
        ? e.sortMethod
        : (c, f, S) => {
            const r = n.value.find((C) => C.name === f);
            if (r === void 0 || r.field === void 0) return c;
            const h = S === !0 ? -1 : 1,
              m =
                typeof r.field == "function"
                  ? (C) => r.field(C)
                  : (C) => C[r.field];
            return c.sort((C, T) => {
              let q = m(C),
                w = m(T);
              return r.rawSort !== void 0
                ? r.rawSort(q, w, C, T) * h
                : q == null
                ? -1 * h
                : w == null
                ? 1 * h
                : r.sort !== void 0
                ? r.sort(q, w, C, T) * h
                : et(q) === !0 && et(w) === !0
                ? (q - w) * h
                : ut(q) === !0 && ut(w) === !0
                ? Pa(q, w) * h
                : typeof q == "boolean" && typeof w == "boolean"
                ? (q - w) * h
                : (([q, w] = [q, w].map((M) =>
                    (M + "").toLocaleString().toLowerCase()
                  )),
                  q < w ? -1 * h : q === w ? 0 : h);
            });
          }
    );
  function i(c) {
    let f = e.columnSortOrder;
    if (jt(c) === !0) c.sortOrder && (f = c.sortOrder), (c = c.name);
    else {
      const h = n.value.find((m) => m.name === c);
      h?.sortOrder && (f = h.sortOrder);
    }
    let { sortBy: S, descending: r } = t.value;
    S !== c
      ? ((S = c), (r = f === "da"))
      : e.binaryStateSort === !0
      ? (r = !r)
      : r === !0
      ? f === "ad"
        ? (S = null)
        : (r = !1)
      : f === "ad"
      ? (r = !0)
      : (S = null),
      u({ sortBy: S, descending: r, page: 1 });
  }
  return { columnToSort: o, computedSortMethod: l, sort: i };
}
const pa = { filter: [String, Object], filterMethod: Function };
function xa(e, t) {
  const n = d(() =>
    e.filterMethod !== void 0
      ? e.filterMethod
      : (u, o, l, i) => {
          const c = o ? o.toLowerCase() : "";
          return u.filter((f) =>
            l.some((S) => {
              const r = i(S, f) + "";
              return (
                (r === "undefined" || r === "null"
                  ? ""
                  : r.toLowerCase()
                ).indexOf(c) !== -1
              );
            })
          );
        }
  );
  return (
    K(
      () => e.filter,
      () => {
        St(() => {
          t({ page: 1 }, !0);
        });
      },
      { deep: !0 }
    ),
    { computedFilterMethod: n }
  );
}
function Ra(e, t) {
  for (const n in t) if (t[n] !== e[n]) return !1;
  return !0;
}
function dt(e) {
  return (
    e.page < 1 && (e.page = 1),
    e.rowsPerPage !== void 0 && e.rowsPerPage < 1 && (e.rowsPerPage = 0),
    e
  );
}
const Ba = {
  pagination: Object,
  rowsPerPageOptions: {
    type: Array,
    default: () => [5, 7, 10, 15, 20, 25, 50, 0],
  },
  "onUpdate:pagination": [Function, Array],
};
function La(e, t) {
  const { props: n, emit: u } = e,
    o = N(
      Object.assign(
        {
          sortBy: null,
          descending: !1,
          page: 1,
          rowsPerPage:
            n.rowsPerPageOptions.length !== 0 ? n.rowsPerPageOptions[0] : 5,
        },
        n.pagination
      )
    ),
    l = d(() => {
      const r =
        n["onUpdate:pagination"] !== void 0
          ? { ...o.value, ...n.pagination }
          : o.value;
      return dt(r);
    }),
    i = d(() => l.value.rowsNumber !== void 0);
  function c(r) {
    f({ pagination: r, filter: n.filter });
  }
  function f(r = {}) {
    St(() => {
      u("request", {
        pagination: r.pagination || l.value,
        filter: r.filter || n.filter,
        getCellValue: t,
      });
    });
  }
  function S(r, h) {
    const m = dt({ ...l.value, ...r });
    if (Ra(l.value, m) === !0) {
      i.value === !0 && h === !0 && c(m);
      return;
    }
    if (i.value === !0) {
      c(m);
      return;
    }
    n.pagination !== void 0 && n["onUpdate:pagination"] !== void 0
      ? u("update:pagination", m)
      : (o.value = m);
  }
  return {
    innerPagination: o,
    computedPagination: l,
    isServerSide: i,
    requestServerInteraction: f,
    setPagination: S,
  };
}
function Fa(e, t, n, u, o, l) {
  const {
      props: i,
      emit: c,
      proxy: { $q: f },
    } = e,
    S = d(() => (u.value === !0 ? n.value.rowsNumber || 0 : l.value)),
    r = d(() => {
      const { page: R, rowsPerPage: L } = n.value;
      return (R - 1) * L;
    }),
    h = d(() => {
      const { page: R, rowsPerPage: L } = n.value;
      return R * L;
    }),
    m = d(() => n.value.page === 1),
    C = d(() =>
      n.value.rowsPerPage === 0
        ? 1
        : Math.max(1, Math.ceil(S.value / n.value.rowsPerPage))
    ),
    T = d(() => (h.value === 0 ? !0 : n.value.page >= C.value)),
    q = d(() =>
      (i.rowsPerPageOptions.includes(t.value.rowsPerPage)
        ? i.rowsPerPageOptions
        : [t.value.rowsPerPage].concat(i.rowsPerPageOptions)
      ).map((L) => ({
        label: L === 0 ? f.lang.table.allRows : "" + L,
        value: L,
      }))
    );
  K(C, (R, L) => {
    if (R === L) return;
    const D = n.value.page;
    R && !D ? o({ page: 1 }) : R < D && o({ page: R });
  });
  function w() {
    o({ page: 1 });
  }
  function M() {
    const { page: R } = n.value;
    R > 1 && o({ page: R - 1 });
  }
  function I() {
    const { page: R, rowsPerPage: L } = n.value;
    h.value > 0 && R * L < S.value && o({ page: R + 1 });
  }
  function y() {
    o({ page: C.value });
  }
  return (
    i["onUpdate:pagination"] !== void 0 &&
      c("update:pagination", { ...n.value }),
    {
      firstRowIndex: r,
      lastRowIndex: h,
      isFirstPage: m,
      isLastPage: T,
      pagesNumber: C,
      computedRowsPerPageOptions: q,
      computedRowsNumber: S,
      firstPage: w,
      prevPage: M,
      nextPage: I,
      lastPage: y,
    }
  );
}
const $a = {
    selection: {
      type: String,
      default: "none",
      validator: (e) => ["single", "multiple", "none"].includes(e),
    },
    selected: { type: Array, default: () => [] },
  },
  Aa = ["update:selected", "selection"];
function Oa(e, t, n, u) {
  const o = d(() => {
      const T = {};
      return (
        e.selected.map(u.value).forEach((q) => {
          T[q] = !0;
        }),
        T
      );
    }),
    l = d(() => e.selection !== "none"),
    i = d(() => e.selection === "single"),
    c = d(() => e.selection === "multiple"),
    f = d(
      () =>
        n.value.length !== 0 && n.value.every((T) => o.value[u.value(T)] === !0)
    ),
    S = d(
      () => f.value !== !0 && n.value.some((T) => o.value[u.value(T)] === !0)
    ),
    r = d(() => e.selected.length);
  function h(T) {
    return o.value[T] === !0;
  }
  function m() {
    t("update:selected", []);
  }
  function C(T, q, w, M) {
    t("selection", { rows: q, added: w, keys: T, evt: M });
    const I =
      i.value === !0
        ? w === !0
          ? q
          : []
        : w === !0
        ? e.selected.concat(q)
        : e.selected.filter((y) => T.includes(u.value(y)) === !1);
    t("update:selected", I);
  }
  return {
    hasSelectionMode: l,
    singleSelection: i,
    multipleSelection: c,
    allRowsSelected: f,
    someRowsSelected: S,
    rowsSelectedNumber: r,
    isRowSelected: h,
    clearSelection: m,
    updateSelection: C,
  };
}
function vt(e) {
  return Array.isArray(e) ? e.slice() : [];
}
const Ma = { expanded: Array },
  Da = ["update:expanded"];
function Ea(e, t) {
  const n = N(vt(e.expanded));
  K(
    () => e.expanded,
    (i) => {
      n.value = vt(i);
    }
  );
  function u(i) {
    return n.value.includes(i);
  }
  function o(i) {
    e.expanded !== void 0 ? t("update:expanded", i) : (n.value = i);
  }
  function l(i, c) {
    const f = n.value.slice(),
      S = f.indexOf(i);
    c === !0
      ? S === -1 && (f.push(i), o(f))
      : S !== -1 && (f.splice(S, 1), o(f));
  }
  return { isRowExpanded: u, setExpanded: o, updateExpanded: l };
}
const ja = { visibleColumns: Array };
function Va(e, t, n) {
  const u = d(() => {
      if (e.columns !== void 0) return e.columns;
      const c = e.rows[0];
      return c !== void 0
        ? Object.keys(c).map((f) => ({
            name: f,
            label: f.toUpperCase(),
            field: f,
            align: et(c[f]) ? "right" : "left",
            sortable: !0,
          }))
        : [];
    }),
    o = d(() => {
      const { sortBy: c, descending: f } = t.value;
      return (
        e.visibleColumns !== void 0
          ? u.value.filter(
              (r) =>
                r.required === !0 || e.visibleColumns.includes(r.name) === !0
            )
          : u.value
      ).map((r) => {
        const h = r.align || "right",
          m = `text-${h}`;
        return {
          ...r,
          align: h,
          __iconClass: `q-table__sort-icon q-table__sort-icon--${h}`,
          __thClass:
            m +
            (r.headerClasses !== void 0 ? " " + r.headerClasses : "") +
            (r.sortable === !0 ? " sortable" : "") +
            (r.name === c ? ` sorted ${f === !0 ? "sort-desc" : ""}` : ""),
          __tdStyle:
            r.style !== void 0
              ? typeof r.style != "function"
                ? () => r.style
                : r.style
              : () => null,
          __tdClass:
            r.classes !== void 0
              ? typeof r.classes != "function"
                ? () => m + " " + r.classes
                : (C) => m + " " + r.classes(C)
              : () => m,
        };
      });
    }),
    l = d(() => {
      const c = {};
      return (
        o.value.forEach((f) => {
          c[f.name] = f;
        }),
        c
      );
    }),
    i = d(() =>
      e.tableColspan !== void 0
        ? e.tableColspan
        : o.value.length + (n.value === !0 ? 1 : 0)
    );
  return {
    colList: u,
    computedCols: o,
    computedColsMap: l,
    computedColspan: i,
  };
}
const Ie = "q-table__bottom row items-center",
  _t = {};
Ct.forEach((e) => {
  _t[e] = {};
});
var vl = ae({
  name: "QTable",
  props: {
    rows: { type: Array, required: !0 },
    rowKey: { type: [String, Function], default: "id" },
    columns: Array,
    loading: Boolean,
    iconFirstPage: String,
    iconPrevPage: String,
    iconNextPage: String,
    iconLastPage: String,
    title: String,
    hideHeader: Boolean,
    grid: Boolean,
    gridHeader: Boolean,
    dense: Boolean,
    flat: Boolean,
    bordered: Boolean,
    square: Boolean,
    separator: {
      type: String,
      default: "horizontal",
      validator: (e) => ["horizontal", "vertical", "cell", "none"].includes(e),
    },
    wrapCells: Boolean,
    virtualScroll: Boolean,
    virtualScrollTarget: {},
    ..._t,
    noDataLabel: String,
    noResultsLabel: String,
    loadingLabel: String,
    selectedRowsLabel: Function,
    rowsPerPageLabel: String,
    paginationLabel: Function,
    color: { type: String, default: "grey-8" },
    titleClass: [String, Array, Object],
    tableStyle: [String, Array, Object],
    tableClass: [String, Array, Object],
    tableHeaderStyle: [String, Array, Object],
    tableHeaderClass: [String, Array, Object],
    tableRowStyleFn: Function,
    tableRowClassFn: Function,
    cardContainerClass: [String, Array, Object],
    cardContainerStyle: [String, Array, Object],
    cardStyle: [String, Array, Object],
    cardClass: [String, Array, Object],
    cardStyleFn: Function,
    cardClassFn: Function,
    hideBottom: Boolean,
    hideSelectedBanner: Boolean,
    hideNoData: Boolean,
    hidePagination: Boolean,
    onRowClick: Function,
    onRowDblclick: Function,
    onRowContextmenu: Function,
    ...Ne,
    ...Ca,
    ...ja,
    ...pa,
    ...Ba,
    ...Ma,
    ...$a,
    ...Ta,
  },
  emits: ["request", "virtualScroll", ...qa, ...Da, ...Aa],
  setup(e, { slots: t, emit: n }) {
    const u = le(),
      {
        proxy: { $q: o },
      } = u,
      l = Qe(e, o),
      { inFullscreen: i, toggleFullscreen: c } = _a(),
      f = d(() =>
        typeof e.rowKey == "function" ? e.rowKey : (a) => a[e.rowKey]
      ),
      S = N(null),
      r = N(null),
      h = d(() => e.grid !== !0 && e.virtualScroll === !0),
      m = d(
        () =>
          " q-table__card" +
          (l.value === !0 ? " q-table__card--dark q-dark" : "") +
          (e.square === !0 ? " q-table--square" : "") +
          (e.flat === !0 ? " q-table--flat" : "") +
          (e.bordered === !0 ? " q-table--bordered" : "")
      ),
      C = d(
        () =>
          `q-table__container q-table--${e.separator}-separator column no-wrap` +
          (e.grid === !0 ? " q-table--grid" : m.value) +
          (l.value === !0 ? " q-table--dark" : "") +
          (e.dense === !0 ? " q-table--dense" : "") +
          (e.wrapCells === !1 ? " q-table--no-wrap" : "") +
          (i.value === !0 ? " fullscreen scroll" : "")
      ),
      T = d(() => C.value + (e.loading === !0 ? " q-table--loading" : ""));
    K(
      () =>
        e.tableStyle +
        e.tableClass +
        e.tableHeaderStyle +
        e.tableHeaderClass +
        C.value,
      () => {
        h.value === !0 && r.value?.reset();
      }
    );
    const {
        innerPagination: q,
        computedPagination: w,
        isServerSide: M,
        requestServerInteraction: I,
        setPagination: y,
      } = La(u, oe),
      { computedFilterMethod: R } = xa(e, y),
      { isRowExpanded: L, setExpanded: D, updateExpanded: U } = Ea(e, n),
      Q = d(() => {
        let a = e.rows;
        if (M.value === !0 || a.length === 0) return a;
        const { sortBy: b, descending: _ } = w.value;
        return (
          e.filter && (a = R.value(a, e.filter, W.value, oe)),
          Fe.value !== null &&
            (a = $e.value(e.rows === a ? a.slice() : a, b, _)),
          a
        );
      }),
      X = d(() => Q.value.length),
      G = d(() => {
        let a = Q.value;
        if (M.value === !0) return a;
        const { rowsPerPage: b } = w.value;
        return (
          b !== 0 &&
            (be.value === 0 && e.rows !== a
              ? a.length > ge.value && (a = a.slice(0, ge.value))
              : (a = a.slice(be.value, ge.value))),
          a
        );
      }),
      {
        hasSelectionMode: ne,
        singleSelection: _e,
        multipleSelection: ve,
        allRowsSelected: k,
        someRowsSelected: $,
        rowsSelectedNumber: z,
        isRowSelected: Z,
        clearSelection: fe,
        updateSelection: ce,
      } = Oa(e, n, G, f),
      {
        colList: He,
        computedCols: W,
        computedColsMap: ie,
        computedColspan: Pe,
      } = Va(e, w, ne),
      { columnToSort: Fe, computedSortMethod: $e, sort: J } = ka(e, w, He, y),
      {
        firstRowIndex: be,
        lastRowIndex: ge,
        isFirstPage: Te,
        isLastPage: me,
        pagesNumber: he,
        computedRowsPerPageOptions: Ue,
        computedRowsNumber: ye,
        firstPage: ue,
        prevPage: Se,
        nextPage: ke,
        lastPage: pe,
      } = Fa(u, q, w, M, y, X),
      Ae = d(() => G.value.length === 0),
      Oe = d(() => {
        const a = {};
        return (
          Ct.forEach((b) => {
            a[b] = e[b];
          }),
          a.virtualScrollItemSize === void 0 &&
            (a.virtualScrollItemSize = e.dense === !0 ? 28 : 48),
          a
        );
      });
    function Me() {
      h.value === !0 && r.value.reset();
    }
    function we() {
      if (e.grid === !0) return Lt();
      const a = e.hideHeader !== !0 ? ee : null;
      if (h.value === !0) {
        const _ = t["top-row"],
          P = t["bottom-row"],
          x = { default: (V) => A(V.item, t.body, V.index) };
        if (_ !== void 0) {
          const V = s("tbody", _({ cols: W.value }));
          x.before = a === null ? () => V : () => [a()].concat(V);
        } else a !== null && (x.before = a);
        return (
          P !== void 0 && (x.after = () => s("tbody", P({ cols: W.value }))),
          s(
            ya,
            {
              ref: r,
              class: e.tableClass,
              style: e.tableStyle,
              ...Oe.value,
              scrollTarget: e.virtualScrollTarget,
              items: G.value,
              type: "__qtable",
              tableColspan: Pe.value,
              onVirtualScroll: g,
            },
            x
          )
        );
      }
      const b = [O()];
      return (
        a !== null && b.unshift(a()),
        qt(
          {
            class: ["q-table__middle scroll", e.tableClass],
            style: e.tableStyle,
          },
          b
        )
      );
    }
    function v(a, b) {
      if (r.value !== null) {
        r.value.scrollTo(a, b);
        return;
      }
      a = parseInt(a, 10);
      const _ = S.value.querySelector(`tbody tr:nth-of-type(${a + 1})`);
      if (_ !== null) {
        const P = S.value.querySelector(".q-table__middle.scroll"),
          x = _.offsetTop - e.virtualScrollStickySizeStart,
          V = x < P.scrollTop ? "decrease" : "increase";
        (P.scrollTop = x),
          n("virtualScroll", {
            index: a,
            from: 0,
            to: q.value.rowsPerPage - 1,
            direction: V,
          });
      }
    }
    function g(a) {
      n("virtualScroll", a);
    }
    function p() {
      return [
        s(wa, {
          class: "q-table__linear-progress",
          color: e.color,
          dark: l.value,
          indeterminate: !0,
          trackColor: "transparent",
        }),
      ];
    }
    function A(a, b, _) {
      const P = f.value(a),
        x = Z(P);
      if (b !== void 0) {
        const j = {
          key: P,
          row: a,
          pageIndex: _,
          __trClass: x ? "selected" : "",
        };
        if (
          (e.tableRowStyleFn !== void 0 && (j.__trStyle = e.tableRowStyleFn(a)),
          e.tableRowClassFn !== void 0)
        ) {
          const de = e.tableRowClassFn(a);
          de && (j.__trClass = `${de} ${j.__trClass}`);
        }
        return b(F(j));
      }
      const V = t["body-cell"],
        E = W.value.map((j) => {
          const de = t[`body-cell-${j.name}`],
            Ee = de !== void 0 ? de : V;
          return Ee !== void 0
            ? Ee(B({ key: P, row: a, pageIndex: _, col: j }))
            : s(
                "td",
                { class: j.__tdClass(a), style: j.__tdStyle(a) },
                oe(j, a)
              );
        });
      if (ne.value === !0) {
        const j = t["body-selection"],
          de =
            j !== void 0
              ? j(H({ key: P, row: a, pageIndex: _ }))
              : [
                  s(Xe, {
                    modelValue: x,
                    color: e.color,
                    dark: l.value,
                    dense: e.dense,
                    "onUpdate:modelValue": (Ee, Ft) => {
                      ce([P], [a], Ee, Ft);
                    },
                  }),
                ];
        E.unshift(s("td", { class: "q-table--col-auto-width" }, de));
      }
      const te = { key: P, class: { selected: x } };
      if (
        (e.onRowClick !== void 0 &&
          ((te.class["cursor-pointer"] = !0),
          (te.onClick = (j) => {
            n("rowClick", j, a, _);
          })),
        e.onRowDblclick !== void 0 &&
          ((te.class["cursor-pointer"] = !0),
          (te.onDblclick = (j) => {
            n("rowDblclick", j, a, _);
          })),
        e.onRowContextmenu !== void 0 &&
          ((te.class["cursor-pointer"] = !0),
          (te.onContextmenu = (j) => {
            n("rowContextmenu", j, a, _);
          })),
        e.tableRowStyleFn !== void 0 && (te.style = e.tableRowStyleFn(a)),
        e.tableRowClassFn !== void 0)
      ) {
        const j = e.tableRowClassFn(a);
        j && (te.class[j] = !0);
      }
      return s("tr", te, E);
    }
    function O() {
      const a = t.body,
        b = t["top-row"],
        _ = t["bottom-row"];
      let P = G.value.map((x, V) => A(x, a, V));
      return (
        b !== void 0 && (P = b({ cols: W.value }).concat(P)),
        _ !== void 0 && (P = P.concat(_({ cols: W.value }))),
        s("tbody", P)
      );
    }
    function F(a) {
      return (
        Y(a),
        (a.cols = a.cols.map((b) => xe({ ...b }, "value", () => oe(b, a.row)))),
        a
      );
    }
    function B(a) {
      return Y(a), xe(a, "value", () => oe(a.col, a.row)), a;
    }
    function H(a) {
      return Y(a), a;
    }
    function Y(a) {
      Object.assign(a, {
        cols: W.value,
        colsMap: ie.value,
        sort: J,
        rowIndex: be.value + a.pageIndex,
        color: e.color,
        dark: l.value,
        dense: e.dense,
      }),
        ne.value === !0 &&
          xe(
            a,
            "selected",
            () => Z(a.key),
            (b, _) => {
              ce([a.key], [a.row], b, _);
            }
          ),
        xe(
          a,
          "expand",
          () => L(a.key),
          (b) => {
            U(a.key, b);
          }
        );
    }
    function oe(a, b) {
      const _ = typeof a.field == "function" ? a.field(b) : b[a.field];
      return a.format !== void 0 ? a.format(_, b) : _;
    }
    const se = d(() => ({
      pagination: w.value,
      pagesNumber: he.value,
      isFirstPage: Te.value,
      isLastPage: me.value,
      firstPage: ue,
      prevPage: Se,
      nextPage: ke,
      lastPage: pe,
      inFullscreen: i.value,
      toggleFullscreen: c,
    }));
    function We() {
      const a = t.top,
        b = t["top-left"],
        _ = t["top-right"],
        P = t["top-selection"],
        x = ne.value === !0 && P !== void 0 && z.value > 0,
        V = "q-table__top relative-position row items-center";
      if (a !== void 0) return s("div", { class: V }, [a(se.value)]);
      let E;
      if (
        (x === !0
          ? (E = P(se.value).slice())
          : ((E = []),
            b !== void 0
              ? E.push(s("div", { class: "q-table__control" }, [b(se.value)]))
              : e.title &&
                E.push(
                  s("div", { class: "q-table__control" }, [
                    s(
                      "div",
                      { class: ["q-table__title", e.titleClass] },
                      e.title
                    ),
                  ])
                )),
        _ !== void 0 &&
          (E.push(s("div", { class: "q-table__separator col" })),
          E.push(s("div", { class: "q-table__control" }, [_(se.value)]))),
        E.length !== 0)
      )
        return s("div", { class: V }, E);
    }
    const Ce = d(() => ($.value === !0 ? null : k.value));
    function ee() {
      const a = kt();
      return (
        e.loading === !0 &&
          t.loading === void 0 &&
          a.push(
            s("tr", { class: "q-table__progress" }, [
              s("th", { class: "relative-position", colspan: Pe.value }, p()),
            ])
          ),
        s("thead", a)
      );
    }
    function kt() {
      const a = t.header,
        b = t["header-cell"];
      if (a !== void 0) return a(Ke({ header: !0 })).slice();
      const _ = W.value.map((P) => {
        const x = t[`header-cell-${P.name}`],
          V = x !== void 0 ? x : b,
          E = Ke({ col: P });
        return V !== void 0
          ? V(E)
          : s(fa, { key: P.name, props: E }, () => P.label);
      });
      if (_e.value === !0 && e.grid !== !0)
        _.unshift(s("th", { class: "q-table--col-auto-width" }, " "));
      else if (ve.value === !0) {
        const P = t["header-selection"],
          x =
            P !== void 0
              ? P(Ke({}))
              : [
                  s(Xe, {
                    color: e.color,
                    modelValue: Ce.value,
                    dark: l.value,
                    dense: e.dense,
                    "onUpdate:modelValue": ot,
                  }),
                ];
        _.unshift(s("th", { class: "q-table--col-auto-width" }, x));
      }
      return [
        s("tr", { class: e.tableHeaderClass, style: e.tableHeaderStyle }, _),
      ];
    }
    function Ke(a) {
      return (
        Object.assign(a, {
          cols: W.value,
          sort: J,
          colsMap: ie.value,
          color: e.color,
          dark: l.value,
          dense: e.dense,
        }),
        ve.value === !0 && xe(a, "selected", () => Ce.value, ot),
        a
      );
    }
    function ot(a) {
      $.value === !0 && (a = !1), ce(G.value.map(f.value), G.value, a);
    }
    const De = d(() => {
      const a = [
        e.iconFirstPage || o.iconSet.table.firstPage,
        e.iconPrevPage || o.iconSet.table.prevPage,
        e.iconNextPage || o.iconSet.table.nextPage,
        e.iconLastPage || o.iconSet.table.lastPage,
      ];
      return o.lang.rtl === !0 ? a.reverse() : a;
    });
    function pt() {
      if (e.hideBottom === !0) return;
      if (Ae.value === !0) {
        if (e.hideNoData === !0) return;
        const _ =
            e.loading === !0
              ? e.loadingLabel || o.lang.table.loading
              : e.filter
              ? e.noResultsLabel || o.lang.table.noResults
              : e.noDataLabel || o.lang.table.noData,
          P = t["no-data"],
          x =
            P !== void 0
              ? [
                  P({
                    message: _,
                    icon: o.iconSet.table.warning,
                    filter: e.filter,
                  }),
                ]
              : [
                  s(qe, {
                    class: "q-table__bottom-nodata-icon",
                    name: o.iconSet.table.warning,
                  }),
                  _,
                ];
        return s("div", { class: Ie + " q-table__bottom--nodata" }, x);
      }
      const a = t.bottom;
      if (a !== void 0) return s("div", { class: Ie }, [a(se.value)]);
      const b =
        e.hideSelectedBanner !== !0 && ne.value === !0 && z.value > 0
          ? [
              s("div", { class: "q-table__control" }, [
                s("div", [
                  (e.selectedRowsLabel || o.lang.table.selectedRecords)(
                    z.value
                  ),
                ]),
              ]),
            ]
          : [];
      if (e.hidePagination !== !0)
        return s("div", { class: Ie + " justify-end" }, Rt(b));
      if (b.length !== 0) return s("div", { class: Ie }, b);
    }
    function xt(a) {
      y({ page: 1, rowsPerPage: a.value });
    }
    function Rt(a) {
      let b;
      const { rowsPerPage: _ } = w.value,
        P = e.paginationLabel || o.lang.table.pagination,
        x = t.pagination,
        V = e.rowsPerPageOptions.length > 1;
      if (
        (a.push(s("div", { class: "q-table__separator col" })),
        V === !0 &&
          a.push(
            s("div", { class: "q-table__control" }, [
              s("span", { class: "q-table__bottom-item" }, [
                e.rowsPerPageLabel || o.lang.table.recordsPerPage,
              ]),
              s(sa, {
                class: "q-table__select inline q-table__bottom-item",
                color: e.color,
                modelValue: _,
                options: Ue.value,
                displayValue: _ === 0 ? o.lang.table.allRows : _,
                dark: l.value,
                borderless: !0,
                dense: !0,
                optionsDense: !0,
                optionsCover: !0,
                "onUpdate:modelValue": xt,
              }),
            ])
          ),
        x !== void 0)
      )
        b = x(se.value);
      else if (
        ((b = [
          s("span", _ !== 0 ? { class: "q-table__bottom-item" } : {}, [
            _
              ? P(be.value + 1, Math.min(ge.value, ye.value), ye.value)
              : P(1, X.value, ye.value),
          ]),
        ]),
        _ !== 0 && he.value > 1)
      ) {
        const E = { color: e.color, round: !0, dense: !0, flat: !0 };
        e.dense === !0 && (E.size = "sm"),
          he.value > 2 &&
            b.push(
              s(je, {
                key: "pgFirst",
                ...E,
                icon: De.value[0],
                disable: Te.value,
                ariaLabel: o.lang.pagination.first,
                onClick: ue,
              })
            ),
          b.push(
            s(je, {
              key: "pgPrev",
              ...E,
              icon: De.value[1],
              disable: Te.value,
              ariaLabel: o.lang.pagination.prev,
              onClick: Se,
            }),
            s(je, {
              key: "pgNext",
              ...E,
              icon: De.value[2],
              disable: me.value,
              ariaLabel: o.lang.pagination.next,
              onClick: ke,
            })
          ),
          he.value > 2 &&
            b.push(
              s(je, {
                key: "pgLast",
                ...E,
                icon: De.value[3],
                disable: me.value,
                ariaLabel: o.lang.pagination.last,
                onClick: pe,
              })
            );
      }
      return a.push(s("div", { class: "q-table__control" }, b)), a;
    }
    function Bt() {
      const a =
        e.gridHeader === !0
          ? [s("table", { class: "q-table" }, [ee()])]
          : e.loading === !0 && t.loading === void 0
          ? p()
          : void 0;
      return s("div", { class: "q-table__middle" }, a);
    }
    function Lt() {
      const a =
        t.item !== void 0
          ? t.item
          : (b) => {
              const _ = b.cols.map((x) =>
                s("div", { class: "q-table__grid-item-row" }, [
                  s("div", { class: "q-table__grid-item-title" }, [x.label]),
                  s("div", { class: "q-table__grid-item-value" }, [x.value]),
                ])
              );
              if (ne.value === !0) {
                const x = t["body-selection"],
                  V =
                    x !== void 0
                      ? x(b)
                      : [
                          s(Xe, {
                            modelValue: b.selected,
                            color: e.color,
                            dark: l.value,
                            dense: e.dense,
                            "onUpdate:modelValue": (E, te) => {
                              ce([b.key], [b.row], E, te);
                            },
                          }),
                        ];
                _.unshift(
                  s("div", { class: "q-table__grid-item-row" }, V),
                  s(It, { dark: l.value })
                );
              }
              const P = {
                class: ["q-table__grid-item-card" + m.value, e.cardClass],
                style: e.cardStyle,
              };
              if (
                (e.cardStyleFn !== void 0 &&
                  (P.style = [P.style, e.cardStyleFn(b.row)]),
                e.cardClassFn !== void 0)
              ) {
                const x = e.cardClassFn(b.row);
                x && (P.class[0] += ` ${x}`);
              }
              return (
                (e.onRowClick !== void 0 ||
                  e.onRowDblclick !== void 0 ||
                  e.onRowContextmenu !== void 0) &&
                  ((P.class[0] += " cursor-pointer"),
                  e.onRowClick !== void 0 &&
                    (P.onClick = (x) => {
                      n("RowClick", x, b.row, b.pageIndex);
                    }),
                  e.onRowDblclick !== void 0 &&
                    (P.onDblclick = (x) => {
                      n("RowDblclick", x, b.row, b.pageIndex);
                    }),
                  e.onRowContextmenu !== void 0 &&
                    (P.onContextmenu = (x) => {
                      n("rowContextmenu", x, b.row, b.pageIndex);
                    })),
                s(
                  "div",
                  {
                    class:
                      "q-table__grid-item col-xs-12 col-sm-6 col-md-4 col-lg-3" +
                      (b.selected === !0
                        ? " q-table__grid-item--selected"
                        : ""),
                  },
                  [s("div", P, _)]
                )
              );
            };
      return s(
        "div",
        {
          class: ["q-table__grid-content row", e.cardContainerClass],
          style: e.cardContainerStyle,
        },
        G.value.map((b, _) => a(F({ key: f.value(b), row: b, pageIndex: _ })))
      );
    }
    return (
      Object.assign(u.proxy, {
        requestServerInteraction: I,
        setPagination: y,
        firstPage: ue,
        prevPage: Se,
        nextPage: ke,
        lastPage: pe,
        isRowSelected: Z,
        clearSelection: fe,
        isRowExpanded: L,
        setExpanded: D,
        sort: J,
        resetVirtualScroll: Me,
        scrollTo: v,
        getCellValue: oe,
      }),
      Vt(u.proxy, {
        filteredSortedRows: () => Q.value,
        computedRows: () => G.value,
        computedRowsNumber: () => ye.value,
      }),
      () => {
        const a = [We()],
          b = { ref: S, class: T.value };
        return (
          e.grid === !0
            ? a.push(Bt())
            : Object.assign(b, {
                class: [b.class, e.cardClass],
                style: e.cardStyle,
              }),
          a.push(we(), pt()),
          e.loading === !0 && t.loading !== void 0 && a.push(t.loading()),
          s("div", b, a)
        );
      }
    );
  },
});
const Ia = () => !0;
function Na(e) {
  const t = {};
  return (
    e.forEach((n) => {
      t[n] = Ia;
    }),
    t
  );
}
function Pt() {
  const { emit: e, proxy: t } = le(),
    n = N(null);
  function u() {
    n.value.show();
  }
  function o() {
    n.value.hide();
  }
  function l(c) {
    e("ok", c), o();
  }
  function i() {
    e("hide");
  }
  return (
    Object.assign(t, { show: u, hide: o }),
    { dialogRef: n, onDialogHide: i, onDialogOK: l, onDialogCancel: o }
  );
}
const Tt = ["ok", "hide"];
Pt.emits = Tt;
Pt.emitsObject = Na(Tt);
function Qa(e) {
  const t = document.createElement("textarea");
  (t.value = e), (t.contentEditable = "true"), (t.style.position = "fixed");
  const n = () => {};
  Nt(n), document.body.appendChild(t), t.focus(), t.select();
  const u = document.execCommand("copy");
  return t.remove(), Qt(n), u;
}
function za(e) {
  return navigator.clipboard !== void 0
    ? navigator.clipboard.writeText(e)
    : new Promise((t, n) => {
        const u = Qa(e);
        u ? t(!0) : n(u);
      });
}
function fl(e) {
  za(e).then(() => {
    va("Copied to clipboard");
  });
}
let Ha = 0;
const Ua = ["click", "keydown"],
  Wa = {
    icon: String,
    label: [Number, String],
    alert: [Boolean, String],
    alertIcon: String,
    name: { type: [Number, String], default: () => `t_${Ha++}` },
    noCaps: Boolean,
    tabindex: [String, Number],
    disable: Boolean,
    contentClass: String,
    ripple: { type: [Boolean, Object], default: !0 },
  };
function Ka(e, t, n, u) {
  const o = zt(wt, Ge);
  if (o === Ge)
    return (
      console.error("QTab/QRouteTab component needs to be child of QTabs"), Ge
    );
  const { proxy: l } = le(),
    i = N(null),
    c = N(null),
    f = N(null),
    S = d(() =>
      e.disable === !0 || e.ripple === !1
        ? !1
        : Object.assign(
            { keyCodes: [13, 32], early: !0 },
            e.ripple === !0 ? {} : e.ripple
          )
    ),
    r = d(() => o.currentModel.value === e.name),
    h = d(
      () =>
        "q-tab relative-position self-stretch flex flex-center text-center" +
        (r.value === !0
          ? " q-tab--active" +
            (o.tabProps.value.activeClass
              ? " " + o.tabProps.value.activeClass
              : "") +
            (o.tabProps.value.activeColor
              ? ` text-${o.tabProps.value.activeColor}`
              : "") +
            (o.tabProps.value.activeBgColor
              ? ` bg-${o.tabProps.value.activeBgColor}`
              : "")
          : " q-tab--inactive") +
        (e.icon && e.label && o.tabProps.value.inlineLabel === !1
          ? " q-tab--full"
          : "") +
        (e.noCaps === !0 || o.tabProps.value.noCaps === !0
          ? " q-tab--no-caps"
          : "") +
        (e.disable === !0
          ? " disabled"
          : " q-focusable q-hoverable cursor-pointer") +
        (u !== void 0 ? u.linkClass.value : "")
    ),
    m = d(
      () =>
        "q-tab__content self-stretch flex-center relative-position q-anchor--skip non-selectable " +
        (o.tabProps.value.inlineLabel === !0
          ? "row no-wrap q-tab__content--inline"
          : "column") +
        (e.contentClass !== void 0 ? ` ${e.contentClass}` : "")
    ),
    C = d(() =>
      e.disable === !0 ||
      o.hasFocus.value === !0 ||
      (r.value === !1 && o.hasActiveTab.value === !0)
        ? -1
        : e.tabindex || 0
    );
  function T(y, R) {
    if (
      (R !== !0 && y?.qAvoidFocus !== !0 && i.value?.focus(), e.disable === !0)
    ) {
      u?.hasRouterLink.value === !0 && Le(y);
      return;
    }
    if (u === void 0) {
      o.updateModel({ name: e.name }), n("click", y);
      return;
    }
    if (u.hasRouterLink.value === !0) {
      const L = (D = {}) => {
        let U;
        const Q =
          D.to === void 0 || Xt(D.to, e.to) === !0
            ? (o.avoidRouteWatcher = Gt())
            : null;
        return u
          .navigateToRouterLink(y, { ...D, returnRouterError: !0 })
          .catch((X) => {
            U = X;
          })
          .then((X) => {
            if (
              (Q === o.avoidRouteWatcher &&
                ((o.avoidRouteWatcher = !1),
                U === void 0 &&
                  (X === void 0 ||
                    X.message?.startsWith("Avoided redundant navigation") ===
                      !0) &&
                  o.updateModel({ name: e.name })),
              D.returnRouterError === !0)
            )
              return U !== void 0 ? Promise.reject(U) : X;
          });
      };
      n("click", y, L), y.defaultPrevented !== !0 && L();
      return;
    }
    n("click", y);
  }
  function q(y) {
    Wt(y, [13, 32])
      ? T(y, !0)
      : Kt(y) !== !0 &&
        y.keyCode >= 35 &&
        y.keyCode <= 40 &&
        y.altKey !== !0 &&
        y.metaKey !== !0 &&
        o.onKbdNavigate(y.keyCode, l.$el) === !0 &&
        Le(y),
      n("keydown", y);
  }
  function w() {
    const y = o.tabProps.value.narrowIndicator,
      R = [],
      L = s("div", {
        ref: f,
        class: ["q-tab__indicator", o.tabProps.value.indicatorClass],
      });
    e.icon !== void 0 && R.push(s(qe, { class: "q-tab__icon", name: e.icon })),
      e.label !== void 0 &&
        R.push(s("div", { class: "q-tab__label" }, e.label)),
      e.alert !== !1 &&
        R.push(
          e.alertIcon !== void 0
            ? s(qe, {
                class: "q-tab__alert-icon",
                color: e.alert !== !0 ? e.alert : void 0,
                name: e.alertIcon,
              })
            : s("div", {
                class:
                  "q-tab__alert" + (e.alert !== !0 ? ` text-${e.alert}` : ""),
              })
        ),
      y === !0 && R.push(L);
    const D = [
      s("div", { class: "q-focus-helper", tabindex: -1, ref: i }),
      s("div", { class: m.value }, lt(t.default, R)),
    ];
    return y === !1 && D.push(L), D;
  }
  const M = {
    name: d(() => e.name),
    rootRef: c,
    tabIndicatorRef: f,
    routeData: u,
  };
  ze(() => {
    o.unregisterTab(M);
  }),
    at(() => {
      o.registerTab(M);
    });
  function I(y, R) {
    const L = {
      ref: c,
      class: h.value,
      tabindex: C.value,
      role: "tab",
      "aria-selected": r.value === !0 ? "true" : "false",
      "aria-disabled": e.disable === !0 ? "true" : void 0,
      onClick: T,
      onKeydown: q,
      ...R,
    };
    return Ht(s(y, L, w()), [[Ut, S.value]]);
  }
  return { renderTab: I, $tabs: o };
}
var bl = ae({
  name: "QTab",
  props: Wa,
  emits: Ua,
  setup(e, { slots: t, emit: n }) {
    const { renderTab: u } = Ka(e, t, n);
    return () => u("div");
  },
});
function Xa(e, t, n) {
  const u = n === !0 ? ["left", "right"] : ["top", "bottom"];
  return `absolute-${t === !0 ? u[0] : u[1]}${e ? ` text-${e}` : ""}`;
}
const Ga = ["left", "center", "right", "justify"];
var gl = ae({
  name: "QTabs",
  props: {
    modelValue: [Number, String],
    align: {
      type: String,
      default: "center",
      validator: (e) => Ga.includes(e),
    },
    breakpoint: { type: [String, Number], default: 600 },
    vertical: Boolean,
    shrink: Boolean,
    stretch: Boolean,
    activeClass: String,
    activeColor: String,
    activeBgColor: String,
    indicatorColor: String,
    leftIcon: String,
    rightIcon: String,
    outsideArrows: Boolean,
    mobileArrows: Boolean,
    switchIndicator: Boolean,
    narrowIndicator: Boolean,
    inlineLabel: Boolean,
    noCaps: Boolean,
    dense: Boolean,
    contentClass: String,
    "onUpdate:modelValue": [Function, Array],
  },
  setup(e, { slots: t, emit: n }) {
    const { proxy: u } = le(),
      { $q: o } = u,
      { registerTick: l } = Ye(),
      { registerTick: i } = Ye(),
      { registerTick: c } = Ye(),
      { registerTimeout: f, removeTimeout: S } = tt(),
      { registerTimeout: r, removeTimeout: h } = tt(),
      m = N(null),
      C = N(null),
      T = N(e.modelValue),
      q = N(!1),
      w = N(!0),
      M = N(!1),
      I = N(!1),
      y = [],
      R = N(0),
      L = N(!1);
    let D = null,
      U = null,
      Q;
    const X = d(() => ({
        activeClass: e.activeClass,
        activeColor: e.activeColor,
        activeBgColor: e.activeBgColor,
        indicatorClass: Xa(e.indicatorColor, e.switchIndicator, e.vertical),
        narrowIndicator: e.narrowIndicator,
        inlineLabel: e.inlineLabel,
        noCaps: e.noCaps,
      })),
      G = d(() => {
        const v = R.value,
          g = T.value;
        for (let p = 0; p < v; p++) if (y[p].name.value === g) return !0;
        return !1;
      }),
      ne = d(
        () =>
          `q-tabs__content--align-${
            q.value === !0 ? "left" : I.value === !0 ? "justify" : e.align
          }`
      ),
      _e = d(
        () =>
          `q-tabs row no-wrap items-center q-tabs--${
            q.value === !0 ? "" : "not-"
          }scrollable q-tabs--${
            e.vertical === !0 ? "vertical" : "horizontal"
          } q-tabs__arrows--${
            e.outsideArrows === !0 ? "outside" : "inside"
          } q-tabs--mobile-with${e.mobileArrows === !0 ? "" : "out"}-arrows` +
          (e.dense === !0 ? " q-tabs--dense" : "") +
          (e.shrink === !0 ? " col-shrink" : "") +
          (e.stretch === !0 ? " self-stretch" : "")
      ),
      ve = d(
        () =>
          "q-tabs__content scroll--mobile row no-wrap items-center self-stretch hide-scrollbar relative-position " +
          ne.value +
          (e.contentClass !== void 0 ? ` ${e.contentClass}` : "")
      ),
      k = d(() =>
        e.vertical === !0
          ? {
              container: "height",
              content: "offsetHeight",
              scroll: "scrollHeight",
            }
          : {
              container: "width",
              content: "offsetWidth",
              scroll: "scrollWidth",
            }
      ),
      $ = d(() => e.vertical !== !0 && o.lang.rtl === !0),
      z = d(() => ca === !1 && $.value === !0);
    K($, ie),
      K(
        () => e.modelValue,
        (v) => {
          Z({ name: v, setCurrent: !0, skipEmit: !0 });
        }
      ),
      K(() => e.outsideArrows, fe);
    function Z({ name: v, setCurrent: g, skipEmit: p }) {
      T.value !== v &&
        (p !== !0 &&
          e["onUpdate:modelValue"] !== void 0 &&
          n("update:modelValue", v),
        (g === !0 || e["onUpdate:modelValue"] === void 0) &&
          (He(T.value, v), (T.value = v)));
    }
    function fe() {
      l(() => {
        m.value &&
          ce({ width: m.value.offsetWidth, height: m.value.offsetHeight });
      });
    }
    function ce(v) {
      if (k.value === void 0 || C.value === null) return;
      const g = v[k.value.container],
        p = Math.min(
          C.value[k.value.scroll],
          Array.prototype.reduce.call(
            C.value.children,
            (O, F) => O + (F[k.value.content] || 0),
            0
          )
        ),
        A = g > 0 && p > g;
      (q.value = A),
        A === !0 && i(ie),
        (I.value = g < parseInt(e.breakpoint, 10));
    }
    function He(v, g) {
      const p =
          v != null && v !== "" ? y.find((O) => O.name.value === v) : null,
        A = g != null && g !== "" ? y.find((O) => O.name.value === g) : null;
      if (we === !0) we = !1;
      else if (p && A) {
        const O = p.tabIndicatorRef.value,
          F = A.tabIndicatorRef.value;
        D !== null && (clearTimeout(D), (D = null)),
          (O.style.transition = "none"),
          (O.style.transform = "none"),
          (F.style.transition = "none"),
          (F.style.transform = "none");
        const B = O.getBoundingClientRect(),
          H = F.getBoundingClientRect();
        (F.style.transform =
          e.vertical === !0
            ? `translate3d(0,${B.top - H.top}px,0) scale3d(1,${
                H.height ? B.height / H.height : 1
              },1)`
            : `translate3d(${B.left - H.left}px,0,0) scale3d(${
                H.width ? B.width / H.width : 1
              },1,1)`),
          c(() => {
            D = setTimeout(() => {
              (D = null),
                (F.style.transition =
                  "transform .25s cubic-bezier(.4, 0, .2, 1)"),
                (F.style.transform = "none");
            }, 70);
          });
      }
      A && q.value === !0 && W(A.rootRef.value);
    }
    function W(v) {
      const {
          left: g,
          width: p,
          top: A,
          height: O,
        } = C.value.getBoundingClientRect(),
        F = v.getBoundingClientRect();
      let B = e.vertical === !0 ? F.top - A : F.left - g;
      if (B < 0) {
        (C.value[e.vertical === !0 ? "scrollTop" : "scrollLeft"] +=
          Math.floor(B)),
          ie();
        return;
      }
      (B += e.vertical === !0 ? F.height - O : F.width - p),
        B > 0 &&
          ((C.value[e.vertical === !0 ? "scrollTop" : "scrollLeft"] +=
            Math.ceil(B)),
          ie());
    }
    function ie() {
      const v = C.value;
      if (v === null) return;
      const g = v.getBoundingClientRect(),
        p = e.vertical === !0 ? v.scrollTop : Math.abs(v.scrollLeft);
      $.value === !0
        ? ((w.value = Math.ceil(p + g.width) < v.scrollWidth - 1),
          (M.value = p > 0))
        : ((w.value = p > 0),
          (M.value =
            e.vertical === !0
              ? Math.ceil(p + g.height) < v.scrollHeight
              : Math.ceil(p + g.width) < v.scrollWidth));
    }
    function Pe(v) {
      U !== null && clearInterval(U),
        (U = setInterval(() => {
          Te(v) === !0 && J();
        }, 5));
    }
    function Fe() {
      Pe(z.value === !0 ? Number.MAX_SAFE_INTEGER : 0);
    }
    function $e() {
      Pe(z.value === !0 ? 0 : Number.MAX_SAFE_INTEGER);
    }
    function J() {
      U !== null && (clearInterval(U), (U = null));
    }
    function be(v, g) {
      const p = Array.prototype.filter.call(
          C.value.children,
          (H) =>
            H === g || (H.matches && H.matches(".q-tab.q-focusable") === !0)
        ),
        A = p.length;
      if (A === 0) return;
      if (v === 36) return W(p[0]), p[0].focus(), !0;
      if (v === 35) return W(p[A - 1]), p[A - 1].focus(), !0;
      const O = v === (e.vertical === !0 ? 38 : 37),
        F = v === (e.vertical === !0 ? 40 : 39),
        B = O === !0 ? -1 : F === !0 ? 1 : void 0;
      if (B !== void 0) {
        const H = $.value === !0 ? -1 : 1,
          Y = p.indexOf(g) + B * H;
        return (
          Y >= 0 && Y < A && (W(p[Y]), p[Y].focus({ preventScroll: !0 })), !0
        );
      }
    }
    const ge = d(() =>
      z.value === !0
        ? {
            get: (v) => Math.abs(v.scrollLeft),
            set: (v, g) => {
              v.scrollLeft = -g;
            },
          }
        : e.vertical === !0
        ? {
            get: (v) => v.scrollTop,
            set: (v, g) => {
              v.scrollTop = g;
            },
          }
        : {
            get: (v) => v.scrollLeft,
            set: (v, g) => {
              v.scrollLeft = g;
            },
          }
    );
    function Te(v) {
      const g = C.value,
        { get: p, set: A } = ge.value;
      let O = !1,
        F = p(g);
      const B = v < F ? -1 : 1;
      return (
        (F += B * 5),
        F < 0
          ? ((O = !0), (F = 0))
          : ((B === -1 && F <= v) || (B === 1 && F >= v)) &&
            ((O = !0), (F = v)),
        A(g, F),
        ie(),
        O
      );
    }
    function me(v, g) {
      for (const p in v) if (v[p] !== g[p]) return !1;
      return !0;
    }
    function he() {
      let v = null,
        g = { matchedLen: 0, queryDiff: 9999, hrefLen: 0 };
      const p = y.filter((B) => B.routeData?.hasRouterLink.value === !0),
        { hash: A, query: O } = u.$route,
        F = Object.keys(O).length;
      for (const B of p) {
        const H = B.routeData.exact.value === !0;
        if (
          B.routeData[H === !0 ? "linkIsExactActive" : "linkIsActive"].value !==
          !0
        )
          continue;
        const {
            hash: Y,
            query: oe,
            matched: se,
            href: We,
          } = B.routeData.resolvedLink.value,
          Ce = Object.keys(oe).length;
        if (H === !0) {
          if (Y !== A || Ce !== F || me(O, oe) === !1) continue;
          v = B.name.value;
          break;
        }
        if ((Y !== "" && Y !== A) || (Ce !== 0 && me(oe, O) === !1)) continue;
        const ee = {
          matchedLen: se.length,
          queryDiff: F - Ce,
          hrefLen: We.length - Y.length,
        };
        if (ee.matchedLen > g.matchedLen) {
          (v = B.name.value), (g = ee);
          continue;
        } else if (ee.matchedLen !== g.matchedLen) continue;
        if (ee.queryDiff < g.queryDiff) (v = B.name.value), (g = ee);
        else if (ee.queryDiff !== g.queryDiff) continue;
        ee.hrefLen > g.hrefLen && ((v = B.name.value), (g = ee));
      }
      if (
        v === null &&
        y.some((B) => B.routeData === void 0 && B.name.value === T.value) === !0
      ) {
        we = !1;
        return;
      }
      Z({ name: v, setCurrent: !0 });
    }
    function Ue(v) {
      if (
        (S(),
        L.value !== !0 &&
          m.value !== null &&
          v.target &&
          typeof v.target.closest == "function")
      ) {
        const g = v.target.closest(".q-tab");
        g &&
          m.value.contains(g) === !0 &&
          ((L.value = !0), q.value === !0 && W(g));
      }
    }
    function ye() {
      f(() => {
        L.value = !1;
      }, 30);
    }
    function ue() {
      Ae.avoidRouteWatcher === !1 ? r(he) : h();
    }
    function Se() {
      if (Q === void 0) {
        const v = K(() => u.$route.fullPath, ue);
        Q = () => {
          v(), (Q = void 0);
        };
      }
    }
    function ke(v) {
      y.push(v),
        R.value++,
        fe(),
        v.routeData === void 0 || u.$route === void 0
          ? r(() => {
              if (q.value === !0) {
                const g = T.value,
                  p =
                    g != null && g !== ""
                      ? y.find((A) => A.name.value === g)
                      : null;
                p && W(p.rootRef.value);
              }
            })
          : (Se(), v.routeData.hasRouterLink.value === !0 && ue());
    }
    function pe(v) {
      y.splice(y.indexOf(v), 1),
        R.value--,
        fe(),
        Q !== void 0 &&
          v.routeData !== void 0 &&
          (y.every((g) => g.routeData === void 0) === !0 && Q(), ue());
    }
    const Ae = {
      currentModel: T,
      tabProps: X,
      hasFocus: L,
      hasActiveTab: G,
      registerTab: ke,
      unregisterTab: pe,
      verifyRouteModel: ue,
      updateModel: Z,
      onKbdNavigate: be,
      avoidRouteWatcher: !1,
    };
    Yt(wt, Ae);
    function Oe() {
      D !== null && clearTimeout(D), J(), Q?.();
    }
    let Me, we;
    return (
      ze(Oe),
      yt(() => {
        (Me = Q !== void 0), Oe();
      }),
      ht(() => {
        Me === !0 && (Se(), (we = !0), ue()), fe();
      }),
      () =>
        s(
          "div",
          {
            ref: m,
            class: _e.value,
            role: "tablist",
            onFocusin: Ue,
            onFocusout: ye,
          },
          [
            s(ra, { onResize: ce }),
            s("div", { ref: C, class: ve.value, onScroll: ie }, re(t.default)),
            s(qe, {
              class:
                "q-tabs__arrow q-tabs__arrow--left absolute q-tab__icon" +
                (w.value === !0 ? "" : " q-tabs__arrow--faded"),
              name:
                e.leftIcon || o.iconSet.tabs[e.vertical === !0 ? "up" : "left"],
              onMousedownPassive: Fe,
              onTouchstartPassive: Fe,
              onMouseupPassive: J,
              onMouseleavePassive: J,
              onTouchendPassive: J,
            }),
            s(qe, {
              class:
                "q-tabs__arrow q-tabs__arrow--right absolute q-tab__icon" +
                (M.value === !0 ? "" : " q-tabs__arrow--faded"),
              name:
                e.rightIcon ||
                o.iconSet.tabs[e.vertical === !0 ? "down" : "right"],
              onMousedownPassive: $e,
              onTouchstartPassive: $e,
              onMouseupPassive: J,
              onMouseleavePassive: J,
              onTouchendPassive: J,
            }),
          ]
        )
    );
  },
});
const nt = {
    left: !0,
    right: !0,
    up: !0,
    down: !0,
    horizontal: !0,
    vertical: !0,
  },
  Ya = Object.keys(nt);
nt.all = !0;
function ft(e) {
  const t = {};
  for (const n of Ya) e[n] === !0 && (t[n] = !0);
  return Object.keys(t).length === 0
    ? nt
    : (t.horizontal === !0
        ? (t.left = t.right = !0)
        : t.left === !0 && t.right === !0 && (t.horizontal = !0),
      t.vertical === !0
        ? (t.up = t.down = !0)
        : t.up === !0 && t.down === !0 && (t.vertical = !0),
      t.horizontal === !0 && t.vertical === !0 && (t.all = !0),
      t);
}
const Za = ["INPUT", "TEXTAREA"];
function bt(e, t) {
  return (
    t.event === void 0 &&
    e.target !== void 0 &&
    e.target.draggable !== !0 &&
    typeof t.handler == "function" &&
    Za.includes(e.target.nodeName.toUpperCase()) === !1 &&
    (e.qClonedBy === void 0 || e.qClonedBy.indexOf(t.uid) === -1)
  );
}
function Ja(e) {
  const t = [0.06, 6, 50];
  return (
    typeof e == "string" &&
      e.length &&
      e.split(":").forEach((n, u) => {
        const o = parseFloat(n);
        o && (t[u] = o);
      }),
    t
  );
}
var el = Zt({
  name: "touch-swipe",
  beforeMount(e, { value: t, arg: n, modifiers: u }) {
    if (u.mouse !== !0 && Re.has.touch !== !0) return;
    const o = u.mouseCapture === !0 ? "Capture" : "",
      l = {
        handler: t,
        sensitivity: Ja(n),
        direction: ft(u),
        noop: Jt,
        mouseStart(i) {
          bt(i, l) &&
            ea(i) &&
            (Ve(l, "temp", [
              [document, "mousemove", "move", `notPassive${o}`],
              [document, "mouseup", "end", "notPassiveCapture"],
            ]),
            l.start(i, !0));
        },
        touchStart(i) {
          if (bt(i, l)) {
            const c = i.target;
            Ve(l, "temp", [
              [c, "touchmove", "move", "notPassiveCapture"],
              [c, "touchcancel", "end", "notPassiveCapture"],
              [c, "touchend", "end", "notPassiveCapture"],
            ]),
              l.start(i);
          }
        },
        start(i, c) {
          Re.is.firefox === !0 && Ze(e, !0);
          const f = st(i);
          l.event = {
            x: f.left,
            y: f.top,
            time: Date.now(),
            mouse: c === !0,
            dir: !1,
          };
        },
        move(i) {
          if (l.event === void 0) return;
          if (l.event.dir !== !1) {
            Le(i);
            return;
          }
          const c = Date.now() - l.event.time;
          if (c === 0) return;
          const f = st(i),
            S = f.left - l.event.x,
            r = Math.abs(S),
            h = f.top - l.event.y,
            m = Math.abs(h);
          if (l.event.mouse !== !0) {
            if (r < l.sensitivity[1] && m < l.sensitivity[1]) {
              l.end(i);
              return;
            }
          } else if (window.getSelection().toString() !== "") {
            l.end(i);
            return;
          } else if (r < l.sensitivity[2] && m < l.sensitivity[2]) return;
          const C = r / c,
            T = m / c;
          l.direction.vertical === !0 &&
            r < m &&
            r < 100 &&
            T > l.sensitivity[0] &&
            (l.event.dir = h < 0 ? "up" : "down"),
            l.direction.horizontal === !0 &&
              r > m &&
              m < 100 &&
              C > l.sensitivity[0] &&
              (l.event.dir = S < 0 ? "left" : "right"),
            l.direction.up === !0 &&
              r < m &&
              h < 0 &&
              r < 100 &&
              T > l.sensitivity[0] &&
              (l.event.dir = "up"),
            l.direction.down === !0 &&
              r < m &&
              h > 0 &&
              r < 100 &&
              T > l.sensitivity[0] &&
              (l.event.dir = "down"),
            l.direction.left === !0 &&
              r > m &&
              S < 0 &&
              m < 100 &&
              C > l.sensitivity[0] &&
              (l.event.dir = "left"),
            l.direction.right === !0 &&
              r > m &&
              S > 0 &&
              m < 100 &&
              C > l.sensitivity[0] &&
              (l.event.dir = "right"),
            l.event.dir !== !1
              ? (Le(i),
                l.event.mouse === !0 &&
                  (document.body.classList.add("no-pointer-events--children"),
                  document.body.classList.add("non-selectable"),
                  da(),
                  (l.styleCleanup = (q) => {
                    (l.styleCleanup = void 0),
                      document.body.classList.remove("non-selectable");
                    const w = () => {
                      document.body.classList.remove(
                        "no-pointer-events--children"
                      );
                    };
                    q === !0 ? setTimeout(w, 50) : w();
                  })),
                l.handler({
                  evt: i,
                  touch: l.event.mouse !== !0,
                  mouse: l.event.mouse,
                  direction: l.event.dir,
                  duration: c,
                  distance: { x: r, y: m },
                }))
              : l.end(i);
        },
        end(i) {
          l.event !== void 0 &&
            (Je(l, "temp"),
            Re.is.firefox === !0 && Ze(e, !1),
            l.styleCleanup?.(!0),
            i !== void 0 && l.event.dir !== !1 && Le(i),
            (l.event = void 0));
        },
      };
    if (((e.__qtouchswipe = l), u.mouse === !0)) {
      const i = u.mouseCapture === !0 || u.mousecapture === !0 ? "Capture" : "";
      Ve(l, "main", [[e, "mousedown", "mouseStart", `passive${i}`]]);
    }
    Re.has.touch === !0 &&
      Ve(l, "main", [
        [
          e,
          "touchstart",
          "touchStart",
          `passive${u.capture === !0 ? "Capture" : ""}`,
        ],
        [e, "touchmove", "noop", "notPassiveCapture"],
      ]);
  },
  updated(e, t) {
    const n = e.__qtouchswipe;
    n !== void 0 &&
      (t.oldValue !== t.value &&
        (typeof t.value != "function" && n.end(), (n.handler = t.value)),
      (n.direction = ft(t.modifiers)));
  },
  beforeUnmount(e) {
    const t = e.__qtouchswipe;
    t !== void 0 &&
      (Je(t, "main"),
      Je(t, "temp"),
      Re.is.firefox === !0 && Ze(e, !1),
      t.styleCleanup?.(),
      delete e.__qtouchswipe);
  },
});
function tl() {
  let e = Object.create(null);
  return {
    getCache: (t, n) =>
      e[t] === void 0 ? (e[t] = typeof n == "function" ? n() : n) : e[t],
    setCache(t, n) {
      e[t] = n;
    },
    hasCache(t) {
      return Object.hasOwnProperty.call(e, t);
    },
    clearCache(t) {
      t !== void 0 ? delete e[t] : (e = Object.create(null));
    },
  };
}
const al = { name: { required: !0 }, disable: Boolean },
  gt = {
    setup(e, { slots: t }) {
      return () =>
        s("div", { class: "q-panel scroll", role: "tabpanel" }, re(t.default));
    },
  },
  ll = {
    modelValue: { required: !0 },
    animated: Boolean,
    infinite: Boolean,
    swipeable: Boolean,
    vertical: Boolean,
    transitionPrev: String,
    transitionNext: String,
    transitionDuration: { type: [String, Number], default: 300 },
    keepAlive: Boolean,
    keepAliveInclude: [String, Array, RegExp],
    keepAliveExclude: [String, Array, RegExp],
    keepAliveMax: Number,
  },
  nl = ["update:modelValue", "beforeTransition", "transition"];
function ol() {
  const { props: e, emit: t, proxy: n } = le(),
    { getCache: u } = tl(),
    { registerTimeout: o } = tt();
  let l, i;
  const c = N(null),
    f = { value: null };
  function S(k) {
    const $ = e.vertical === !0 ? "up" : "left";
    Q((n.$q.lang.rtl === !0 ? -1 : 1) * (k.direction === $ ? 1 : -1));
  }
  const r = d(() => [
      [
        el,
        S,
        void 0,
        { horizontal: e.vertical !== !0, vertical: e.vertical, mouse: !0 },
      ],
    ]),
    h = d(
      () => e.transitionPrev || `slide-${e.vertical === !0 ? "down" : "right"}`
    ),
    m = d(
      () => e.transitionNext || `slide-${e.vertical === !0 ? "up" : "left"}`
    ),
    C = d(() => `--q-transition-duration: ${e.transitionDuration}ms`),
    T = d(() =>
      typeof e.modelValue == "string" || typeof e.modelValue == "number"
        ? e.modelValue
        : String(e.modelValue)
    ),
    q = d(() => ({
      include: e.keepAliveInclude,
      exclude: e.keepAliveExclude,
      max: e.keepAliveMax,
    })),
    w = d(() => e.keepAliveInclude !== void 0 || e.keepAliveExclude !== void 0);
  K(
    () => e.modelValue,
    (k, $) => {
      const z = R(k) === !0 ? L(k) : -1;
      i !== !0 && U(z === -1 ? 0 : z < L($) ? -1 : 1),
        f.value !== z &&
          ((f.value = z),
          t("beforeTransition", k, $),
          o(() => {
            t("transition", k, $);
          }, e.transitionDuration));
    }
  );
  function M() {
    Q(1);
  }
  function I() {
    Q(-1);
  }
  function y(k) {
    t("update:modelValue", k);
  }
  function R(k) {
    return k != null && k !== "";
  }
  function L(k) {
    return l.findIndex(
      ($) =>
        $.props.name === k && $.props.disable !== "" && $.props.disable !== !0
    );
  }
  function D() {
    return l.filter((k) => k.props.disable !== "" && k.props.disable !== !0);
  }
  function U(k) {
    const $ =
      k !== 0 && e.animated === !0 && f.value !== -1
        ? "q-transition--" + (k === -1 ? h.value : m.value)
        : null;
    c.value !== $ && (c.value = $);
  }
  function Q(k, $ = f.value) {
    let z = $ + k;
    for (; z !== -1 && z < l.length; ) {
      const Z = l[z];
      if (Z !== void 0 && Z.props.disable !== "" && Z.props.disable !== !0) {
        U(k),
          (i = !0),
          t("update:modelValue", Z.props.name),
          setTimeout(() => {
            i = !1;
          });
        return;
      }
      z += k;
    }
    e.infinite === !0 &&
      l.length !== 0 &&
      $ !== -1 &&
      $ !== l.length &&
      Q(k, k === -1 ? l.length : -1);
  }
  function X() {
    const k = L(e.modelValue);
    return f.value !== k && (f.value = k), !0;
  }
  function G() {
    const k = R(e.modelValue) === !0 && X() && l[f.value];
    return e.keepAlive === !0
      ? [
          s(la, q.value, [
            s(
              w.value === !0
                ? u(T.value, () => ({ ...gt, name: T.value }))
                : gt,
              { key: T.value, style: C.value },
              () => k
            ),
          ]),
        ]
      : [
          s(
            "div",
            {
              class: "q-panel scroll",
              style: C.value,
              key: T.value,
              role: "tabpanel",
            },
            [k]
          ),
        ];
  }
  function ne() {
    if (l.length !== 0)
      return e.animated === !0 ? [s(ta, { name: c.value }, G)] : G();
  }
  function _e(k) {
    return (
      (l = aa(re(k.default, [])).filter(
        ($) =>
          $.props !== null && $.props.slot === void 0 && R($.props.name) === !0
      )),
      l.length
    );
  }
  function ve() {
    return l;
  }
  return (
    Object.assign(n, { next: M, previous: I, goTo: y }),
    {
      panelIndex: f,
      panelDirectives: r,
      updatePanelsList: _e,
      updatePanelIndex: X,
      getPanelContent: ne,
      getEnabledPanels: D,
      getPanels: ve,
      isValidPanelName: R,
      keepAliveProps: q,
      needsUniqueKeepAliveWrapper: w,
      goToPanelByOffset: Q,
      goToPanel: y,
      nextPanel: M,
      previousPanel: I,
    }
  );
}
var ml = ae({
    name: "QTabPanel",
    props: al,
    setup(e, { slots: t }) {
      return () =>
        s("div", { class: "q-tab-panel", role: "tabpanel" }, re(t.default));
    },
  }),
  hl = ae({
    name: "QTabPanels",
    props: { ...ll, ...Ne },
    emits: nl,
    setup(e, { slots: t }) {
      const n = le(),
        u = Qe(e, n.proxy.$q),
        { updatePanelsList: o, getPanelContent: l, panelDirectives: i } = ol(),
        c = d(
          () =>
            "q-tab-panels q-panel-parent" +
            (u.value === !0 ? " q-tab-panels--dark q-dark" : "")
        );
      return () => (
        o(t),
        na("div", { class: c.value }, l(), "pan", e.swipeable, () => i.value)
      );
    },
  });
export {
  vl as Q,
  dl as a,
  gl as b,
  bl as c,
  hl as d,
  ml as e,
  cl as f,
  fl as g,
  ft as h,
  wa as i,
  fa as j,
  al as k,
  tl as l,
  ll as m,
  nl as n,
  ol as o,
  za as p,
  bt as s,
  Pt as u,
};

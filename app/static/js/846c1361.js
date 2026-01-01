import {
  b as he,
  d as z,
  h as ge,
  e as be,
  f as we,
  r as U,
  w as ke,
  _ as N,
  g as ee,
  o as c,
  i as f,
  j as t,
  k as l,
  Q as _,
  l as i,
  m as x,
  n,
  p as $,
  q as le,
  s as y,
  t as h,
  v as S,
  x as w,
  y as W,
  z as j,
  A as ye,
  B as Ce,
  C as te,
  D as Ae,
  E as Ve,
  F as ze,
  G as Se,
  H as Te,
  I as xe,
  J as R,
  K as T,
  L as qe,
  M as Ue,
  O as Y,
  u as Qe,
  a as Re,
  P as De,
  R as Oe,
  S as Fe,
  T as Pe,
  U as B,
} from "./ec0ef80e.js";
import { Q as J, a as Ie } from "./cddc0b81.js";
import { Q as C, a as Q, b as H, c as M } from "./c7c9b8ae.js";
import { Q as V, a as v, b } from "./8ccb46ba.js";
import { Q as P, C as q } from "./bf4a8154.js";
import {
  S as Le,
  Q as oe,
  l as Be,
  a as Me,
  r as $e,
  b as He,
  c as Ee,
} from "./de9d2464.js";
import { Q as Ne, a as We } from "./51996ac8.js";
import { u as je } from "./946466bb.js";
import { u as Ge } from "./6b3fe15f.js";
import {
  Q as Ke,
  a as E,
  b as se,
  n as ae,
  c as Ye,
  d as Je,
  o as Xe,
} from "./16cf54aa.js";
import { m as G } from "./6225e303.js";
import {
  Q as Ze,
  a as X,
  b as el,
  c as ll,
  d as tl,
  e as ol,
  u as Z,
} from "./aab2a0d1.js";
import { Q as sl } from "./98e0875c.js";
import { o as al } from "./6269c2dc.js";
import "./780fb64b.js";
var nl = he({
  name: "QToolbarTitle",
  props: { shrink: Boolean },
  setup(o, { slots: e }) {
    const r = z(
      () => "q-toolbar__title ellipsis" + (o.shrink === !0 ? " col-shrink" : "")
    );
    return () => ge("div", { class: r.value }, be(e.default));
  },
});
const il = we("dashboard", () => {
    const o = U(0),
      e = U(0),
      r = U(0),
      p = U(0),
      a = U(180),
      { data: u } = Ge();
    return (
      ke(u, (s) => {
        if (s.action === "dashboard.agentcount") {
          const m = s.data;
          (o.value = m.total_server_count),
            (e.value = m.total_server_offline_count),
            (r.value = m.total_workstation_count),
            (p.value = m.total_workstation_offline_count),
            (a.value = m.days_until_cert_expires);
        }
      }),
      {
        serverCount: o,
        serverOfflineCount: e,
        workstationCount: r,
        workstationOfflineCount: p,
        daysUntilCertExpires: a,
      }
    );
  }),
  rl = {
    name: "AlertsOverview",
    emits: ["hide"],
    mixins: [G],
    setup() {
      const o = ee();
      return { formatDate: z(() => o.getters.formatDate) };
    },
    data() {
      return {
        alerts: [],
        selectedAlerts: [],
        severityFilter: [],
        clientFilter: [],
        timeFilter: 30,
        includeResolved: !1,
        includeSnoozed: !1,
        searched: !1,
        clientsOptions: [],
        severityOptions: [
          { label: "Informational", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
        timeOptions: [
          { value: 1, label: "1 Day Ago" },
          { value: 7, label: "1 Week Ago" },
          { value: 30, label: "30 Days Ago" },
          { value: 90, label: "3 Months Ago" },
          { value: 180, label: "6 Months Ago" },
          { value: 365, label: "1 Year Ago" },
          { value: 0, label: "Everything" },
        ],
        columns: [
          {
            name: "alert_time",
            label: "Time",
            field: "alert_time",
            align: "left",
            sortable: !0,
            format: (o) => this.formatDate(o),
          },
          {
            name: "client",
            label: "Client",
            field: "client",
            align: "left",
            sortable: !0,
          },
          {
            name: "site",
            label: "Site",
            field: "site",
            align: "left",
            sortable: !0,
          },
          {
            name: "hostname",
            label: "Agent",
            field: "hostname",
            align: "left",
            sortable: !0,
          },
          {
            name: "alert_type",
            label: "Type",
            field: "alert_type",
            align: "left",
            sortable: !0,
            format: (o) => this.capitalize(o, !0),
          },
          {
            name: "severity",
            label: "Severity",
            field: "severity",
            align: "left",
            sortable: !0,
          },
          {
            name: "message",
            label: "Message",
            field: "message",
            align: "left",
            sortable: !0,
          },
          {
            name: "resolved_on",
            label: "Resolved On",
            field: "resolved_on",
            align: "left",
            sortable: !0,
            format: (o) => this.formatDate(o),
          },
          {
            name: "snoozed_until",
            label: "Snoozed Until",
            field: "snoozed_until",
            align: "left",
            sortable: !0,
            format: (o) => this.formatDate(o),
          },
          { name: "actions", label: "Actions", align: "left" },
        ],
        pagination: { rowsPerPage: 50, sortBy: "alert_time", descending: !0 },
      };
    },
    computed: {
      noDataText() {
        return this.searched
          ? "No data found. Try to refine you search"
          : "Click search to find alerts";
      },
      visibleColumns() {
        return this.columns.map((o) => {
          if (o.name === "snoozed_until") {
            if (this.includeSnoozed) return o.name;
          } else if (o.name === "resolved_on") {
            if (this.includeResolved) return o.name;
          } else return o.name;
        });
      },
    },
    methods: {
      getClients() {
        this.$axios.get("/clients/").then((o) => {
          this.clientsOptions = Object.freeze(
            o.data.map((e) => ({ label: e.name, value: e.id }))
          );
        });
      },
      search() {
        this.$q.loading.show(),
          (this.selectedAlerts = []),
          (this.searched = !0);
        let o = {
          snoozedFilter: this.includeSnoozed,
          resolvedFilter: this.includeResolved,
        };
        this.clientFilter.length > 0 && (o.clientFilter = this.clientFilter),
          this.timeFilter && (o.timeFilter = this.timeFilter),
          this.severityFilter.length > 0 &&
            (o.severityFilter = this.severityFilter),
          this.$axios
            .patch("/alerts/", o)
            .then((e) => {
              this.$q.loading.hide(), (this.alerts = Object.freeze(e.data));
            })
            .catch(() => {
              this.$q.loading.hide();
            });
      },
      snoozeAlert(o) {
        this.$q
          .dialog({
            title: "Snooze Alert",
            message: "How many days to snooze alert?",
            prompt: {
              model: "",
              type: "number",
              isValid: (e) => !!e && e > 0 && e < 9999,
            },
            cancel: !0,
          })
          .onOk((e) => {
            this.$q.loading.show();
            const r = { id: o.id, type: "snooze", snooze_days: e };
            this.$axios
              .put(`alerts/${o.id}/`, r)
              .then(() => {
                this.search(),
                  this.$q.loading.hide(),
                  this.notifySuccess(
                    `The alert has been snoozed for ${e} days`
                  );
              })
              .catch(() => {
                this.$q.loading.hide();
              });
          });
      },
      unsnoozeAlert(o) {
        this.$q.loading.show();
        const e = { id: o.id, type: "unsnooze" };
        this.$axios
          .put(`alerts/${o.id}/`, e)
          .then(() => {
            this.search(),
              this.$q.loading.hide(),
              this.notifySuccess("The alert has been unsnoozed");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
      },
      resolveAlert(o) {
        this.$q.loading.show();
        const e = { id: o.id, type: "resolve" };
        this.$axios
          .put(`alerts/${o.id}/`, e)
          .then(() => {
            this.search(),
              this.$q.loading.hide(),
              this.notifySuccess("The alert has been resolved");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
      },
      resolveAlertBulk(o) {
        this.$q.loading.show();
        const e = { alerts: o.map((r) => r.id), bulk_action: "resolve" };
        this.$axios
          .post("alerts/bulk/", e)
          .then(() => {
            this.search(),
              this.$q.loading.hide(),
              this.notifySuccess("Alerts were resolved");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
      },
      snoozeAlertBulk(o) {
        this.$q
          .dialog({
            title: "Snooze Alert",
            message: "How many days to snooze alert?",
            prompt: {
              model: "",
              type: "number",
              isValid: (e) => !!e && e > 0 && e < 9999,
            },
            cancel: !0,
          })
          .onOk((e) => {
            this.$q.loading.show();
            const r = {
              alerts: o.map((p) => p.id),
              bulk_action: "snooze",
              snooze_days: e,
            };
            this.$axios
              .post("alerts/bulk/", r)
              .then(() => {
                this.search(),
                  this.$q.loading.hide(),
                  this.notifySuccess(`Alerts were snoozed for ${e} days`);
              })
              .catch(() => {
                this.$q.loading.hide();
              });
          });
      },
      showScriptOutput(o, e = !1) {
        let r = {};
        e
          ? ((r.readable_desc = `${o.alert_type} failure action results`),
            (r.execution_time = o.action_execution_time),
            (r.retcode = o.action_retcode),
            (r.stdout = o.action_stdout),
            (r.errout = o.action_errout),
            (r.last_run = o.action_run))
          : ((r.readable_desc = `${o.alert_type} resolved action results`),
            (r.execution_time = o.resolved_action_execution_time),
            (r.retcode = o.resolved_action_retcode),
            (r.stdout = o.resolved_action_stdout),
            (r.errout = o.resolved_action_errout),
            (r.last_run = o.resolved_action_run)),
          this.$q.dialog({ component: Le, componentProps: { scriptInfo: r } });
      },
      alertColor(o) {
        if (o === "error") return "red";
        if (o === "warning") return "orange";
        if (o === "info") return "info";
      },
      show() {
        this.$refs.dialog.show();
      },
      hide() {
        this.$refs.dialog.hide();
      },
      onHide() {
        this.$emit("hide");
      },
    },
    mounted() {
      this.getClients();
    },
  },
  dl = { class: "row" },
  ul = { class: "q-pa-sm col-3" },
  cl = { class: "q-pa-sm col-3" },
  fl = { class: "q-pa-sm col-2" },
  ml = { class: "q-pa-sm col-2" },
  pl = { class: "q-pa-sm col-2" };
function vl(o, e, r, p, a, u) {
  return (
    c(),
    f(
      j,
      {
        ref: "dialog",
        onHide: u.onHide,
        maximized: "",
        "transition-show": "slide-up",
        "transition-hide": "slide-down",
      },
      {
        default: t(() => [
          l(W, null, {
            default: t(() => [
              l(Ke, null, {
                default: t(() => [
                  l(
                    _,
                    {
                      onClick: u.search,
                      class: "q-mr-sm",
                      dense: "",
                      flat: "",
                      push: "",
                      icon: "refresh",
                    },
                    null,
                    8,
                    ["onClick"]
                  ),
                  l(E),
                  e[10] || (e[10] = i(" Alerts Overview ")),
                  l(E),
                  x(
                    (c(),
                    f(
                      _,
                      { dense: "", flat: "", icon: "close" },
                      {
                        default: t(() => [
                          l(
                            C,
                            { class: "bg-white text-primary" },
                            {
                              default: t(() => e[9] || (e[9] = [i("Close")])),
                              _: 1,
                            }
                          ),
                        ]),
                        _: 1,
                      }
                    )),
                    [[q]]
                  ),
                ]),
                _: 1,
              }),
              e[19] ||
                (e[19] = n(
                  "div",
                  { class: "text-h6 q-pl-sm q-pt-sm" },
                  "Filter",
                  -1
                )),
              n("div", dl, [
                n("div", ul, [
                  l(
                    Q,
                    {
                      modelValue: a.clientFilter,
                      "onUpdate:modelValue":
                        e[0] || (e[0] = (s) => (a.clientFilter = s)),
                      options: a.clientsOptions,
                      label: "Clients",
                      multiple: "",
                      outlined: "",
                      dense: "",
                      "use-chips": "",
                      "map-options": "",
                      "emit-value": "",
                    },
                    null,
                    8,
                    ["modelValue", "options"]
                  ),
                ]),
                n("div", cl, [
                  l(
                    Q,
                    {
                      modelValue: a.severityFilter,
                      "onUpdate:modelValue":
                        e[1] || (e[1] = (s) => (a.severityFilter = s)),
                      options: a.severityOptions,
                      label: "Severity",
                      multiple: "",
                      outlined: "",
                      dense: "",
                      "use-chips": "",
                      "map-options": "",
                      "emit-value": "",
                    },
                    null,
                    8,
                    ["modelValue", "options"]
                  ),
                ]),
                n("div", fl, [
                  l(
                    Q,
                    {
                      outlined: "",
                      dense: "",
                      modelValue: a.timeFilter,
                      "onUpdate:modelValue":
                        e[2] || (e[2] = (s) => (a.timeFilter = s)),
                      label: "Time",
                      "emit-value": "",
                      "map-options": "",
                      options: a.timeOptions,
                    },
                    null,
                    8,
                    ["modelValue", "options"]
                  ),
                ]),
                n("div", ml, [
                  l(
                    $,
                    {
                      outlined: "",
                      dense: "",
                      modelValue: a.includeSnoozed,
                      "onUpdate:modelValue":
                        e[3] || (e[3] = (s) => (a.includeSnoozed = s)),
                      label: "Include snoozed",
                    },
                    null,
                    8,
                    ["modelValue"]
                  ),
                  l(
                    $,
                    {
                      outlined: "",
                      dense: "",
                      modelValue: a.includeResolved,
                      "onUpdate:modelValue":
                        e[4] || (e[4] = (s) => (a.includeResolved = s)),
                      label: "Include resolved",
                    },
                    null,
                    8,
                    ["modelValue"]
                  ),
                ]),
                n("div", pl, [
                  l(
                    _,
                    { color: "primary", label: "Search", onClick: u.search },
                    null,
                    8,
                    ["onClick"]
                  ),
                ]),
              ]),
              l(le),
              l(y, null, {
                default: t(() => [
                  l(
                    Ze,
                    {
                      "table-class": {
                        "table-bgcolor": !o.$q.dark.isActive,
                        "table-bgcolor-dark": o.$q.dark.isActive,
                      },
                      class: "audit-mgr-tbl-sticky",
                      rows: a.alerts,
                      columns: a.columns,
                      "rows-per-page-options": [25, 50, 100, 500, 1e3],
                      pagination: a.pagination,
                      "onUpdate:pagination":
                        e[7] || (e[7] = (s) => (a.pagination = s)),
                      "no-data-label": u.noDataText,
                      "visible-columns": u.visibleColumns,
                      selected: a.selectedAlerts,
                      "onUpdate:selected":
                        e[8] || (e[8] = (s) => (a.selectedAlerts = s)),
                      selection: "multiple",
                      "binary-state-sort": "",
                      "row-key": "id",
                      dense: "",
                      "virtual-scroll": "",
                    },
                    {
                      top: t(() => [
                        e[13] ||
                          (e[13] = n(
                            "div",
                            { class: "col-1 q-table__title" },
                            "Alerts",
                            -1
                          )),
                        l(
                          oe,
                          {
                            flat: "",
                            label: "Bulk Actions",
                            disable:
                              a.selectedAlerts.length === 0 ||
                              a.includeResolved,
                          },
                          {
                            default: t(() => [
                              l(
                                P,
                                { dense: "" },
                                {
                                  default: t(() => [
                                    x(
                                      (c(),
                                      f(
                                        V,
                                        {
                                          clickable: "",
                                          onClick:
                                            e[5] ||
                                            (e[5] = (s) =>
                                              u.snoozeAlertBulk(
                                                a.selectedAlerts
                                              )),
                                        },
                                        {
                                          default: t(() => [
                                            l(
                                              v,
                                              { avatar: "" },
                                              {
                                                default: t(() => [
                                                  l(h, { name: "alarm_off" }),
                                                ]),
                                                _: 1,
                                              }
                                            ),
                                            l(v, null, {
                                              default: t(() => [
                                                l(b, null, {
                                                  default: t(
                                                    () =>
                                                      e[11] ||
                                                      (e[11] = [
                                                        i("Snooze alerts"),
                                                      ])
                                                  ),
                                                  _: 1,
                                                }),
                                              ]),
                                              _: 1,
                                            }),
                                          ]),
                                          _: 1,
                                        }
                                      )),
                                      [[q]]
                                    ),
                                    x(
                                      (c(),
                                      f(
                                        V,
                                        {
                                          clickable: "",
                                          onClick:
                                            e[6] ||
                                            (e[6] = (s) =>
                                              u.resolveAlertBulk(
                                                a.selectedAlerts
                                              )),
                                        },
                                        {
                                          default: t(() => [
                                            l(
                                              v,
                                              { avatar: "" },
                                              {
                                                default: t(() => [
                                                  l(h, { name: "flag" }),
                                                ]),
                                                _: 1,
                                              }
                                            ),
                                            l(v, null, {
                                              default: t(() => [
                                                l(b, null, {
                                                  default: t(
                                                    () =>
                                                      e[12] ||
                                                      (e[12] = [
                                                        i("Resolve alerts"),
                                                      ])
                                                  ),
                                                  _: 1,
                                                }),
                                              ]),
                                              _: 1,
                                            }),
                                          ]),
                                          _: 1,
                                        }
                                      )),
                                      [[q]]
                                    ),
                                  ]),
                                  _: 1,
                                }
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          ["disable"]
                        ),
                      ]),
                      "body-cell-actions": t((s) => [
                        l(
                          X,
                          { props: s },
                          {
                            default: t(() => [
                              s.row.action_run
                                ? (c(),
                                  f(
                                    h,
                                    {
                                      key: 0,
                                      name: "mdi-archive-alert",
                                      size: "sm",
                                      class: "cursor-pointer",
                                      onClick: (m) =>
                                        u.showScriptOutput(s.row, !0),
                                    },
                                    {
                                      default: t(() => [
                                        l(C, null, {
                                          default: t(
                                            () =>
                                              e[14] ||
                                              (e[14] = [
                                                i(
                                                  "Show failure action run results"
                                                ),
                                              ])
                                          ),
                                          _: 1,
                                        }),
                                      ]),
                                      _: 2,
                                    },
                                    1032,
                                    ["onClick"]
                                  ))
                                : S("", !0),
                              s.row.resolved_action_run
                                ? (c(),
                                  f(
                                    h,
                                    {
                                      key: 1,
                                      name: "mdi-archive-check",
                                      size: "sm",
                                      class: "cursor-pointer",
                                      onClick: (m) =>
                                        u.showScriptOutput(s.row, !1),
                                    },
                                    {
                                      default: t(() => [
                                        l(C, null, {
                                          default: t(
                                            () =>
                                              e[15] ||
                                              (e[15] = [
                                                i(
                                                  "Show resolved action run results"
                                                ),
                                              ])
                                          ),
                                          _: 1,
                                        }),
                                      ]),
                                      _: 2,
                                    },
                                    1032,
                                    ["onClick"]
                                  ))
                                : S("", !0),
                              !s.row.resolved && !s.row.snoozed
                                ? (c(),
                                  f(
                                    h,
                                    {
                                      key: 2,
                                      name: "snooze",
                                      size: "sm",
                                      class: "cursor-pointer",
                                      onClick: (m) => u.snoozeAlert(s.row),
                                    },
                                    {
                                      default: t(() => [
                                        l(C, null, {
                                          default: t(
                                            () =>
                                              e[16] ||
                                              (e[16] = [i("Snooze alert")])
                                          ),
                                          _: 1,
                                        }),
                                      ]),
                                      _: 2,
                                    },
                                    1032,
                                    ["onClick"]
                                  ))
                                : !s.row.resolved && s.row.snoozed
                                ? (c(),
                                  f(
                                    h,
                                    {
                                      key: 3,
                                      name: "alarm_off",
                                      size: "sm",
                                      class: "cursor-pointer",
                                      onClick: (m) => u.unsnoozeAlert(s.row),
                                    },
                                    {
                                      default: t(() => [
                                        l(C, null, {
                                          default: t(
                                            () =>
                                              e[17] ||
                                              (e[17] = [i("Unsnooze alert")])
                                          ),
                                          _: 1,
                                        }),
                                      ]),
                                      _: 2,
                                    },
                                    1032,
                                    ["onClick"]
                                  ))
                                : S("", !0),
                              s.row.resolved
                                ? S("", !0)
                                : (c(),
                                  f(
                                    h,
                                    {
                                      key: 4,
                                      name: "flag",
                                      size: "sm",
                                      class: "cursor-pointer",
                                      onClick: (m) => u.resolveAlert(s.row),
                                    },
                                    {
                                      default: t(() => [
                                        l(C, null, {
                                          default: t(
                                            () =>
                                              e[18] ||
                                              (e[18] = [i("Resolve alert")])
                                          ),
                                          _: 1,
                                        }),
                                      ]),
                                      _: 2,
                                    },
                                    1032,
                                    ["onClick"]
                                  )),
                            ]),
                            _: 2,
                          },
                          1032,
                          ["props"]
                        ),
                      ]),
                      "body-cell-severity": t((s) => [
                        l(
                          X,
                          { props: s },
                          {
                            default: t(() => [
                              l(
                                se,
                                { color: u.alertColor(s.row.severity) },
                                {
                                  default: t(() => [
                                    i(w(o.capitalize(s.row.severity)), 1),
                                  ]),
                                  _: 2,
                                },
                                1032,
                                ["color"]
                              ),
                            ]),
                            _: 2,
                          },
                          1032,
                          ["props"]
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    [
                      "table-class",
                      "rows",
                      "columns",
                      "pagination",
                      "no-data-label",
                      "visible-columns",
                      "selected",
                    ]
                  ),
                ]),
                _: 1,
              }),
            ]),
            _: 1,
          }),
        ]),
        _: 1,
      },
      8,
      ["onHide"]
    )
  );
}
var _l = N(rl, [["render", vl]]);
const hl = {
  name: "AlertsIcon",
  mixins: [G],
  setup() {
    return { getTimeLapse: ye };
  },
  data() {
    return { alertsCount: 0, topAlerts: [], poll: null };
  },
  computed: {
    ...Ce(["dash_info_color", "dash_warning_color", "dash_negative_color"]),
    badgeColor() {
      const o = this.topAlerts.map((e) => e.severity);
      return o.includes("error")
        ? this.dash_negative_color
        : o.includes("warning")
        ? this.dash_warning_color
        : this.dash_info_color;
    },
  },
  methods: {
    getAlerts() {
      this.$axios.patch("alerts/", { top: 10 }).then((o) => {
        (this.alertsCount = o.data.alerts_count),
          (this.topAlerts = o.data.alerts);
      });
    },
    showOverview() {
      this.$q.dialog({ component: _l }).onDismiss(() => {
        this.getAlerts();
      });
    },
    snoozeAlert(o) {
      this.$q
        .dialog({
          title: "Snooze Alert",
          message: "How many days to snooze alert?",
          prompt: {
            model: "",
            type: "number",
            isValid: (e) => !!e && e > 0 && e < 9999,
          },
          cancel: !0,
        })
        .onOk((e) => {
          this.$q.loading.show();
          const r = { id: o.id, type: "snooze", snooze_days: e };
          this.$axios
            .put(`alerts/${o.id}/`, r)
            .then(() => {
              this.getAlerts(),
                this.$q.loading.hide(),
                this.notifySuccess(`The alert has been snoozed for ${e} days`);
            })
            .catch(() => {
              this.$q.loading.hide();
            });
        });
    },
    resolveAlert(o) {
      this.$q.loading.show();
      const e = { id: o.id, type: "resolve" };
      this.$axios
        .put(`alerts/${o.id}/`, e)
        .then(() => {
          this.getAlerts(),
            this.$q.loading.hide(),
            this.notifySuccess("The alert has been resolved");
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    alertIconColor(o) {
      return o === "error"
        ? this.dash_negative_color
        : o === "warning"
        ? this.dash_warning_color
        : this.dash_info_color;
    },
    alertsCountText() {
      return this.alertsCount > 99 ? "99+" : this.alertsCount;
    },
    pollAlerts() {
      this.poll = setInterval(() => {
        this.getAlerts();
      }, 60 * 1 * 1e3);
    },
  },
  mounted() {
    this.getAlerts(), this.pollAlerts();
  },
  beforeUnmount() {
    clearInterval(this.poll);
  },
};
function gl(o, e, r, p, a, u) {
  const s = te("router-link");
  return (
    c(),
    f(
      _,
      { dense: "", flat: "", icon: "notifications" },
      {
        default: t(() => [
          a.alertsCount > 0
            ? (c(),
              f(
                se,
                { key: 0, color: u.badgeColor, floating: "", transparent: "" },
                { default: t(() => [i(w(u.alertsCountText()), 1)]), _: 1 },
                8,
                ["color"]
              ))
            : S("", !0),
          l(
            H,
            { style: Ae({ "max-height": `${o.$q.screen.height - 100}px` }) },
            {
              default: t(() => [
                l(
                  P,
                  { separator: "" },
                  {
                    default: t(() => [
                      a.alertsCount === 0
                        ? (c(),
                          f(
                            V,
                            { key: 0 },
                            {
                              default: t(
                                () => e[0] || (e[0] = [i("No New Alerts")])
                              ),
                              _: 1,
                            }
                          ))
                        : S("", !0),
                      (c(!0),
                      Ve(
                        ze,
                        null,
                        Se(
                          a.topAlerts,
                          (m) => (
                            c(),
                            f(
                              V,
                              { key: m.id },
                              {
                                default: t(() => [
                                  l(
                                    v,
                                    null,
                                    {
                                      default: t(() => [
                                        l(
                                          b,
                                          { overline: "" },
                                          {
                                            default: t(() => [
                                              l(
                                                s,
                                                { to: `/agents/${m.agent_id}` },
                                                {
                                                  default: t(() => [
                                                    i(
                                                      w(m.client) +
                                                        " - " +
                                                        w(m.site) +
                                                        " - " +
                                                        w(m.hostname),
                                                      1
                                                    ),
                                                  ]),
                                                  _: 2,
                                                },
                                                1032,
                                                ["to"]
                                              ),
                                            ]),
                                            _: 2,
                                          },
                                          1024
                                        ),
                                        l(
                                          b,
                                          { lines: "1" },
                                          {
                                            default: t(() => [
                                              l(
                                                h,
                                                {
                                                  size: "xs",
                                                  class: Te(
                                                    `text-${u.alertIconColor(
                                                      m.severity
                                                    )}`
                                                  ),
                                                  name: m.severity,
                                                },
                                                null,
                                                8,
                                                ["class", "name"]
                                              ),
                                              i(" " + w(m.message), 1),
                                            ]),
                                            _: 2,
                                          },
                                          1024
                                        ),
                                      ]),
                                      _: 2,
                                    },
                                    1024
                                  ),
                                  l(
                                    v,
                                    { side: "", top: "" },
                                    {
                                      default: t(() => [
                                        l(
                                          b,
                                          { caption: "" },
                                          {
                                            default: t(() => [
                                              i(
                                                w(p.getTimeLapse(m.alert_time)),
                                                1
                                              ),
                                            ]),
                                            _: 2,
                                          },
                                          1024
                                        ),
                                        l(
                                          b,
                                          null,
                                          {
                                            default: t(() => [
                                              x(
                                                (c(),
                                                f(
                                                  h,
                                                  {
                                                    name: "snooze",
                                                    size: "xs",
                                                    class: "cursor-pointer",
                                                    onClick: (D) =>
                                                      u.snoozeAlert(m),
                                                  },
                                                  {
                                                    default: t(() => [
                                                      l(C, null, {
                                                        default: t(
                                                          () =>
                                                            e[1] ||
                                                            (e[1] = [
                                                              i("Snooze alert"),
                                                            ])
                                                        ),
                                                        _: 1,
                                                      }),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1032,
                                                  ["onClick"]
                                                )),
                                                [[q]]
                                              ),
                                              x(
                                                (c(),
                                                f(
                                                  h,
                                                  {
                                                    name: "flag",
                                                    size: "xs",
                                                    class: "cursor-pointer",
                                                    onClick: (D) =>
                                                      u.resolveAlert(m),
                                                  },
                                                  {
                                                    default: t(() => [
                                                      l(C, null, {
                                                        default: t(
                                                          () =>
                                                            e[2] ||
                                                            (e[2] = [
                                                              i(
                                                                "Resolve alert"
                                                              ),
                                                            ])
                                                        ),
                                                        _: 1,
                                                      }),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1032,
                                                  ["onClick"]
                                                )),
                                                [[q]]
                                              ),
                                            ]),
                                            _: 2,
                                          },
                                          1024
                                        ),
                                      ]),
                                      _: 2,
                                    },
                                    1024
                                  ),
                                ]),
                                _: 2,
                              },
                              1024
                            )
                          )
                        ),
                        128
                      )),
                      x(
                        (c(),
                        f(
                          V,
                          { clickable: "", onClick: u.showOverview },
                          {
                            default: t(() => [
                              i(
                                "View All Alerts (" + w(a.alertsCount) + ")",
                                1
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          ["onClick"]
                        )),
                        [[q]]
                      ),
                    ]),
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
      }
    )
  );
}
var bl = N(hl, [["render", gl]]);
const wl = {
  name: "UserPreferences",
  emits: ["hide", "ok", "cancel"],
  mixins: [G],
  data() {
    return {
      loadingBarColors: Be,
      agentDblClickAction: "",
      defaultAgentTblTab: "",
      clientTreeSort: "",
      url_action: null,
      tab: "ui",
      splitterModel: 20,
      loading_bar_color: "",
      dash_info_color: "",
      dash_positive_color: "",
      dash_negative_color: "",
      dash_warning_color: "",
      urlActions: [],
      clear_search_when_switching: !0,
      date_format: "",
      quasar_color_url: "https://quasar.dev/style/color-palette",
      clientTreeSortOptions: [
        {
          label: "Sort alphabetically, moving failing clients to the top",
          value: "alphafail",
        },
        { label: "Sort alphabetically only", value: "alpha" },
      ],
      agentDblClickOptions: [
        { label: "Edit Agent", value: "editagent" },
        { label: "Take Control", value: "takecontrol" },
        { label: "Remote Background", value: "remotebg" },
        { label: "Run URL Action", value: "urlaction" },
      ],
      defaultAgentTblTabOptions: [
        { label: "Servers", value: "server" },
        { label: "Workstations", value: "workstation" },
        { label: "Mixed", value: "mixed" },
      ],
    };
  },
  watch: {
    agentDblClickAction(o) {
      o === "urlaction" && this.getURLActions();
    },
  },
  methods: {
    openURL(o) {
      al(o);
    },
    getURLActions() {
      this.$axios.get("/core/urlaction/").then((o) => {
        (this.urlActions = o.data
          .filter((e) => e.action_type === "web")
          .sort((e, r) => e.name.localeCompare(r.name))
          .map((e) => ({ label: e.name, value: e.id }))),
          this.urlActions.length === 0 &&
            this.notifyWarning(
              "No URL Actions configured. Go to Settings > Global Settings > URL Actions"
            );
      });
    },
    getUserPrefs() {
      this.$axios.get("/core/dashinfo/").then((o) => {
        (this.agentDblClickAction = o.data.dbl_click_action),
          (this.url_action = o.data.url_action),
          (this.defaultAgentTblTab = o.data.default_agent_tbl_tab),
          (this.clientTreeSort = o.data.client_tree_sort),
          (this.loading_bar_color = o.data.loading_bar_color),
          (this.dash_info_color = o.data.dash_info_color),
          (this.dash_positive_color = o.data.dash_positive_color),
          (this.dash_negative_color = o.data.dash_negative_color),
          (this.dash_warning_color = o.data.dash_warning_color),
          (this.clear_search_when_switching =
            o.data.clear_search_when_switching),
          (this.date_format = o.data.date_format);
      });
    },
    editUserPrefs() {
      if (
        this.agentDblClickAction === "urlaction" &&
        this.url_action === null
      ) {
        this.notifyError("Select a URL Action");
        return;
      }
      const o = {
        agent_dblclick_action: this.agentDblClickAction,
        url_action: this.url_action,
        default_agent_tbl_tab: this.defaultAgentTblTab,
        client_tree_sort: this.clientTreeSort,
        loading_bar_color: this.loading_bar_color,
        dash_info_color: this.dash_info_color,
        dash_positive_color: this.dash_positive_color,
        dash_negative_color: this.dash_negative_color,
        dash_warning_color: this.dash_warning_color,
        clear_search_when_switching: this.clear_search_when_switching,
        date_format: this.date_format,
      };
      this.$axios.patch("/accounts/users/ui/", o).then(() => {
        this.notifySuccess("Preferences were saved!"),
          this.$store.dispatch("loadTree"),
          this.onOk();
      });
    },
    show() {
      this.$refs.dialog.show();
    },
    hide() {
      this.$refs.dialog.hide();
    },
    onHide() {
      this.$emit("hide");
    },
    onOk() {
      this.$emit("ok"), this.hide();
    },
  },
  mounted() {
    this.getUserPrefs();
  },
};
function kl(o, e, r, p, a, u) {
  return (
    c(),
    f(
      j,
      { ref: "dialog", onHide: u.onHide },
      {
        default: t(() => [
          l(
            W,
            { class: "q-dialog-plugin", style: { "min-width": "60vw" } },
            {
              default: t(() => [
                l(
                  Me,
                  {
                    modelValue: a.splitterModel,
                    "onUpdate:modelValue":
                      e[19] || (e[19] = (s) => (a.splitterModel = s)),
                  },
                  {
                    before: t(() => [
                      l(
                        el,
                        {
                          dense: "",
                          modelValue: a.tab,
                          "onUpdate:modelValue":
                            e[0] || (e[0] = (s) => (a.tab = s)),
                          vertical: "",
                          class: "text-primary",
                        },
                        {
                          default: t(() => [
                            l(ll, { name: "ui", label: "User Interface" }),
                          ]),
                          _: 1,
                        },
                        8,
                        ["modelValue"]
                      ),
                    ]),
                    after: t(() => [
                      l(
                        sl,
                        { onSubmit: xe(u.editUserPrefs, ["prevent"]) },
                        {
                          default: t(() => [
                            l(
                              y,
                              { class: "row items-center" },
                              {
                                default: t(() => [
                                  e[20] ||
                                    (e[20] = n(
                                      "div",
                                      { class: "text-h6" },
                                      "Preferences",
                                      -1
                                    )),
                                  l(E),
                                  x(
                                    l(
                                      _,
                                      {
                                        icon: "close",
                                        flat: "",
                                        round: "",
                                        dense: "",
                                      },
                                      null,
                                      512
                                    ),
                                    [[q]]
                                  ),
                                ]),
                                _: 1,
                              }
                            ),
                            l(
                              tl,
                              {
                                modelValue: a.tab,
                                "onUpdate:modelValue":
                                  e[18] || (e[18] = (s) => (a.tab = s)),
                                animated: "",
                                "transition-prev": "jump-up",
                                "transition-next": "jump-up",
                              },
                              {
                                default: t(() => [
                                  l(
                                    ol,
                                    { name: "ui" },
                                    {
                                      default: t(() => [
                                        e[46] ||
                                          (e[46] = n(
                                            "div",
                                            { class: "text-subtitle2" },
                                            "User Interface",
                                            -1
                                          )),
                                        l(le),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[21] ||
                                                (e[21] = n(
                                                  "div",
                                                  { class: "col-6" },
                                                  "Agent double-click action:",
                                                  -1
                                                )),
                                              e[22] ||
                                                (e[22] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                Q,
                                                {
                                                  "map-options": "",
                                                  "emit-value": "",
                                                  outlined: "",
                                                  dense: "",
                                                  "options-dense": "",
                                                  modelValue:
                                                    a.agentDblClickAction,
                                                  "onUpdate:modelValue": [
                                                    e[1] ||
                                                      (e[1] = (s) =>
                                                        (a.agentDblClickAction =
                                                          s)),
                                                    e[2] ||
                                                      (e[2] = (s) =>
                                                        (a.url_action = null)),
                                                  ],
                                                  options:
                                                    a.agentDblClickOptions,
                                                  class: "col-4",
                                                },
                                                null,
                                                8,
                                                ["modelValue", "options"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        a.agentDblClickAction === "urlaction"
                                          ? (c(),
                                            f(
                                              y,
                                              { key: 0, class: "row" },
                                              {
                                                default: t(() => [
                                                  e[23] ||
                                                    (e[23] = n(
                                                      "div",
                                                      { class: "col-6" },
                                                      "URL Action:",
                                                      -1
                                                    )),
                                                  e[24] ||
                                                    (e[24] = n(
                                                      "div",
                                                      { class: "col-2" },
                                                      null,
                                                      -1
                                                    )),
                                                  l(
                                                    Q,
                                                    {
                                                      "map-options": "",
                                                      "emit-value": "",
                                                      outlined: "",
                                                      dense: "",
                                                      "options-dense": "",
                                                      modelValue: a.url_action,
                                                      "onUpdate:modelValue":
                                                        e[3] ||
                                                        (e[3] = (s) =>
                                                          (a.url_action = s)),
                                                      options: a.urlActions,
                                                      class: "col-4",
                                                    },
                                                    null,
                                                    8,
                                                    ["modelValue", "options"]
                                                  ),
                                                ]),
                                                _: 1,
                                              }
                                            ))
                                          : S("", !0),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[25] ||
                                                (e[25] = n(
                                                  "div",
                                                  { class: "col-6" },
                                                  "Agent table default tab:",
                                                  -1
                                                )),
                                              e[26] ||
                                                (e[26] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                Q,
                                                {
                                                  "map-options": "",
                                                  "emit-value": "",
                                                  outlined: "",
                                                  dense: "",
                                                  "options-dense": "",
                                                  modelValue:
                                                    a.defaultAgentTblTab,
                                                  "onUpdate:modelValue":
                                                    e[4] ||
                                                    (e[4] = (s) =>
                                                      (a.defaultAgentTblTab =
                                                        s)),
                                                  options:
                                                    a.defaultAgentTblTabOptions,
                                                  class: "col-4",
                                                },
                                                null,
                                                8,
                                                ["modelValue", "options"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[27] ||
                                                (e[27] = n(
                                                  "div",
                                                  { class: "col-4" },
                                                  "Loading Bar Color:",
                                                  -1
                                                )),
                                              e[28] ||
                                                (e[28] = n(
                                                  "div",
                                                  { class: "col-4" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                Q,
                                                {
                                                  outlined: "",
                                                  dense: "",
                                                  "options-dense": "",
                                                  modelValue:
                                                    a.loading_bar_color,
                                                  "onUpdate:modelValue":
                                                    e[5] ||
                                                    (e[5] = (s) =>
                                                      (a.loading_bar_color =
                                                        s)),
                                                  options: a.loadingBarColors,
                                                  class: "col-4",
                                                },
                                                null,
                                                8,
                                                ["modelValue", "options"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[30] ||
                                                (e[30] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  "Dashboard Info Color:",
                                                  -1
                                                )),
                                              e[31] ||
                                                (e[31] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                R,
                                                {
                                                  outlined: "",
                                                  dense: "",
                                                  modelValue: a.dash_info_color,
                                                  "onUpdate:modelValue":
                                                    e[7] ||
                                                    (e[7] = (s) =>
                                                      (a.dash_info_color = s)),
                                                  class: "col-8",
                                                },
                                                {
                                                  after: t(() => [
                                                    l(
                                                      _,
                                                      {
                                                        round: "",
                                                        dense: "",
                                                        flat: "",
                                                        size: "sm",
                                                        icon: "info",
                                                        onClick:
                                                          e[6] ||
                                                          (e[6] = (s) =>
                                                            u.openURL(
                                                              a.quasar_color_url
                                                            )),
                                                      },
                                                      {
                                                        default: t(() => [
                                                          l(C, null, {
                                                            default: t(
                                                              () =>
                                                                e[29] ||
                                                                (e[29] = [
                                                                  i(
                                                                    "Click to see color options"
                                                                  ),
                                                                ])
                                                            ),
                                                            _: 1,
                                                          }),
                                                        ]),
                                                        _: 1,
                                                      }
                                                    ),
                                                  ]),
                                                  _: 1,
                                                },
                                                8,
                                                ["modelValue"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[33] ||
                                                (e[33] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  "Dashboard Positive Color:",
                                                  -1
                                                )),
                                              e[34] ||
                                                (e[34] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                R,
                                                {
                                                  outlined: "",
                                                  dense: "",
                                                  modelValue:
                                                    a.dash_positive_color,
                                                  "onUpdate:modelValue":
                                                    e[9] ||
                                                    (e[9] = (s) =>
                                                      (a.dash_positive_color =
                                                        s)),
                                                  class: "col-8",
                                                },
                                                {
                                                  after: t(() => [
                                                    l(
                                                      _,
                                                      {
                                                        round: "",
                                                        dense: "",
                                                        flat: "",
                                                        size: "sm",
                                                        icon: "info",
                                                        onClick:
                                                          e[8] ||
                                                          (e[8] = (s) =>
                                                            u.openURL(
                                                              a.quasar_color_url
                                                            )),
                                                      },
                                                      {
                                                        default: t(() => [
                                                          l(C, null, {
                                                            default: t(
                                                              () =>
                                                                e[32] ||
                                                                (e[32] = [
                                                                  i(
                                                                    "Click to see color options"
                                                                  ),
                                                                ])
                                                            ),
                                                            _: 1,
                                                          }),
                                                        ]),
                                                        _: 1,
                                                      }
                                                    ),
                                                  ]),
                                                  _: 1,
                                                },
                                                8,
                                                ["modelValue"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[36] ||
                                                (e[36] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  "Dashboard Negative Color:",
                                                  -1
                                                )),
                                              e[37] ||
                                                (e[37] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                R,
                                                {
                                                  outlined: "",
                                                  dense: "",
                                                  modelValue:
                                                    a.dash_negative_color,
                                                  "onUpdate:modelValue":
                                                    e[11] ||
                                                    (e[11] = (s) =>
                                                      (a.dash_negative_color =
                                                        s)),
                                                  class: "col-8",
                                                },
                                                {
                                                  after: t(() => [
                                                    l(
                                                      _,
                                                      {
                                                        round: "",
                                                        dense: "",
                                                        flat: "",
                                                        size: "sm",
                                                        icon: "info",
                                                        onClick:
                                                          e[10] ||
                                                          (e[10] = (s) =>
                                                            u.openURL(
                                                              a.quasar_color_url
                                                            )),
                                                      },
                                                      {
                                                        default: t(() => [
                                                          l(C, null, {
                                                            default: t(
                                                              () =>
                                                                e[35] ||
                                                                (e[35] = [
                                                                  i(
                                                                    "Click to see color options"
                                                                  ),
                                                                ])
                                                            ),
                                                            _: 1,
                                                          }),
                                                        ]),
                                                        _: 1,
                                                      }
                                                    ),
                                                  ]),
                                                  _: 1,
                                                },
                                                8,
                                                ["modelValue"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[39] ||
                                                (e[39] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  "Dashboard Warning Color:",
                                                  -1
                                                )),
                                              e[40] ||
                                                (e[40] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                R,
                                                {
                                                  outlined: "",
                                                  dense: "",
                                                  modelValue:
                                                    a.dash_warning_color,
                                                  "onUpdate:modelValue":
                                                    e[13] ||
                                                    (e[13] = (s) =>
                                                      (a.dash_warning_color =
                                                        s)),
                                                  class: "col-8",
                                                },
                                                {
                                                  after: t(() => [
                                                    l(
                                                      _,
                                                      {
                                                        round: "",
                                                        dense: "",
                                                        flat: "",
                                                        size: "sm",
                                                        icon: "info",
                                                        onClick:
                                                          e[12] ||
                                                          (e[12] = (s) =>
                                                            u.openURL(
                                                              a.quasar_color_url
                                                            )),
                                                      },
                                                      {
                                                        default: t(() => [
                                                          l(C, null, {
                                                            default: t(
                                                              () =>
                                                                e[38] ||
                                                                (e[38] = [
                                                                  i(
                                                                    "Click to see color options"
                                                                  ),
                                                                ])
                                                            ),
                                                            _: 1,
                                                          }),
                                                        ]),
                                                        _: 1,
                                                      }
                                                    ),
                                                  ]),
                                                  _: 1,
                                                },
                                                8,
                                                ["modelValue"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[41] ||
                                                (e[41] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  "Client Sort:",
                                                  -1
                                                )),
                                              e[42] ||
                                                (e[42] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                Q,
                                                {
                                                  "map-options": "",
                                                  "emit-value": "",
                                                  outlined: "",
                                                  dense: "",
                                                  "options-dense": "",
                                                  modelValue: a.clientTreeSort,
                                                  "onUpdate:modelValue":
                                                    e[14] ||
                                                    (e[14] = (s) =>
                                                      (a.clientTreeSort = s)),
                                                  options:
                                                    a.clientTreeSortOptions,
                                                  class: "col-8",
                                                },
                                                null,
                                                8,
                                                ["modelValue", "options"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              e[44] ||
                                                (e[44] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  "Date Format:",
                                                  -1
                                                )),
                                              e[45] ||
                                                (e[45] = n(
                                                  "div",
                                                  { class: "col-2" },
                                                  null,
                                                  -1
                                                )),
                                              l(
                                                R,
                                                {
                                                  outlined: "",
                                                  dense: "",
                                                  modelValue: a.date_format,
                                                  "onUpdate:modelValue":
                                                    e[16] ||
                                                    (e[16] = (s) =>
                                                      (a.date_format = s)),
                                                  class: "col-8",
                                                },
                                                {
                                                  after: t(() => [
                                                    l(
                                                      _,
                                                      {
                                                        round: "",
                                                        dense: "",
                                                        flat: "",
                                                        size: "sm",
                                                        icon: "info",
                                                        onClick:
                                                          e[15] ||
                                                          (e[15] = (s) =>
                                                            u.openURL(
                                                              "https://quasar.dev/quasar-utils/date-utils#format-for-display"
                                                            )),
                                                      },
                                                      {
                                                        default: t(() => [
                                                          l(C, null, {
                                                            default: t(
                                                              () =>
                                                                e[43] ||
                                                                (e[43] = [
                                                                  i(
                                                                    "Click to see formatting options"
                                                                  ),
                                                                ])
                                                            ),
                                                            _: 1,
                                                          }),
                                                        ]),
                                                        _: 1,
                                                      }
                                                    ),
                                                  ]),
                                                  _: 1,
                                                },
                                                8,
                                                ["modelValue"]
                                              ),
                                            ]),
                                            _: 1,
                                          }
                                        ),
                                        l(
                                          y,
                                          { class: "row" },
                                          {
                                            default: t(() => [
                                              l(
                                                $,
                                                {
                                                  modelValue:
                                                    a.clear_search_when_switching,
                                                  "onUpdate:modelValue":
                                                    e[17] ||
                                                    (e[17] = (s) =>
                                                      (a.clear_search_when_switching =
                                                        s)),
                                                  label:
                                                    "Clear search field when switching client/site",
                                                },
                                                null,
                                                8,
                                                ["modelValue"]
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
                              ["modelValue"]
                            ),
                            l(
                              y,
                              { class: "row items-center" },
                              {
                                default: t(() => [
                                  l(_, {
                                    label: "Save",
                                    color: "primary",
                                    type: "submit",
                                  }),
                                ]),
                                _: 1,
                              }
                            ),
                          ]),
                          _: 1,
                        },
                        8,
                        ["onSubmit"]
                      ),
                    ]),
                    _: 1,
                  },
                  8,
                  ["modelValue"]
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
var yl = N(wl, [["render", kl]]);
const Cl = { class: "col-9" },
  Al = { class: "col-9" },
  Vl = {
    __name: "ResetPass",
    emits: [...Z.emits],
    setup(o) {
      const e = U(""),
        r = U(""),
        p = U(!0),
        {
          dialogRef: a,
          onDialogHide: u,
          onDialogOK: s,
          onDialogCancel: m,
        } = Z();
      async function D() {
        const O = await $e(e.value);
        ae(O), s();
      }
      return (O, g) => (
        c(),
        f(
          j,
          { ref_key: "dialogRef", ref: a, onHide: T(u) },
          {
            default: t(() => [
              l(
                W,
                { class: "q-dialog-plugin", style: { width: "60vw" } },
                {
                  default: t(() => [
                    l(
                      y,
                      { class: "row" },
                      {
                        default: t(() => [
                          g[4] ||
                            (g[4] = n(
                              "div",
                              { class: "col-3" },
                              "New password:",
                              -1
                            )),
                          n("div", Cl, [
                            l(
                              R,
                              {
                                outlined: "",
                                dense: "",
                                modelValue: e.value,
                                "onUpdate:modelValue":
                                  g[1] || (g[1] = (k) => (e.value = k)),
                                type: p.value ? "password" : "text",
                                rules: [(k) => !!k || "*Required"],
                              },
                              {
                                append: t(() => [
                                  l(
                                    h,
                                    {
                                      name: p.value
                                        ? "visibility_off"
                                        : "visibility",
                                      class: "cursor-pointer",
                                      onClick:
                                        g[0] ||
                                        (g[0] = (k) => (p.value = !p.value)),
                                    },
                                    null,
                                    8,
                                    ["name"]
                                  ),
                                ]),
                                _: 1,
                              },
                              8,
                              ["modelValue", "type", "rules"]
                            ),
                          ]),
                          g[5] ||
                            (g[5] = n(
                              "div",
                              { class: "col-3" },
                              "Confirm password:",
                              -1
                            )),
                          n("div", Al, [
                            l(
                              R,
                              {
                                outlined: "",
                                dense: "",
                                modelValue: r.value,
                                "onUpdate:modelValue":
                                  g[3] || (g[3] = (k) => (r.value = k)),
                                type: p.value ? "password" : "text",
                                rules: [
                                  (k) =>
                                    k === e.value || "Passwords do not match",
                                ],
                              },
                              {
                                append: t(() => [
                                  l(
                                    h,
                                    {
                                      name: p.value
                                        ? "visibility_off"
                                        : "visibility",
                                      class: "cursor-pointer",
                                      onClick:
                                        g[2] ||
                                        (g[2] = (k) => (p.value = !p.value)),
                                    },
                                    null,
                                    8,
                                    ["name"]
                                  ),
                                ]),
                                _: 1,
                              },
                              8,
                              ["modelValue", "type", "rules"]
                            ),
                          ]),
                        ]),
                        _: 1,
                      }
                    ),
                    l(
                      qe,
                      { align: "right" },
                      {
                        default: t(() => [
                          l(
                            _,
                            {
                              color: "primary",
                              label: "Reset",
                              onClick: D,
                              disable: !e.value || e.value !== r.value,
                            },
                            null,
                            8,
                            ["disable"]
                          ),
                          l(
                            _,
                            {
                              color: "negative",
                              label: "Cancel",
                              onClick: T(m),
                            },
                            null,
                            8,
                            ["onClick"]
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
    },
  },
  zl = { class: "text-overline q-ml-sm" },
  Sl = ["href"],
  Hl = Ue({
    __name: "MainLayout",
    setup(o) {
      const e = ee(),
        r = je(),
        {
          serverCount: p,
          serverOfflineCount: a,
          workstationCount: u,
          workstationOfflineCount: s,
          daysUntilCertExpires: m,
        } = Y(il()),
        { displayName: D } = Y(Qe()),
        O = z({
          get: () => r.dark.isActive,
          set: (A) => {
            Re.patch("/accounts/users/ui/", { dark_mode: A }), r.dark.set(A);
          },
        }),
        g = z(() => e.state.currentTRMMVersion),
        k = z(() => e.state.latestTRMMVersion),
        ne = z(() => e.state.needrefresh),
        I = z(() => e.state.hosted),
        ie = z(() => e.state.tokenExpired),
        re = z(() => e.state.dash_warning_color),
        L = z(() => e.state.dash_negative_color),
        de = z(() =>
          k.value
            ? `https://github.com/amidaware/tacticalrmm/releases/tag/v${k.value}`
            : ""
        );
      function ue() {
        r.dialog({ component: yl }).onOk(() => e.dispatch("getDashInfo"));
      }
      function ce() {
        r.dialog({ component: Vl });
      }
      function fe() {
        r.dialog({
          title: "Reset 2FA",
          message: "Are you sure you would like to reset your 2FA token?",
          cancel: !0,
          persistent: !0,
        }).onOk(async () => {
          try {
            const A = await Ee();
            ae(A, 3e3);
          } catch {}
        });
      }
      async function me() {
        try {
          const { message: A, status: d } = await Ye();
          d === 412 ? Je(A) : Xe();
        } catch (A) {
          console.error(A);
        }
      }
      const pe = z(() =>
          k.value === "error" || I.value || g.value?.includes("-dev")
            ? !1
            : g.value !== k.value
        ),
        K = U(null);
      function ve() {
        K.value = setInterval(() => {
          e.dispatch("checkVer"), e.dispatch("getDashInfo", !1);
        }, 60 * 4 * 1e3);
      }
      return (
        De(() => {
          e.dispatch("getDashInfo"), e.dispatch("checkVer"), ve();
        }),
        Oe(() => {
          clearInterval(K.value);
        }),
        (A, d) => {
          const _e = te("router-view");
          return (
            c(),
            f(
              We,
              { view: "hHh lpR fFf" },
              {
                default: t(() => [
                  l(
                    He,
                    { elevated: "", class: "bg-grey-9 text-white" },
                    {
                      default: t(() => [
                        ne.value
                          ? (c(),
                            f(
                              J,
                              {
                                key: 0,
                                "inline-actions": "",
                                class: "bg-red text-white text-center",
                              },
                              {
                                default: t(() => [
                                  d[5] ||
                                    (d[5] = i(
                                      " You are viewing an outdated version of this page. "
                                    )),
                                  l(_, {
                                    color: "dark",
                                    icon: "refresh",
                                    label: "Refresh",
                                    onClick:
                                      d[0] ||
                                      (d[0] = (F) =>
                                        A.$store.dispatch("reload")),
                                  }),
                                ]),
                                _: 1,
                              }
                            ))
                          : S("", !0),
                        !I.value && ie.value
                          ? (c(),
                            f(
                              J,
                              {
                                key: 1,
                                "inline-actions": "",
                                class: "bg-yellow text-black text-center",
                              },
                              {
                                default: t(() => [
                                  l(h, { size: "xl", name: "warning" }),
                                  d[6] ||
                                    (d[6] = n(
                                      "span",
                                      null,
                                      [
                                        n("br"),
                                        i(
                                          "Your license is currently inactive, usually due to a payment issue."
                                        ),
                                        n("br"),
                                        n("br"),
                                        i(
                                          "To restore access, please update your payment method."
                                        ),
                                        n("br"),
                                        n("br"),
                                        i(
                                          " If you\u2019ve intentionally cancelled your sponsorship, you can remove your license key to stop seeing this message."
                                        ),
                                        n("br"),
                                        n("br"),
                                        i(
                                          " If you need help, please contact our support team at "
                                        ),
                                        n(
                                          "a",
                                          {
                                            href: "https://support.amidaware.com",
                                            target: "_blank",
                                            rel: "noopener",
                                            class: "text-primary",
                                          },
                                          "https://support.amidaware.com"
                                        ),
                                        n("br"),
                                        n("br"),
                                      ],
                                      -1
                                    )),
                                  l(_, {
                                    color: "dark",
                                    icon: "refresh",
                                    label: "Refresh",
                                    onClick:
                                      d[1] ||
                                      (d[1] = (F) =>
                                        A.$store.dispatch("reload")),
                                  }),
                                ]),
                                _: 1,
                              }
                            ))
                          : S("", !0),
                        l(Ie, null, {
                          default: t(() => [
                            A.$route.name === "Dashboard"
                              ? (c(),
                                f(_, {
                                  key: 0,
                                  dense: "",
                                  flat: "",
                                  onClick:
                                    d[2] ||
                                    (d[2] = (F) =>
                                      A.$store.dispatch("refreshDashboard")),
                                  icon: "refresh",
                                }))
                              : (c(),
                                f(
                                  _,
                                  {
                                    key: 1,
                                    dense: "",
                                    flat: "",
                                    onClick:
                                      d[3] ||
                                      (d[3] = (F) =>
                                        A.$router.push({ name: "Dashboard" })),
                                    icon: "dashboard",
                                  },
                                  {
                                    default: t(() => [
                                      l(C, null, {
                                        default: t(
                                          () =>
                                            d[7] ||
                                            (d[7] = [i("Back to Dashboard")])
                                        ),
                                        _: 1,
                                      }),
                                    ]),
                                    _: 1,
                                  }
                                )),
                            l(nl, null, {
                              default: t(() => [
                                d[8] || (d[8] = i(" Tactical RMM")),
                                n("span", zl, "v" + w(g.value), 1),
                                pe.value
                                  ? (c(),
                                    f(
                                      M,
                                      {
                                        key: 0,
                                        class: "text-overline q-ml-sm",
                                        color: re.value,
                                        icon: "update",
                                        dense: "",
                                      },
                                      {
                                        default: t(() => [
                                          n(
                                            "a",
                                            {
                                              href: de.value,
                                              target: "_blank",
                                            },
                                            "v" + w(k.value) + " available",
                                            9,
                                            Sl
                                          ),
                                        ]),
                                        _: 1,
                                      },
                                      8,
                                      ["color"]
                                    ))
                                  : S("", !0),
                                T(m) <= 15
                                  ? (c(),
                                    f(
                                      M,
                                      {
                                        key: 1,
                                        dense: "",
                                        color: L.value,
                                        "text-color": "black",
                                        icon: "warning",
                                      },
                                      {
                                        default: t(() => [
                                          i(
                                            "SSL certificate expires in " +
                                              w(T(m)) +
                                              " days",
                                            1
                                          ),
                                        ]),
                                        _: 1,
                                      },
                                      8,
                                      ["color"]
                                    ))
                                  : S("", !0),
                              ]),
                              _: 1,
                            }),
                            l(
                              Fe,
                              {
                                modelValue: O.value,
                                "onUpdate:modelValue":
                                  d[4] || (d[4] = (F) => (O.value = F)),
                                class: "q-mr-sm",
                                "checked-icon": "nights_stay",
                                "unchecked-icon": "wb_sunny",
                              },
                              null,
                              8,
                              ["modelValue"]
                            ),
                            I.value
                              ? S("", !0)
                              : (c(),
                                f(_, {
                                  key: 2,
                                  label: ">_",
                                  dense: "",
                                  flat: "",
                                  onClick: me,
                                  class: "q-mr-sm",
                                  style: { "font-size": "16px" },
                                })),
                            l(
                              M,
                              { class: "cursor-pointer" },
                              {
                                default: t(() => [
                                  l(Pe, {
                                    size: "md",
                                    icon: "devices",
                                    color: "primary",
                                  }),
                                  l(
                                    C,
                                    {
                                      delay: 600,
                                      anchor: "top middle",
                                      self: "top middle",
                                    },
                                    {
                                      default: t(
                                        () =>
                                          d[9] || (d[9] = [i("Agent Count")])
                                      ),
                                      _: 1,
                                    }
                                  ),
                                  i(" " + w(T(p) + T(u)) + " ", 1),
                                  l(H, null, {
                                    default: t(() => [
                                      l(
                                        P,
                                        { dense: "" },
                                        {
                                          default: t(() => [
                                            l(
                                              b,
                                              { header: "" },
                                              {
                                                default: t(
                                                  () =>
                                                    d[10] ||
                                                    (d[10] = [i("Servers")])
                                                ),
                                                _: 1,
                                              }
                                            ),
                                            l(V, null, {
                                              default: t(() => [
                                                l(
                                                  v,
                                                  { avatar: "" },
                                                  {
                                                    default: t(() => [
                                                      l(h, {
                                                        name: "dns",
                                                        size: "sm",
                                                        color: "primary",
                                                      }),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                                l(
                                                  v,
                                                  { "no-wrap": "" },
                                                  {
                                                    default: t(() => [
                                                      l(b, null, {
                                                        default: t(() => [
                                                          i(
                                                            "Total: " + w(T(p)),
                                                            1
                                                          ),
                                                        ]),
                                                        _: 1,
                                                      }),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                              ]),
                                              _: 1,
                                            }),
                                            l(V, null, {
                                              default: t(() => [
                                                l(
                                                  v,
                                                  { avatar: "" },
                                                  {
                                                    default: t(() => [
                                                      l(
                                                        h,
                                                        {
                                                          name: "power_off",
                                                          size: "sm",
                                                          color: L.value,
                                                        },
                                                        null,
                                                        8,
                                                        ["color"]
                                                      ),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                                l(
                                                  v,
                                                  { "no-wrap": "" },
                                                  {
                                                    default: t(() => [
                                                      l(b, null, {
                                                        default: t(() => [
                                                          i(
                                                            "Offline: " +
                                                              w(T(a)),
                                                            1
                                                          ),
                                                        ]),
                                                        _: 1,
                                                      }),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                              ]),
                                              _: 1,
                                            }),
                                            l(
                                              b,
                                              { header: "" },
                                              {
                                                default: t(
                                                  () =>
                                                    d[11] ||
                                                    (d[11] = [
                                                      i("Workstations"),
                                                    ])
                                                ),
                                                _: 1,
                                              }
                                            ),
                                            l(V, null, {
                                              default: t(() => [
                                                l(
                                                  v,
                                                  { avatar: "" },
                                                  {
                                                    default: t(() => [
                                                      l(h, {
                                                        name: "computer",
                                                        size: "sm",
                                                        color: "primary",
                                                      }),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                                l(
                                                  v,
                                                  { "no-wrap": "" },
                                                  {
                                                    default: t(() => [
                                                      l(b, null, {
                                                        default: t(() => [
                                                          i(
                                                            "Total: " + w(T(u)),
                                                            1
                                                          ),
                                                        ]),
                                                        _: 1,
                                                      }),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                              ]),
                                              _: 1,
                                            }),
                                            l(V, null, {
                                              default: t(() => [
                                                l(
                                                  v,
                                                  { avatar: "" },
                                                  {
                                                    default: t(() => [
                                                      l(
                                                        h,
                                                        {
                                                          name: "power_off",
                                                          size: "sm",
                                                          color: L.value,
                                                        },
                                                        null,
                                                        8,
                                                        ["color"]
                                                      ),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                                l(
                                                  v,
                                                  { "no-wrap": "" },
                                                  {
                                                    default: t(() => [
                                                      l(b, null, {
                                                        default: t(() => [
                                                          i(
                                                            "Offline: " +
                                                              w(T(s)),
                                                            1
                                                          ),
                                                        ]),
                                                        _: 1,
                                                      }),
                                                    ]),
                                                    _: 1,
                                                  }
                                                ),
                                              ]),
                                              _: 1,
                                            }),
                                          ]),
                                          _: 1,
                                        }
                                      ),
                                    ]),
                                    _: 1,
                                  }),
                                ]),
                                _: 1,
                              }
                            ),
                            l(bl),
                            l(
                              oe,
                              {
                                flat: "",
                                "no-caps": "",
                                stretch: "",
                                label: T(D) || "",
                              },
                              {
                                default: t(() => [
                                  l(P, null, {
                                    default: t(() => [
                                      x(
                                        (c(),
                                        f(
                                          V,
                                          { clickable: "", onClick: ue },
                                          {
                                            default: t(() => [
                                              l(v, null, {
                                                default: t(() => [
                                                  l(b, null, {
                                                    default: t(
                                                      () =>
                                                        d[12] ||
                                                        (d[12] = [
                                                          i("Preferences"),
                                                        ])
                                                    ),
                                                    _: 1,
                                                  }),
                                                ]),
                                                _: 1,
                                              }),
                                            ]),
                                            _: 1,
                                          }
                                        )),
                                        [[B], [q]]
                                      ),
                                      l(
                                        V,
                                        { clickable: "" },
                                        {
                                          default: t(() => [
                                            l(v, null, {
                                              default: t(
                                                () =>
                                                  d[13] ||
                                                  (d[13] = [i("Account")])
                                              ),
                                              _: 1,
                                            }),
                                            l(
                                              v,
                                              { side: "" },
                                              {
                                                default: t(() => [
                                                  l(h, {
                                                    name: "keyboard_arrow_right",
                                                  }),
                                                ]),
                                                _: 1,
                                              }
                                            ),
                                            l(
                                              H,
                                              {
                                                anchor: "top end",
                                                self: "top start",
                                              },
                                              {
                                                default: t(() => [
                                                  l(P, null, {
                                                    default: t(() => [
                                                      x(
                                                        (c(),
                                                        f(
                                                          V,
                                                          {
                                                            clickable: "",
                                                            onClick: ce,
                                                          },
                                                          {
                                                            default: t(() => [
                                                              l(v, null, {
                                                                default: t(
                                                                  () => [
                                                                    l(b, null, {
                                                                      default:
                                                                        t(
                                                                          () =>
                                                                            d[14] ||
                                                                            (d[14] =
                                                                              [
                                                                                i(
                                                                                  "Reset Password"
                                                                                ),
                                                                              ])
                                                                        ),
                                                                      _: 1,
                                                                    }),
                                                                  ]
                                                                ),
                                                                _: 1,
                                                              }),
                                                            ]),
                                                            _: 1,
                                                          }
                                                        )),
                                                        [[B], [q]]
                                                      ),
                                                      x(
                                                        (c(),
                                                        f(
                                                          V,
                                                          {
                                                            clickable: "",
                                                            onClick: fe,
                                                          },
                                                          {
                                                            default: t(() => [
                                                              l(v, null, {
                                                                default: t(
                                                                  () => [
                                                                    l(b, null, {
                                                                      default:
                                                                        t(
                                                                          () =>
                                                                            d[15] ||
                                                                            (d[15] =
                                                                              [
                                                                                i(
                                                                                  "Reset 2FA"
                                                                                ),
                                                                              ])
                                                                        ),
                                                                      _: 1,
                                                                    }),
                                                                  ]
                                                                ),
                                                                _: 1,
                                                              }),
                                                            ]),
                                                            _: 1,
                                                          }
                                                        )),
                                                        [[B], [q]]
                                                      ),
                                                    ]),
                                                    _: 1,
                                                  }),
                                                ]),
                                                _: 1,
                                              }
                                            ),
                                          ]),
                                          _: 1,
                                        }
                                      ),
                                      l(
                                        V,
                                        { to: "/expired", exact: "" },
                                        {
                                          default: t(() => [
                                            l(v, null, {
                                              default: t(() => [
                                                l(b, null, {
                                                  default: t(
                                                    () =>
                                                      d[16] ||
                                                      (d[16] = [i("Logout")])
                                                  ),
                                                  _: 1,
                                                }),
                                              ]),
                                              _: 1,
                                            }),
                                          ]),
                                          _: 1,
                                        }
                                      ),
                                    ]),
                                    _: 1,
                                  }),
                                ]),
                                _: 1,
                              },
                              8,
                              ["label"]
                            ),
                          ]),
                          _: 1,
                        }),
                      ]),
                      _: 1,
                    }
                  ),
                  l(Ne, null, { default: t(() => [l(_e)]), _: 1 }),
                ]),
                _: 1,
              }
            )
          );
        }
      );
    },
  });
export { Hl as default };

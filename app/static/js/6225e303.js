import { N as m, bm as l, a as g, bn as c } from "./ec0ef80e.js";
function d(e) {
  var t = e * 1e3,
    r = new Date(),
    a = 60 * 1e3,
    i = a * 60,
    u = i * 24,
    n = u * 30,
    f = u * 365,
    o = r - t;
  return o < a
    ? Math.round(o / 1e3) + " seconds ago"
    : o < i
    ? Math.round(o / a) + " minutes ago"
    : o < u
    ? Math.round(o / i) + " hours ago"
    : o < n
    ? Math.round(o / u) + " days ago"
    : o < f
    ? Math.round(o / n) + " months ago"
    : Math.round(o / f) + " years ago";
}
var v = {
  methods: {
    bootTime(e) {
      return d(e);
    },
    alertTime(e) {
      return d(e);
    },
    notifySuccess(e, t = 2e3) {
      m.create({ type: "positive", message: e, timeout: t });
    },
    notifyError(e, t = 2e3) {
      m.create({ type: "negative", message: e, timeout: t });
    },
    notifyWarning(e, t = 2e3) {
      m.create({ type: "warning", message: e, timeout: t });
    },
    notifyInfo(e, t = 2e3) {
      m.create({ type: "info", message: e, timeout: t });
    },
    isValidThreshold(e, t, r = !1) {
      return e === 0 && t === 0
        ? (m.create({
            type: "negative",
            timeout: 2e3,
            message: "Warning Threshold or Error Threshold need to be set",
          }),
          !1)
        : !r && e > t && e > 0 && t > 0
        ? (m.create({
            type: "negative",
            timeout: 2e3,
            message: "Warning Threshold must be less than Error Threshold",
          }),
          !1)
        : r && e < t && e > 0 && t > 0
        ? (m.create({
            type: "negative",
            timeout: 2e3,
            message: "Warning Threshold must be more than Error Threshold",
          }),
          !1)
        : !0;
    },
    isValidEmail(e) {
      return /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/.test(
        e
      );
    },
    unixToString(e) {
      if (!e) return "";
      let t = new Date(e * 1e3);
      return l.formatDate(t, "MMM-D-YYYY - HH:mm");
    },
    dateStringToUnix(e) {
      if (!e) return 0;
      const t = l.extractDate(e, "MM DD YYYY HH:mm");
      return parseInt(l.formatDate(t, "X"));
    },
    formatDjangoDate(e) {
      if (!e) return "";
      const t = l.extractDate(e, "MM DD YYYY HH:mm");
      return l.formatDate(t, "MMM-DD-YYYY - HH:mm");
    },
    formatClientOptions(e) {
      return e.map((t) => ({ label: t.name, value: t.id, sites: t.sites }));
    },
    formatSiteOptions(e) {
      return e.map((t) => ({ label: t.name, value: t.id }));
    },
    capitalize(e) {
      return e[0].toUpperCase() + e.substring(1);
    },
    getCustomFields(e) {
      return g.patch("/core/customfields/", { model: e });
    },
    getAgentCount(e, t, r) {
      if (t === "client") return e.find((a) => r === a.id).agent_count;
      {
        const a = e.map((i) => i.sites);
        for (let i of a) for (let u of i) if (u.id === r) return u.agent_count;
        return 0;
      }
    },
    formatCustomFields(e, t) {
      let r = [];
      for (let a of e)
        a.type === "multiple"
          ? r.push({ multiple_value: t[a.name], field: a.id })
          : a.type === "checkbox"
          ? r.push({ bool_value: t[a.name], field: a.id })
          : r.push({ string_value: t[a.name], field: a.id });
      return r;
    },
    async getScriptOptions(e = !1) {
      let t = [];
      const { data: r } = await g.get("/scripts/");
      let a;
      e ? (a = r) : (a = r.filter((n) => n.script_type !== "builtin"));
      let i = [],
        u = !1;
      return (
        a.forEach((n) => {
          !!n.category && !i.includes(n.category)
            ? i.push(n.category)
            : n.category || (u = !0);
        }),
        u && i.push("Unassigned"),
        i.sort().forEach((n) => {
          t.push({ category: n });
          let f = [];
          a.forEach((s) => {
            s.category === n
              ? f.push({
                  label: s.name,
                  value: s.id,
                  timeout: s.default_timeout,
                  args: s.args,
                  env_vars: s.env_vars,
                })
              : n === "Unassigned" &&
                !s.category &&
                f.push({
                  label: s.name,
                  value: s.id,
                  timeout: s.default_timeout,
                  args: s.args,
                  env_vars: s.env_vars,
                });
          });
          const o = f.sort((s, h) => s.label.localeCompare(h.label));
          t.push(...o);
        }),
        t
      );
    },
    async getAgentOptions(e = "agent_id") {
      const { data: t } = await g.get("/agents/?detail=false");
      return c(t, !1, e);
    },
    getNextAgentUpdateTime() {
      const e = new Date();
      let t;
      e.getMinutes() <= 35
        ? (t = e.setMinutes(35))
        : ((t = l.addToDate(e, { hours: 1 })), t.setMinutes(35));
      const r = l.formatDate(t, "MMM D, YYYY"),
        a = l.formatDate(t, "h:mm A");
      return `${r} at ${a}`;
    },
    truncateText(e) {
      return e ? (e.length >= 60 ? e.substring(0, 60) + "..." : e) : "";
    },
  },
};
export { v as m };

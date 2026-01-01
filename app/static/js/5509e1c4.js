import { a as s, e7 as c } from "./ec0ef80e.js";
import { getBaseUrl as i } from "./780fb64b.js";
function d(t) {
  let o = null;
  if (document.cookie && document.cookie !== "") {
    const e = document.cookie.split(";");
    for (let a = 0; a < e.length; a++) {
      const n = e[a].trim();
      if (n.substring(0, t.length + 1) === t + "=") {
        o = decodeURIComponent(n.substring(t.length + 1));
        break;
      }
    }
  }
  return o;
}
const r = "accounts";
function u() {
  return d("csrftoken");
}
function l(t, o) {
  const e = document.createElement("form");
  (e.method = "POST"), (e.action = t);
  for (const a in o) {
    const n = document.createElement("input");
    (n.type = "hidden"), (n.name = a), (n.value = o[a]), e.appendChild(n);
  }
  document.body.appendChild(e), e.submit();
}
async function m() {
  const { data: t } = await s.get(`${r}/ssoproviders/`);
  return t;
}
async function v(t) {
  const { data: o } = await s.post(`${r}/ssoproviders/`, t);
  return o;
}
async function g(t, o) {
  const { data: e } = await s.put(`${r}/ssoproviders/${t}/`, o);
  return e;
}
async function k(t) {
  const { data: o } = await s.delete(`${r}/ssoproviders/${t}/`);
  return o;
}
async function h() {
  const { data: t } = await s.get(`${r}/ssoproviders/settings/`);
  return t;
}
async function $(t) {
  const { data: o } = await s.post(`${r}/ssoproviders/settings/`, t);
  return o;
}
async function y(t, o) {
  const { data: e } = await s.delete(`${r}/ssoproviders/account/`, {
    data: { provider: t, account: o },
  });
  return e;
}
const p = "_allauth/browser/v1";
async function b(t) {
  c("provider_id", t),
    l(`${i()}/${p}/auth/provider/redirect/`, {
      provider: t,
      process: "login",
      callback_url: `${location.origin}/account/provider/callback`,
      csrfmiddlewaretoken: u() || "",
    });
}
export { v as a, m as b, y as d, g as e, h as f, b as o, k as r, $ as u };

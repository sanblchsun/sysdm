import { b9 as o, a as e } from "./ec0ef80e.js";
import { o as r } from "./6269c2dc.js";
const s = "/agents";
function f(a) {
  const t = o.resolve(`/takecontrol/${a}`).href;
  r(t, null, {
    popup: !0,
    scrollbars: !1,
    location: !1,
    status: !1,
    toolbar: !1,
    menubar: !1,
    width: 1600,
    height: 900,
  });
}
function $(a, t) {
  const n = o.resolve(`/webvnc/${a}/${t}`).href;
  r(n, null, {
    popup: !0,
    scrollbars: !1,
    location: !1,
    status: !1,
    toolbar: !1,
    menubar: !1,
    width: 1600,
    height: 900,
  });
}
function g(a) {
  const t = o.resolve(`/agents/${a}`).href;
  r(t, null, {
    popup: !0,
    scrollbars: !1,
    location: !1,
    status: !1,
    toolbar: !1,
    menubar: !1,
    width: 1600,
    height: 900,
  });
}
function d(a, t) {
  const n = o.resolve(`/remotebackground/${a}?agentPlatform=${t}`).href;
  r(n, null, {
    popup: !0,
    scrollbars: !1,
    location: !1,
    status: !1,
    toolbar: !1,
    menubar: !1,
    width: 1280,
    height: 900,
  });
}
async function h(a = {}) {
  try {
    const { data: t } = await e.get(`${s}/`, { params: a });
    return t;
  } catch (t) {
    console.error(t);
  }
}
async function p(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function w(a, t) {
  const { data: n } = await e.put(`${s}/${a}/`, t);
  return n;
}
async function y(a) {
  const { data: t } = await e.delete(`${s}/${a}/`);
  return t;
}
async function m(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/history/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function b(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/checks/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function A(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/tasks/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function v(a, t) {
  const { data: n } = await e.post(`${s}/${a}/recover/`, t);
  return n;
}
async function k(a, t) {
  const { data: n } = await e.post(`${s}/${a}/cmd/`, t);
  return n;
}
async function C(a) {
  const { data: t } = await e.post(`${s}/${a}/wmi/`);
  return t;
}
async function N(a, t) {
  const { data: n } = await e.post(`${s}/${a}/runscript/`, t);
  return n;
}
async function R(a) {
  const { data: t } = await e.post(`${s}/actions/bulk/`, a);
  return t;
}
async function U(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/processes/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function W(a, t, n = {}) {
  const { data: c } = await e.delete(`${s}/${a}/processes/${t}/`, {
    params: n,
  });
  return c;
}
async function L(a, t, n, c = {}) {
  try {
    const { data: u } = await e.get(`${s}/${a}/eventlog/${t}/${n}/`, {
      params: c,
    });
    return u;
  } catch (u) {
    console.error(u);
  }
}
async function P(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/meshcentral/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function x(a, t) {
  try {
    const { data: n } = await e.get(`${s}/${a}/${t}/webvnc/`);
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function B(a, t) {
  const { data: n } = await e.patch(`${s}/${a}/reboot/`, t);
  return n;
}
async function M(a) {
  const { data: t } = await e.post(`${s}/${a}/reboot/`);
  return t;
}
async function E(a) {
  const { data: t } = await e.post(`${s}/${a}/shutdown/`);
  return t;
}
async function S(a, t = {}) {
  const { data: n } = await e.post(`${s}/${a}/meshcentral/recover/`, {
    params: t,
  });
  return n;
}
async function T(a, t = {}) {
  const { data: n } = await e.get(`${s}/${a}/ping/`, { params: t });
  return n;
}
async function V(a, t = {}) {
  try {
    const { data: n } = await e.get(`${s}/${a}/notes/`, { params: t });
    return n;
  } catch (n) {
    console.error(n);
  }
}
async function j(a) {
  const { data: t } = await e.post(`${s}/notes/`, a);
  return t;
}
async function q(a, t) {
  const { data: n } = await e.put(`${s}/notes/${a}/`, t);
  return n;
}
async function z(a) {
  const { data: t } = await e.delete(`${s}/notes/${a}/`);
  return t;
}
async function D(a) {
  const { data: t } = await e.post(`${s}/${a}/wol/`);
  return t;
}
export {
  S as A,
  x as B,
  U as C,
  W as D,
  L as E,
  B as a,
  k as b,
  f as c,
  d,
  w as e,
  h as f,
  $ as g,
  M as h,
  E as i,
  T as j,
  y as k,
  p as l,
  C as m,
  b as n,
  g as o,
  A as p,
  m as q,
  N as r,
  v as s,
  V as t,
  j as u,
  q as v,
  D as w,
  z as x,
  R as y,
  P as z,
};

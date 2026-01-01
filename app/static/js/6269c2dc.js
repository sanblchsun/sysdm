import { Y as a, az as t, bc as p } from "./ec0ef80e.js";
function f(e) {
  const n = Object.assign({ noopener: !0 }, e),
    r = [];
  for (const i in n) {
    const o = n[i];
    o === !0
      ? r.push(i)
      : (p(o) || (typeof o == "string" && o !== "")) && r.push(i + "=" + o);
  }
  return r.join(",");
}
function s(e, n, r) {
  let i = window.open;
  if (a.is.cordova === !0) {
    if (cordova?.InAppBrowser?.open !== void 0) i = cordova.InAppBrowser.open;
    else if (navigator?.app !== void 0)
      return navigator.app.loadUrl(e, { openExternal: !0 });
  }
  const o = i(e, "_blank", f(r));
  if (o) return a.is.desktop && o.focus(), o;
  n?.();
}
var u = (e, n, r) => {
  if (a.is.ios === !0 && window.SafariViewController !== void 0) {
    window.SafariViewController.isAvailable((i) => {
      i ? window.SafariViewController.show({ url: e }, t, n) : s(e, n, r);
    });
    return;
  }
  return s(e, n, r);
};
export { u as o };

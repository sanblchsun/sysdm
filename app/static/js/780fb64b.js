import { a as n, u as c, N as i } from "./ec0ef80e.js";
const p = () => window._env_.PROD_URL;
function l(o, a) {
  return console.log(o), [() => {}];
}
function d({ app: o, router: a }) {
  (o.config.globalProperties.$axios = n),
    (n.defaults.withCredentials = !0),
    n.interceptors.request.use(
      function (e) {
        const s = c();
        e.baseURL = p();
        const t = s.token;
        return t != null && (e.headers.Authorization = `Token ${t}`), e;
      },
      function (e) {
        return Promise.reject(e);
      }
    ),
    n.interceptors.response.use(
      function (e) {
        return e;
      },
      async function (e) {
        if (e.code && e.code === "ERR_NETWORK")
          return (
            i.create({
              color: "negative",
              message: "Backend is offline (network error)",
              caption:
                "Open your browser's dev tools and check the console tab for more detailed error messages",
              timeout: 5e3,
            }),
            Promise.reject({ ...e })
          );
        let s;
        if (!e.response) s = e.message;
        else if (e.response.status === 401) a.push({ path: "/expired" });
        else if (e.response.status === 403) {
          if (
            e.config.method === "get" ||
            e.config.method === "patch" ||
            e.config.url === "accounts/ssoproviders/token/"
          )
            return Promise.reject({ ...e });
          s = e.response.data.detail;
        } else if (
          e.response.status >= 400 &&
          e.response.status < 500 &&
          e.response.status !== 423
        ) {
          if (e.config.responseType === "blob")
            s = (await e.response.data.text()).replace(/^"|"$/g, "");
          else if (e.response.data.non_field_errors)
            s = e.response.data.non_field_errors[0];
          else if (typeof e.response.data == "string") s = e.response.data;
          else if (typeof e.response.data == "object") {
            let [t, u] = Object.entries(e.response.data)[0];
            s = t + ": " + u[0];
          }
        }
        return (
          (s || e.response) &&
            e.response.status !== 423 &&
            i.create({
              color: "negative",
              message: s || "",
              caption: e.response
                ? e.response.status + ": " + e.response.statusText
                : "",
              timeout: 2500,
            }),
          Promise.reject({ ...e })
        );
      }
    );
}
export { d as default, p as getBaseUrl, l as setErrorMessage };

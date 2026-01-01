import { W as o, a as e, b as s, c as n } from "./36cdb1ed.js";
import { b as a } from "./83623c9a.js";
var f = a(() => {
  self.MonacoEnvironment = {
    getWorker(t, r) {
      return r === "json"
        ? new o()
        : r === "css" || r === "scss" || r === "less"
        ? new e()
        : r === "html" || r === "handlebars" || r === "razor"
        ? new s()
        : new n();
    },
  };
});
export { f as default };

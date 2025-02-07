import { createVuetify } from "vuetify";
import "vuetify/styles";
import * as components from "vuetify/components"; // ✅ Import all components
import * as directives from "vuetify/directives"; // ✅ Import all directives

export default createVuetify({
  components, // ✅ Register all Vuetify components
  directives, // ✅ Register all Vuetify directives
});

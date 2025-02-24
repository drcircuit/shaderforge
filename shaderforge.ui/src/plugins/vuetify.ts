import { createVuetify } from "vuetify";
import "vuetify/styles";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#40c0ff',
          secondary: '#9b59b6',
          accent: '#6c3483',
          background: '#16222A',
          surface: 'rgba(16, 18, 24, 0.95)',
          'surface-bright': 'rgba(20, 20, 25, 0.95)',
          'surface-variant': 'rgba(12, 14, 18, 0.98)',
        }
      }
    }
  }
});

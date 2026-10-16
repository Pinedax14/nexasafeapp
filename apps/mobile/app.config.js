// E7-01 (D25): google-services.json (Firebase Cloud Messaging) no está en el repositorio.
// En EAS llega como la variable de tipo archivo GOOGLE_SERVICES_JSON; en el PC se usa el
// archivo local apps/mobile/google-services.json, que está en .gitignore.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});

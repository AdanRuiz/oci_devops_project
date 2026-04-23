export const oidcConfig = {
  authority: "https://idcs-a333fea8b68e4aff8867ff6094453a03.identity.oraclecloud.com",
  client_id: "7809ed300a374eafa7bb9403f8f1ff01",
  redirect_uri: "http://localhost:3000/callback",
  scope: "openid profile http://localhost:8080api.read",
  automaticSilentRenew: true,
  loadUserInfo: true,
};
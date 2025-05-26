Sakai is an application template for Vue based on the [create-vue](https://github.com/vuejs/create-vue), the recommended way to start a Vite-powered Vue projects.

Visit the [documentation](https://sakai.primevue.org/documentation) to get started.

## Configuration

Copiez `.env.template` vers `.env` et remplissez les valeurs suivantes :

```
VITE_SPOTIFY_CLIENT_ID=<votre id>
VITE_SPOTIFY_CLIENT_SECRET=<votre secret>
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify/callback/
```

Lancez le projet avec :

```bash
npm install
npm run dev
```

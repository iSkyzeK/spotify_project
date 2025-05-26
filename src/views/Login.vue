<script setup>
import router from '@/router';

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('verifier', verifier);

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('response_type', 'code');
    params.append('redirect_uri', import.meta.env.VITE_SPOTIFY_REDIRECT_URI);
    params.append('scope', 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-top-read user-read-recently-played user-library-read user-library-modify');
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

const login = async () => {
    if (!code) {
        console.log(code);
        redirectToAuthCodeFlow(clientId);
    } else {
        router.push('/home');
    }
};
</script>

<template>
    <div>
        <Button v-on:click="login" label="Se connecter avec Spotify" icon="fab fa-spotify" />
    </div>
</template>

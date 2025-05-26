import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                { path: '/home', component: () => import('@/views/Home.vue') },
                { path: '/playlist/:id', component: () => import('@/views/PlaylistDetail.vue'), props: true },
                { path: '/dashboard', component: () => import('@/views/Dashboard.vue') },
                { path: '/stats', component: () => import('@/views/Stats.vue') },
                { path: '/recent', component: () => import('@/views/RecentlyPlayed.vue') },
                { path: '/library', component: () => import('@/views/LikedSongs.vue') },
                { path: '/login', component: () => import('@/views/Login.vue') },
                {
                    path: '/spotify/callback',
                    component: () => import('@/views/RedirectLogin.vue'),
                    props: (route) => ({ code: route.query.code })
                }
            ]
        }
    ]
});


// router.beforeEach((to, from, next) => {
//     const auth = useAuthStore();
//     if (to.path !== '/login' && !auth.isAuthenticated) {
//         next('/login');
//     } else {
//         next();
//     }
// });

export default router;

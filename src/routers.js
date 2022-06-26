import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const router = new VueRouter({
    // history: VueRouter.createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'Content',
            component: () => import('@/view/Content')
        },
        {
            path: '/update',
            name: 'Update',
            component: () => import('@/view/Update')
        },
    ]
});

export default router
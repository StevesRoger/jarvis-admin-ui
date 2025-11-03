import request from '@/utils/request';

export const authService = {
    async login(username, password) {
        return request({
            url: '/auth/login/cookie',
            method: 'POST',
            data: {
                username: username,
                password: password,
                client_id: import.meta.env.VITE_CLIENT_ID,
                client_secret: import.meta.env.VITE_CLIENT_SECRET,
                grant_type: 'password'
            },
            summary: 'Incorrect username or password'
        });
    },
    async checkToken() {
        try {
            const res = await request({
                url: '/auth/check-token/cookie',
                method: 'GET',
                summary: 'Invalid token or expired'
            });
            return res && res.code === '200';
        } catch (error) {
            return false;
        }
    },
    async getPublicKey() {
        return await request({
            url: '/public-key',
            method: 'GET'
        });
    }
};

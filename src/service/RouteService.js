import request from '@/utils/Request';

export const routeAPI = {
    async listRoute(params) {
        return request({
            url: '/route',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString()
        });
    },
    async addRoute(body) {
        return request({
            url: '/route',
            method: 'POST',
            data: body
        });
    },
    async updateRoute(body) {
        return request({
            url: '/route',
            method: 'PUT',
            data: body
        });
    },
    async deleteRoute(id) {
        return request({
            url: '/route/' + id,
            method: 'DELETE'
        });
    }
};

import request from '@/utils/request';

export const routeService = {
    async listRoute(params) {
        return request({
            url: '/route',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
            summary: 'Error listing route'
        });
    },
    async addRoute(body) {
        return request({
            url: '/route',
            method: 'POST',
            data: body,
            summary: 'Error add route'
        });
    },
    async updateRoute(body) {
        return request({
            url: '/route',
            method: 'PUT',
            data: body,
            summary: 'Error update route'
        });
    },
    async deleteRoute(id) {
        return request({
            url: '/route/' + id,
            method: 'DELETE',
            summary: 'Error delete route'
        });
    },
    async listRouteId() {
        return request({
            url: '/route/list/id',
            method: 'GET',
            summary: 'Error listing route id'
        });
    }
};

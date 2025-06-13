import request from '@/utils/request';

export const routeSecurityService = {
    async listRouteRedirect(params) {
        return request({
            url: '/route/redirect',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
            summary: 'Error listing route security'
        });
    },
    async addRouteRedirect(body) {
        return request({
            url: '/route/redirect',
            method: 'POST',
            data: body,
            summary: 'Error add route security'
        });
    },
    async updateRouteRedirect(body) {
        return request({
            url: '/route/redirect',
            method: 'PUT',
            data: body,
            summary: 'Error update route security'
        });
    },
    async deleteRouteRedirect(id) {
        return request({
            url: '/route/redirect/' + id,
            method: 'DELETE',
            summary: 'Error delete route security'
        });
    }
};

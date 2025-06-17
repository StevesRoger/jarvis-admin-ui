import request from '@/utils/request';

export const routeRedirectService = {
    async listRouteRedirect(params) {
        return request({
            url: '/route/redirect',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
            summary: 'Error listing route redirect'
        });
    },
    async addRouteRedirect(body) {
        return request({
            url: '/route/redirect',
            method: 'POST',
            data: body,
            summary: 'Error add route redirect'
        });
    },
    async updateRouteRedirect(body) {
        return request({
            url: '/route/redirect',
            method: 'PUT',
            data: body,
            summary: 'Error update route redirect'
        });
    },
    async deleteRouteRedirect(id) {
        return request({
            url: '/route/redirect/' + id,
            method: 'DELETE',
            summary: 'Error delete route redirect'
        });
    }
};

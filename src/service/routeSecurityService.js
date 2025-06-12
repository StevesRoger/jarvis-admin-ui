import request from '@/utils/request';

export const routeSecurityService = {
    async listRouteSecurity(params) {
        return request({
            url: '/route/security',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
            summary: 'Error listing route security'
        });
    },
    async addRouteSecurity(body) {
        return request({
            url: '/route/security',
            method: 'POST',
            data: body,
            summary: 'Error add route security'
        });
    },
    async updateRouteSecurity(body) {
        return request({
            url: '/route/security',
            method: 'PUT',
            data: body,
            summary: 'Error update route security'
        });
    },
    async deleteRouteSecurity(id) {
        return request({
            url: '/route/security/' + id,
            method: 'DELETE',
            summary: 'Error delete route security'
        });
    }
};

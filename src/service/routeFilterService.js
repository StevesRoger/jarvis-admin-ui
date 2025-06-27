import request from '@/utils/request';

export const routeFilterService = {
    async listRouteFilter(params) {
        return request({
            url: '/route/filter',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
            summary: 'Error listing route filter'
        });
    },
    async addRouteFilter(body) {
        return request({
            url: '/route/filter',
            method: 'POST',
            data: body,
            summary: 'Error add route filter'
        });
    },
    async updateRouteFilter(body) {
        return request({
            url: '/route/filter',
            method: 'PUT',
            data: body,
            summary: 'Error update route filter'
        });
    },
    async deleteRouteFilter(id) {
        return request({
            url: '/route/filter/' + id,
            method: 'DELETE',
            summary: 'Error delete route filter'
        });
    }
};

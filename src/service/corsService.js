import request from '@/utils/request';

export const corsService = {
    async listCors(params) {
        return request({
            url: '/cors',
            method: 'GET',
            params: params,
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
            summary: 'Error listing cors'
        });
    },
    async addCors(body) {
        return request({
            url: '/cors',
            method: 'POST',
            data: body,
            summary: 'Error add cors'
        });
    },
    async updateCors(body) {
        return request({
            url: '/cors',
            method: 'PUT',
            data: body,
            summary: 'Error update cors'
        });
    },
    async deleteCors(id) {
        return request({
            url: '/cors/' + id,
            method: 'DELETE',
            summary: 'Error delete cors'
        });
    }
};

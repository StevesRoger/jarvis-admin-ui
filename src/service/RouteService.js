import request from '@/utils/Request';

export async function listRoute(params) {
    return request({
        url: '/route',
        method: 'get',
        params: params,
        paramsSerializer: (params) => new URLSearchParams(params).toString()
    });
}

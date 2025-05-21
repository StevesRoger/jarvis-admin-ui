import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import { v4 as uuidv4 } from 'uuid';

const request = applyCaseMiddleware(
    axios.create({
        baseURL: import.meta.env.VITE_APIHOST,
        withCredentials: true,
        timeout: 0
    })
);

request.interceptors.request.use(async (config) => {
    const data = config.data;
    if (data) {
        config.data = { data: data, uuid: uuidv4() };
    }
    return config;
});

request.interceptors.response.use(async (response) => {
    if (response.status === 200) {
        return response.data;
    }
    return response;
});

const errorHandler = (error) => {
    const { response, message } = error;
    if (message === 'CustomError') {
        const { config, data } = response;
        const { url, baseURL } = config;
        const { code, msg } = data;
        alert(code || msg || 'Error');
    } else if (message === 'CancelToken') {
        console.log(message);
    } else if (response && response.status) {
        const { status, request } = response;
        /*ElNotification({
      type: "error",
      title: `Request error ${status}: ${request.responseURL}`,
      message: response.data.message,
    });*/
        alert(response.data.message);
    } else if (!response) {
        alert('There is an abnormality in your network and you cannot connect to the server.');
    }
    return Promise.reject(error);
};

export default async function (config) {
    return request(config)
        .then((response) => response.data)
        .catch((error) => errorHandler(error));
}

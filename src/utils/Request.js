import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from './ToastService';

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
        config.data = { data: data, request_id: uuidv4() };
    }
    return config;
});

request.interceptors.response.use(
    async (response) => {
        // Any status code within the range of 2xx will trigger this
        if (response.status === 200) {
            return response.data;
        }
        return response;
    },
    async (error) => {
        if (error.response) {
            // Server responded with a status code outside 2xx
            const { message, data } = error.response.data;
            console.error('Error data:', data);
            showToast({ severity: 'error', summary: 'Error Message', detail: message, life: 3000 });
        } else if (error.request) {
            // No response received
            console.error('No response received:', error.request);
            showToast({ severity: 'error', summary: 'Connectivity error', detail: 'There is an abnormality in your network and you cannot connect to the server', life: 3000 });
        } else {
            // Something else happened
            console.error('Error setting up request:', error.message);
            showToast({ severity: 'error', summary: 'Unexpected error', detail: error.message, life: 3000 });
        } // Optionally, you can throw the error again or return a custom object
        return Promise.reject(error);
    }
);

/*const errorHandler = (error) => {
    const { response, message } = error;
    if (message === 'CustomError') {
        const { config, data } = response;
        const { url, baseURL } = config;
        const { code, msg } = data;
        alert(code || msg || 'Error');
    } else if (message === 'CancelToken') {
        console.log(message);
    } else if (response && response.status) {
        console.log(response);
        alert(response.data.message);
    } else if (!response) {
        alert('There is an abnormality in your network and you cannot connect to the server.');
    }
    return Promise.reject(error);
};*/

export default async function (option) {
    return request(option);
    //.then((response) => response.data)
    //.catch((error) => errorHandler(error));
}

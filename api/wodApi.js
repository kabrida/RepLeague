// Lähteenä: https://axios-http.com/

import axios from "axios";

const wodApi = axios.create({
    baseURL: 'https://crossfit-wod-api.fly.dev/api/v1',
    timeout: 5000,
});

export default wodApi;
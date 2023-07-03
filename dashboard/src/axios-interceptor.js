import axios from 'axios';
import { userKey } from '@/global'

const json = localStorage.getItem(userKey)
const user = JSON.parse(json)

axios.interceptors.request.use(config => {
    if (user && user.ip) {
        config.headers['X-IP-Address'] = user.ip;
    }
    return config;
});

export default axios;

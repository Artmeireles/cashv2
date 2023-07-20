import axios from 'axios';
import { userKey, glKey } from '@/global';

const json = localStorage.getItem(userKey);
const user = JSON.parse(json);
const jsonGLK = localStorage.getItem(glKey);
const geoLocationData = JSON.parse(jsonGLK);

axios.interceptors.request.use((config) => {
    if (user && user.ip) {
        config.headers['x-ip-address'] = user.ip;
    }
    if (geoLocationData && geoLocationData.geolocation) {
        config.headers['x-geo-lt'] = geoLocationData.geolocation.latitude;
        config.headers['x-geo-ln'] = geoLocationData.geolocation.longitude;
    }
    return config;
});

export default axios;

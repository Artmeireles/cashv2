import { defineStore } from 'pinia';
import { baseApiAuthUrl } from '@/env';
import { userKey, glKey } from '@/global';
import interceptor from '@/axios-interceptor';
import axios from 'axios';

export const useUserStore = defineStore('users', {
    state: () => ({
        user: {},
        ipify: undefined,
        timeToLogOut: 600,
        isTokenValid: false,
        geolocation: {
            latitude: null,
            longitude: null
        },
        errorMessage: null
    }),
    getters: {
        userStore(state) {
            return state.user;
        },
        userGeoLoc(state) {
            return state.geolocation;
        },
        userTimeToLogOut(state) {
            setInterval(() => {
                state.timeToLogOut--;
                let timeTo = state.user.timeLogged + state.timeToLogOut;
                return timeTo;
            }, 1000);
        }
    },
    actions: {
        async registerUser(email, password) {
            const url = `${baseApiAuthUrl}/signin`;
            const urlIp = `https://api.vivazul.com.br/getIp`;
            let ip = await axios.get(urlIp);
            ip = ip.data.ip.split(',')[0];
            interceptor.interceptors.request.use((config) => {
                config.headers['x-ip-address'] = ip;
                return config;
            });
            await interceptor
                .post(url, { email, password })
                .then((res) => {
                    this.user = res.data;
                    if (this.user.id && this.user.isMatch) {
                        this.user.timeLogged = Math.floor(Date.now() / 1000);
                        this.user.ip = ip;
                        interceptor.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`;
                        localStorage.setItem(userKey, JSON.stringify({ ...res.data, ip: ip }));
                        location.reload();
                    } else {
                        delete interceptor.defaults.headers.common['Authorization'];
                        delete interceptor.defaults.headers.common['x-ip-address'];
                        delete interceptor.defaults.headers.common['x-geo-lt'];
                        delete interceptor.defaults.headers.common['x-geo-ln'];
                        localStorage.removeItem(userKey);
                    }
                    return this.user;
                })
                .catch((error) => {
                    return { data: error };
                });
        },
        async findUser(cpf) {
            const url = `${baseApiAuthUrl}/signin`;
            await interceptor
                .post(url, { cpf })
                .then((res) => {
                    this.user = res.data;
                })
                .catch((error) => {
                    return error;
                });
        },
        async validateToken(userData) {
            const url = `${baseApiAuthUrl}/validateToken`;
            if (userData && userData.ip) userData.ipSignin = userData.ip;
            return await interceptor
                .post(url, userData)
                .then((res) => {
                    this.isTokenValid = res.data;
                    if (this.isTokenValid) {
                        this.user = userData;
                        interceptor.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`;
                        this.getLocation();
                        this.timeToLogOut = 600;
                    } else {
                        this.logout();
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        logout() {
            this.user = {};
            delete interceptor.defaults.headers.common['Authorization'];
            delete interceptor.defaults.headers.common['x-ip-address'];
            delete interceptor.defaults.headers.common['x-geo-lt'];
            delete interceptor.defaults.headers.common['x-geo-ln'];
            localStorage.removeItem(userKey);
        },
        getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.showPosition, this.showError);
            } else {
                this.errorMessage = 'Geolocalização não suportada pelo navegador.';
            }
        },
        showPosition(position) {
            this.geolocation.latitude = position.coords.latitude;
            this.geolocation.longitude = position.coords.longitude;
            this.errorMessage = null;
            localStorage.setItem(glKey, JSON.stringify({ geolocation: this.geolocation }));
            interceptor.defaults.headers.common['x-geo-lt'] = this.geolocation.latitude;
            interceptor.defaults.headers.common['x-geo-ln'] = this.geolocation.longitude;
        },
        showError(error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    this.errorMessage = 'Permissão negada pelo usuário.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    this.errorMessage = 'Informações de localização indisponíveis.';
                    break;
                case error.TIMEOUT:
                    this.errorMessage = 'Tempo limite expirado para obter a localização.';
                    break;
                case error.UNKNOWN_ERROR:
                    this.errorMessage = 'Erro desconhecido ao obter a localização.';
                    break;
            }
        },
        async fetchGeolocation(ip) {
            fetch(`ipinfo.io/${ip}?token=d72148b1c8d694`)
                // .then((response) => response.json())
                .then((data) => {
                    if (data.length > 0) {
                        const location = data.loc.split(',');
                        this.location = {
                            latitude: location[0],
                            longitude: location[1]
                        };
                    }
                })
                .catch((error) => {
                    console.error('Erro ao obter a geolocalização:', error);
                });
        }
    }
});

<script>
export default {
    data() {
        return {
            latitude: null,
            longitude: null,
            errorMessage: null
        };
    },
    methods: {
        getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.showPosition, this.showError);
            } else {
                this.errorMessage = 'Geolocalização não suportada pelo navegador.';
            }
        },
        showPosition(position) {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            this.errorMessage = null;
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
        }
    }
};
</script>

<template>
    <div>
        <h1>Geolocalização</h1>
        <button @click="getLocation">Obter Localização</button>
        <div v-if="latitude && longitude">
            <p>Latitude: {{ latitude }}</p>
            <p>Longitude: {{ longitude }}</p>
        </div>
        <p v-if="errorMessage">{{ errorMessage }}</p>
    </div>
</template>

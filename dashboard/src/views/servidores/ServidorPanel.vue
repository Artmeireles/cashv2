<script setup>
import { onMounted, ref } from 'vue';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import router from '../../router';
import { defaultSuccess, defaultWarn } from '@/toast';
import ServidorForm from './ServidorForm.vue';

import { useRoute } from 'vue-router';
const route = useRoute();

const itemData = ref({});
const loading = ref(true);
const urlBase = ref(`${baseApiUrl}/servidores/${route.params.id}`);

const loadData = async () => {
    axios.get(urlBase.value).then((res) => {
        const body = res.data;
        if (body && body.id) {
            itemData.value = body;
            loading.value = false;
        } else {
            defaultWarn('Registro não localizado');
            router.push(urlBase.value);
        }
    });
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Servidor {{ itemData.nome }}</h5>
                <TabView>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-fw pi-id-card mr-2"></i>
                            <span>Dados</span>
                        </template>
                        <ServidorForm :itemData="itemData" />
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-wallet mr-2"></i>
                            <span>Documentos</span>
                        </template>
                        <p class="line-height-3 m-0">
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                            enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-users mr-2"></i>
                            <span>Dependentes</span>
                        </template>
                        <p class="line-height-3 m-0">
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                            enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-building mr-2"></i>
                            <span>Funcional</span>
                        </template>
                        <p class="line-height-3 m-0">
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                            enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-arrow-right-arrow-left mr-2"></i>
                            <span>Movimentações</span>
                        </template>
                        <p class="line-height-3 m-0">
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                            enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-briefcase mr-2"></i>
                            <span>Vinculos</span>
                        </template>
                        <p class="line-height-3 m-0">
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                            enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-money-bill mr-2"></i>
                            <span>Remuneração</span>
                        </template>
                        <p class="line-height-3 m-0">
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                            enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-wrench mr-2"></i>
                            <span>Diversos</span>
                        </template>
                        <p class="line-height-3 m-0">Impressão de documentos, Foto do servidor</p>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    </div>
</template>

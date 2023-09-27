<script setup>
import { onMounted, ref } from 'vue';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import router from '../../router';
import { defaultSuccess, defaultWarn } from '@/toast';
import ServidorForm from './ServidorForm.vue';
import ServVinculosGrid from '../servidoresVinculos/ServVinculosGrid.vue';
import RemuneracoesGrid from '../remuneracao/RemuneracoesGrid.vue';
import ServDependentesGrid from '../servidoresDependentes/ServDependentesGrid.vue';
import ServAfastamentosGrid from '../servidoresAfastamentos/ServAfastamentosGrid.vue';

import { useRoute } from 'vue-router';
const route = useRoute();

const itemData = ref({}); // O próprio servidor
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
                        <ServidorForm />
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
                            <i class="pi pi-fw pi-id-card mr-2"></i>
                            <span>Dependentes</span>
                        </template>
                        <ServDependentesGrid />
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-fw pi-id-card mr-2"></i>
                            <span>Movimentações</span>
                        </template>
                        <ServAfastamentosGrid />
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-fw pi-id-card mr-2"></i>
                            <span>Vinculos</span>
                        </template>
                        <ServVinculosGrid />
                    </TabPanel>
                    <TabPanel>
                        <template #header>
                            <i class="pi pi-fw pi-id-card mr-2"></i>
                            <span>Remuneração</span>
                        </template>
                        <RemuneracoesGrid />
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

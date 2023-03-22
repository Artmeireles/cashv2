<template>
    <div class="parcela-data">
        <b-form>
            <input type="hidden" v-model="itemData.id" />
            <input type="hidden" v-model="itemData.evento" />
            <input type="hidden" v-model="itemData.status" />
            <input type="hidden" v-model="itemData.created_at" />
            <input type="hidden" v-model="itemData.updated_at" />
            <h3>{{ canEdit ? 'Alterar' : 'Ver' }} os dados da parcela {{ itemData.parcela
                    ? itemData.parcela.toString().padStart(3, '0') : ""
            }} {{
        userParams.admin >= 1 ? `(${itemData.id})` : ""
}}
            </h3>
            <hr>
            <b-row>
                <b-col md="2" sm="12">
                    <b-form-group label="Valor Parcela" label-for="parcela-valor_parcela">
                        <b-input-group prepend="R$">
                            <money v-model="itemData.valor_parcela" v-bind="money" id="parcela-valor_parcela"
                                class="valor-field-right form-control" v-if="canEdit" />
                            <p v-else class="valor-field-right form-control disabled">
                                {{ valueFormater(itemData.valor_parcela) }}</p>
                        </b-input-group>
                    </b-form-group>
                </b-col>
                <b-col :md="`${canEdit ? '3' : '2'}`" sm="12">
                    <b-form-group label="Vencimento" label-for="parcela-vencimento">
                        <b-form-datepicker id="parcela-vencimento" v-model="itemData.vencimento" locale="pt" :min="min"
                            :date-disabled-fn="dateDisabled" v-bind="labelsDatePicker['pt'] || {}"
                            :disabled="mode != 'save'"
                            :date-format-options="{ year: 'numeric', month: 'numeric', day: 'numeric', }" reset-button
                            v-if="canEdit" />
                        <p v-else class="valor-field-center form-control disabled">{{ itemData.vencimento }}</p>
                    </b-form-group>
                </b-col>
                <b-col :md="`${canEdit ? '3' : '2'}`" sm="12">
                    <b-form-group label="Situação" label-for="parcela-situacao">
                        <b-form-select id="parcela-situacao" :options="optionStatus" v-model="itemData.situacao"
                            v-if="canEdit" />
                        <p v-else class="valor-field-center form-control disabled">{{ getLabel(optionStatus,
                                itemData.situacao)
                        }}</p>
                    </b-form-group>
                </b-col>
                <b-col md="4" sm="12" v-if="canEdit">
                    <b-form-group label="Recorrência da edição" label-for="parcela-recorrencia">
                        <b-form-radio-group v-model="recorrencia" :options="optionsRecorrencia" class="mb-3"
                            value-field="item" text-field="name" disabled-field="notEnabled"></b-form-radio-group>
                    </b-form-group>
                </b-col>
                <b-col :md="`${canEdit ? '10' : '4'}`" sm="12">
                    <b-form-group label="Observações da edição" label-for="parcela-observacao">
                        <b-form-textarea placeholder="Digite aqui o motivo da edição" v-model="itemData.observacao"
                            v-if="canEdit" />
                        <p v-else class="valor-field-center form-control disabled">{{ itemData.observacao }}</p>
                    </b-form-group>
                </b-col>
                <b-col :md="`${canEdit ? '2' : '2'}`" sm="12">
                    <b-button block variant="primary" @click="save" v-if="canEdit" class="mt-2">Salvar</b-button>
                    <b-button block @click="close" v-if="canEdit">Cancelar</b-button>
                    <b-button block @click="transfDomain" v-if="canEdit && userParams.admin >= 1">Transferir Domínio</b-button>
                    <b-form-group v-else label="." :label-class="`invis${canEdit ? '' : ' no-bottom-margim'}`"
                        label-for="parcela-buttons">
                        <b-button block @click="close">Cancelar</b-button>
                    </b-form-group>
                </b-col>
            </b-row>
            <code v-if="itemData.uName && itemData.updated_at" class="float-right">
          Última alteração executada por {{ itemData.uName }} em {{ itemData.updated_at }}
        </code>
        </b-form>
    </div>
</template>
  
<script>
import { mapState } from "vuex";
import axios from "axios";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import { Money } from "v-money";
import { isNumber, datePickerLocale, getDecimalFormater } from "@/config/globalFacilities";
import moment from 'moment'

export default {
    name: "ParcelaData",
    props: ["item"],
    components: { Money },
    data: function () {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const minDate = new Date(today)
        minDate.setMonth(minDate.getMonth())
        minDate.setDate(1)

        return {
            userParams: {},
            itemData: {},
            labelsDatePicker: datePickerLocale,
            valueFormater: getDecimalFormater,
            canEdit: false,
            money: {
                decimal: ",",
                thousands: ".",
                prefix: "",
                suffix: "",
                precision: 2,
                masked: false,
            },
            mode: "save",
            lblCancelar: "Cancelar",
            isNumber: isNumber,
            recorrencia: "0",
            optionsRecorrencia: [
                { item: "0", name: 'Apenas esta' },
                { item: "1", name: 'Todas as seguintes' },
            ],
            optionStatus: [
                { value: null, text: "Selecione" },
                { value: "1", text: "Acatar" },
                { value: "2", text: "Excluido" },
                { value: "3", text: "Excesso de débito" },
                { value: "4", text: "Matrícula inválida" },
                { value: "5", text: "DV-Matrícula inválida" },
                { value: "6", text: "Aposentado" },
                { value: "7", text: "Rescisão sem desconto" },
                { value: "8", text: "Afastado" },
                { value: "9", text: "Outros" },
                { value: "100", text: "Pagamento parcial" },
                { value: "101", text: "Rescisão com desconto" },
                { value: "102", text: "Decisão judicial" },
                { value: "103", text: "Férias" },
                { value: "104", text: "Falecido" },
                { value: "105", text: "Exonerado" },
                { value: "106", text: "Licença" },
            ],
            lang: {
                formatLocale: {
                    firstDayOfWeek: 0,
                },
                monthBeforeYear: true,
            },
            min: minDate,
        };
    },
    methods: {
        loadData() {
            if (this.item.id) {
                const url = `${baseApiUrl}/con-parcelas/${this.item.id_con_contratos}/${this.item.id}`;
                axios.get(url).then((body) => {
                    this.itemData = body.data.data;
                    moment.locale('pt-br');
                    if (this.itemData.updated_at)
                        this.itemData.updated_at = moment(this.itemData.updated_at).format("LLL")
                    this.canEdit = this.userParams.con_contratos >= 3 && ((this.userParams.tipoUsuario == 1  && this.userParams.consignatario == this.itemData.id_consignatario) || this.userParams.tipoUsuario == 2 || this.userParams.admin >= 1)
                    if (!this.canEdit)
                        this.itemData.vencimento = moment(this.itemData.vencimento).format("DD/MM/YYYY")
                });
            }
        },
        save() {
            const url = `${baseApiUrl}/con-parcelas/${this.item.id_con_contratos}/${this.item.id}`;
            this.itemData.recorrencia = this.recorrencia
            axios.put(url, this.itemData)
                .then((res) => {
                    this.itemData = res.data;
                    this.$toasted.global.defaultSuccess();
                    this.$emit("objectInputs");
                })
                .catch((error) => {
                    showError(error);
                });
        },
        getLabel(array, key) {
            const item = array.filter((it) => it.value == key);
            return item && item[0] && item[0].text ? item[0].text : "";
        },
        close() {
            this.$emit("close")
        },
        // reset() {
        //     this.$bvModal.hide(`modal_${this.item.id_con_contratos}`);
        // },
        loadUserParams() {
            const url = `${baseApiUrl}/users/${this.user.id}`;
            axios.get(url).then((res) => {
                this.userParams = res.data;
                this.loadData();
            });
        },
        dateDisabled(ymd, date) {
            // Disable weekends (Sunday = `0`, Saturday = `6`)
            const weekday = date.getDay()
            return weekday === 0 || weekday === 6
        }
    },
    watch: {},
    mounted() {
        this.loadUserParams();
    },
    computed: {
        ...mapState(["user"]),
    },
};
</script>
  
<style scoped>
.float-right {
    margin-top: 5px;
    padding: 1px;
    margin-left: 10px;
    margin-bottom: 15px;
}

.disabled {
    background: #e9ecef;
}

.mx-datepicker {
    width: 100%;
}
</style>
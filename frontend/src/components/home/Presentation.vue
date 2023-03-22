<template>
  <div class="home">
    <div class="float-right w-100 100vh p-3">
      <b-row style="padding-right: 6px">
        <b-col offset-md="4">
          <b-card no-body :class="`presentation-panel ${formatClass}`">
            <b-tabs v-model="tabIndex" small pills card end>
              <b-tab title="Apresentando">
                <h2 class="text-center mb-3">
                  De cabelo em pé com o tratamento de Consignações? &#128545;
                </h2>
                <h2 class="text-center mb-3">
                  Cansado de erros em sua aplicação de Folha de Pagamento?
                  &#128531;
                </h2>
                <h5 class="text-center mb-3">
                  A gente te entende &#128521;. Não perca a cabeça...
                </h5>
                <h4 class="text-center mb-3">
                  Descubra o que o Cash pode fazer por seu departamento
                </h4>
              </b-tab>
              <b-tab title="O que é?">
                <h5>O que é?</h5>
                <p>
                  O Cash é uma plataforma online preparada para processar os
                  <b>consignados</b> de seu município
                </p>
                <p>
                  Contém os dados da folha de pagamento de seu município e
                  permite acesso rápido aos dados mais importantes
                </p>
                <p>
                  Já nasceu moderna e se mantém em dia com todas as exigências
                  federais, estaduais e municipais
                </p>
                <p>
                  Está pronta para o <b>eSocial S-1.0</b> do governo federal.
                  Atende ao FNDE, ao SICAP estadual e todas as outras
                  obrigatoriedades
                </p>
                <p>
                  Hoje está integrada com a nossa aplicação desktop para
                  tratamento da folha de pagamento e mantém os dados online e
                  sincronizados (Windows apenas)
                </p>
              </b-tab>
              <b-tab title="Segurança">
                <h5>Segurança</h5>
                <p>A segurança dos dados é uma de nossas prioridades</p>
                <p>
                  Além das camadas de segurança já mencionadas, estamos atentos
                  à LGPD
                </p>
                <p>
                  A plataforma conta com uma camada própria de segurança baseada
                  em sua estrutura
                </p>
                <p>
                  Cada cliente tem seus próprios bancos de dados e todos eles
                  são monitorados e becapeados diversas vezes por dia visando
                  evitar problemas com sequestro de dados
                </p>
                <p>
                  Cada usuário tem suas próprias alçadas de liberação. Muito
                  parecido ao que os bancos usam. Cada operação é monitorada e
                  tudo é registrado
                </p>
                <p>
                  Um operador precisa de liberação para acessar determinadas
                  informações e essa liberação é feita pelo nosso time de
                  suporte ou por um gestor designado pela autarquia
                </p>
              </b-tab>
              <b-tab title="+Segurança">
                <h5>+Segurança</h5>
                <p>
                  Um log de operações registra tudo que é executado dentro da
                  plataforma de forma que um usuário não poderá atribuir a outro
                  a sua própria operação
                </p>
                <p>
                  Os bancos de dados são previamente criptografados. No
                  infortúnio caso de sequestro, os dados sensíveis dos
                  servidores são ilegíveis e inúteis sem que antes se quebre a
                  criptografia
                </p>
                <p>A chave criptográfica é guardada fora da aplicação</p>
                <p>
                  Todas as senhas de acesso são convertidas em uma chave
                  ilegível e as senhas só podem ser recuperadas por meio de uma
                  função própria da plataforma
                </p>
                <p>
                  A aplicação não envia mensagens pedindo dados e o suporte
                  jamais pedirá chaves de acesso
                </p>
              </b-tab>
              <b-tab title="Telas do sistema">
                <h5>Telas do sistema</h5>
                <p>
                  Consignações: acessível apenas para usuários consignatários
                </p>
                <p>
                  Painel do servidor: acessível apenas para usuários da folha de
                  pagamento
                </p>
                <p>
                  Os servidores municipais contam com a visualização de seu
                  próprio perfil e nele acessam seus dados básicos, seus
                  contracheques e histórico de descontos de consignados
                </p>
                <p>
                  Perfil de usuário com as informações mais básicas e não
                  sensíveis do usuário
                </p>
              </b-tab>
              <b-tab title="Suporte">
                <h5>Suporte</h5>
                <p>
                  Nosso suporte atende chamados em todo o horário comercial, de
                  segunda-feira a sexta-feira, através das ferramentas online e
                  pelos telefones informados em contrato
                </p>
                <p>
                  A própria plataforma contém um chat online para ajuda imediata
                  com um atendente humano
                </p>
                <p>
                  Mesmo que o chat esteja offline, é possível enviar um ticket
                  solicitando suporte. Seu ticket será atendido em até 72horas
                  ou menos
                </p>
                <p>
                  Nosso email de suporte é o
                  <a href="mailto:suporte@mgcash.app.br"
                    >suporte@mgcash.app.br</a
                  >
                </p>
                <p>
                  Além de tudo isso o suporte tem uma equipe com mais de
                  {{ years }} anos de experiência pronta para te atender
                </p>
              </b-tab>
              <b-tab title="Estrutura">
                <h5>Estrutura</h5>
                <p>
                  O Cash foi desenvolvido utilizando-se das mais modernas
                  tecnologias: Java©, JavaScript©, Oracle© e Linux©
                </p>
                <p>
                  Como utiliza a linguagem nativa de seu navegador (o JavaScript©)
                  chega a executar algumas tarefas em frações de segundos
                </p>
                <p>
                  É um sistema de múltiplas camadas, hospedado na nuvem, em
                  servidores dedicados Linux© e Data Center de última geração
                </p>
                <p>
                  Seus diversos bancos de dados são becapeados várias vezes ao
                  dia sob múltiplas camadas de segurança de rede para garantir a
                  integridade dos dados
                </p>
                <p>
                  Operação garantida em mais de 99% do tempo, 24 horas por dia,
                  7 dias por semana
                </p>
              </b-tab>
              <b-tab title="Quer saber mais?">
                <h5>Quer saber mais?</h5>
                <p>
                  Envie-nos um email utilizando o formulário abaixo. Teremos
                  prazer em te responder o quanto antes
                </p>
                <b-form>
                  <b-form-group
                    id="input-group-1"
                    description="Nunca compartilharemos seu e-mail com mais ninguém."
                  >
                    <b-form-input
                      id="input-1"
                      v-model="form.from"
                      type="email"
                      placeholder="Seu melhor email"
                      required
                    ></b-form-input>
                  </b-form-group>

                  <b-form-group id="input-group-2">
                    <b-form-input
                      id="input-2"
                      v-model="form.name"
                      placeholder="Seu nome"
                      required
                    ></b-form-input>
                  </b-form-group>

                  <b-form-group id="input-group-3">
                    <b-form-input
                      id="input-3"
                      v-model="form.subject"
                      placeholder="Assunto"
                      required
                    ></b-form-input>
                  </b-form-group>

                  <b-form-group label-for="input-group-4">
                    <b-form-textarea
                      id="input-group-4"
                      v-model="form.message"
                      placeholder="Sua mensagem..."
                      rows="4"
                      max-rows="6"
                    ></b-form-textarea>
                  </b-form-group>

                  <b-button @click="onSubmit" variant="primary"
                    >Enviar</b-button
                  >
                  <b-button @click="onReset" variant="danger" class="ml-3"
                    >Resetar</b-button
                  >
                </b-form>
              </b-tab>
            </b-tabs>
          </b-card>
          <!-- Control buttons-->
          <div class="text-center">
            <b-button-group class="mt-2">
              <b-button @click="tabIndex--">Anterior</b-button>
              <b-button @click="tabIndex++">Próximo</b-button>
            </b-button-group>
          </div>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import { appName } from "@/global";
import { mapState } from "vuex";
import moment from "moment";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import axios from "axios";
import { isBrowser } from "mobile-device-detect";

export default {
  name: "Home",
  components: {},
  data: function () {
    return {
      title: appName,
      subTitle: `Consignados e Pagamentos online`,
      tabIndex: 0,
      years: moment().diff("2001-12-05", "years"),
      formatClass: "",
      form: {
        to: "suporte@mgcash.app.br",
        from: "",
        name: "",
        subject: "",
        message: "",
      },
    };
  },
  methods: {
    onSubmit() {
      this.form.ccSender = true
      axios
        .post(`${baseApiUrl}/mailer-noncli`, this.form)
        .then(() => {
          this.$toasted.global.defaultSuccess({
            msg: "Mensagem enviada com sucesso!",
          });
          this.$toasted.global.defaultSuccess({
            msg: "Responderemos assim que possível",
          });
          this.onReset();
          this.tabIndex = 0;
        })
        .catch(showError);
    },
    onReset() {
      this.form = {
        from: "",
        name: "",
        subject: "",
        body: "",
      };
    },
    getMainClass() {
      if (isBrowser) this.formatClass = " desktop";
    },
  },
  mounted() {
    this.getMainClass();
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.presentation-panel {
  border-color: transparent;
  color: #3f1316;

  width: 100%;
}
.card-footer {
  border-color: transparent;
  background-color: transparent;
}
.desktop {
  background-color: transparent;
}
</style>

import Vue from 'vue'
import Toasted from 'vue-toasted'

Vue.use(Toasted, {
    iconPack: 'fontawesome',
    duration: 10000,
    position: "top-center",
    action: {
        text: "X",
        onClick: (e, toastObject) => {
            toastObject.goAway(0);
        },
    },
})

Vue.toasted.register(
    'defaultSuccess',
    payload => !payload.msg ? 'Operação realidada com sucesso!' : payload.msg,
    { type: 'success', icon: 'check' }
)

Vue.toasted.register(
    'defaultInfo',
    payload => !payload.msg ? 'Por favor aguarde!' : payload.msg,
    { type: 'info', icon: 'check' }
)

Vue.toasted.register(
    'defaultWarning',
    payload => !payload.msg ? 'Aviso!' : payload.msg,
    {
        type: 'error', icon: 'times'
    }
)

Vue.toasted.register(
    'defaultRequestPassword',
    payload => !payload.msg ? 'Verifique seu email ou SMS no celular para concluir a operação!' : payload.msg,
    { type: 'success', icon: 'check' }
)

Vue.toasted.register(
    'defaultError',
    payload => !payload.msg ? 'Oops.. Erro inesperado.' : payload.msg,
    { type: 'error', icon: 'times' }
)
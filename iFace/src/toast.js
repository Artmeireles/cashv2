import { app } from './main';


export function defaultToast(msg, severity) {
  let severityRes = severity || 'success'
  let msgTimeLife = 1
  if (typeof (msg) == 'string')
    msgTimeLife = msg.split(' ').length
  else console.log(msg);

  app.config.globalProperties.$toast.removeAllGroups()
  if (typeof (msg) == 'object') {
    const lengths = []
    msg.forEach(element => {
      lengths.push(element.split(' ').length)
    })
    const msgTimeLife = Math.max(...lengths) * 500
    msg.forEach(element => {
      app.config.globalProperties.$toast.add({ severity: severityRes, detail: element, life: msgTimeLife * 500 })
    });
  } else {
    app.config.globalProperties.$toast.add({ severity: severityRes, detail: msg, life: msgTimeLife * 500 })
  }
}

export function defaultSuccess(msg) {
  return defaultToast(msg, 'success')
}

export function defaultInfo(msg) {
  return defaultToast(msg, 'info')
}

export function defaultError(msg) {
  return defaultToast(msg, 'error')
}

export function defaultWarn(msg) {
  return defaultToast(msg, 'warn')
}


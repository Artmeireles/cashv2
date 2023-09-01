import { app } from './main';

export function defaultToast(msg, severity, clear) {
    let severityRes = severity || 'success';
    let msgTimeLife = 1;
    if (typeof msg == 'string') msgTimeLife = msg.split(' ').length;
    else console.log(msg);

    if (clear) app.config.globalProperties.$toast.removeAllGroups();
    if (typeof msg == 'object') {
        const lengths = [];
        msg.forEach((element) => {
            lengths.push(element.split(' ').length);
        });
        const msgTimeLife = Math.max(...lengths) * 500;
        msg.forEach((element) => {
            app.config.globalProperties.$toast.add({ severity: severityRes, detail: element, life: msgTimeLife * 500 });
        });
    } else {
        app.config.globalProperties.$toast.add({ severity: severityRes, detail: msg, life: msgTimeLife * 500 });
    }
}

export function defaultSuccess(msg, clear) {
    return defaultToast(msg, 'success', clear);
}

export function defaultInfo(msg, clear) {
    return defaultToast(msg, 'info', clear);
}

export function defaultError(msg, clear) {
    return defaultToast(msg, 'error', clear);
}

export function defaultWarn(msg, clear) {
    return defaultToast(msg, 'warn', clear);
}

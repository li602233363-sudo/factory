
import { createPinia } from 'pinia'

function initPinia(app){
    const pinia = createPinia();
    app.use(pinia)
}

export {
    initPinia
}
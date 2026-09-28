import {defineStore} from 'pinia'
/*
存储按钮点击时候当前的状态
*/
export const useKeyboardStore = defineStore('keyboard',{
    state: () => ({
        ARROW_KEYS: new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']),
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Shift: false
    }),
    getters: {
        setArrowKeys: (state)=> state.ARROW_KEYS,
        setArrowUp: (state)=> state.ArrowUp,
        setArrowDown: (state)=> state.ArrowDown,
        setArrowLeft: (state)=> state.ArrowLeft,
        setArrowRight: (state)=> state.ArrowRight,
        setShift:  (state)=> state.Shift,
    },
    actions: {
        // 当前摁下去的是啥
        setArrow(val, type){
            console.log(val)
            if(val){
                this[val.includes('Shift')?'Shift': val] = type
            } else {
                this.ArrowUp= false
                this.ArrowDown= false
                this.ArrowLeft= false
                this.ArrowRight= false
                this.Shift= false
            }
        }
    }
})
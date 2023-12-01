import ExternalAppControl from '/external-app-control/dist/external-app-control.js'

new Vue({
    el: '.outer',
    mounted() {
        this.app = new ExternalAppControl();
    },
    methods: {
        panToEiffelTower() {
            this.app.map.panTo(48.8584, 2.2945);
        }
    }
})
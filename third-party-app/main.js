import ExternalAppControl from '/external-app-control/dist/external-app-control.js'

new Vue({
    el: '.outer',
    mounted() {
        this.app = new ExternalAppControl();
        this.app.selection.on('change', this.onSelectionChange.bind(this));
    },
    data() {
        return {
            selections: [],
            selectedType: null,
            selectedId: null
        }
    },
    methods: {
        panToEiffelTower() {
            this.app.map.panTo(48.8584, 2.2945);
        },
        panToEntity() {
            this.app.map.panToEntity(
                'object', // 'object', 'area','task' 
                'object-G_Ic4zx2FM2Ebz6VeW9qC' //id
            );
        },
        onSelectionChange(type, id) {
            this.$data.selections.unshift({ type, id });
        },
        async getSelection() {
            const selection = await this.app.selection.get();
            this.$data.selectedType = selection.type;
            this.$data.selectedId = selection.id;
        },
        select() {
            this.app.selection.select(
                'object', // 'object', 'area','task' 
                'object-G_Ic4zx2FM2Ebz6VeW9qC' //id
            );
        },
        unselect() {
            this.app.selection.unselect();
        },
        setAppWindowSize() {
            this.app.appWindow.setSize(400, 200);
        },
        closeAppWindow() {
            this.app.appWindow.close();
        }

    }
})
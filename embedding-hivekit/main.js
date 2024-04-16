import { SignJWT } from './node_modules/jose/dist/browser/jwt/sign.js';
import ExternalAppControl from '/external-app-control/dist/external-app-control.js'
import HivekitClient from './node_modules/@hivekit/client-js/dist/hivekit.js';

const realmId = 'REALM_ID';
const userId = 'YOUR_USER_NAME (can be anything)';
const secret = 'YOUR_SECRET';
const tenantId = 'YOUR_TENANT_ID';
const secretId = 'YOUR_SECRET_ID';
const permissions = {
    [realmId]: {
        "*": "CRUDPS"
    },
    "sys": {
        "*": "CRUDPS"
    }
}

new Vue({
    el: '#app-container',
    data() {
        return {
            hivekitUrl: null,
            selectedObjectId: null,
            objects: {}
        }
    },
    async mounted() {
        const token = await this.createToken()
        this.$data.hivekitUrl = `https://realm.hivekit.io/?realm=${realmId}&token=${token}`;
        this.hivekitClient = new HivekitClient();
        await this.hivekitClient.connect('wss://api.hivekit.io/v1/ws');
        await this.hivekitClient.authenticate(token);
        this.realm = await this.hivekitClient.realm.get(realmId);
        this.subscription = await this.realm.object.subscribe({ executeImmediately: true })
        this.subscription.on('update', objects => {
            this.$data.objects = objects;
        });

        this.hivekitApp = new ExternalAppControl(this.$refs.iframe);
        this.hivekitApp.selection.on('change', (type, id) => {
            if (id === null) {
                this.$data.selectedObjectId = null;
            }
            else if (type === 'object') {
                this.$data.selectedObjectId = id;
            }
        });
    },
    methods: {
        async createToken() {
            // !!!! DO NOT DO THIS !!!!
            // I am creating the token on the client side
            // with a cleartext secret to showcase how to authenticate
            // a user from your user management system. 
            // Token creation should only happen on the server side as part of
            // your user authentication process.
            const payload = {
                sub: userId,
                tnd: tenantId,
                // per: permissions,
            };

            return new SignJWT(payload)
                .setProtectedHeader({
                    alg: 'HS256',
                    kid: secretId,
                    typ: 'JWT',
                })
                .setIssuedAt()
                .setIssuer('platform.hivekit.io')
                .setExpirationTime('24h')
                .sign(Uint8Array.from(atob(secret), c => c.charCodeAt(0)));
        },
        setSelection(id) {
            this.hivekitApp.selection.select('object', id)
        }
    }
})
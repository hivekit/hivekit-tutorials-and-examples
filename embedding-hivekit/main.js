import { SignJWT } from 'jose/jwt/sign';
import ExternalAppControl from '@hivekit/external-app-control'
import HivekitClient from '@hivekit/client-js';

// The ID of the realm you wish to open. You can find it at https://hivekit.io/account/#/realms
const realmId = 'REALM_ID';


// These values are required to authenticate a user from your user management system.
// They are purely here to demonstrate how to construct and sign a JWT. THIS IS NOT SOMETHING
// THAT SHOULD BE DONE ON THE CLIENT SIDE.
const userId = 'YOUR_USER_NAME'; // Just use to address the user, can be anything
const secret = 'YOUR_SECRET'; // Click show secret at https://hivekit.io/account/#/access-management to get the secret
const secretId = 'YOUR_SECRET_ID'; // That's the secret id from https://hivekit.io/account/#/access-management
const tenantId = 'YOUR_TENANT_ID'; // That's the Organisation ID from https://hivekit.io/account/#/tenant

// You can define the permissions for the user here. Omit the permission entry in the token to allow everything.
// You can learn more about permissions at https://hivekit.io/guides/core/permissions
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
        // Create a token and compose the URL to open the realm in Hivekit
        // Assigning it to this.$data.hivekitUrl will trigger the iframe to load the realm
        const token = await this.createToken()
        this.$data.hivekitUrl = `https://realm.hivekit.io/?realm=${realmId}&token=${token}`;

        // Establish a client connection to Hivekit using the same token to get an up to
        // date list of objects in the realm
        this.hivekitClient = new HivekitClient();
        await this.hivekitClient.connect('wss://api.hivekit.io/v1/ws');
        await this.hivekitClient.authenticate(token);
        this.realm = await this.hivekitClient.realm.get(realmId);
        this.subscription = await this.realm.object.subscribe({ executeImmediately: true })
        this.subscription.on('update', objects => {
            this.$data.objects = structuredClone(objects);// Clone the objects to avoid reactivity issues
        });

        // Connect the ExternalAppControl to the iframe
        this.hivekitApp = new ExternalAppControl(this.$refs.iframe);

        // and react to selection changes in the app
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
                per: permissions,
            };

            return new SignJWT(payload)
                .setProtectedHeader({
                    alg: 'HS256',
                    // don't forget the secretId. Hivekit looks it up
                    // to verify the token
                    kid: secretId,
                    typ: 'JWT',
                })
                .setIssuedAt()
                // Set the issuer to platform.hivekit.io to tell Hivekit's servers
                // that the secret is from the access management page
                .setIssuer('platform.hivekit.io')
                .setExpirationTime('24h')
                // The secret you get from the access management page is Base64 encoded
                // so we need to convert it before turning it into a byte array
                .sign(Uint8Array.from(atob(secret), c => c.charCodeAt(0)));
        },

        // set the selection in the Hivekit app
        setSelection(id) {
            this.hivekitApp.selection.select('object', id)
        }
    }
})
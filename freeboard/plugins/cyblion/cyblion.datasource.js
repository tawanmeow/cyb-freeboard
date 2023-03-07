if (typeof cyblion === 'undefined') {
    cyblion = {};
}

(function () {
    freeboard.loadDatasourcePlugin({
        type_name: 'cyblion_datasource',
        display_name: 'Cyblion',
        external_scripts: [''],
        settings: [
            {
                name: 'deviceid',
                display_name: 'Device ID',
                type: 'text',
                description: '',
                required: true
            },
            {
                name: 'devicetoken',
                display_name: 'Device Token',
                type: 'text',
                description: '',
                required: true
            }
        ],

        newInstance: function (settings, newInstanceCallback, updateCallback, statusChangeCallback) {
            newInstanceCallback(new myDatasourcePlugin(settings, updateCallback, statusChangeCallback));
        }
    });

    myDatasourcePlugin = function (settings, updateCallback, statusChangeCallback) {
        let self = this;
        let currentSettings = settings;

        this.store = {
            msg: {},
            cmsg: {},
            cstore: {}
        };

        this.cyblionmqtt = new CyblionMQTT({
            deviceid: currentSettings.deviceid,
            devicetoken: currentSettings.devicetoken,
            secure: true
        });

        cyblion[currentSettings.name] = {
            publish: self.cyblionmqtt.publish.bind(self.cyblionmqtt)
        }
        updateCallback(self.store);

        this.onSettingsChanged = function (newSettings) {

        };

        this.updateNow = function () {

        };

        this.onDispose = function () {
            self.cyblionmqtt.disconnect();
            delete self.cyblionmqtt;
        };

        this.cyblionmqtt.on('msg', (topic, payload) => {
            console.log(`@msg : ${topic} ==> ${payload}`)
            let newchunk = {};
            let ptopic = topic.replace('@msg/', '');

            newchunk[ptopic] = payload;
            self.store = {
                ...self.store, ...{
                    msg: newchunk
                }
            };
            updateCallback(self.store);
        })

        this.cyblionmqtt.on('cmsg', async (topic, payload) => {
            console.log(`@cmsg : ${topic} ==> ${payload}`)
            let newchunk = {};
            let ptopic = topic.replace('@msg/', '');

            newchunk[ptopic] = await cyblion_decrypt(payload);
            self.store = {
                ...self.store, ...{
                    cmsg: newchunk
                }
            };
            updateCallback(self.store);
        })

        this.cyblionmqtt.on('cstore', async (topic, payload) => {
            console.log(`@cstore : ${topic} ==> ${payload}`)

            let newchunk = {};
            let ptopic = topic.replace('@cstore/data/updated/', '');

            newchunk[ptopic] = await cyblion_decrypt(payload);

            self.store = {
                ...self.store, ...{
                    cstore: newchunk
                }
            };
            updateCallback(self.store);
        })

        this.cyblionmqtt.on('connected', () => {
            console.log('connected');
            this.cyblionmqtt.subscribe('@private/#');
            this.cyblionmqtt.subscribe('@cprivate/#');

            this.cyblionmqtt.subscribe('@msg/#');
            this.cyblionmqtt.subscribe('@cmsg/#');

            this.cyblionmqtt.subscribe('@cstore/data/updated/#');
        })

        this.cyblionmqtt.on('disconnected', () => {
            console.log('disconnected');
        })

        this.cyblionmqtt.connect();

    };
})();

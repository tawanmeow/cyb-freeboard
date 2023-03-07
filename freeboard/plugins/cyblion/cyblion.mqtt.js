const NETPIE_MQTT_HOST = 'ws://mqtt.netpie.io:80/mqtt';
const NETPIE_MQTTS_HOST = 'wss://mqtt.netpie.io:443/mqtt';
const NETPIE_CYBLION_MQTT_HOST = 'ws://fhe.netpie.io:8083/mqtt';
const NETPIE_CYBLION_MQTTS_HOST = 'wss://fhe.netpie.io:8084/mqtt';

class CyblionMQTT {
	constructor(option) {
		let that = this;

		this.deviceid = option.deviceid;
		this.devicetoken = option.devicetoken;
		this.option = option;

		if (this.option.secure) {
			this.netpie_broker_uri = NETPIE_MQTTS_HOST;
			this.cyblion_broker_uri = NETPIE_CYBLION_MQTTS_HOST;
		}
		else {
			this.netpie_broker_uri = NETPIE_MQTT_HOST;
			this.cyblion_broker_uri = NETPIE_CYBLION_MQTT_HOST;
		}

		this.eventhandler = {};
		this.eventhandler_once = {};

		this.emitter = {
	        on(event, handler) {
	            if (!that.eventhandler[event]) {
	                that.eventhandler[event] = [];
	            }
	            for (let c of that.eventhandler[event]) {
	                if (c === handler) return;
	            }
	            that.eventhandler[event].push(handler);
	        },

	        once(event, handler) {
	            if (!that.eventhandler_once[event]) {
	                that.eventhandler_once[event] = [];
	            }
	            for (let c of that.eventhandler_once[event]) {
	                if (c === handler) return;
	            }
	            that.eventhandler_once[event].push(handler);
	        },

	        emit(event, topic, payload1, payload2, payload3) {
	            if (that.eventhandler[event]) {
	                for (let c of that.eventhandler[event]) {
	                    if (typeof(c) == 'function') {
	                        c(topic, payload1, payload2, payload3);
	                    }
	                }
	            }
	            if (that.eventhandler_once[event]) {
	                for (let c of that.eventhandler_once[event]) {
	                    if (typeof(c) == 'function') {
	                        c(topic, payload1, payload2, payload3);
	                    }

	                    let plist = that.eventhandler_once[event];
	                    for (let i in plist) {
	                        if (plist[i] === c) {
	                            plist.splice(i,1);
	                            return;
	                        }
	                    }
	                }
	            }
	        },

	        removeListener(event, handler) {
	            // if (!eventhandler[event]) {
	            //     return;
	            // }
	            let plist;

	            plist = that.eventhandler[event];
	            for (let i in plist) {
	                if (plist[i] === handler) {
	                    plist.splice(i,1);
	                    return;
	                }
	            }

	            plist = that.eventhandler_once[event];
	            for (let i in plist) {
	                if (plist[i] === handler) {
	                    plist.splice(i,1);
	                    return;
	                }
	            }
	        }
	    }

		this.on = function(...args) {
			that.emitter.on(...args);
		}

		this.once = function(...args) {
			that.emitter.once(...args);
		}

		this.removeListener = function(...args) {
			that.emitter.removeListener(...args);
		}
	}

	_connect_netpie() {
		let that = this;

		if (!this.netpie_client || !this.netpie_client.connected) {
			this.netpie_client  = mqtt.connect(that.netpie_broker_uri, {
			    keepalive: 30,
			    clientId: that.deviceid,
			    username: that.devicetoken,
			    password: '',
			    clean: true,
			    reconnectPeriod: 1000,
			    connectTimeout: 30 * 1000,
			    rejectUnauthorized: false
			});


			this.netpie_client.on('connect', ()=> {
				this._connect_cyblion();
			});

			this.netpie_client.on('close', ()=> {
				this._disconnect_cyblion();
			});

			this.netpie_client.on('disconnect', ()=> {
				this._disconnect_cyblion();
			});

			this.netpie_client.on('message', (topic, payload)=> {
				if (topic.startsWith('@msg/')) {
					try {
						payload = payload.toString();
					}
					catch(e) {
						payload = null;
					}
					that.emitter.emit('msg', topic, payload);
				}
				else if (topic.startsWith('@shadow/data/updated')) {
					let shadowobj;
					try {
						shadowobj = JSON.parse(payload.toString());
					}
					catch(e) {
						shadowobj = {}
					}
					that.emitter.emit('shadow_updated', shadowobj);
				}
			});
		}
	}

	_disconnect_netpie() {
		if (this.netpie_client && this.netpie_client.connected) {
			this.netpie_client.end();
		}
	}

	_connect_cyblion() {
		let that = this;
		if (!this.cyblion_client || !this.cyblion_client.connected) {
			this.cyblion_client  = mqtt.connect(that.cyblion_broker_uri, {
			    keepalive: 30,
			    clientId: that.deviceid,
			    username: that.devicetoken,
			    password: '',
			    clean: true,
			    reconnectPeriod: 1000,
			    connectTimeout: 30 * 1000,
			    rejectUnauthorized: false
			});

			this.cyblion_client.on('connect', ()=> {
				that.emitter.emit('connected');
				that.cyblion_client.subscribe('@cstore/data/updated/#');
			});

			this.cyblion_client.on('message', (topic, payload)=> {
				if (topic.startsWith('@cmsg')) {
					try {
						payload = payload.toString();
					}
					catch(e) {
						payload = null;
					}
					that.emitter.emit('cmsg', topic, payload);
				}
				else if (topic.startsWith('@cstore')) {
					let key = topic.split('/').slice(3).join('/');
					let value;
					try {
						value = payload.toString();
					}
					catch(e) {
						value = null;
					}
					that.emitter.emit('cstore', key, value);
				}
			});
		}
	}

	_disconnect_cyblion() {
		if (this.cyblion_client && this.cyblion_client.connected) {
			this.cyblion_client.end();
		}
	}

	connect() {
		let that = this;
		this._connect_netpie();
	}

	disconnect() {
		this.netpie_client.end(true);
		this.cyblion_client.end(true);
	}

	publish(topic, payload) {
		let out;
		if (topic.startsWith('@msg/') || topic.startsWith('@shadow/')) {
			if (typeof(payload) == 'object') {
				out = JSON.stringify(payload);
			}
			else {
				out = String(payload);
			}
			this.netpie_client.publish(topic, out);
		}
		else if (topic.startsWith('@cmsg/') || topic.startsWith('@cstore/')) {
			if (typeof(payload) == 'object') {
				out = JSON.stringify(payload);
			}
			else {
				out = String(payload);
			}
			this.cyblion_client.publish(topic, out);
		}
	}

	subscribe(topic) {
		if (topic.startsWith('@msg/') || topic.startsWith('@shadow/')) {
			this.netpie_client.subscribe(topic);
		}
		else if (topic.startsWith('@cmsg/') || topic.startsWith('@cstore/')) {
			this.cyblion_client.subscribe(topic);
		}
	}

	writeShadow(arg1, arg2) {
		if (typeof(arg1) == 'string') {
			let val;
			if (typeof(arg2) == 'object') {
				val = JSON.stringify(arg2);
			}
			else {
				val = String(arg2);
			}
			let dobj = {data: {}};
			dobj.data[arg1] = arg2;
			let out = JSON.stringify(dobj);
			this.netpie_client.publish('@shadow/data/update',out);
		}
		else if (typeof(arg1) == 'object') {
			let out = JSON.stringify({data: arg1});
			this.netpie_client.publish('@shadow/data/update',out);
		}
	}

	writeCStore(key, value) {
		this.cyblion_client.publish(`@cstore/data/update/${key}`, value);
	}

	publishMsg(topic, payload) {
		this.netpie_client.publish(`@msg/${topic}`, payload);
	}

	publishPrivateMsg(topic, payload) {
		this.netpie_client.publish(`@private/${topic}`, payload);
	}
}

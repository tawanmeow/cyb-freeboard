if (typeof netpie === 'undefined') {
  netpie = {};
}

(function () {

  let FEED_URL;

  $.ajax({
      url: '/env-config.js',
      type: 'get',
      success: function (data) {
          let dx =  data.replace('window._env_ =','');
          let d;
          try {
              d = JSON.parse(dx);
          }
          catch (e){
              console.log(e)
              d = {};
          }
          FEED_URL = `${d.DATASOURCE_API_URL}/feed/api/v1/datapoints/query`;
      }
  });

  freeboard.loadDatasourcePlugin({
    type_name: 'netpiex_datasource',
    display_name: 'NETPIE Datasource',
    // "description": "Connect to NETPIE as a microgear to communicate real-time with other microgears in the same App ID. The microgear of this datasource is referenced by microgear[DATASOURCENAME]",
    external_scripts: [''],
    settings: [
      {
        name: 'deviceid',
        display_name: 'Device ID',
        type: 'text',
        description: 'Client ID ของ Device ที่ต้องการอ่านข้อมูล',
        required: true
      },
      {
        name: 'devicetoken',
        display_name: 'Device Token',
        type: 'text',
        description: 'Token ของ Device ที่ต้องการอ่านข้อมูล',
        required: true
      },
      {
        name: 'topics',
        display_name: 'Subscribed Topics',
        type: 'text',
        description: 'Topic ที่ต้องการ Subscribe',
        required: false
      },
      {
        name: 'feed',
        display_name: 'Feed',
        type: 'boolean',
        default_value: 0
      },
      {
        name: 'feed_since_value',
        display_name: 'Since',
        type: 'text',
        default_value: '6',
        required: false
      },
      {
        name: 'feed_since_unit',
        display_name: '',
        type: 'option',
        description: 'Display data points since ... ago.',
        options: [
          {
            name: 'Second',
            value: 'seconds'
          },
          {
            name: 'Minute',
            value: 'minutes'
          },
          {
            name: 'Hour',
            value: 'hours'
          },
          {
            name: 'Day',
            value: 'days'
          },
          {
            name: 'Month',
            value: 'months'
          },
          {
            name: 'Year',
            value: 'years'
          }
        ],
        default_value: 'hours'
      },
      {
        name: 'feed_downsampling',
        display_name: 'Down Sampling',
        type: 'text',
        // "description": "",
        default_value: '1',
        required: false
      },
      {
        name: 'feed_downsampling_unit',
        display_name: '',
        type: 'option',
        description: 'Resolution of the data points.',
        options: [
          {
            name: 'Milliseconds',
            value: 'milliseconds'
          },
          {
            name: 'Second',
            value: 'seconds'
          },
          {
            name: 'Minute',
            value: 'minutes'
          },
          {
            name: 'Hour',
            value: 'hours'
          },
          {
            name: 'Day',
            value: 'days'
          },
          {
            name: 'Weeks',
            value: 'weeks'
          },
          {
            name: 'Month',
            value: 'months'
          },
          {
            name: 'Year',
            value: 'years'
          }
        ],
        default_value: 'minutes'
      }
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      // myDatasourcePlugin is defined below.
      newInstanceCallback(new myDatasourcePlugin(settings, updateCallback));
    }
  });

  // ### Datasource Implementation
  //
  // -------------------
  // Here we implement the actual datasource plugin. We pass in the settings and updateCallback.
  var myDatasourcePlugin = function (settings, updateCallback) {
    var self = this;
    var currentSettings = settings;
    self.device = netpieXdevice.create({
      devicename: currentSettings.name,
      deviceid: currentSettings.deviceid,
      devicetoken: currentSettings.devicetoken
    });
    netpie[currentSettings.name] = self.device;
    self.device.shadow = '';
    self.device.feed = '';
    self.device.lastfeed;
    self.device.msg = '';
    self.device.status = 0;
    self.device.projectid = '';
    self.device.groupid = '';
    self.device.topics = [];
    self.device.updateCallback = updateCallback;

    function getData() {
      if (currentSettings.feed == '1') {
        var deviceid = currentSettings.deviceid;
        var devicetoken = currentSettings.devicetoken;
        var since = currentSettings.feed_since_value;
        var unit = currentSettings.feed_since_unit;
        var downsamplingValue = currentSettings.feed_downsampling;
        var downsamplingUnit = currentSettings.feed_downsampling_unit;

        var timelist = {
          seconds: 1000,
          minutes: 1000 * 60,
          hours: 1000 * 60 * 60,
          days: 1000 * 60 * 60 * 24,
          months: 1000 * 60 * 60 * 24 * 30,
          years: 1000 * 60 * 60 * 24 * 30 * 12
        };
        var endtime = new Date().getTime();
        var starttime = endtime - since * timelist[unit];

        var body = {
          start_absolute: starttime,
          end_absolute: endtime,
          metrics: [
            {
              name: deviceid,
              group_by: [
                {
                  name: 'tag',
                  tags: ['attr']
                }
              ],
              aggregators: [
                {
                  name: 'avg',
                  sampling: {
                    value: downsamplingValue,
                    unit: downsamplingUnit
                  }
                }
              ]
            }
          ]
        };

        //var apiurl = 'https://api.netpie.io/v2/feed/api/v1/datapoints/query';
        $.ajax({
          url: FEED_URL,
          type: 'post',
          data: body,
          headers: {
            Authorization: 'Device ' + deviceid + ':' + devicetoken
          },
          dataType: 'json',
          success: function (data) {
            datajson = data.queries[0];
            netpie[currentSettings.name].feed = datajson.results;
            netpie[currentSettings.name].updateCallback({
              feed: netpie[currentSettings.name].feed,
              status: netpie[currentSettings.name].status,
              shadow: netpie[currentSettings.name].shadow
            });
            netpie[currentSettings.name].lastfeed = new Date();
          },
          fail: function(xhr, textStatus, errorThrown){
            alert('request failed');
         }
        });
      }
    }
    self.device.getData = getData;
    self.initSubscribe = function (toparr, toSub) {
      let topics = toparr.trim().split(",").map(function(item) {
        return item.trim();
      });
      if (topics && topics.length > 0) {
        self.device.topics = topics;
        if (toSub) {
          flowagent.subscribeAll(currentSettings.deviceid);
        } else {
          flowagent.unsubscribeAll(currentSettings.deviceid);
        }
      }
    };

    if (typeof flowagent === 'undefined') {
        $.ajax({
          url: '/env-config.js',
          type: 'get',
          success: function (data) {
            let dx =  data.replace('window._env_ =','');
            let d;
            try {
              d = JSON.parse(dx);
            }
            catch (e){
              console.log(e)
              d = {};
            }

            flowagent = new FlowAgent({
                timestamp: Date.now(),
                gqlendpoint: d.GRAPHQL2,
                mqttendpoint: d.MQTT_WS_BROKER

                // gqlv2endpoint: 'https://gqlv2.netpie.io',
                // mqttendpoint: 'mqtt.netpie.io'
            });

            flowagent.on('connected', function () {
            });

            flowagent.on('message', function (topic, payload) {
              if (
                topic == '@private/device/status/get/response' ||
                topic.includes('@device/status/changed')
              ) {
                //status
                let payloadjson = JSON.parse(payload);
                let listname = getKeyByDeviceID(netpie, payloadjson.deviceid);
                listname.forEach(name => {
                  netpie[name].status = payloadjson.status;
                  netpie[name].projectid = payloadjson.projectid;
                  netpie[name].groupid = payloadjson.groupid;
                  netpie[name].updateCallback({
                    feed: netpie[name].feed,
                    status: netpie[name].status,
                    shadow: netpie[name].shadow,
                    msg: netpie[name].msg
                  });
                })
              } else if (topic.includes('@msg')) {
                //message
                let listtopic = topic.split('/');
                let listname = getKeyByGroupID(netpie, listtopic[2]);
                listname.forEach(name => {
                  let jsonMsg = makeStringJson(
                    topic.split(listtopic[2] + '/')[1],
                    payload,
                    '/'
                  );
                  for (let index = 0; index < netpie[name].topics.length; index++) {
                    const element = netpie[name].topics[index];
                    if (
                      mqttWildcard(
                        '@msg/' + topic.split(listtopic[2] + '/')[1],
                        element
                      ) != null
                    ) {
                      netpie[name].msg = jsonConcat(netpie[name].msg || {}, jsonMsg);
                      netpie[name].updateCallback({
                        feed: netpie[name].feed,
                        status: netpie[name].status,
                        shadow: netpie[name].shadow,
                        msg: netpie[name].msg
                      });
                      break;
                    }
                  }
                });
              } else {
                //shadow
                let payloadjson = JSON.parse(payload);
                let listname = getKeyByDeviceID(netpie, payloadjson.deviceid);
                listname.forEach(name => {
                  netpie[name].shadow = jsonConcat(
                    netpie[name].shadow || {},
                    payloadjson.data
                  );
                  netpie[name].updateCallback({
                    feed: netpie[name].feed,
                    status: netpie[name].status,
                    shadow: netpie[name].shadow,
                    msg: netpie[name].msg
                  });
                  if (topic != '@private/shadow/data/get/response') {
                    let timeit = new Date() - netpie[name].lastfeed;
                    if (
                      checkExistFeed(netpie[name].feed, getFlatObject(payloadjson.data))
                    ) {
                      if (timeit > 15000) {
                        netpie[name].getData();

                      }
                    }
                  }
                })
              }
            });

            self.device._writeshadow = flowagent.writeShadow;
            self.device._publish = flowagent.publish;

            if (currentSettings.topics != '' && currentSettings.topics != undefined) {
              self.device.topics = currentSettings.topics.trim().split(",").map(function(item) {
                return item.trim();
              });
            }

            flowagent.add(self.device);


          },
          fail: function(xhr, textStatus, errorThrown){

         }
        });




      // flowagent.connect();
    }


    if (currentSettings.feed == '1') {
      getData();
    }

    self.onSettingsChanged = function (newSettings) {
      if (currentSettings.topics != newSettings.topics) {
        if(currentSettings.topics != undefined){
          self.initSubscribe(currentSettings.topics, false);
        }
        if (newSettings.topics != '' && newSettings.topics != undefined) {
        self.initSubscribe(newSettings.topics, true);
        }
      }
      clearInterval(netpie[currentSettings.name]['timer']);
      currentSettings = newSettings;
      flowagent.remove(self.device);
      self.device = netpieXdevice.create({
        devicename: currentSettings.name,
        deviceid: currentSettings.deviceid,
        devicetoken: currentSettings.devicetoken
      });
      flowagent.add(self.device);
      if (currentSettings.feed == '1') {
        getData();
      }
    };

    self.updateNow = function () { };

    self.onDispose = function () {
      flowagent.remove(self.device);
      clearInterval(netpie[currentSettings.name]['timer']);
      delete self.device;
    };
  };
})();

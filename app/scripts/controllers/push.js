angular.module('projek.push', [])

.factory('pushService', function ($http, $state, $q, $auth, GCM_SENDER_ID, API_BASE) {
  var _initialized = false;

  function setRegistrationId (id) {
    localStorage.setItem('pushId', id);
  }

  function getRegistrationId () {
    return localStorage.getItem('pushId');
  }

  function incrementLocalCount () {
    var incremented = getLocalCount() + 1;
    localStorage.setItem('pushCount', incremented);
  }

  function clearLocalCount () {
    localStorage.setItem('pushCount', 0);
  }

  function getLocalCount () {
    return Number(localStorage.getItem('pushCount') || 0);
  }

  function register (registrationId) {
    setRegistrationId(registrationId);
    $http.post(API_BASE+'/push_devices', {
      data: {
        type: 'push_devices',
        attributes: {
          registrationId: registrationId,
          platform: ionic.Platform.platform()
        }
      }
    }, {
      'Content-Type': 'application/json',
    })

    .then(function () {
      clearLocalCount();
    });
  }

  function handleIncoming (data) {
    incrementLocalCount();
    var metadata = data.additionalData.metadata;

    if (!$auth.isAuthenticated()) { return; }
    if (!metadata) { return; }
    if (!metadata.type) { return; }
    if (data.additionalData.foreground) { return; }

    switch (metadata.type) {
      case 'news':
        $state.go('tab.news');
        break;
      case 'updates':
        if (metadata.projectId) {
          $state.go('project', {id: metadata.projectId});
        } else {
          $state.go('tab.updates');
        }

        break;
      case 'quotes':
        $state.go('tab.quotes');
        break;
    }
  }

  function init () {
    if (window.PushNotification) {
      _initialized = true;
      var push = PushNotification.init({
        android: {
          senderID: GCM_SENDER_ID,
          icon: 'ic_stat_icon_transparent',
          iconColor: '#ffba00'
        },
        ios: {
          alert: true,
          badge: true,
          sound: true,
          vibration: true,
          clearBadge: true
        }
      });

      push.on('registration', function (data) {
        register(data.registrationId);
      });

      push.on('notification', handleIncoming);

      /*$ionicPlatform.on('resume', function () {
        var localCount = getLocalCount();
        var regId = getRegistrationId();
        if ((localCount > 0) && regId) {
          setTimeout(function () {
            register(regId);
          }, 1000);
        }
      });*/
    }
  }

  function initOnce () {
    if (!_initialized) {
      init();
    }
  }

  function hasPermission () {
    var deferred = $q.defer();

    if (!window.PushNotification) {
      deferred.reject();
    } else {
      PushNotification.hasPermission(function (data) {
        if (data.isEnabled) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      });
    }

    return deferred.promise;
  }

  return {
    init: init,
    initOnce: initOnce,
    hasPermission: hasPermission
  }
});

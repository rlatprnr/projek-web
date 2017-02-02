angular.module('projek.users', [])

.controller('ProfileCtrl', function($scope, $state, $auth, $uibModalInstance, $processPhoneInput, userInfo) {

  $scope.user = userInfo;
  $scope.phoneInput = $processPhoneInput($scope, 'user.tmpPhone', 'user.phone');

  $scope.submit = function () {
    $uibModalInstance.close();
    /*$scope.sending = true;

    var attrs = _.pick($scope.user, 'firstName', 'lastName', 'phone', 'email', 'id');
    $auth.register(attrs).then(function (v) {
      $uibModalInstance.close();
    }, function (err) {
      $scope.sending = false;
      alert(err.data.message);
    });*/
  }

  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };

})

.controller('AgentFormCtrl', function($scope, $state, $auth, $agents, $uibModalInstance, agentInfo, $processPhoneInput) {
  $scope.agent = {};

  if (agentInfo) {
    $agents.findOne(agentInfo.id).then(function (agent) {
      $scope.agent = _.pick(agent, 'id', 'govId', 'companyName', 'officeName', 'officePhone','officeAddress', 'officeCity', 'officeProvince');
      if ($scope.agent.officePhone) {
        $scope.helpPhone = true;
        $scope.agent.tmpPhone = $scope.agent.officePhone.replace('+62', '');
      }
    });
  }

  $scope.phoneInput = $processPhoneInput($scope, 'agent.tmpPhone', 'agent.officePhone');

  $scope.submit = function () {
    $scope.sending = true;
    $auth.currentUser().then(function (user) {
      var pathPrefix = '/users/' + user.id;
      var action = $agents.create.bind($agents);
      var attrs = _.pick($scope.agent,
                         'govId',
                         'companyName',
                         'officeName',
                         'officePhone',
                         'officeAddress',
                         'officeCity',
                         'officeProvince');

      if ($scope.agent.id) {
        pathPrefix = null;
        action = _.partial($agents.update, $scope.agent.id).bind($agents);
      }

      action(attrs, {pathPrefix: pathPrefix}).then(function (agent) {
        $uibModalInstance.close();
        if (!agentInfo) {
          $auth.resetCurrentUser();
          alert("You're registered as an Agent", function () {
          }, 'Success', 'Ok');
        }
      }, function (err) {
        $scope.sending = false;
        alert(err.data.message);
      });
    });
  }

  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };

})

.controller('LoginCtrl', function($scope, $state, $stateParams, $auth, $processPhoneInput) {
  $scope.useEmail = !$stateParams.method || ($stateParams.method === 'email');
  $scope.usePhone = !$stateParams.method || ($stateParams.method === 'phone');
  $scope.form = {};

  $scope.phoneInput = $processPhoneInput($scope, 'form.tmpPhone', 'form.phone');

  $scope.login = function(){
    $scope.sending = true;

    var method = _.findKey(_.pick($scope.form, 'phone', 'email'), function (v) {
      return !!v;
    });

    return $auth.login(method, $scope.form[method]).then(function (v) {
      var value = $scope.form[method];
      $scope.form = {};
      $scope.sending = false;
      $state.go('verify', {
        id: v.id,
        method: v.attributes.label,
        value: value
      });
    }, function (err) {
      $scope.form = {};
      $scope.sending = false;
      alert(err.data.message);
    })
  }
})

.controller('RegisterCtrl', function($scope, $state, $auth, $processPhoneInput) {
  $scope.form = {};

  $scope.phoneInput = $processPhoneInput($scope, 'form.tmpPhone', 'form.phone');
  
  $scope.regSubmit = function () {
    $scope.submitted = true;

    var attrs = _.pick($scope.form, 'firstName', 'lastName', 'phone', 'email');
    $auth.register(attrs).then(function (v) {
      var value = $scope.form[v.attributes.label];
      var altValue = $scope.form.email;
      $scope.form = {};
      $scope.submitted = false;
      $state.go('verify', {
        id: v.id,
        method: v.attributes.label,
        value: value,
        altMethod: 'email',
        altValue: altValue
      });
    }, function (err) {
      $scope.submitted = false;
      alert(err.data.message);
    });
  }
})

.controller('VerifyCtrl', function($scope, $state, $stateParams, $auth, $q) {
  function reload (params) {
    var params = angular.extend(angular.copy($stateParams), params);
    $state.go('verify', params);
  }

  function resend (method, value) {
    $scope.sending = true;
    return $auth.login(method, value).then(function (result) {
      $scope.form = {};
      $scope.sending = false;
      return result;
    }, function (err) {
      $scope.sending = false;
      $scope.form = {};
      alert(err.data.message);
      return $q.reject();
    });
  }

  function chooseAlt (currentMethod) {
    return _.find(['email', 'phone'], function (method) {
      return method !== currentMethod;
    });
  }

  $scope.form = {};
  $scope.method = $stateParams.method;
  $scope.value = $stateParams.value;
  $scope.altMethod = chooseAlt($scope.method);

  $scope.useAlt = function () {
    if (($scope.altMethod === $stateParams.altMethod) && $stateParams.altValue) {
      return resend($scope.altMethod, $stateParams.altValue).then(function (v) {
        return reload({
          id: v.id,
          method: v.attributes.label,
          value: $stateParams.altValue,
          altMethod: $scope.method,
          altValue: $scope.value
        });
      });
    } else {
      $scope.form = {};
      $state.go('login', {method: $scope.altMethod});
    }
  }

  $scope.verify = function () {
    $scope.sending = true;

    return $auth.verify($stateParams.id, $scope.form.code).then(function () {
      $scope.form = {};
      $scope.sending = false;
      $state.go('tab.home');
    }, function (err) {
      $scope.form = {};
      $scope.sending = false;
      alert(err.data.message);
    });
  }

  $scope.resend = function () {
    return resend($stateParams.method, $stateParams.value).then(function (v) {
      reload({id: v.id, method: v.attributes.label});
    });
  }
})

.factory('$processPhoneInput', function () {
  return function ($scope, from, to) {
    return function () {
      var value = _.get($scope, from);

      if (!value) {
        _.set($scope, to, '');
      } else {
        _.set($scope, to, '+62' + value.replace(/^0/, ''));
      }
    }
  }
})

.factory('$auth', function($http, $q, API_BASE, JsonApiDataStore, $state) {
  var AUTH_TOKEN_KEY = 'jwtBearerAuth';
  var _currentUserId;

  function isAuthenticated () {
    return !!fetchToken();
  }

  function fetchToken() {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  function setToken(token) {
    if (!token) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } else {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    setHeaders();
  }

  function setHeaders() {
    var token = fetchToken();

    if (token) {
      token = 'Bearer ' + token;
    }

    $http.defaults.headers.common.Authorization = token;
  }

  function logout() {
    _currentUserId = undefined;
    setToken();
  }

  function login (method, value) {
    return $http.post(API_BASE + '/verifications', {
      data: {
        type: 'verifications',
        attributes: {
          label: method,
          value: value
        }
      }
    })

    .then(function (result) {
      return result.data.data;
    });
  }

  function register (attrs) {
    return $http.post(API_BASE + '/users', {
      data: {
        type: 'users',
        attributes: attrs
      }
    })

    .then(function (result) {
      return result.data.data;
    });
  }

  function verify (id, token) {
    return $http.put(API_BASE + '/verifications/' + id, {
      data: {
        id: id,
        type: 'verifications',
        attributes: {token: token}
      }
    })

    .then(function (result) {
      setToken(result.data.data.id);
    });
  }

  function notifyAgentOnly () {
    if (navigator.notification) {
      navigator.notification.confirm('This content is for Agents only', function (index) {
        if (index === 1) { $state.go('agent-form'); }
      }, 'Notice', ["I'm an Agent", "Cancel"])
    } else {
      alert('This content is for Agents only');
    }
  }

  function isAllowedAccess (content) {
    var contentRoles = _.map((content.roles || []), function (role) {
      return role.name;
    });

    function rolesIncludeAgent (roles) {
      return _.includes(roles, 'agent');
    }

    return currentUserRoles().then(function (userRoles) {
      if (rolesIncludeAgent(contentRoles) && !rolesIncludeAgent(userRoles)) {
        return $q.reject();
      }

      return $q.resolve();
    });
  }

  function currentUserRoles () {
    return currentUser().then(function (user) {
      return _.map((user.roles || []), function (role) {
        return role.name;
      });
    });
  }

  function currentUser (opts) {
    var opts = opts || {};
    var deferred = $q.defer();

    function format (data) {
      return breakCyclesInBFS(angular.copy(data));
    }

    if (!isAuthenticated()) {
      deferred.reject();
    } else if (_currentUserId) {
      deferred.resolve(format(JsonApiDataStore.store.find('users', _currentUserId)));
    } else {
      $http.get(API_BASE + '/me').then(function (result) {
        var res = JsonApiDataStore.store.sync(result.data);
        _currentUserId = res.id;
        deferred.resolve(format(res));
      }, deferred.reject);
    }

    return deferred.promise;
  }

  setHeaders();

  return {
    login: login,
    register: register,
    verify: verify,
    logout: logout,
    isAuthenticated: isAuthenticated,
    currentUser: currentUser,
    currentUserRoles: currentUserRoles,
    isAllowedAccess: isAllowedAccess,
    notifyAgentOnly: notifyAgentOnly,
    resetCurrentUser: function () {
      _currentUserId = undefined;
    }
  }
});

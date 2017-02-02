angular.module('projek.data', [])

.factory('JsonApi', function ($http, $injector, $q, API_BASE, JsonApiDataStore) {
  function JsonApi (type, path) {
    this.type = type;
    this.path = path;
  }

  function fetchIncluded (rels, records) {
    var processing = {};
    var promises = [];

    records.forEach(function (obj) {
      rels.forEach(function (key) {
        if (obj[key] && obj[key]._placeHolder) {
          var processingKey = obj[key]._type + obj[key].id;
          if (!processing[processingKey]) {
            processing[processingKey] = true;
            promises.push($injector.get('$'+obj[key]._type).findOne(obj[key].id));
          }
        }
      });
    });

    return $q.all(promises);
  }

  JsonApi.prototype.findAll = function (params, opts) {
    var params = params || {};
    var opts = opts || {};

    return $http.get(API_BASE + this.path, {
      params: params,
      headers: {
        'Accept': 'application/json'
      }
    })

    .then(function(res) {
      var res = JsonApiDataStore.store.sync(res.data);
      var include = opts.include;

      if (include && include.length > 0) {
        return fetchIncluded(include, res).then(function () {
          return res;
        });
      } else {
        return res;
      }
    });
  }

  JsonApi.prototype.findOne = function (id, opts) {
    var opts = opts || {};

    return $http.get(API_BASE + this.path + '/' + id, null, {
      headers: {
        'Accept': 'application/json'
      }
    })

    .then(function(res) {
      var res = JsonApiDataStore.store.sync(res.data);
      var include = opts.include;

      if (include && include.length > 0) {
        return fetchIncluded(include, [res]).then(function () {
          return res;
        });
      } else {
        return res;
      }
    });
  }

  JsonApi.prototype.create = function (attrs, opts) {
    var opts = opts || {};
    var path = this.path;

    if (opts.pathPrefix) {
      path = opts.pathPrefix + path;
    }

    var body = {
      data: {
        type: this.type,
        attributes: attrs
      }
    }

    return $http.post(API_BASE + path, body).then(function (res) {
      var res = JsonApiDataStore.store.sync(res.data);
      var include = opts.include;

      if (include && include.length > 0) {
        return fetchIncluded(include, [res]).then(function () {
          return res;
        });
      } else {
        return res;
      }
    });
  }

  JsonApi.prototype.update = function (id, attrs, opts) {
    var opts = opts || {};
    var path = this.path + '/' + id;

    if (opts.pathPrefix) {
      path = opts.pathPrefix + path;
    }

    var body = {
      data: {
        id: id,
        type: this.type,
        attributes: attrs
      }
    }

    return $http.patch(API_BASE + path, body).then(function (res) {
      var res = JsonApiDataStore.store.sync(res.data);
      var include = opts.include;

      if (include && include.length > 0) {
        return fetchIncluded(include, [res]).then(function () {
          return res;
        });
      } else {
        return res;
      }
    });
  }

  JsonApi.prototype.peekAll = function () {
    return JsonApiDataStore.store.findAll(this.type);
  }

  JsonApi.prototype.peekOne = function (id) {
    return JsonApiDataStore.store.find(this.type, id);
  }

  return JsonApi;
})

.factory('$projects', function (JsonApi) {
  return new JsonApi('projects', '/projects');
})

.factory('$updates', function (JsonApi) {
  return new JsonApi('updates', '/updates');
})

.factory('$projectItems', function (JsonApi) {
  return new JsonApi('projectItems');
})

.factory('$events', function (JsonApi) {
  return new JsonApi('events', '/events');
})

.factory('$news', function (JsonApi) {
  return new JsonApi('news', '/news');
})

.factory('$feed', function (JsonApi) {
  return new JsonApi('feed', '/feed');
})

.factory('$feed_summary', function (JsonApi) {
  return new JsonApi('feed', '/feed/summary');
})

.factory('$agents', function (JsonApi) {
  return new JsonApi('agents', '/agents');
})

.factory('$ads', function (JsonApi) {
  return new JsonApi('ads', '/ads');
})
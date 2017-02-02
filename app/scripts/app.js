'use strict';

/**
 * @ngdoc overview
 * @name projekWebApp
 * @description
 * # projekWebApp
 *
 * Main module of the application.
 */
angular
  .module('projekWebApp', [
    'ngAnimate',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'angular-clipboard',
    'infinite-scroll',
    'beauby.jsonApiDataStore',
    'projek.constants',
    'projek.data',
    'projek.push',
    'projek.directives',
    'projek.users',
    'projek.tabs',
    'projek.home',
    'projek.projects',
    'projek.events',
    'projek.updates',
    'projek.news'
  ])
  .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {

    $urlRouterProvider.otherwise('/login');

    $stateProvider

    .state('login', {
      url: '/login?method',
      templateUrl: 'views/login.html',
      controller: 'LoginCtrl',
      data: {
        redirectIfAuth: true
      }
    })

    .state('register', {
      url: '/register',
      templateUrl: 'views/register.html',
      controller: 'RegisterCtrl',
      data: {
        redirectIfAuth: true
      }
    })

    .state('verify', {
      url: '/verify/:id?method&value&altMethod&altValue',
      templateUrl: 'views/verify.html',
      controller: 'VerifyCtrl',
      data: {
        redirectIfAuth: true
      }
    })

    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'views/tabs.html',
      controller: 'TabsCtrl',
      data: {
        auth: true
      }
    })

    .state('tab.home', {
      url: '/home',
      views: {
        'tab-home': {
          templateUrl: 'views/tab-home.html',
          controller: 'HomeCtrl'
        }
      }
    })

    .state('tab.projects', {
      url: '/projects',
      views: {
        'tab-projects': {
          templateUrl: 'views/tab-projects.html',
          controller: 'ProjectsCtrl'
        }
      }
    })

    .state('tab.events', {
      url: '/events',
      views: {
        'tab-events': {
          templateUrl: 'views/tab-events.html',
          controller: 'EventsCtrl'
        }
      }
    })

    .state('tab.updates', {
      url: '/updates',
      views: {
        'tab-updates': {
          templateUrl: 'views/tab-updates.html',
          controller: 'UpdatesCtrl'
        }
      }
    })

    .state('tab.news', {
      url: '/news',
      views: {
        'tab-news': {
          templateUrl: 'views/tab-news.html',
          controller: 'NewsCtrl'
        }
      }
    })

    .state('tab.project', {
      url: '/projects/:id',
      views: {
        'tab-detail': {
          templateUrl: 'views/tab-project.html',
          controller: 'ProjectCtrl'
        }
      }
    })

    .state('tab.event', {
      url: '/events/:id',
      views: {
        'tab-detail': {
          templateUrl: 'views/tab-event.html',
          controller: 'EventCtrl'
        }
      }
    })

    .state('tab.project-update', {
      url: '/project-updates/:id',
      views: {
        'tab-detail': {
          templateUrl: 'views/tab-project-update.html',
          controller: 'ProjectUpdateCtrl'
        }
      }
    })

    .state('tab.project-item', {
      url: '/project-item/:id',
      views: {
        'tab-detail': {
          templateUrl: 'views/tab-project-item.html',
          controller: 'ProjectItemCtrl'
        }
      }
    })

    .state('tab.news-detail/:newsid', {
      url: '/news/:newsid',
      views: {
        'tab-detail': {
          templateUrl: 'views/tab-news-detail.html',
          controller: 'NewsDetailCtrl'
        }
      }
    });

    $httpProvider.defaults.paramSerializer = '$httpParamSerializerJQLike';
    $httpProvider.interceptors.push(function($rootScope, $q, $injector, API_BASE) {
      var current = 0;
      var showLoading = function (url) {
        if (url == API_BASE+'/feed/summary') return false;
        return !!url.match(/https?/) || !!url.match(/http?/)
      }

      return {
        request: function(config) {
          if (showLoading(config.url)) {
            if (current === 0) 
              $rootScope.$broadcast('loading:show');
            current++;
          }

          return config;
        },

        response: function(response) {
          if (showLoading(response.config.url)) {
            current--;
            if (current === 0)
              $rootScope.$broadcast('loading:hide');
          }

          return response;
        },

        responseError: function(response) {
          $rootScope.$broadcast('loading:hide');

          if (response.status === 401) {
            $injector.get('$auth').logout();
            $injector.get('$state').go('intro');
          }

          return $q.reject(response);
        }
      }
    });
      
  })

  .run(function($rootScope, $state, $auth, $window) {

    $window.fbAsyncInit = function() {
      FB.init({
        appId      : '955023564596417',
        xfbml      : true,
        version    : 'v2.6'
      });
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "//connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));


    $rootScope.$on('loading:show', function() {
      //$ionicLoading.show({template: '<ion-spinner icon="lines"></ion-spinner><br><span>Loading</span>'})
    });

    $rootScope.$on('loading:hide', function() {
      //$ionicLoading.hide()
    });

    $rootScope.$on('$stateChangeStart', function(event, next) {
      if ($auth.isAuthenticated()) {
        if (next.data && next.data.redirectIfAuth) {
          event.preventDefault();
          $state.go('tab.home');
        }
      } else {
        if (next.data && next.data.auth) {
          event.preventDefault();
          $state.go('login');
        }
      }
    });
  })

  .factory('browserService', function() {
    return {
      openBrowser: function (data){
        // requires org.apache.cordova.inappbrowser
        if(window.cordova) {
          window.open(data.url, '_blank', 'location=no,hardwareback=no,enableViewportScale=yes');
        } else {
          window.open(data.url);
        }
      }
    }
  })

  .factory('youtube', function (/*$ionicPlatform, */$window, YOUTUBE_KEY, browserService) {
    function extractYoutubeId (url) {
      var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      var match = url.match(regExp);
      return match && match[7].length === 11 ? match[7] : false;
    }

    return {
      playVideo: function (url) {
        /*$ionicPlatform.ready(function () {
          var videoId = extractYoutubeId(url);
          if ($ionicPlatform.is('ios')) {
            YoutubeVideoPlayer.openVideo(videoId);
          } else if ($ionicPlatform.is('android')) {
            $window.youtube.init(YOUTUBE_KEY);
            $window.youtube.playVideo(videoId, 1, true, false);
          } else {
            browserService.openBrowser({
              url: url
            });
          }
        });*/
      }
    };
  });

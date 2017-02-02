angular.module('projek.directives', [])

.directive('slideButton', function($state) {
  return {
    restrict: 'A',
    link: function($scope, $el, $attrs,  ctrl) {
      $scope.$on('slider-change.button', function(e, $index) {
        if ($index === 0) {
          $el.removeClass($attrs.slideButtonDark);
          $el.addClass($attrs.slideButtonLight);
        } else {
          $el.removeClass($attrs.slideButtonLight);
          $el.addClass($attrs.slideButtonDark);
        }
      })
    }
  }
})

.directive('newsFeedItem', function($state) {
  return {
    restrict: 'E',
    scope: {
      item: '=',
    },
    templateUrl: 'views/directives/news-feed-item.html'
  }
})

.directive('adItem', function($state) {
  return {
    restrict: 'E',
    scope: {
      item: '=',
    },
    templateUrl: 'views/directives/ad-item.html'
  }
})

.directive('projectsFeedItem', function() {
  return {
    restrict: 'E',
    scope: {
      item: '=',
    },
    templateUrl: 'views/directives/projects-feed-item.html'
  }
})

.directive('eventsFeedItem', function($http, API_BASE, browserService, clipboard) {
  return {
    restrict: 'E',
    scope: {
      item: '=',
    },
    templateUrl: 'views/directives/events-feed-item.html',
    link: function ($scope) {

      $scope.clipboardSupported = clipboard.supported;
      $scope.currentUrl = location.href + '/' + $scope.item.id;

      $scope.clickGoing = function($id){
        var body = {
          data: {
            userId: $scope.$parent.$parent.member.id,
            eventId: $id
          }
        }
        $http.put(API_BASE + '/attendEvent', body)
        .then(function(response){
          $scope.item.myAttendance = true;
          $scope.item.attendeesCount++;
        }, function(response){
        });
      }

      $scope.sendmail = function() {
        var fromDate = new Date($scope.item.fromDate);
        var toDate = new Date($scope.item.toDate);
        var options = { year: 'numeric', month: 'short', day: 'numeric' };
        location.href = "mailto:?subject=" + $scope.item.name +
                "&body=I found an event in Projek and thought you might be interested in:%0D%0A" + 
                $scope.item.name + "%0D%0A" + 
                $scope.item.description + "%0D%0A" + 
                "from: " + fromDate.toLocaleDateString("en-US", options) + "%0D%0A" + 
                "to: " + toDate.toLocaleDateString("en-US", options) + "%0D%0A%0D%0A" + 
                "Here is the link to get more information about this event:%0D%0A" + 
                location.href + '/' + $scope.item.id;
      }

      $scope.facebook = function(){

        FB.ui({
          method: 'share',
          href: location.href + '/' + $scope.item.id,
        }, function(response){});

      }
    }
  }
})

.directive('updatesFeedItem', function() {
  return {
    restrict: 'E',
    scope: {
      item: '=',
      project: '='
    },
    templateUrl: 'views/directives/updates-feed-item.html'
  }
})

.directive('hasRemoteLinks', function(browserService, $timeout) {
  return {
    restrict: 'A',
    link: function ($scope, $el, $attrs) {
      $timeout(function () {
        $el.find('a').on('click', function (e) {
          e.preventDefault();
          var url = e.currentTarget.getAttribute('href');
          browserService.openBrowser({url: url});
        });
      });
    }
  }
})

.factory('attachmentDownload', function($http, $state, browserService, $rootScope, youtube, GETJSON_BASE) {
  return function (url) {
    function isPDF () {
      return url.substr(url.lastIndexOf('.') + 1) === 'pdf';
    }

    function isVideo () {
      return new RegExp('^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$').test(url);
    }

    // if first substring is viewer, return true.
    function isViewer(){
      return new RegExp('^(viewer?\:\/\/).+$').test(url);
    }

    function downloadPDF () {
      browserService.openBrowser({url:url});
      /*var filePath = url.substr(url.lastIndexOf('/') + 1);
      var targetPath = cordova.file.externalApplicationStorageDirectory + filePath;
      var trustHosts = true;
      var options = {};

      $rootScope.$broadcast('loading:show');

      $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
        .then(function (result) {
          $rootScope.$broadcast('loading:hide');
          $cordovaFileOpener2.open(result.toInternalURL(), 'application/pdf');
        }, function (err) {
          $rootScope.$broadcast('loading:hide');
          alert('Server can not be reached, please contact our customer support.');
        });*/
    }

    function loadSwiper(result){
      var pswpElement = document.querySelectorAll('.pswp')[0];
      var items = Array();
      for(i in result.photos){
        var item = {src: result.photos[i].src, w: result.photos[i].w, h: result.photos[i].h};
        items.push(item);
      }

      var options = {
          index: 0, // start at first slide
          backButtonHideEnabled: false,
          history: false,
          shareEl: false
      };

      var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
      gallery.init();
    }
    if (isPDF(url)) {
      downloadPDF(url);
    } else if (isVideo(url)) {
      youtube.playVideo(url);
    } else if(isViewer(url)){
      $.ajax({
        type: "GET",
        url: GETJSON_BASE + '?json=gallery.json',
        dataType: 'json',   
        success: function(result) {
          loadSwiper(result);
        } 
      });
      /*$http.get(url.substring(9)).then(function(result){
        loadSwiper(result);
      })*/
    }
     else {
      browserService.openBrowser({
        url: url
      });
    }
  }
})

.directive('attachmentDownload', function($parse, attachmentDownload) {
  return {
    restrict: 'A',
    link: function($scope, $el, $attrs) {
      $el.bind('click', function(e) {
        var url = $parse($attrs.attachmentDownload)($scope);
        if (url) {
          e.preventDefault();
          attachmentDownload(url);
        }
      });
    }
  }
})

.directive('goToUpdateOnClick', function($state, $parse, $auth) {
  return {
    restrict: 'A',
    link: function($scope, $el, $attrs) {
      const update = $parse($attrs.goToUpdateOnClick)($scope);

      function handleClick(e) {
        if (update.body) {
          $auth.isAllowedAccess(update).then(function () {
            $state.go('tab.project-update', {id: update.id});
          }, function () {
            $auth.notifyAgentOnly();
          });
        } else {
          e.preventDefault();
        }
      }

      $el.bind('click', handleClick);
    }
  }
})

.directive('passwordMatches', function($parse) {
  return {
    restrict: 'A',
    require: '^ngModel',
    link: function($scope, $el, $attrs, $ctrl) {
      function compareValue () {
        return $parse($attrs.passwordMatches)($scope).$viewValue;
      }

      $ctrl.$parsers.unshift(function (viewValue) {
        var match = viewValue === compareValue();
        $ctrl.$setValidity('passwordMatch', match);
        return viewValue;
      });
    }
  }
})

.directive('paNavBar', function($ionicHistory, $auth) {
  // the ion-cover-header plugin requires this html to be present immediately.
  // Loading from templateUrl does not satisfy this.
  var tmpl="";
  tmpl += "<ion-header-bar class=\"bar-positive\">";
  tmpl += "  <div class=\"buttons\">";
  tmpl += "    <button class='button button-clear' ng-if=\"hasBackView\" ng-click=\"goBack()\">";
  tmpl += "      <i class=\"fa fa-arrow-left\"><\/i> ";
  tmpl += "    <\/button>";
  tmpl += "  <\/div>";
  tmpl += "  <span class='title' ng-bind-html='title'></span>";
  tmpl += "  <div ng-if=\"showRight\" class=\"buttons\">";
  tmpl += "    <button ui-sref=\"account\" class='button button-clear'>";
  tmpl += "     <i class='icon ion-android-more-vertical'></i>";
  tmpl += "    </button>";
  tmpl += "  <\/div>";
  tmpl += "<\/ion-header-bar>";
  tmpl += "";

  var logoHtml = "<img class='junti-logo-small' src='img/logo.png' height='40px'>";

  return {
    restrict: 'E',
    template: tmpl,
    link: function($scope, $el, $attrs) {
      $scope.showRight = $auth.isAuthenticated();
      $scope.title = $attrs.title || logoHtml;
      $scope.hasBackView = !$attrs.disableBack && $ionicHistory.backView();
      $scope.goBack = $ionicHistory.goBack;
    }
  }
})

.directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseFloat(value, 10);
      });
    }
  };
});

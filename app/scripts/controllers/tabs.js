angular.module('projek.tabs', [])

.controller('TabsCtrl', function($scope, $state, $auth, $projects, $feed_summary, $ads, browserService, $uibModal, $timeout) {

  $scope.version = 'Version 1.1.0';
  $scope.hasFeatured = false;
  $scope.featuredProjects = [];
  $scope.ads = [];
  $scope.homeItems = [];
  $scope.projectItems = [];
  $scope.eventItems = [];
  $scope.updateItems = [];
  $scope.newsItems = [];

  $scope.badgeProjects = 0;
  $scope.badgeEvents = 0;
  $scope.badgeUpdates = 0;
  $scope.badgeNews = 0;

  $scope.projectIDs = [];
  $scope.eventIDs = [];
  $scope.updateIDs = [];
  $scope.newsIDs = [];

  // localStorage.setItem('projek-projects', '[]');
  // localStorage.setItem('projek-events', '[]');
  // localStorage.setItem('projek-updates', '[]');
  // localStorage.setItem('projek-news', '[]');

  var agent = window.navigator.userAgent;
  var isWindowPhone = (agent.indexOf("IEMobile") > -1) || (agent.indexOf("Windows Phone") > -1);
  $scope.isMobile = (agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1) && !isWindowPhone;

  // get user's info
  $auth.currentUser().then(function (result) {
    $scope.member = result;
  });

  // get ads
  $ads.findAll().then(function (items) {
    for (var i=0; i<items.length; i++) {
      var item = breakCyclesInBFS(items[i]);
      item._type = "ad";
      $scope.ads.push(item);
    }
  });

  $projects.findAll({
    filter: {featured: true}
  }).then(function(projects) {
    $scope.featuredProjects = _.shuffle(projects);
    $scope.hasFeatured = true;

    // bug with slide box specifically for 2 items
    if ($scope.featuredProjects.length === 2) {
      $scope.featuredProjects = $scope.featuredProjects.concat($scope.featuredProjects);
    }
  });

  loadFeedSummary();

  function loadFeedSummary(init) {
    $feed_summary.findAll().then(function(items) {
      $scope.badgeProjects = checNewItems('projects', items, $scope.projectIDs);
      $scope.badgeEvents = checNewItems('events', items, $scope.eventIDs);
      $scope.badgeUpdates = checNewItems('updates', items, $scope.updateIDs);
      $scope.badgeNews = checNewItems('news', items, $scope.newsIDs);
      setTimeout(function(){
        loadFeedSummary(true);
      }, 3*60*1000);
    });
    console.log('loadFeedSummary');
  }

  function checNewItems(name, items, ids) {
    while (ids.length) ids.pop();
    var isCurrentState = $state.current.name == 'tab.' + name;
    var key = 'projek-' + name;
    var str = localStorage.getItem(key);
    Array.prototype.push.apply(ids, JSON.parse(str));
    if (str == null) {
      isCurrentState = true;
    }
    var badge = 0;
    for (var i=0; i<items.length; i++) {
      var item = items[i];
      if (item._type == name) {
        if (ids.indexOf(item.id) == -1) {
          ids.push(item.id);
          if (!isCurrentState) {
            badge++;
          }
        }
      }
    }

    if (isCurrentState) {
      localStorage.setItem(key, JSON.stringify(ids));
    }
    return badge;
  }

  // open browser
  $scope.openBrowser = function(url_reference) {
    browserService.openBrowser({url:url_reference});
  }

  // logout
  $scope.logout = function() {
    $auth.logout();
    $state.go('login');
  };

  // popup

  $scope.openProfile = function () {

    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'eidtProfile.html',
      controller: 'ProfileCtrl',
      resolve: {
        userInfo: function () {
          return $scope.member;
        }
      }
    });

    var trigger = document.getElementsByClassName('popoverTrigger');
    var trigger0 = angular.element(trigger[0]);
    trigger0.triggerHandler('click');
    trigger0.removeClass('popoverTrigger');

  };

  $scope.openAgent = function () {

    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'agentInfo.html',
      controller: 'AgentFormCtrl',
      resolve: {
        agentInfo: function () {
          return $scope.member.agent;
        }
      }
    });

    modalInstance.result.then(function () {
      $auth.currentUser().then(function (result) {
        $scope.member = result;
      });
    }, function () {
    });

    var trigger = document.getElementsByClassName('popoverTrigger');
    var trigger0 = angular.element(trigger[0]);
    trigger0.triggerHandler('click');
    trigger0.removeClass('popoverTrigger');

  };

})

.directive('popoverClose', function($timeout){
  return{
    link: function(scope, element, attrs) {
      var trigger = document.getElementsByClassName('popoverTrigger');

      function closeTrigger(i) {
        $timeout(function(){
          var trigger0 = angular.element(trigger[0]);
          trigger0.triggerHandler('click');
          trigger0.removeClass('popoverTrigger');
        });
      }

      element.on('click', function(event){
        var etarget = angular.element(event.target);
        var tlength = trigger.length;
        if(!etarget.hasClass('popoverTrigger') && !etarget.hasClass(scope.excludeClass)) {
          for(var i=0; i<tlength; i++) {
            closeTrigger(i)
          }
        }
      });
    }
  };
})

.directive('popoverBtn', function(){
  return{
    link: function(scope, element, attrs) {
      element.on('click', function(){
        element.toggleClass('popoverTrigger');
      });
    }
  };
})

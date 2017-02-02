angular.module('projek.projects', [])

.controller('ProjectsCtrl', function($scope, $projects) {

  if ($scope.$parent.badgeProjects > 0) {
    $scope.$parent.badgeProjects = 0;
    localStorage.setItem('projek-projects', JSON.stringify($scope.$parent.projectIDs));    
  }

  $scope.$parent.hasFeatured = false;
  $scope.loading = false;

  if ($scope.projectItems.length == 0) {
    fetch();
  }

  function fetch() {
    if ($scope.loading) return;
    $scope.loading = true;

    return $projects.findAll().then(function(items) {
      $scope.loading = false;

      var ad_count = Math.floor($scope.projectItems.length / 5);
      if (ad_count < $scope.ads.length - 1) {
        var index = ($scope.projectItems.length % 5);
        for (var i=0; i<items.length; i++) {
          if (index == 4 && ad_count<$scope.ads.length-1) {
            $scope.projectItems.push(breakCyclesInBFS($scope.ads[ad_count+1]));
            index++;
            ad_count++;
          }
          if (items[i]._type == 'projects') {
            $scope.projectItems.push(breakCyclesInBFS(items[i]));
            index = (index + 1) % 5;
          }
        }
      } else  {
        Array.prototype.push.apply($scope.projectItems, items.map(function (item, key) {
          return breakCyclesInBFS(item);
        }));
      }
    })
  }

})

.controller('ProjectCtrl', function($scope, $state, $stateParams, $projects, $auth, attachmentDownload) {

  $scope.$parent.hasFeatured = false;
  $scope.loading = false;
  $scope.item = null;
  $scope.activeTab = 'info';

  fetch();

  function fetch () {
    $scope.loading = true;
    return $projects.findOne($stateParams.id).then(function(res) {
      $scope.loading = false;
      $scope.item = res;
    })
  }

  $scope.showProjectItem = function (item) {
    $auth.isAllowedAccess(item).then(function () {
      if (item.remoteUrl) {
        attachmentDownload(item.remoteUrl);
      } else {
        $state.go('tab.project-item', {id: item.id});
      }
    }, function () {
      $auth.notifyAgentOnly();
    });
  }

  $scope.showAttachment = function (attachment) {
    $auth.isAllowedAccess(attachment).then(function () {
      attachmentDownload(attachment.url);
    }, function () {
      $auth.notifyAgentOnly();
    });
  }

})

.controller('ProjectItemCtrl', function($scope, $stateParams, $projectItems) {
  $scope.$parent.hasFeatured = true;
  $scope.item = $projectItems.peekOne($stateParams.id);
})

.controller('ProjectUpdateCtrl', function($scope, $stateParams, $updates) {

  $scope.$parent.hasFeatured = true;
  $scope.loading = true;

  $updates.findOne($stateParams.id, {include: ['project']}).then(function(res) {

    $scope.loading = false;
    $scope.item = res;
    if ($scope.item.project) {
      $scope.item.title = 'Update: ' + $scope.item.project.title;
    } else {
      $scope.item.title = 'Update';
    }
  })
})

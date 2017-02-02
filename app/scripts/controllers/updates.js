angular.module('projek.updates', [])

.controller('UpdatesCtrl', function($scope, $updates) {

  if ($scope.$parent.badgeUpdates > 0) {
    $scope.$parent.badgeUpdates = 0;
    localStorage.setItem('projek-updates', JSON.stringify($scope.$parent.updateIDs));
  }

  $scope.$parent.hasFeatured = true;
  $scope.loading = false;
  $scope.canFetch = true;
  $scope.fetchMore = fetch;

  if ($scope.updateItems.length == 0) {
    fetch();
  }

  function fetch() {
    if ($scope.loading) return;
    $scope.loading = true;

    return $updates.findAll({
      page: {
        offset: $scope.updateItems.length
      }
    }, {
      include: ['project']
    }).then(function (items) {
      $scope.loading = false;

      if (items.length === 0) {
        $scope.canFetch = false;
        return;
      }

      var ad_count = Math.floor($scope.updateItems.length / 5);
      if (ad_count < $scope.ads.length - 1) {
        var index = ($scope.updateItems.length % 5);
        for (var i=0; i<items.length; i++) {
          if (index == 4 && ad_count<$scope.ads.length-1) {
            $scope.updateItems.push(breakCyclesInBFS($scope.ads[ad_count+1]));
            index++;
            ad_count++;
          }
          if (items[i]._type == 'updates') {
            $scope.updateItems.push(breakCyclesInBFS(items[i]));
            index = (index + 1) % 5;
          }
        }
      } else  {
        Array.prototype.push.apply($scope.updateItems, items.map(function (item, key) {
          return breakCyclesInBFS(item);
        }));
      }

    });
  }

})

angular.module('projek.home', [])

.controller('HomeCtrl', function($scope, $feed) {
  
  $scope.$parent.hasFeatured = true;
  $scope.loading = false;
  $scope.canFetch = true;
  $scope.fetchMore = fetch;

  if ($scope.homeItems.length == 0) {
    fetch();
  }

  function fetch() {  
    if ($scope.loading) return;
    $scope.loading = true;

    return $feed.findAll({
      page: {
        limit: 8,
        offset: $scope.homeItems.length
      }
    }, {
      include: ['project']
    }).then(function (items) {
      $scope.loading = false;
      
      if (items.length === 0) {
        $scope.canFetch = false;
        return;
      }

      var ad_count = Math.floor($scope.homeItems.length / 5);
      if (ad_count < $scope.ads.length - 1) {
        var index = ($scope.homeItems.length % 5);
        for (var i=0; i<items.length; i++) {
          if (index == 4 && ad_count<$scope.ads.length-1) {
            $scope.homeItems.push(breakCyclesInBFS($scope.ads[ad_count+1]));
            index++;
            ad_count++;
          }
          if (items[i]._type == 'events' || items[i]._type == 'updates' || items[i]._type == 'news') {
            $scope.homeItems.push(breakCyclesInBFS(items[i]));            
            index = (index + 1) % 5;  
          }          
        }
      } else  {
        Array.prototype.push.apply($scope.homeItems, items.map(function (item, key) {
          return breakCyclesInBFS(item);
        }));
      }
      
    });
  }

})

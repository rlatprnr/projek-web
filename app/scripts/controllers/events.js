angular.module('projek.events', [])

.controller('EventsCtrl', function($scope, $events, $http, API_BASE, JsonApiDataStore) {

  if ($scope.$parent.badgeEvents > 0) {
    $scope.$parent.badgeEvents = 0;
    localStorage.setItem('projek-events', JSON.stringify($scope.$parent.eventIDs));    
  }

  $scope.$parent.hasFeatured = true;
  $scope.loading = false;
  $scope.canFetch = true;
  $scope.fetchMore = fetch;

  if ($scope.eventItems.length == 0) {
    fetch();
  }

  function fetch() {
    if ($scope.loading) return;
    $scope.loading = true;

    return $events.findAll({
      page: {
        offset: $scope.eventItems.length
      }
    }).then(function (items) {
      $scope.loading = false;

      if (items.length === 0) {
        $scope.canFetch = false;
        return;
      }

      var ad_count = Math.floor($scope.eventItems.length / 5);
      if (ad_count < $scope.ads.length - 1) {
        var index = ($scope.eventItems.length % 5);
        for (var i=0; i<items.length; i++) {
          if (index == 4 && ad_count<$scope.ads.length-1) {
            $scope.eventItems.push(breakCyclesInBFS($scope.ads[ad_count+1]));
            index++;
            ad_count++;
          }
          if (items[i]._type == 'events') {
            $scope.eventItems.push(breakCyclesInBFS(items[i]));
            index = (index + 1) % 5;
          }
        }
      } else  {
        Array.prototype.push.apply($scope.eventItems, items.map(function (item, key) {
          return breakCyclesInBFS(item);
        }));
      }

    });
  }

})

.controller('EventCtrl', function($scope, $state, $stateParams, $events, $http, API_BASE, clipboard) {

  $scope.$parent.hasFeatured = true;
  $scope.loading = false;
  $scope.item = null;

  $scope.clipboardSupported = clipboard.supported;

  fetch();

  function fetch () {
    $scope.loading = true;
    return $events.findOne($stateParams.id).then(function(res) {
      $scope.loading = false;
      $scope.item = res;
      $scope.currentUrl = location.href;
    })
  }
  $scope.clickGoing = function($id){
    var body = {
      data: {
        userId: $scope.$parent.member.id,
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
            location.href;
  }

  $scope.facebook = function(){

    FB.ui({
      method: 'share',
      href: location.href,
    }, function(response){});

  }
});

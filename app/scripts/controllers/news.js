angular.module('projek.news', [])

.controller('NewsCtrl', function($scope, $news) {

  if ($scope.$parent.badgeNews > 0) {
    $scope.$parent.badgeNews = 0;
    localStorage.setItem('projek-news', JSON.stringify($scope.$parent.newsIDs));
  }

  $scope.$parent.hasFeatured = true;
  $scope.loading = false;
  $scope.canFetch = true;
  $scope.fetchMore = fetch;

  if ($scope.newsItems.length == 0) {
    fetch();
  }

  function fetch() {
    if ($scope.loading) return;
    $scope.loading = true;

    return $news.findAll({
      page: {
        offset: $scope.newsItems.length
      }
    }).then(function (items) {
      $scope.loading = false;

      if (items.length === 0) {
        $scope.canFetch = false;
        return;
      }

      var ad_count = Math.floor($scope.newsItems.length / 5);
      if (ad_count < $scope.ads.length - 1) {
        var index = ($scope.newsItems.length % 5);
        for (var i=0; i<items.length; i++) {
          if (index == 4 && ad_count<$scope.ads.length-1) {
            $scope.newsItems.push(breakCyclesInBFS($scope.ads[ad_count+1]));
            index++;
            ad_count++;
          }
          if (items[i]._type == 'news') {
            $scope.newsItems.push(breakCyclesInBFS(items[i]));
            index = (index + 1) % 5;
          }
        }
      } else  {
        Array.prototype.push.apply($scope.newsItems, items.map(function (item, key) {
          return breakCyclesInBFS(item);
        }));
      }

    });
  }


})

.controller('NewsDetailCtrl', function($scope, $state, $news, browserService) {

  var $newsID = $state.params.newsid;

  $scope.loading = true;
  $news.findOne($newsID).then(function (item) {
    $scope.loading = false;
    $scope.news = item;
  });

});

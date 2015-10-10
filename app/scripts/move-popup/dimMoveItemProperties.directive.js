(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveItemProperties', MoveItemProperties);

  MoveItemProperties.$inject = ['$sce'];

  function MoveItemProperties($sce) {
    return {
      bindToController: true,
      controller: MoveItemPropertiesCtrl,
      controllerAs: 'vm',
      scope: {
        item: '=dimMoveItemProperties'
      },
      restrict: 'A',
      replace: true,
      template: [
        '<div>',
        '<div ng-class="vm.classes">',
        '  <span ng-if="vm.item.locked" class="locked"></span>',
        '  <span><a target="_new" href="http://db.destinytracker.com/inventory/item/{{vm.item.hash}}">{{vm.title}}</a></span>',
        '  <span ng-if="vm.item.type === \'Bounties\' && !vm.item.complete" class="bounty-progress"> | {{vm.item.xpComplete}}%</span>',
        '  <span ng-if="vm.light > 0"> &#10022; {{ vm.light }}</span>',
        '  <div class="inline-stats"><span ng-repeat="stat in vm.stats track by stat.label"> | {{ stat.label }} {{ stat.value }}</span></div>',
        '  <span class="pull-right move-popup-info-detail" ng-mouseover="vm.itemDetails = true;" ng-if="!vm.itemDetails && vm.item.type != \'Bounties\' && !vm.item.classified"><span class="fa fa-info-circle"></span></span>',
        '</div>',
        '<div class="item-details" ng-show="vm.item.classified">Classified item. Bungie does not yet provide information about this item. Item is not yet transferable.</div>',
        '<div class="item-details" ng-show="vm.itemDetails && vm.item.stats.length && vm.item.type != \'Bounties\'">',
        '  <div class="item-stats" ng-repeat="stat in vm.item.stats track by $index">',
        '    <div ng-if="vm.item.sort === \'Weapons\' && vm.item.owner != \'vault\'" class="stat-box-row">',
        '       <span class="stat-box-text"> {{ stat.name }} </span>',
        '       <span class="stat-box-outer">',
        '         <span ng-if="stat.value === stat.equippedStatsValue && stat.equippedStatsName != \'Magazine\' || stat.equippedStatsName != stat.name" ng-show="{{ stat.bar }}" class="stat-box-inner" style="width: {{ stat.value }}%"></span>',
        '         <span ng-if="stat.value < stat.equippedStatsValue && stat.equippedStatsName != \'Magazine\' && stat.equippedStatsName === stat.name" ng-show="{{ stat.bar }}" class="stat-box-inner" style="width: {{ stat.value }}%"></span>',
        '         <span ng-if="stat.value < stat.equippedStatsValue && stat.equippedStatsName != \'Magazine\' && stat.equippedStatsName === stat.name" ng-show="{{ stat.equippedStatsValue - stat.value}}" class="stat-box-inner lower-stats" style="width: {{ stat.equippedStatsValue - stat.value }}%"></span>',
        '         <span ng-if="stat.value > stat.equippedStatsValue && stat.equippedStatsName != \'Magazine\' && stat.equippedStatsName === stat.name" ng-show="{{ stat.equippedStatsValue }}" class="stat-box-inner" style="width: {{ stat.equippedStatsValue }}%"></span>',
        '         <span ng-if="stat.value > stat.equippedStatsValue && stat.equippedStatsName != \'Magazine\' && stat.equippedStatsName === stat.name" ng-show="{{ stat.value - stat.equippedStatsValue}}" class="stat-box-inner higher-stats" style="width: {{ stat.value - stat.equippedStatsValue }}%"></span>',
        '         <span ng-if="stat.value < stat.equippedStatsValue && stat.equippedStatsName === \'Magazine\' && stat.equippedStatsName === stat.name" ng-hide="{{ stat.bar }}" class="lower-stats">{{ stat.value }}</span>',
        '         <span ng-if="stat.value > stat.equippedStatsValue && stat.equippedStatsName === \'Magazine\' && stat.equippedStatsName === stat.name" ng-hide="{{ stat.bar }}" class="higher-stats">{{ stat.value }}</span>',
        '         <span ng-if="stat.value === stat.equippedStatsValue" ng-hide="{{ stat.bar }}">{{ stat.value }}</span>',
        '       </span>',
        '         <span ng-if="stat.value < stat.equippedStatsValue && stat.equippedStatsName === stat.name" ng-show="{{ stat.bar }}" class="lower-stats stat-box-val">{{ stat.value }}</span>',
        '         <span ng-if="stat.value > stat.equippedStatsValue && stat.equippedStatsName === stat.name" ng-show="{{ stat.bar }}" class="higher-stats stat-box-val">{{ stat.value }}</span>',
        '         <span ng-if="stat.value === stat.equippedStatsValue || stat.equippedStatsName != stat.name" ng-show="{{ stat.bar }}" class="stat-box-val">{{ stat.value }}</span>',
        '    </div>',
        '    <div ng-if="vm.item.sort != \'Weapons\' || vm.item.owner === \'vault\'" class="stat-box-row">',
        '       <span class="stat-box-text"> {{ stat.name }} </span>',
        '       <span class="stat-box-outer">',
        '         <span ng-show="{{ stat.bar }}" class="stat-box-inner" style="width: {{ stat.value }}%"></span>',
        '         <span ng-hide="{{ stat.bar }}">{{ stat.value }}</span>',
        '       </span>',
        '       <span class="stat-box-val" ng-show="{{ stat.bar }}">{{ stat.value }}</span>',
        '    </div>',
        '  </div>',
        '  <div class="item-perks">',
        '    <div ng-if="vm.isInfusable(vm.item)" ng-click="vm.infuse(vm.item, $event)" title="Infusion calculator" alt="Infusion calculator" style="background-image: url(\'/images/{{vm.item.sort}}.png\')"></div>',
        '    <div ng-repeat="perk in vm.item.perks track by $index" title="{{perk.displayName}}\n{{perk.displayDescription}}" style="background-image: url(http://bungie.net{{ perk.iconPath }})"></div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MoveItemPropertiesCtrl.$inject = ['$sce', 'dimSettingsService', 'ngDialog', '$scope'];

  function MoveItemPropertiesCtrl($sce, settings, ngDialog, $scope) {
    var vm = this;

    vm.classes = {
      'item-name': true,
      'is-arc': false,
      'is-solar': false,
      'is-void': false
    };

    vm.title = $sce.trustAsHtml(vm.item.name);
    vm.light = 0;
    vm.stats = [];
    vm.itemDetails = false;
    settings.getSetting('itemDetails')
      .then(function(show) {
        vm.itemDetails = show;
      });

    if (vm.item.primStat) {
      if (vm.item.primStat.statHash === 3897883278) {
        // only 4 stats if there is a light element. other armor has only 3 stats.
        if (vm.item.stats.length === 4) {
          vm.light = vm.item.stats[0].value;
        }

        var stats = [{
          name: 'Intellect',
          abbr: 'Int:'
        }, {
          name: 'Discipline',
          abbr: 'Dis:'
        }, {
          name: 'Strength',
          abbr: 'Str:'
        }];

        var val = 0;

        vm.stats = _.reduce(stats, function(memo, pStat) {
          var iStat = _.find(vm.item.stats, function(stat) {
            return stat.name === pStat.name;
          });

          if (!_.isUndefined(iStat)) {
            if (iStat.value !== 0) {
              memo.push({
                'label': pStat.abbr,
                'value': iStat.value
              });
            }
          }

          return memo;
        }, []);

        vm.stats.unshift({
          'label': 'Def:',
          'value': vm.item.primStat.value
        });

        // for (var s = 0; s < stats.length; s++) {
        //   if (vm.item.stats.length > 0) {
        //
        //     val = vm.item.stats[s + (vm.item.stats.length === 4 ? 1 : 0)].value;
        //     if (val !== 0) {
        //       vm.stats.push({
        //         'label': stats[s],
        //         'value': val
        //       });
        //     }
        //   }
        // }
      } else if (vm.item.primStat.statHash === 368428387) {
        // switch(vm.item.dmg) {
        //  case 'arc': vm.color = '#85c5ec'; break;
        //  case 'solar': vm.color = '#f2721b';  break;
        //  case 'void': vm.color = '#b184c5'; break;
        // }

        switch (vm.item.dmg) {
          case 'arc':
            {
              vm.classes['is-arc'] = true;
              break;
            }
          case 'solar':
            {
              vm.classes['is-solar'] = true;
              break;
            }
          case 'void':
            {
              vm.classes['is-void'] = true;
              break;
            }
        }

        vm.stats.push({
          'label': 'Atk:',
          'value': vm.item.primStat.value
        });
      }
    }

    /*
    * Check that the current item is infusable
    * Only legendary or Exotic items are infusable.
    */
    vm.isInfusable = function isInfusable(item) {
      // Infuse perk's id is 1270552711
      return _.contains(item.talentPerks, 1270552711);
    }

    /*
    * Open up the dialog for infusion by passing
    * the selected item
    */
    vm.infuse = function infuse(item, e) {
      e.stopPropagation();

      // Close the move-popup
      ngDialog.closeAll();

      // Open the infuse window
      var infuse = ngDialog.open({
        template: 'views/infuse.html',
        overlay: false,
        className: 'app-settings',
        controller: ['dimShareData', function(shareDataService) {
          shareDataService.setItem(item);
        }]
      });
    }

    /*
    * Get the item stats and its stat name 
    * of the equipped item for comparison
    */
    var items = $scope.$parent.$parent.vm.store.items;

    for (var item of items) {
      if (item.equipped && item.type === vm.item.type) {
        for (var key in vm.item.stats) {
          vm.item.stats[key]['equippedStatsValue'] = item.stats[key].value;
          vm.item.stats[key]['equippedStatsName'] = item.stats[key].name;
        }
      }
    }
  }
})();

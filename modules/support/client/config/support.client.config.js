
'use strict';

// Configuring the Jobs module
angular.module('support').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'support', {
      title: 'User Guide',
      state: 'support.portal-user-guide',
      roles:  ['user', 'admin', 'root', 'partner', 'read', 'l1ops']
    });

    Menus.addSubMenuItem('topbar', 'support', {
      title: 'Interoperability Guide',
      state: 'support.portal-user-api-guide',
      roles:  ['user', 'admin', 'root', 'partner', 'read', 'l1ops' ]
    });

    Menus.addSubMenuItem('topbar', 'support', {
      title: 'ISCSI Host Setup Guide',
      state: 'support.portal-iscsi-host-setup-guide',
      roles:  ['user', 'admin', 'root', 'partner', 'read', 'l1ops' ]
    });

    Menus.addSubMenuItem('topbar', 'support', {
      title: 'Downloads',
      state: 'support.downloads',
      type: 'dropdown',
      roles:  ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
      submenu: [
        { 
          'name': 'OnCommand Unified Manager-7.2RC1',
          'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          'state': 'support.downloads.software({software:"OCUM"})',
          // 'submenu': [
          //   {
          //     'name': '7.2 RC1',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"OCUM"})'
          //   },
          //   {
          //      'name': '7.3 RC1',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"OCUM"})'
          //   },
          //   {
          //     'name': 'Release Notes',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"OCUM"})'
          //   }
          // ]
        },
        { 
          'name' : 'OnCommand CloudManager-V3.2.0',
          'roles' : ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          'state': 'support.downloads.software({software:"cloud-manager"})',
          // 'submenu': [
          //   {
          //     'name': 'V3.2.0',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"cloud-manager"})'
          //   },
          //   {
          //      'name': 'V3.3.0',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"cloud-manager"})'
          //   },
          //   {
          //     'name': 'Release Notes',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"cloud-manager"})'
          //   }
          // ]
        },
        { 
          'name' : 'OntapDSM-V4.1',
          'roles' : ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          'state': 'support.downloads.software({software:"ontapdsm"})',
          // 'submenu': [
          //   {
          //     'name': 'V4.1',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"ontapdsm"})'
          //   },
          //   {
          //      'name': 'V4.2',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"ontapdsm"})'
          //   },
          //   {
          //     'name': 'Release Notes',
          //     'roles': ['user', 'admin', 'root', 'partner', 'read', 'l1ops'],
          //     'state': 'support.downloads.software({software:"ontapdsm"})'
          //   }
          // ]
        }       
      ]
    });
  }]);
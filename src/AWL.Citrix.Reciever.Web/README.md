AWL Citrix Reciever Web
=======================

Custom CSS and JavaScript overrides for the Citrix Web Receiver. 
![](docs/dashboard.png)
## Overview

* [Features](#features)
* [Installation](#installation)
* [Building from Source](#building-from-source)
* [Configuration](#configuration)
* [Links](#links)

## Features

* AWL look and feel in StoreFront
    - AWL blue as primary color
    - Randomized image on the login page from the `images` directory 
    - Messages and tags from [Bulma](https://bulma.io)
* Additional desktop information
    - Connected
    - Available desktops
    - Under maintenance
    - Disconnected with the idle time
* Display custom service messages 
    - Located in the `Notification` table in the `BrainsDB`
    - Uses [SignalR](https://www.asp.net/signalr) to push new notifications real-time to the clients (see [Citrix Service](http://issuetracker.awl.tech/projects/awl-citrix-service) for the hub)

## Installation

To install the AWL Citrix Reciever Web you should:

1. Install the [AWL Citrix Reciever Proxy]
2. The [Citrix Service]should be running and accessible for the StoreFront server
3. Copy all the files from `dist/` to the StoreFront server on `C:\inetpub\wwwroot\Citrix\<storename>Web\custom`

## Building from Source for Production

[Node.js](https://nodejs.org/) is required to build and bundle the custom CSS and JavaScript. After installing the `npm` package manager should be available in your system/user path. Run `npm install` from the AWL Citrix Reciever Web directory to install the required (dev) dependencies. 

You can build and bundle the source files by running `npm run build --env production` or you can automatically build the files on change by running `npm run watch`. All the build scripts can be found in the `package.json` file.
This will use the `config\production.config.js` configuration file.

## Building from Source for Development

You can build and bundle the source files by running `npm run build` or you can automatically build the files on change by running `npm run watch`. This will use the `config\development.config.js` configuration file.


## Configuration

AWL Citrix Reciever Web uses [Sass](http://sass-lang.com/) as a CSS preprocessor, configurations (ie primary color and font) can be found in `css/utilities/variables.scss`.

The JavaScript library can be configured by editing the config files in the `config` directory. Depending on the `NODE_ENV` environment value the corresponding config file is used with the default value set to `development`. The config file contains a literal with the following keys:

#### logger

*  `level` 
    - Type: `string`
    - Description: Sets the level for [console-log-level](https://github.com/watson/console-log-level), a simple logger for STDOUT or STDERR
    - Values: `trace`, `debug`, `info`, `warn`, `error` and `fatal`
    - Default: `info`

#### notifications

*  `enabled` 
    - Type: `boolean`
    - Description: Enable or disable real-time service notifications from the `BrainsDB`
    - Default: `false`
*  `autoRestart` 
    - Type: `boolean`
    - Description: Auto recover the SignalR connection
    - Default: `true`
*  `url` 
    - Type: `string`
    - Description: Url for the NotificationHub that's implemented in the [AWL Citrix Service]()
    - Default: `""`
*  `debug` 
    - Type: `boolean`
    - Description: Debug the SignalR connection
    - Default: `false`

#### dashboard

*  `url` 
    - Type: `string`
    - Description: Url for the DashboardController in the [AWL Citrix Service]()
    - Default: `""`
*  `caching`
    - `enabled` 
        - Type: `boolean`
        - Description: Cache the dashboard in LocalStorage
        - Default: `false`
    - `duration` 
        - Type: `integer`
        - Description: Expiration time for the dashboard caching in milliseconds
        - Default: `0`

### Example

```
var config = {
    "logger": {
        "level": "info"
    },
    "notifications": {
        "enabled": true,
        "autoRestart": true,
        "url": "/Citrix/AWLTESTLIVEWeb/AWLCitrixClientHandler.ashx/signalr",
        "debug": false
    },
    "dashboard": {
        "url": "/Citrix/AWLTESTLIVEWeb/AWLCitrixClientHandler.ashx/dashboard",
        "caching": {
            "enabled": true,
            "duration": 10000
        }
    }
};
```

## Links


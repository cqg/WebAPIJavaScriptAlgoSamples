# CQG WebAPI JavaScript Algo Samples

If you are just getting started with the CQG Web API, you may find it helpful to study the basic sample code packages below. Here you will find comments regarding special concepts necessary to working efficiently with the interface. Each sample module demonstrates all the necessary steps to accomplishing its basic function; e.g. all modules include the functions for connecting to the server and logging in with user credentials. Please note these samples stop short of recommending best practices for error handling or memory management.

## Introduction
There are 4 samples concerning algo orders inside the package. Run them in the following order:
| File name | Description |
|-----------|-------------|
|`account.js`|logon, and send client message to receive account information associated with user id|
|`entitlements.js`|logon, resolve contract id for given symbol, get names of all CQG Algo strategies|
|`algoStrategy.js`|logon, resolve contract id for given symbol, get all parameters of chosen Algo strategy|
|`algoOrders.js`|logon, resolve contract id for given symbol, trade subscription and send client message to place or modify an order for chosen Algo and it's parameters|

## How to use
There are two ways to run test the samples:
1. Install [JetBrains WebStorm](https://www.jetbrains.com/webstorm/), load package with examples, run files from it.
2. Use your convenient JavaScript environment and run files there with the following packages installed:
    1. [ProtobufJs](https://github.com/protobufjs/protobuf.js) ([documentation](https://www.npmjs.com/package//protobufjs#using-proto-files))
    2. [WebSocket](https://github.com/websockets/ws)

## Package content
### Service files
Service files and folders for JetBrains WebStorm.

### \proto\Webapi
| File name | Description |
|-----------|-------------|
|`account_authorization_2.proto`|Messages for accounts that require separate authorization process|
|`api_limit_2.proto`|WebAPI limit messages|
|`historical_2.proto`|Historical related messages. T&S, TimeBar, NonTimedBar, RenkoBar and so on|
|`instrument_definition_2.proto`|Instrument definition messages|
|`market_data_2.proto`|Market Data messaging. RealTimeMarketData, DetailedDOM, RFQRequest, OptionCalculationRequest|
|`metadata_2.proto`|Public metadata related messages|
|`metadata_admin_2.proto`|Metadata administration messages|
|`order_2.proto`|Order related messages|
|`otc_1.proto`|OTC messages|
|`rules_1.proto`|Rules server messages|
|`strategy_2.proto`|Strategy related messages|
|`strategy_definition_2.proto`|Strategy definition messages|
|`symbol_browsing_2.proto`|Symbol related messages|
|`trade_routing_2.proto`|Trade Routing messaging|
|`trading_account_2.proto`|Trading account related messages|
|`trading_session_2.proto`|Trading session related messages|
|`user_attribute_2.proto`|User attributes messages|
|`user_session_2.proto`|User session level messages|
|`webapi_2.proto`|CQG Web API server protocol|

### \proto\Webapi\common
| File name | Description |
|-----------|-------------|
|`decimal.proto`|decimal numbers wrapper|
|`shared.proto`|Entities shared between different protocols|

### \proto\WebAPI\google\protobuf
Part of Google Protocol Buffers library

## Notice
Protocol buffers files for JavaScript differ by import paths from proto files [here](https://partners.cqg.com/api-resources/web-api/documentation)

## Contact
If you have problems, questions, ideas or suggestions, please [contact us](mailto:apihelp@cqg.com)

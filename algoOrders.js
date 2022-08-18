let protobuf = require("protobufjs");
let WebSocket = require('ws');

let host_name = '';
let user_name = '';
let password = '';

let resolve_symbol_name = 'EP';
let account_id = 0;  //To find account_id for given user, run account.js script
let contract_id = 1;
let request_id = 1;

let trade_subscription_id = 1;
let cl_order_id = '3';      //every order must have unique cl_order_id per trader per day
let order_type = 1;         //1 means MKT 2 means LMT 3 means STP 4 means STL
let duration = 1;
let side = 1;               //1 means buy and 2 means sell
let qty_significant = 5;
let qty_exponent = 0;
let is_manual = false;

let ws = new WebSocket(host_name, { rejectUnauthorized: false });


function logon(root, user_name, password, client_app_id='WebApiTest',
               client_version='python-client-test-2-1', protocol_version_major= 2,
               protocol_version_minor = 90) {
    let logonMsg = root.lookupType("user_session_2.Logon");
    let logon = logonMsg.create({userName : user_name,
        password : password,
        clientAppId : client_app_id,
        clientVersion : client_version,
        protocolVersionMinor : protocol_version_minor,
        protocolVersionMajor : protocol_version_major});

    let clientMsg = root.lookupType("WebAPI_2.ClientMsg");
    let client_msg = clientMsg.create({logon : logon});
    let buffer = clientMsg.encode(client_msg).finish();
    ws.on('open', function open() {
        ws.send(buffer);
    });
}

function resolve_symbol(root, symbol_name, msg_id=1) {
    let symbolResolutionRequestMsg = root.lookupType("metadata_2.SymbolResolutionRequest");
    let symbol_resolution_request = symbolResolutionRequestMsg.create({symbol : symbol_name});

    let InformationRequestMsg = root.lookupType("WebAPI_2.InformationRequest");
    let information_request = InformationRequestMsg.create({id : msg_id, symbolResolutionRequest: symbol_resolution_request});

    let clientMsg = root.lookupType("WebAPI_2.ClientMsg");
    let client_msg = clientMsg.create({informationRequests : [information_request]});
    let buffer = clientMsg.encode(client_msg).finish();
    ws.send(buffer);
}

function request_trade_subscription(root, trade_subscription_id) {
    let tradeSubscriptionMsg = root.lookupType("trade_routing_2.TradeSubscription");
    let trade_subscription_request = tradeSubscriptionMsg.create({id : trade_subscription_id,
                                                                  subscribe: true, subscriptionScopes: [1]});

    let clientMsg = root.lookupType("WebAPI_2.ClientMsg");
    let client_msg = clientMsg.create({tradeSubscriptions : [trade_subscription_request]});
    let buffer = clientMsg.encode(client_msg).finish();
    ws.send(buffer);
}

function new_order_request(root, request_id, account_id, contract_id,
                           cl_order_id, order_type, duration, side,
                           qty_significant, qty_exponent, is_manual) {
    let decimalMsg = root.lookupType("cqg.Decimal");
    let decimal = decimalMsg.create({significand: qty_significant, exponent: qty_exponent});

    let timestampMsg = root.lookupType("google.protobuf.Timestamp");
    let timestamp = timestampMsg.create({ seconds: Math.floor(Date.now() / 1000)});

    let extraAttributeMsg = root.lookupType("shared_1.NamedValue");
    let extra_attribute_cost = extraAttributeMsg.create({name: "ALGO_CQG_cost_model", value: "1"});
    let extra_attribute_pov = extraAttributeMsg.create({name: "ALGO_CQG_percent_of_volume", value: "0"});

    let orderMsg = root.lookupType("order_2.Order");
    // Run entitlements.js script to get available algo orders names.
    // Run algo_strategy.js to get params and possible values for selected algo order
    let order = orderMsg.create({accountId: account_id,
                                 whenUtcTimestamp: timestamp,
                                 contractId: contract_id,
                                 clOrderId: cl_order_id,
                                 orderType: order_type,
                                 duration: duration,
                                 side: side,
                                 qty: decimal,
                                 isManual: is_manual,
                                 algoStrategy: "CQG ARRIVALPRICE",
                                 extraAttributes: [extra_attribute_cost, extra_attribute_pov]});

    let newOrderMsg = root.lookupType("order_2.NewOrder");
    let new_order = newOrderMsg.create({order: order});

    let orderRequestMsg = root.lookupType("order_2.OrderRequest");
    let order_request = orderRequestMsg.create({requestId: request_id, newOrder: new_order});

    let clientMsg = root.lookupType("WebAPI_2.ClientMsg");
    let client_msg = clientMsg.create({orderRequests : [order_request]});
    let buffer = clientMsg.encode(client_msg).finish();
    ws.send(buffer);
}

function main() {
    protobuf.load("proto/WebApi/webapi_2.proto",function(err, root) {
        if (err)
            throw err;

        logon(root, user_name, password);

        let serverMsg = root.lookupType("WebAPI_2.ServerMsg");
        ws.on('message', function message(data) {
            let server_message = serverMsg.decode(data);
            let message = server_message.toJSON();

            if (message['logonResult'] !== undefined){
                console.log('Logon successful: %s', JSON.stringify(message));
                let logon_result = message['logonResult'];
                if (logon_result['resultCode'] === 0) {
                    resolve_symbol(root, resolve_symbol_name);
                }
                else {
                    console.log('Logon failed: result code %s, %s', logon_result['resultCode'], logon_result['textMessage']);
                    ws.close();
                    return;
                }
            }

            if (message['informationReports'] !== undefined){
                let information_reports_array = message['informationReports'];
                for (const information_report of information_reports_array){
                    if (information_report['statusCode'] === 0) {
                        if (information_report['symbolResolutionReport'] !== undefined){
                            console.log('Symbol resolution: %s', JSON.stringify(information_report));
                            request_trade_subscription(root, trade_subscription_id);
                        }
                    }
                    else {
                        console.log('Information request failed: result code %s, %s', information_report['statusCode'], information_report['textMessage'])
                        ws.close();
                        return;
                    }
                }
            }

            if (message['tradeSubscriptionStatuses'] !== undefined){
                let trade_subscription_statuses_array = message['tradeSubscriptionStatuses'];
                for (const trade_subscription_status of trade_subscription_statuses_array){
                    if (trade_subscription_status['statusCode'] === 0) {
                        console.log('Trade subscription: %s', JSON.stringify(trade_subscription_status));
                        new_order_request(root, request_id, account_id, contract_id,
                            cl_order_id, order_type, duration, side,
                            qty_significant, qty_exponent, is_manual);
                    }
                    else {
                        console.log('Trade subscription failed: result code %s, %s', trade_subscription_status['statusCode'], trade_subscription_status['textMessage'])
                        ws.close();
                        return;
                    }
                }
            }

            if (message['tradeSnapshotCompletions'] !== undefined){
                let trade_snapshot_completions_array = message['tradeSnapshotCompletions'];
                for (const trade_snapshot_completion of trade_snapshot_completions_array){
                    console.log('Trade snapshot: %s', JSON.stringify(trade_snapshot_completion));
                }
            }

            if (message['orderStatuses'] !== undefined){
                let order_statuses_array = message['orderStatuses'];
                for (const order_status of order_statuses_array){
                    console.log('Order status : %s', JSON.stringify(order_status));
                }
            }
        });
    });
}

main();

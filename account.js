let protobuf = require("protobufjs");
let WebSocket = require('ws');

let host_name = '';
let user_name = '';
let password = '';

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

// Request for all accounts this user is authorized to trade/monitor
// Accounts are grouped by sales series, which are grouped by brokerages
function resolve_account(root, msg_id=1) {
    let accountsRequestMsg = root.lookupType("trading_account_2.AccountsRequest");
    let accounts_request = accountsRequestMsg.create({});

    let InformationRequestMsg = root.lookupType("WebAPI_2.InformationRequest");
    let information_request = InformationRequestMsg.create({id : msg_id, accountsRequest: accounts_request});

    let clientMsg = root.lookupType("WebAPI_2.ClientMsg");
    let client_msg = clientMsg.create({informationRequests : [information_request]});
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
                    resolve_account(root);
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
                        console.log('Account info: %s', JSON.stringify(information_report));
                    }
                    else {
                        console.log('Logon failed: result code %s, %s', information_report['statusCode'], information_report['textMessage'])
                    }
                }
                ws.close();
            }
        });
    });
}

main();



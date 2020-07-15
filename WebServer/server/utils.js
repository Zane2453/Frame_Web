var ejs = require('ejs');

var sendResponse = function(res, statusCode, contents){
    res.writeHead(statusCode, {"Content-Type": "text/html"});
    res.end(contents);
}

var sendEjsRenderResponse = function(res, statusCode, contents, JSONdata){
    res.writeHead(statusCode, {"Content-Type": "text/html"});
    res.end(ejs.render(contents, JSONdata));
}

module.exports = {
    sendResponse: sendResponse,
    sendEjsRenderResponse: sendEjsRenderResponse
};

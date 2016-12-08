(function() {
    "use strict";

    if (typeof Ugosansh == "undefined") {
        window.Ugosansh = {};
    }

    if (typeof Ugosansh.Autocomplete == "undefined") {
        Ugosansh.Autocomplete = {};
    }


    /**
     * Ugosansh.Autocomplete.Request
     */
    Ugosansh.Autocomplete.Request = function(headers)
    {
        this.headers = headers || new Map();
    };

    Ugosansh.Autocomplete.Request.prototype.createXhr = function()
    {
        var xhr;

        if (window.XMLHttpRequest || window.ActiveXObject) {
            if (window.ActiveXObject) {
                try {
                    xhr = new ActiveXObject("Msxml2.XMLHTTP");
                } catch(e) {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }
            } else {
                xhr = new XMLHttpRequest(); 
            }
        } else {
            throw "Your browser doesn't support XMLHTTPRequest";
        }

        return xhr;
    };

    Ugosansh.Autocomplete.Request.prototype.send = function(method, url, headers, body)
    {
        var self = this;

        var promise = new Promise(function(resolve, reject) {
            var xhr         = self.createXhr(),
                contentType = null
            ;

            xhr.onprogress  = function(event) {
                document.dispatchEvent(new CustomEvent('xhr_request_progress', {'detail': {'event': event, 'request': self}}));
            };
            xhr.onloadstart = function(event) {
                document.dispatchEvent(new CustomEvent('xhr_request_start', {'detail': {'event': event, 'request': self}}));
            };
            xhr.onerror     = function(event) {
                document.dispatchEvent(new CustomEvent('xhr_request_error', {'detail': {'event': event, 'request': self}}));
            
                reject({'event': event, 'request': self});
            };

            xhr.onreadystatechange = function()
            {
                if (xhr.readyState == 4) {
                    var response = new Ugosansh.Autocomplete.Response(
                        xhr.responseText ? xhr.responseText : xhr.responseXML,
                        xhr.responseURL,
                        xhr.status,
                        xhr.statusText,
                        xhr.getResponseHeader('Content-Type')
                    );

                    document.dispatchEvent(new CustomEvent('xhr_request_end', {'detail': response}));

                    resolve(response);
                }
            };

            xhr.open(method, url, true);

            self.headers.forEach(function(value, name) {
                xhr.setRequestHeader(name, value);
            });

            if (headers) {
                for (var i in headers) {
                    if (i == 'Content-Type') {
                        contentType = headers[i];
                    }

                    xhr.setRequestHeader(i, headers[i]);
                }
            }

            if (['POST', 'PUT', 'PATCH'].indexOf(method) > -1) {
                if (body) {
                    var data = '';

                    if (typeof body == "object") {
                        if (body.constructor.name != 'FormData') {
                            if (contentType == 'application/json') {
                                data = JSON.stringify(body);
                            } else {
                                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                                data = self.serializeFormData(body);
                                data = data.substring(0, data.length - 1);
                            }

                            body = data;
                        }
                    }
                }
            }

            xhr.send(body);
        });

        return promise;
    };

    Ugosansh.Autocomplete.Request.prototype.serializeFormData = function(data, key)
    {
        var response = '';

        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                if (typeof data[i] == "object") {
                    if (key) {
                        response += this.serializeFormData(data[i], key +'['+ i +']');
                    } else {
                        response += this.serializeFormData(data[i], i);
                    }
                } else {
                    if (key) {
                        response += key +'['+ i +']='+ encodeURIComponent(data[i]) +'&';
                    } else {
                        response += i +'='+ encodeURIComponent(data[i]) +'&';
                    }
                }
            }
        }

        return response;
    };

    Ugosansh.Autocomplete.Request.prototype.get = function(url, headers)
    {
        return this.send('GET', url, headers);
    };

    Ugosansh.Autocomplete.Request.prototype.post = function(url, body, headers)
    {
        return this.send('POST', url, headers, body);
    };

    Ugosansh.Autocomplete.Request.prototype.put = function(url, body, headers)
    {
        return this.send('PUT', url, headers, body);
    };

    Ugosansh.Autocomplete.Request.prototype.patch = function(url, body, headers)
    {
        return this.send('PATCH', url, headers, body);
    };

    Ugosansh.Autocomplete.Request.prototype.delete = function(url, body, headers)
    {
        return this.send('DELETE', url, headers, body);
    };

    Ugosansh.Autocomplete.Request.prototype.head = function(url, body, headers)
    {
        return this.send('HEAD', url, headers, body);
    };

    Ugosansh.Autocomplete.Request.prototype.options = function(url, body, headers)
    {
        return this.send('OPTIONS', url, headers, body);
    };


    /**
     * Ugosansh.Autocomplete.Response
     */
    Ugosansh.Autocomplete.Response = function(content, request, status, statusText, contentType)
    {
        this.content     = content || '';
        this.request     = request || null;
        this.status      = status || 200;
        this.statusText  = statusText || 'Ok';
        this.contentType = contentType || 'text/plain';
    };

    Ugosansh.Autocomplete.Response.prototype.getRequest = function()
    {
        return this.request;
    };

    Ugosansh.Autocomplete.Response.prototype.text = function()
    {
        return this.content;
    };

    Ugosansh.Autocomplete.Response.prototype.json = function()
    {
        return JSON.parse(this.content);
    };

    Ugosansh.Autocomplete.Response.prototype.getStatus = function()
    {
        return this.status;
    };

    Ugosansh.Autocomplete.Response.prototype.getStatusText = function()
    {
        return this.statusText;
    };

    Ugosansh.Autocomplete.Response.prototype.getContentType = function()
    {
        return this.contentType;
    };

    Ugosansh.Autocomplete.Response.prototype.hasError = function()
    {
        return ((this.status < 200) || (this.status >= 400)) ? true : false;
    };

})();

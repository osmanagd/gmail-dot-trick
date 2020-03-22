(function(global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.FileSaver = mod.exports;
    }
})(this, function(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    }); /*!@source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js*/
    var saveAs = exports.saveAs = saveAs || function(view) {
        "use strict";
        if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
            return;
        }
        var doc = view.document,
            get_URL = function get_URL() {
                return view.URL || view.webkitURL || view;
            },
            save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
            can_use_save_link = "download" in save_link,
            click = function click(node) {
                var event = new MouseEvent("click");
                node.dispatchEvent(event);
            },
            is_safari = /constructor/i.test(view.HTMLElement) || view.safari,
            is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent),
            setImmediate = view.setImmediate || view.setTimeout,
            throw_outside = function throw_outside(ex) {
                setImmediate(function() {
                    throw ex;
                }, 0);
            },
            force_saveable_type = "application/octet-stream",
            arbitrary_revoke_timeout = 1000 * 40,
            revoke = function revoke(file) {
                var revoker = function revoker() {
                    if (typeof file === "string") {
                        get_URL().revokeObjectURL(file);
                    } else {
                        file.remove();
                    }
                };
                setTimeout(revoker, arbitrary_revoke_timeout);
            },
            dispatch = function dispatch(filesaver, event_types, event) {
                event_types = [].concat(event_types);
                var i = event_types.length;
                while (i--) {
                    var listener = filesaver["on" + event_types[i]];
                    if (typeof listener === "function") {
                        try {
                            listener.call(filesaver, event || filesaver);
                        } catch (ex) {
                            throw_outside(ex);
                        }
                    }
                }
            },
            auto_bom = function auto_bom(blob) {
                if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                    return new Blob([String.fromCharCode(0xFEFF), blob], {
                        type: blob.type
                    });
                }
                return blob;
            },
            FileSaver = function FileSaver(blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                var filesaver = this,
                    type = blob.type,
                    force = type === force_saveable_type,
                    object_url, dispatch_all = function dispatch_all() {
                        dispatch(filesaver, "writestart progress write writeend".split(" "));
                    },
                    fs_error = function fs_error() {
                        if ((is_chrome_ios || force && is_safari) && view.FileReader) {
                            var reader = new FileReader();
                            reader.onloadend = function() {
                                var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                                var popup = view.open(url, '_blank');
                                if (!popup) view.location.href = url;
                                url = undefined;
                                filesaver.readyState = filesaver.DONE;
                                dispatch_all();
                            };
                            reader.readAsDataURL(blob);
                            filesaver.readyState = filesaver.INIT;
                            return;
                        }
                        if (!object_url) {
                            object_url = get_URL().createObjectURL(blob);
                        }
                        if (force) {
                            view.location.href = object_url;
                        } else {
                            var opened = view.open(object_url, "_blank");
                            if (!opened) {
                                view.location.href = object_url;
                            }
                        }
                        filesaver.readyState = filesaver.DONE;
                        dispatch_all();
                        revoke(object_url);
                    };
                filesaver.readyState = filesaver.INIT;
                if (can_use_save_link) {
                    object_url = get_URL().createObjectURL(blob);
                    setImmediate(function() {
                        save_link.href = object_url;
                        save_link.download = name;
                        click(save_link);
                        dispatch_all();
                        revoke(object_url);
                        filesaver.readyState = filesaver.DONE;
                    }, 0);
                    return;
                }
                fs_error();
            },
            FS_proto = FileSaver.prototype,
            saveAs = function saveAs(blob, name, no_auto_bom) {
                return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
            };
        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
            return function(blob, name, no_auto_bom) {
                name = name || blob.name || "download";
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                return navigator.msSaveOrOpenBlob(blob, name);
            };
        }
        FS_proto.abort = function() {};
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;
        FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
        return saveAs;
    }(typeof self !== "undefined" && self || typeof window !== "undefined" && window || undefined);
});
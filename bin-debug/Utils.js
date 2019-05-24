var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var Utils = (function () {
    function Utils() {
    }
    Utils.isNull = function (obj) {
        return obj === null || obj === undefined;
    };
    return Utils;
}());
__reflect(Utils.prototype, "Utils");

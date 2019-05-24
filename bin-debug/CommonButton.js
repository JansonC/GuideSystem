var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = this && this.__extends || function __extends(t, e) { 
 function r() { 
 this.constructor = t;
}
for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
r.prototype = e.prototype, t.prototype = new r();
};
var CommonButton = (function (_super) {
    __extends(CommonButton, _super);
    function CommonButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CommonButton.prototype.setObjName = function (name) {
        this.objName = name;
    };
    CommonButton.prototype.getObjName = function () {
        return this.objName;
    };
    CommonButton.prototype.guideClear = function () {
    };
    CommonButton.prototype.guideProcess = function (data) {
        GuideManager.showBorderLight(this);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onNextStep, this);
    };
    CommonButton.prototype.onNextStep = function (e) {
        this.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onNextStep, this);
        GuideManager.doNextStep();
    };
    return CommonButton;
}(eui.Button));
__reflect(CommonButton.prototype, "CommonButton", ["IGuideComponent"]);

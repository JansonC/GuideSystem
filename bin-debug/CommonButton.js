var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CommonButton = /** @class */ (function (_super) {
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

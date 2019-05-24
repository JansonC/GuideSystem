var GuideStepData = /** @class */ (function () {
    function GuideStepData(objName, step, subStep) {
        this.objName = objName;
        this.step = step;
        this.subStep = subStep;
    }
    GuideStepData.prototype.getObjName = function () {
        return this.objName;
    };
    GuideStepData.prototype.getStep = function () {
        return this.step;
    };
    GuideStepData.prototype.getSubStep = function () {
        return this.subStep;
    };
    return GuideStepData;
}());
/**
 * 新手引导管理器
 * 请确保只有需要进入新手引导时才调用其setUp方法。
 */
var GuideManager = /** @class */ (function () {
    function GuideManager() {
    }
    /**
     * 注册要执行新手引导的界面元素
     * @param {IGuideComponent} obj
     */
    GuideManager.register = function (obj) {
        if (!obj) {
            return;
        }
        var name = obj.getObjName();
        if (!DMUtils.isNull(this.componentMap[name])) {
            return;
        }
        this.componentMap[name] = obj;
        // 注册的时候若是发现新手引导已经启动
        // 则搜索当前注册对象是否是新手引导的其中一个步骤
        // 若是, 则加入到引导队列中
        if (!this.isSetUp) {
            return;
        }
        var index = this.stepArray.indexOf(name);
        while (index >= 0) {
            this.guideQueue[index] = obj;
            // 有时候, 两个相邻步骤间会存在时间差
            // 如步骤1执行完毕后调用doNextStep发现步骤2尚未注册
            // 此时会导致GuideManager暂停运作
            // 那么就等待步骤2在注册时重新启动
            if (this.nextStep === index) {
                this.doNextStep(index);
            }
            index = this.stepArray.indexOf(name, index + 1);
        }
    };
    /**
     * 启动新手引导
     * @param {Array<GuideStepData>} config
     * @param {egret.Stage} stage
     * @param {Function} stepFinishCb
     * @param {Function} guideFinishCb
     */
    GuideManager.setUp = function (config, stage, stepFinishCb, guideFinishCb) {
        if (this.isSetUp) {
            return;
        }
        this.isSetUp = true;
        stage && (this.stage = stage);
        stepFinishCb && (this.stepFinishCb = stepFinishCb);
        guideFinishCb && (this.guideFinishCb = guideFinishCb);
        this.stepArray = [];
        this.dataArray = [];
        this.guideQueue = [];
        this.finishList = {};
        for (var i in config) {
            var item = config[i];
            var objName = item.getObjName();
            this.stepArray.push(objName);
            this.dataArray.push(item);
            var component = this.componentMap[objName];
            this.guideQueue.push(component);
        }
    };
    /**
     * 卸载新手引导
     */
    GuideManager.uninstall = function () {
        if (!this.isSetUp) {
            return;
        }
        this.isSetUp = false;
        if (this.curStep >= 0) {
            var component = this.guideQueue[this.curStep];
            this.doClear(component);
        }
        this.guideQueue = null;
        this.curStep = -1;
    };
    /**
     * 开始新手引导
     * @param {number} from
     */
    GuideManager.start = function (from) {
        if (from === void 0) { from = 0; }
        this.doNextStep(from);
    };
    /**
     * 执行下一步引导
     * 若值为-1, 则走到当前步骤的下一步
     * 若将跳转到的步骤不存在, 则结束新手引导
     * @param {number} step 跳到指定的步骤
     */
    GuideManager.doNextStep = function (step) {
        if (step === void 0) { step = -1; }
        // 若在暂停时调用nextStep, 则自动执行resume方法继续播放新手引导
        if (this.paused) {
            this.resume();
            return;
        }
        this.nextStep = step < 0 ? this.curStep + 1 : step;
        // 若该方法是由start方法调用, 此时curStep为-1, 不需要让上一步引导完成
        if (this.nextStep > 0 && this.curStep >= 0) {
            this.markFinish(this.curStep);
        }
        if (this.nextStep < this.guideQueue.length && this.guideQueue[this.nextStep]) {
            var data = this.dataArray[this.nextStep];
            var component = this.guideQueue[this.nextStep];
            component.guideProcess(data);
            this.curStep = this.nextStep;
        }
        else {
            // 若无法执行欲跳转到的步骤, 则不改变curStep
            if (this.nextStep === this.stepArray.length) {
                // 播放结束
                this.guideFinishCb && this.guideFinishCb();
                this.uninstall();
            }
        }
    };
    /**
     * 暂停引导播放
     */
    GuideManager.pause = function () {
        if (this.paused) {
            return;
        }
        this.paused = true;
    };
    /**
     * 继续引导播放
     */
    GuideManager.resume = function () {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.guideQueue[this.nextStep].guideProcess(this.dataArray[this.nextStep]);
        this.curStep = this.nextStep;
    };
    /**
     * 显示全屏遮罩
     * @param {egret.DisplayObjectContainer} obj
     * @param {number} maskAlpha
     * @param {number} maskColor
     * @param {egret.DisplayObjectContainer} parent
     */
    GuideManager.showScreenMask = function (obj, parent, maskColor, maskAlpha) {
        if (DMUtils.isNull(parent)) {
            parent = this.stage;
            if (DMUtils.isNull(parent)) {
                return;
            }
        }
        var w = parent === this.stage ? this.stage.width : parent.width;
        var h = parent === this.stage ? this.stage.height : parent.height;
        if (DMUtils.isNull(this.screenMask)) {
            if (DMUtils.isNull(maskColor)) {
                maskColor = 0x000000;
            }
            if (DMUtils.isNull(maskAlpha)) {
                maskAlpha = 0.4;
            }
            var container = new egret.DisplayObjectContainer();
            var bg = new egret.Sprite();
            bg.graphics.clear();
            bg.graphics.beginFill(maskColor, maskAlpha);
            bg.graphics.drawRect(0, 0, w, h);
            bg.graphics.endFill();
            container.addChild(bg);
            var rec = obj.getTransformedBounds(obj.parent);
            var dp = new egret.Sprite();
            dp.blendMode = egret.BlendMode.ERASE;
            dp.graphics.beginFill(0xff0000);
            dp.graphics.drawRect(rec.x, rec.y, rec.width, rec.height);
            dp.graphics.endFill();
            container.addChild(dp);
            var renderTexture = new egret.RenderTexture();
            renderTexture.drawToTexture(container);
            var mask = new egret.Bitmap(renderTexture);
            mask.touchEnabled = true; //允许点击
            mask.pixelHitTest = true; //镂空区域不响应点击，这样可以穿透点击到下面的背景
            mask.addEventListener(egret.TouchEvent.TOUCH_TAP, function () {
                console.log("click screen mask");
            }, this);
            this.screenMask = mask;
        }
        if (!parent.contains(this.screenMask)) {
            parent.addChild(this.screenMask);
        }
    };
    /**
     * 隐藏全屏遮罩
     */
    GuideManager.hideScreenMask = function () {
        var screenMask = this.screenMask;
        if (!DMUtils.isNull(screenMask) && !DMUtils.isNull(screenMask.parent)) {
            if (screenMask.parent.getChildIndex(screenMask) >= 0) {
                screenMask.parent.removeChild(screenMask);
            }
            this.screenMask = null;
        }
    };
    /**
     * 显示高亮边框
     * @param {egret.DisplayObjectContainer} obj
     * @param {egret.DisplayObjectContainer} parent
     */
    GuideManager.showBorderLight = function (obj, parent) {
        if (DMUtils.isNull(parent)) {
            parent = this.stage;
            if (DMUtils.isNull(parent)) {
                return;
            }
        }
        if (DMUtils.isNull(this.borderLight)) {
            this.borderLight = new egret.Shape();
            this.borderLight.filters = [new egret.GlowFilter(0xff911b, 1, 8, 8, 5)];
        }
        var rec = obj.getTransformedBounds(obj.parent);
        var borderLight = this.borderLight;
        borderLight.width = rec.width + 4;
        borderLight.height = rec.height + 4;
        borderLight.x = rec.x - 2;
        borderLight.y = rec.y - 2;
        var filter = borderLight.filters[0];
        if (!DMUtils.isNull(filter)) {
            egret.Tween.get(filter, { loop: true }).to({ alpha: 1 }, 700).to({ alpha: 0.3 }, 700).to({ alpha: 1 }, 700);
        }
        var graphics = this.borderLight.graphics;
        graphics.clear();
        graphics.lineStyle(2, 0xffff00);
        graphics.drawRoundRect(0, 0, borderLight.width, borderLight.height, 4, 4);
        if (!parent.contains(borderLight)) {
            parent.addChild(borderLight);
        }
    };
    /**
     * 隐藏边框
     *
     */
    GuideManager.hideBorder = function () {
        var borderLight = this.borderLight;
        if (!DMUtils.isNull(borderLight) && !DMUtils.isNull(borderLight.parent)) {
            var filter = borderLight.filters[0];
            if (!DMUtils.isNull(filter)) {
                egret.Tween.removeTweens(filter);
            }
            if (borderLight.parent.getChildIndex(borderLight) >= 0) {
                borderLight.parent.removeChild(borderLight);
            }
            this.borderLight = null;
        }
    };
    /**
     * 清除引导
     * @param {IGuideComponent} step
     */
    GuideManager.doClear = function (step) {
        if (!DMUtils.isNull(step)) {
            step.guideClear();
        }
        this.hideBorder();
        this.hideScreenMask();
    };
    /**
     * 标记引导完成
     * @param {number} step
     */
    GuideManager.markFinish = function (step) {
        if (!DMUtils.isNull(this.finishList[step]) && this.finishList[step] === true) {
            return;
        }
        var obj = this.guideQueue[step];
        var data = this.dataArray[step];
        this.doClear(obj);
        this.stepFinishCb && this.stepFinishCb(data);
        this.finishList[step] = true;
    };
    // 是否开启
    GuideManager.isSetUp = false;
    // 界面元素注册表
    GuideManager.componentMap = {};
    // 当前执行的步骤索引
    GuideManager.curStep = -1;
    // 下一个将执行的步骤索引
    GuideManager.nextStep = 0;
    return GuideManager;
}());

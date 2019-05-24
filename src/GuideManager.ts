interface IGuideComponent {
    getObjName(): string;

    guideProcess(data?: GuideStepData): void;

    guideClear(): void;

    onNextStep(e: MouseEvent): void;
}

class GuideStepData {
    // 界面元素名字
    private readonly objName: string;

    // 引导步骤
    private readonly step: number;

    // 引导子步骤
    // 比如一个元素涉及多次点击引导, 但执行的功能逻辑不同
    private readonly subStep: number;

    constructor(objName: string, step: number, subStep: number) {
        this.objName = objName;
        this.step = step;
        this.subStep = subStep;
    }

    public getObjName(): string {
        return this.objName;
    }

    public getStep(): number {
        return this.step;
    }

    public getSubStep(): number {
        return this.subStep;
    }
}

/**
 * 新手引导管理器
 * 请确保只有需要进入新手引导时才调用其setUp方法。
 */
class GuideManager {
    // 是否开启
    private static isSetUp: boolean = false;

    // 指示符容器
    private static stage: egret.Stage;

    // 新手引导完成一个步骤之后回调
    private static stepFinishCb: Function;

    // 新手引导全部播放完成后回调
    private static guideFinishCb: Function;

    // 界面元素注册表
    private static componentMap: Object = {};

    // 记录新手引导具体步骤, 每一步元素的实例名
    private static stepArray: Array<string>;

    // 记录新手引导每步所包含数据的数组
    private static dataArray: Array<GuideStepData>;

    // 新手引导播放队列, 其中元素为每一步的实例
    private static guideQueue: Array<IGuideComponent>;

    // 完成步骤列表, key: 步骤序号, value: true | false
    private static finishList: Object;

    // 当前执行的步骤索引
    private static curStep: number = -1;

    // 下一个将执行的步骤索引
    private static nextStep: number = 0;

    // 是否暂停
    private static paused: boolean;

    // 界面遮罩对象
    private static screenMask: egret.Bitmap;

    // 界面高光边框对象
    private static borderLight: egret.Shape;

    /**
     * 注册要执行新手引导的界面元素
     * @param {IGuideComponent} obj
     */
    public static register(obj: IGuideComponent): void {
        if (!obj) {
            return;
        }
        let name: string = obj.getObjName();
        if (!Utils.isNull(this.componentMap[name])) {
            return;
        }
        this.componentMap[name] = obj;

        // 注册的时候若是发现新手引导已经启动
        // 则搜索当前注册对象是否是新手引导的其中一个步骤
        // 若是, 则加入到引导队列中
        if (!this.isSetUp) {
            return;
        }
        let index: number = this.stepArray.indexOf(name);
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
    }

    /**
     * 启动新手引导
     * @param {Array<GuideStepData>} config
     * @param {egret.Stage} stage
     * @param {Function} stepFinishCb
     * @param {Function} guideFinishCb
     */
    public static setUp(config: Array<GuideStepData>, stage?: egret.Stage, stepFinishCb?: Function, guideFinishCb?: Function): void {
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

        for (let i in config) {
            let item = config[i];
            let objName = item.getObjName();
            this.stepArray.push(objName);
            this.dataArray.push(item);
            let component: IGuideComponent = this.componentMap[objName];
            this.guideQueue.push(component);
        }
    }

    /**
     * 卸载新手引导
     */
    public static uninstall(): void {
        if (!this.isSetUp) {
            return;
        }
        this.isSetUp = false;
        if (this.curStep >= 0) {
            let component: IGuideComponent = this.guideQueue[this.curStep];
            this.doClear(component);
        }
        this.guideQueue = null;
        this.curStep = -1;
    }

    /**
     * 开始新手引导
     * @param {number} from
     */
    public static start(from: number = 0): void {
        this.doNextStep(from);
    }

    /**
     * 执行下一步引导
     * 若值为-1, 则走到当前步骤的下一步
     * 若将跳转到的步骤不存在, 则结束新手引导
     * @param {number} step 跳到指定的步骤
     */
    public static doNextStep(step: number = -1): void {
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
            let data: GuideStepData = this.dataArray[this.nextStep];
            let component: IGuideComponent = this.guideQueue[this.nextStep];
            this.curStep = this.nextStep;
            setTimeout(function () {
                component.guideProcess(data);
            }, 50);
        } else {
            // 若无法执行欲跳转到的步骤, 则不改变curStep
            if (this.nextStep === this.stepArray.length) {
                // 播放结束
                this.guideFinishCb && this.guideFinishCb();
                this.uninstall();
            }
        }
    }

    /**
     * 暂停引导播放
     */
    public static pause(): void {
        if (this.paused) {
            return;
        }
        this.paused = true;
    }

    /**
     * 继续引导播放
     */
    public static resume(): void {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.guideQueue[this.nextStep].guideProcess(this.dataArray[this.nextStep]);
        this.curStep = this.nextStep;
    }

    /**
     * 显示全屏遮罩
     * @param {egret.DisplayObjectContainer} obj
     * @param {number} maskAlpha
     * @param {number} maskColor
     * @param {egret.DisplayObjectContainer} parent
     */
    public static showScreenMask(obj: egret.DisplayObjectContainer, parent?: egret.DisplayObjectContainer, maskColor?: number, maskAlpha?: number): void {
        if (Utils.isNull(parent)) {
            parent = this.stage;
            if (Utils.isNull(parent)) {
                return;
            }
        }
        let w: number = parent === this.stage ? this.stage.width : parent.width;
        let h: number = parent === this.stage ? this.stage.height : parent.height;
        if (Utils.isNull(this.screenMask)) {
            if (Utils.isNull(maskColor)) {
                maskColor = 0x000000;
            }
            if (Utils.isNull(maskAlpha)) {
                maskAlpha = 0.4;
            }

            let container: egret.DisplayObjectContainer = new egret.DisplayObjectContainer();

            let bg = new egret.Sprite();
            bg.graphics.clear();
            bg.graphics.beginFill(maskColor, maskAlpha);
            bg.graphics.drawRect(0, 0, w, h);
            bg.graphics.endFill();
            container.addChild(bg);

            let rec = obj.getTransformedBounds(obj.parent);

            let dp: egret.Sprite = new egret.Sprite();
            dp.blendMode = egret.BlendMode.ERASE;
            dp.graphics.beginFill(0xff0000);
            dp.graphics.drawRect(rec.x, rec.y, rec.width, rec.height);
            dp.graphics.endFill();
            container.addChild(dp);

            let renderTexture: egret.RenderTexture = new egret.RenderTexture();
            renderTexture.drawToTexture(container);

            let mask = new egret.Bitmap(renderTexture);
            mask.touchEnabled = true;  //允许点击
            mask.pixelHitTest = true;  //镂空区域不响应点击，这样可以穿透点击到下面的背景
            mask.addEventListener(egret.TouchEvent.TOUCH_TAP, function () {
                console.log("click screen mask");
            }, this);
            this.screenMask = mask;
        }
        if (!parent.contains(this.screenMask)) {
            parent.addChild(this.screenMask);
        }
    }

    /**
     * 隐藏全屏遮罩
     */
    public static hideScreenMask(): void {
        let screenMask = this.screenMask;
        if (!Utils.isNull(screenMask) && !Utils.isNull(screenMask.parent)) {
            if (screenMask.parent.getChildIndex(screenMask) >= 0) {
                screenMask.parent.removeChild(screenMask);
            }
            this.screenMask = null;
        }
    }

    /**
     * 显示高亮边框
     * @param {egret.DisplayObjectContainer} obj
     * @param {egret.DisplayObjectContainer} parent
     */
    public static showBorderLight(obj: egret.DisplayObjectContainer, parent?: egret.DisplayObjectContainer): void {
        if (Utils.isNull(parent)) {
            parent = this.stage;
            if (Utils.isNull(parent)) {
                return;
            }
        }

        if (Utils.isNull(this.borderLight)) {
            this.borderLight = new egret.Shape();
            this.borderLight.filters = [new egret.GlowFilter(0xff911b, 1, 8, 8, 5)];
        }

        let rec = obj.getTransformedBounds(obj.parent);
        let borderLight: egret.Shape = this.borderLight;
        borderLight.width = rec.width + 4;
        borderLight.height = rec.height + 4;
        borderLight.x = rec.x - 2;
        borderLight.y = rec.y - 2;

        let filter = borderLight.filters[0];
        if (!Utils.isNull(filter)) {
            egret.Tween.get(filter, {loop: true}).to({alpha: 1}, 700).to({alpha: 0.3}, 700).to({alpha: 1}, 700);
        }

        let graphics: egret.Graphics = this.borderLight.graphics;
        graphics.clear();
        graphics.lineStyle(2, 0xffff00);
        graphics.drawRoundRect(0, 0, borderLight.width, borderLight.height, 4, 4);

        if (!parent.contains(borderLight)) {
            parent.addChild(borderLight);
        }
    }

    /**
     * 隐藏边框
     *
     */
    public static hideBorder(): void {
        let borderLight = this.borderLight;
        if (!Utils.isNull(borderLight) && !Utils.isNull(borderLight.parent)) {
            let filter = borderLight.filters[0];
            if (!Utils.isNull(filter)) {
                egret.Tween.removeTweens(filter);
            }
            if (borderLight.parent.getChildIndex(borderLight) >= 0) {
                borderLight.parent.removeChild(borderLight);
            }
            this.borderLight = null;
        }
    }

    /**
     * 清除引导
     * @param {IGuideComponent} step
     */
    private static doClear(step: IGuideComponent): void {
        if (!Utils.isNull(step)) {
            step.guideClear();
        }
        this.hideBorder();
        this.hideScreenMask();
    }

    /**
     * 标记引导完成
     * @param {number} step
     */
    private static markFinish(step: number): void {
        if (!Utils.isNull(this.finishList[step]) && this.finishList[step] === true) {
            return;
        }
        let obj: IGuideComponent = this.guideQueue[step];
        let data: GuideStepData = this.dataArray[step];
        this.doClear(obj);
        this.stepFinishCb && this.stepFinishCb(data);
        this.finishList[step] = true;
    }
}
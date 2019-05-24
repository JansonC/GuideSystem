class Main extends eui.UILayer {
    private textField: egret.TextField;

    protected createChildren(): void {
        super.createChildren();
        //inject the custom material parser
        //注入自定义的素材解析器
        let assetAdapter = new AssetAdapter();
        egret.registerImplementation("eui.IAssetAdapter", assetAdapter);
        egret.registerImplementation("eui.IThemeAdapter", new ThemeAdapter());

        this.runGame().catch(e => {
            console.log(e);
        });
    }

    private async runGame() {
        await this.loadResource();
        this.createGameScene();
        let result = await RES.getResAsync("description_json");
        this.startAnimation(result);
        this.createGuideGameObj();
        this.startGuideSystem();
    }

    private async loadResource() {
        try {
            let loadingView = new LoadingUI();
            this.stage.addChild(loadingView);
            await RES.loadConfig("resource/default.res.json", "resource/");
            await this.loadTheme();
            await RES.loadGroup("preload", 0, loadingView);
            this.stage.removeChild(loadingView);
        } catch (e) {
            console.error(e);
        }
    }

    private loadTheme() {
        return new Promise((resolve, reject) => {
            // load skin theme configuration file, you can manually modify the file. And replace the default skin.
            //加载皮肤主题配置文件,可以手动修改这个文件。替换默认皮肤。
            let theme = new eui.Theme("resource/default.thm.json", this.stage);
            theme.addEventListener(eui.UIEvent.COMPLETE, () => {
                resolve();
            }, this);
        });
    }

    protected createGameScene(): void {
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;

        let sky = this.createBitmapByName("bg_jpg");
        sky.width = stageW;
        sky.height = stageH;
        this.addChild(sky);

        let topMask = new egret.Shape();
        topMask.graphics.beginFill(0x000000, 0.5);
        topMask.graphics.drawRect(0, 0, stageW, 172);
        topMask.graphics.endFill();
        topMask.y = 33;
        this.addChild(topMask);

        let icon: egret.Bitmap = this.createBitmapByName("egret_icon_png");
        icon.x = 26;
        icon.y = 33;
        this.addChild(icon);

        let line = new egret.Shape();
        line.x = 172;
        line.y = 61;
        line.graphics.lineStyle(2, 0xffffff);
        line.graphics.moveTo(0, 0);
        line.graphics.lineTo(0, 117);
        line.graphics.endFill();
        this.addChild(line);

        let colorLabel = new egret.TextField();
        colorLabel.textColor = 0xffffff;
        colorLabel.width = stageW - 172;
        colorLabel.textAlign = "center";
        colorLabel.text = "Hello Egret";
        colorLabel.size = 24;
        colorLabel.x = 172;
        colorLabel.y = 80;
        this.addChild(colorLabel);

        let textField = new egret.TextField();
        textField.alpha = 0;
        textField.width = stageW - 172;
        textField.textAlign = egret.HorizontalAlign.CENTER;
        textField.size = 24;
        textField.textColor = 0xffffff;
        textField.x = 172;
        textField.y = 135;
        this.addChild(textField);
        this.textField = textField;
    }

    private createBitmapByName(name: string): egret.Bitmap {
        let result = new egret.Bitmap();
        result.texture = RES.getRes(name);
        return result;
    }

    private startAnimation(result: Array<any>): void {
        let parser = new egret.HtmlTextParser();
        let textflowArr = result.map(text => parser.parse(text));
        let textfield = this.textField;
        let count = -1;
        let change = () => {
            count++;
            if (count >= textflowArr.length) {
                count = 0;
            }
            // 切换描述内容
            // Switch to described content
            textfield.textFlow = textflowArr[count];
            let tw = egret.Tween.get(textfield);
            tw.to({"alpha": 1}, 200);
            tw.wait(2000);
            tw.to({"alpha": 0}, 200);
            tw.call(change, this);
        };
        change();
    }

    private createGuideGameObj(): void {
        let self = this;

        let button1 = new CommonButton();
        button1.setObjName('button1');
        button1.label = "button1";
        button1.x = this.width * 0.3;
        button1.y = this.height * 0.48;
        this.addChild(button1);
        GuideManager.register(button1);

        let button2 = new CommonButton();
        button2.setObjName('button2');
        button2.label = "button2";
        button2.x = button1.x + button1.width + 30;
        button2.y = button1.y;
        this.addChild(button2);
        GuideManager.register(button2);

        let button3 = new CommonButton();
        button3.setObjName('button3');
        button3.label = "button3";
        button3.x = button1.x;
        button3.y = button1.y + button1.height + 20;
        this.addChild(button3);
        GuideManager.register(button3);

        let button4 = new CommonButton();
        button4.setObjName('button4');
        button4.label = "button4";
        button4.x = button2.x;
        button4.y = button3.y;
        button4.addEventListener(egret.TouchEvent.TOUCH_TAP, function () {
            self.buildNewButton();
        }, this);
        this.addChild(button4);
        GuideManager.register(button4);
    }

    private startGuideSystem(): void {
        let guide1 = new GuideStepData('button1', 0, 1);
        let guide2 = new GuideStepData('button2', 1, 1);
        let guide3 = new GuideStepData('button3', 2, 1);
        let guide4 = new GuideStepData('button4', 3, 1);
        let guide5 = new GuideStepData('button5', 4, 1);
        let guideConfig: GuideStepData[] = [guide1, guide2, guide3, guide4, guide5];
        GuideManager.setUp(guideConfig, this.stage, function (data: GuideStepData) {
            console.log("您已完成第" + data.getStep() + "步, 子步骤=" + data.getSubStep());
        }, function (data: GuideStepData) {
            console.log("恭喜您，您已完全部新手引导步骤！");
        });
        GuideManager.start();
    }

    private isBuildNewButton: boolean = false;

    private buildNewButton() {
        if (this.isBuildNewButton) {
            return;
        }

        let button5 = new CommonButton();
        button5.setObjName('button5');
        button5.label = "button5";
        button5.x = this.width / 2;
        button5.y = this.height * 0.6;
        this.addChild(button5);
        GuideManager.register(button5);
    }
}

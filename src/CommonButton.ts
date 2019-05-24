class CommonButton extends eui.Button implements IGuideComponent {
    private objName: string;

    public setObjName(name: string): void {
        this.objName = name;
    }

    public getObjName(): string {
        return this.objName;
    }

    public guideClear(): void {
    }

    public guideProcess(data?: GuideStepData): void {
        GuideManager.showBorderLight(this);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onNextStep, this);
    }

    public onNextStep(e: MouseEvent): void {
        this.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onNextStep, this);
        GuideManager.doNextStep();
    }
}
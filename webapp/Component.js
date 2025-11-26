sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/adlsa/vvip/off/assg/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/f/library"
], (UIComponent, models, JSONModel, fioriLibrary) => {
    "use strict";

    return UIComponent.extend("com.adlsa.vvip.off.assg.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
            this.getModel().setSizeLimit(999999);
            var oRouter, oModel, oRoutingModel;
            oModel = new JSONModel();
            oRoutingModel = new JSONModel();
            this.setModel(oModel, "layoutModel");
            oRouter = this.getRouter();
            oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
            oRouter.initialize();
            // set the device model
            this.setModel(models.createDeviceModel(), "device");
        },
        _onBeforeRouteMatched: function (oEvent) {
            var oModel = this.getModel("layoutModel"),
                sLayout = oEvent.getParameters().arguments.layout;
            if (!sLayout) {
                sLayout = fioriLibrary.LayoutType.OneColumn;
            }
            oModel.setProperty("/layout", sLayout);

        },
        getHelper: function () {
            var oFCL = this.getRootControl().byId("flexibleColumnLayout"),
                oParams = UriParameters.fromQuery(location.search),
                oSettings = {
                    defaultTwoColumnLayoutType: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
                    defaultThreeColumnLayoutType: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
                    mode: oParams.get("mode"),
                    maxColumnsCount: oParams.get("max")
                };

            return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
        },
        destroy: function () {

            UIComponent.prototype.destroy.apply(this, arguments);
        }
    });
});
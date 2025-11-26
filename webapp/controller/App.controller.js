sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("com.adlsa.vvip.off.assg.controller.App", {
        onInit: function () {
            this.oOwnerComponent = this.getOwnerComponent();
            this.getView().setModel(this.oOwnerComponent.getModel("layoutModel"), "layoutModel");
            this.oRouter = this.oOwnerComponent.getRouter();
            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
            this._setTitleDynamic();
        },
        _setTitleDynamic: function () {
			this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
				var sOfficialAssignmentType = window.location.hash.match(/#([^-\?]+)/)  ? window.location.hash.match(/#([^-\?]+)/) [1] : null;
				//sOfficialAssignmentType = "OfficialAssignmentApproved";
                this.getView().getModel("layoutModel").setProperty("/sOfficialAssignmentType", sOfficialAssignmentType);
                //this.getView().getModel("layoutModel").setProperty("/onBehalfEnable", false);
				switch (sOfficialAssignmentType) {
					case "OfficialAssignmentApproved": 
                        this.getView().getModel("layoutModel").setProperty("/IsRequest", true);
                         this.getView().getModel("layoutModel").setProperty("/IsAllowance", false);
                         
						oService.setTitle(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Request") + ' ' + this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Official_Assignment_approval"));
						break;
					case "OfficialAssignmentRequest":
                        this.getView().getModel("layoutModel").setProperty("/IsAllowance", true);
                        this.getView().getModel("layoutModel").setProperty("/IsRequest", false);
						oService.setTitle(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Request") + ' ' + this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Official_Assignment_Allowance"));
						break;					
				}

			}.bind(this),
				function (oError) {

				});
		},
        onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name"),
                oArguments = oEvent.getParameter("arguments");
            this.currentRouterName = sRouteName;
            this.currentGuid = oArguments;
            switch (sRouteName) {
                case "approver":
                    this.getView().getModel("layoutModel").setProperty("/layout", "MidColumnFullScreen");
                    this.getView().getModel("layoutModel").updateBindings();
                    this.getView().getModel("layoutModel").setProperty("/IsAppBusy", true);
                    this.oRouter.navTo(sRouteName, oArguments);
                    break;
            }
        },
        onStateChanged: function (oEvent) {
            var bIsNavigationArrow = oEvent.getParameter("isNaviagationArrow"),
                sLayout = oEvent.getParameter("layout");

            if (bIsNavigationArrow) {
                this.oRouter.navTo(this.currentRouterName, {
                    layout: sLayout,
                    guid: this.currentGuid
                }, true);
            }
        },
        onExit: function () {
            this.oRouter.detachRouteMatched(this.onRouteMatched, this);
        }
    });
});
sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Core",
    "sap/m/PDFViewer",
    "sap/m/library"
], function (Controller, JSONModel, Fragment, MessageBox, Device, Filter, FilterOperator, Core, PDFViewer, mobileLibrary) {
	"use strict";
	var URLHelper = mobileLibrary.URLHelper;
	return Controller.extend("com.adlsa.vvip.off.assg.controller.Approver", {
		onInit: function () {
			this._pdfViewer = new PDFViewer({
                    isTrustedSource: true
                });
                this.getView().addDependent(this._pdfViewer);
                this._mLoadFramentsSetting = {};
                this.oRouter = this.getOwnerComponent().getRouter();
                var oViewModel = this._setDetailView();
                this.getView().setModel(oViewModel, "detailView");
                this.oRouter.getRoute("approver").attachPatternMatched(this._onApproverSelected, this);
                var oMessageManager = Core.getMessageManager();
                oMessageManager.registerObject(this.getView(), true);
		},
		
		onExit: function () {
			this.oRouter.getRoute("approver").detachPatternMatched(this._onApproverSelected, this);
		},
            _onApproverSelected: function (oEvent) {
                
                
                this.getOwnerComponent().getModel("layoutModel").setProperty("/IsAppBusy", false);
                this.getOwnerComponent().getModel("layoutModel").updateBindings();
                var oArgment = oEvent.getParameter("arguments"),
                    detailView = this.getView().getModel("detailView");
                detailView.setProperty("/sInstance", oArgment.InstanceID);
                detailView.setProperty("/SAP__Origin", oArgment.SAP__Origin);
                detailView.setProperty("/contextPath", oArgment.contextPath);

                this._bindView(oEvent, detailView);
            },
			
            _bindView: function (oEvent, oViewModel) {
                var sPath = this.getView().getModel().createKey("/EmpRequestSet", {
                    WiId: oViewModel.getData().sInstance.replace(":", "")
                });
                oViewModel.setProperty("/busy", true);

                this.sContextBindElement = this.getView().getModel().hasPendingRequests();
                this.getView().bindElement({
                    path: sPath,
                    events: {
                        dataReceived: function (oResponse) {
                            this.getView().getModel("detailView").setProperty("/busy", false);
                           
                        }.bind(this)
                    }
                });
            },
        onURLPress: function (oEvent) {
                if (oEvent.preventDefault) {
                     oEvent.preventDefault(); 
                     }
                var oBindingContext = oEvent.getSource().getBindingContext().getObject();
                if (oBindingContext.Filename) {
                    var sPath = "/sap/opu/odata/sap/ZVVIP_OFFASSIGN_SRV" + oEvent.getSource().getBindingContext().getPath() + "/$value";
                    URLHelper.redirect(sPath, true);

                }

            },
		_handleError: function (oError) {
			this.getView().getModel("detailView").setProperty("/busy", false);
			var msg;
			this.sPartialMessage = "";
			if (oError.responseText.indexOf("<?xml") > -1) {
				msg = jQuery.parseXML(oError.responseText).getElementsByTagName("message").item(0).textContent;
			} else {
				var sLength = JSON.parse(oError.responseText).error.innererror.errordetails.length;
				if (sLength) {
					JSON.parse(oError.responseText).error.innererror.errordetails.forEach(function (oValue) {
						this.sPartialMessage = this.sPartialMessage + oValue.message + "\n";
					}.bind(this));
					msg = this.sPartialMessage;
				} else {
					msg = JSON.parse(oError.responseText).error.message.value
				}
			}
			MessageBox.error(msg);
		},
		_setDetailView: function () {
			return new JSONModel({
				busy: false,
				bTableSelection: false,
				oTableSelectionContext: {},
				onBehalfEnable: false,
				RequesterNumber:null,
				OnBehalfEmployeeNumber:null,

			});

		}
		
	});
});

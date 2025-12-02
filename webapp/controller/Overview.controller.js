sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Label",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/core/Core",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo, Core, MessageBox, Fragment) {
	"use strict";

	return Controller.extend("com.adlsa.vvip.off.assg.controller.Overview", {
		onInit: function () {
			
			this._mLoadFramentsSetting = {};
			this.oRouter = this.getOwnerComponent().getRouter();
			var oViewModel = this._setDetailView();
			this.getView().setModel(oViewModel, "detailView");
			this.oRouter.getRoute("RouteApp").attachPatternMatched(this._onOverviewPatterMatch, this);

			var oMessageManager = Core.getMessageManager();
			
            
                this._callUserInfo();
				
				
		},
		_onOverviewPatterMatch: function (oEvent) {		
			
			if(this.getOwnerComponent().getComponentData().startupParameters.OnBehalfEmployeeNumber){
				this.RequesterNumber = this.getOwnerComponent().getComponentData().startupParameters.RequesterNumber[0];
				this.OnBehalfEmployeeNumber = this.getOwnerComponent().getComponentData().startupParameters.OnBehalfEmployeeNumber[0];	
				
				var oLayoutModel = this.getOwnerComponent().getModel("layoutModel");
				oLayoutModel.setProperty("/onBehalfEnable", true);
				oLayoutModel.setProperty("/RequesterNumber", this.RequesterNumber);
				oLayoutModel.setProperty("/OnBehalfEmployeeNumber", this.OnBehalfEmployeeNumber);
				oLayoutModel.setProperty("/messageText", 
					this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("onBehalfActivatedText", [this.OnBehalfEmployeeNumber])
				);
				
				this._setTitleDynamic();
			}else{
				this.getOwnerComponent().getModel("layoutModel").setProperty("/onBehalfEnable", false);
				
			}
			if(!this.getOwnerComponent().getModel("layoutModel").getProperty("/sOfficialAssignmentType")){
					this._setTitleDynamic();
				}else{
					this._TableUpdate();		
				}	

			// if(!this.getView().getModel("layoutModel").getProperty("/onBehalfEnable")){

			// if(!this.getOwnerComponent().getModel("layoutModel").getProperty("/sOfficialAssignmentType")){
			// 		this._setTitleDynamic();
			// }else{
			// 	this._TableUpdate();		
			// }		
			
			// }			
		},
        _setTitleDynamic: function () {
			
			this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
				var sOfficialAssignmentType = window.location.hash.match(/#([^-\?]+)/)  ? window.location.hash.match(/#([^-\?]+)/) [1] : null;
				//sOfficialAssignmentType = "OfficialAssignmentApproved";
                this.getView().getModel("layoutModel").setProperty("/sOfficialAssignmentType", sOfficialAssignmentType);
                this.getView().getModel("layoutModel").setProperty("/onBehalfEnable", false);
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

				this._TableUpdate();	

			}.bind(this),
				function (oError) {

				});
		},
        onAfterRendering: function(oEvent){
			//this._onOverviewPatterMatch(oEvent);
			
		},
		_callUserInfo: function(){
			this.getOwnerComponent().getModel().read("/RequestSet",{
				success: function(oResponse){
					this.getView().getModel("detailView").setProperty("/busy", false);
					if(oResponse.results.length){
						this.getView().getModel("detailView").setProperty("/RequestSet", oResponse.results[0]);
					}
				}.bind(this),
				error: this._handleError.bind(this)
			})
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
        onCreatePressed: function(){
            this.oRouter.navTo("Create");
        },
		onExit: function () {
			this.oRouter.getRoute("RouteApp").detachPatternMatched(this._onOverviewPatterMatch, this);
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

		},
		_TableUpdate: function(){
			var aFilters = [];
			
			if(this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")){
				aFilters.push(new Filter("Pernr",FilterOperator.EQ, this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")))
			}
			if(this.getOwnerComponent().getModel("layoutModel").getProperty("/sOfficialAssignmentType")){}
			switch (this.getOwnerComponent().getModel("layoutModel").getProperty("/sOfficialAssignmentType")) {
					case "OfficialAssignmentApproved": 
						aFilters.push(new Filter("IsRequest", FilterOperator.EQ, true));
						 
						break;
					case "OfficialAssignmentRequest":
                        aFilters.push(new Filter("IsAllowance", FilterOperator.EQ, true));
						
						break;					
				}
			this.getView().getModel("detailView").setProperty("/busy",true);
			this.getView().byId("idOfficialAssignmentTable").getBinding("items").filter(aFilters).attachDataReceived(function(){
				if(this.getOwnerComponent().getComponentData().startupParameters.OnBehalfEmployeeNumber){
					this.getOwnerComponent().getModel("layoutModel").setProperty("/onBehalfEnable", true);
				}else{
					this.getOwnerComponent().getModel("layoutModel").setProperty("/onBehalfEnable", false);
				}
				this.getView().getModel("detailView").setProperty("/busy",false);
			}.bind(this));
		},
        _changeToOnBehalfService: function(oEvent){
			this.getView().getModel("detailView").setProperty("/busy",true);
			var oFilter = [];
			oFilter.push(new Filter("EmpPernr",FilterOperator.EQ, this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")))
			this.getView().byId("idOfficialAssignmentTable").getBinding("items").filter(oFilter).attachDataReceived(function(){
				this.getView().getModel("detailView").setProperty("/busy",false);
			}.bind(this));
		},
		onOfficialItemDeletePressed: function(oEvent){
			MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("DELETE_SUCCESFUL"),{
				onClose : function(oEvent){

				}
			});

			return;
			var oConext = oEvent.getSource().getBindingContext().getObject(),
				oModel = this.getView().getModel();
			
				oModel.remove(oEvent.getSource().getBindingContext().getPath(),{
					success: function(oEvent){
								MessageBox.success(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("DELETE_SUCCESFUL"),{
									onClose : function(){
										this._TableUpdate();
									}.bind(this)
								});
					}.bind(this),
					error: this._handleError.bind(this)
				})

		}
		
		
	});
});

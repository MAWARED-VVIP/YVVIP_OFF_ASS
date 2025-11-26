sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Label",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/core/Core",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/core/library"
], function (Controller, JSONModel, Label, Filter, FilterOperator, PersonalizableInfo, Core, MessageBox, Fragment, coreLibrary) {
	"use strict";
	var ValueState = coreLibrary.ValueState;
	return Controller.extend("com.adlsa.vvip.off.assg.controller.Create", {
		onInit: function () {
			this._mLoadFramentsSetting = {};
			this.oRouter = this.getOwnerComponent().getRouter();
			var oViewModel = this._setDetailView();
			this.getView().setModel(oViewModel, "detailView");
			this.oRouter.getRoute("Create").attachPatternMatched(this._onOverviewPatterMatch, this);

			var oMessageManager = Core.getMessageManager();


			this._callUserInfo();
		},

		handleCreateChange: function (oEvent) {
			var oDateTimePickerStart = this.byId("startDate"),
				oDateTimePickerEnd = this.byId("endDate");

			if (oEvent.getParameter("valid")) {
				this._validateDateTimePicker(oDateTimePickerStart, oDateTimePickerEnd, oEvent);
			} else {
				oEvent.getSource().setValueState(ValueState.Error);
			}
		},
		_validateDateTimePicker: function (oDateTimePickerStart, oDateTimePickerEnd, oEvent) {
			var oStartDate = oDateTimePickerStart.getDateValue(),
				oEndDate = oDateTimePickerEnd.getDateValue(),
				sValueStateText = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Start_Date_Before_EndDate");
			if (oStartDate && oEndDate) {
				var start = new Date(oStartDate.getFullYear(), oStartDate.getMonth(), oStartDate.getDate());
				var end = new Date(oEndDate.getFullYear(), oEndDate.getMonth(), oEndDate.getDate());
				if (end < start) {
					oEvent.getSource().setValue("");
					oDateTimePickerStart.setValueState(ValueState.Error);
					oDateTimePickerEnd.setValueState(ValueState.Error);
					oDateTimePickerStart.setValueStateText(sValueStateText);
					oDateTimePickerEnd.setValueStateText(sValueStateText);
				} else {
					oDateTimePickerStart.setValueState(ValueState.None);
					oDateTimePickerEnd.setValueState(ValueState.None);
					if (oStartDate && oEndDate) {
						this._callAllowanceValue(oStartDate, oEndDate);
					}

				}
			}

		},
		_callAllowanceValue: function (oStartDate, oEndDate) {
			var oFilters = [];
			oFilters.push(new Filter("Begda", FilterOperator.EQ, oStartDate));
			oFilters.push(new Filter("Endda", FilterOperator.EQ, oEndDate));
			if (this.getOwnerComponent().getModel("layoutModel").getProperty("/onBehalfEnable")) {
				oFilters.push(new Filter("Pernr", FilterOperator.EQ, this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")))
			}

			this.getView().getModel().read("/RequestSet", {
				filters: oFilters,
				success: function (oResponse) {

					this.getView().getModel("detailView").setProperty("/busy", false);
					if (oResponse.results.length) {
						this.getView().getModel("detailView").setProperty("/AllowanceValue", oResponse.results[0]);
					}
				}.bind(this),
				error: this._handleError.bind(this)
			})
		},
		_callUserInfo: function () {
			this.getOwnerComponent().getModel().read("/RequestSet", {
				success: function (oResponse) {
					this.getView().getModel("detailView").setProperty("/busy", false);
					if (oResponse.results.length) {
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
			try {

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

			} catch (error) {
				MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("ERROR"));
			}
		},
		onCreatePressed: function () {
			this.oRouter.navTo("Create");
		},
		onExit: function () {
			this.oRouter.getRoute("Create").detachPatternMatched(this._onOverviewPatterMatch, this);
		},
		_setDetailView: function () {
			return new JSONModel({
				busy: false,
				bTableSelection: false,
				oTableSelectionContext: {},
				onBehalfEnable: false,
				RequesterNumber: null,
				OnBehalfEmployeeNumber: null,
				IsMgrAppr: false,
				Begda: null,
				Endda: null,
				Comments: "",
				ReqAttachSet: [],
				AllowanceValue: {
					ReqDays: 0,
					AllowanceAmt: 0
				}

			});

		},
		_onOverviewPatterMatch: function (oEvent) {
			// this.getView().byId("idOverviewvvipOffAssingTable").getBinding("rows").refresh();
			this.getView().getModel("detailView").setProperty("/AllowanceValue/ReqDays", 0);
			this.getView().getModel("detailView").setProperty("/AllowanceValue/AllowanceAmt", 0);
			this.getView().byId("idAttachmentOffcialAssignment").removeAllIncompleteItems();
			this.onResetPressed();
			if (this.getOwnerComponent().getModel("layoutModel").getProperty("/onBehalfEnable")) {
				this._changeToOnBehalfService();
			}
		},
		onCalendarNavigate: function (oEvent) {
			oEvent.getSource()._oCalendar.setNonWorkingDays([5, 6]);
		},
		_changeToOnBehalfService: function (oEvent) {
			this.getView().getModel("detailView").setProperty("/busy", true);
			// var oFilter = [];
			// oFilter.push(new Filter("EmpPernr",FilterOperator.EQ, this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")))
			// this.getView().byId("idOfficialAssignmentTable").getBinding("items").filter(oFilter).attachDataReceived(function(){
			// 	this.getView().getModel("detailView").setProperty("/busy",false);
			// }.bind(this));
			// this.getView().byId("messageStripId1").setText(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("onBehalfActivatedText", this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")));		
			this.getView().getModel("detailView").setProperty("/messageText", this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("onBehalfActivatedText", this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber")));
		},
		onAfterAttachmentItemAdded: function (oEvent) {
			oEvent.getParameter("item").setUploadState(sap.m.UploadState.Complete);
			oEvent.getParameter("item").setVisibleEdit(false);
			var oFileData = oEvent.getParameter("item").getFileObject(),
				reader = new FileReader();


			reader.readAsDataURL(oFileData);
			reader.onloadend = function (oEvent) {
				var BASE64_MARKER = 'data:' + this[1].type + ';base64,',
					base64Index = oEvent.target.result.indexOf(BASE64_MARKER) + BASE64_MARKER.length,
					content = oEvent.target.result.substring(base64Index);
				var aAttachmentSet = this[0].getView().getModel("detailView").getProperty("/ReqAttachSet");
				aAttachmentSet.push({
					// Name: encodeURI(this[1].name),
					Filename: this[1].name,
					Mimetype: this[1].type,
					Afile: content
				});
				this[0].getView().getModel("detailView").updateBindings();

			}.bind([this, oFileData])
		},
		onAfterAttachmentItemRemoved: function (oEvent) {
			var iIndex = this.getView().getModel("detailView").getData().ReqAttachSet.findIndex(function (item) {
				// return item.Name === encodeURI(oEvent.getParameter("item").getFileName());
				return item.Name === oEvent.getParameter("item").getFileName();
			});
			var oAttachmenDataModel = this.getView().getModel("detailView").getData().ReqAttachSet;
			oAttachmenDataModel.splice(iIndex, 1);
			this.getView().getModel("detailView").getData().ReqAttachSet = oAttachmenDataModel;
			this.getView().getModel("detailView").updateBindings();
		},
		onResetPressed: function (oEvent) {
			this.getView().getModel("detailView").setProperty("/ReqAttachSet", []);
			this.getView().getModel("detailView").setProperty("/IsMgrAppr", false);
			this.getView().getModel("detailView").setProperty("/Begda", null);
			this.getView().getModel("detailView").setProperty("/Endda", null);
			this.getView().getModel("detailView").setProperty("/Comments", "");
			this.getView().getModel("detailView").setProperty("/AllowanceValue/ReqDays", 0);
			this.getView().getModel("detailView").setProperty("/AllowanceValue/AllowanceAmt", 0);
			this.getView().byId("idAttachmentOffcialAssignment").removeAllIncompleteItems();
		},
		onCreatePress: function (oEvent) {
			this.getView().getModel("detailView").setProperty("/busy", false);
			var oEntry = {};
			if (this.getOwnerComponent().getModel("layoutModel").getProperty("/onBehalfEnable")) {
				oEntry.ReqAttachSet = this.getView().getModel("detailView").getData().ReqAttachSet;
				oEntry.IsMgrAppr = this.getView().getModel("detailView").getData().IsMgrAppr;
				oEntry.Begda = this.getView().getModel("detailView").getData().Begda;
				oEntry.Endda = this.getView().getModel("detailView").getData().Endda;
				oEntry.Comments = this.getView().getModel("detailView").getData().Comments;
				oEntry.Pernr = this.getOwnerComponent().getModel("layoutModel").getProperty("/OnBehalfEmployeeNumber");
				oEntry.IsRequest = this.getOwnerComponent().getModel("layoutModel").getData().IsRequest;
				oEntry.IsAllowance = this.getOwnerComponent().getModel("layoutModel").getData().IsAllowance;
				oEntry.AllowanceAmt = this.getView().getModel("detailView").getData().AllowanceValue.AllowanceAmt;
				oEntry.Onbehalf = true;
			} else {
				oEntry.ReqAttachSet = this.getView().getModel("detailView").getData().ReqAttachSet;
				oEntry.IsMgrAppr = this.getView().getModel("detailView").getData().IsMgrAppr;
				oEntry.Begda = this.getView().getModel("detailView").getData().Begda;
				oEntry.Endda = this.getView().getModel("detailView").getData().Endda;
				oEntry.Comments = this.getView().getModel("detailView").getData().Comments;
				oEntry.Pernr = this.getView().getModel("detailView").getData().RequestSet.Pernr;
				oEntry.IsRequest = this.getOwnerComponent().getModel("layoutModel").getData().IsRequest;
				oEntry.IsAllowance = this.getOwnerComponent().getModel("layoutModel").getData().IsAllowance;
				oEntry.AllowanceAmt = this.getView().getModel("detailView").getData().AllowanceValue.AllowanceAmt;
				oEntry.Onbehalf = false;
			}


			if (oEntry.ReqAttachSet.length > 0 && oEntry.Begda && oEntry.Endda) {
				this.getView().getModel().create("/RequestSet", oEntry, {
					success: function (oResponse) {
						this.getView().getModel("detailView").setProperty("/busy", false);
						MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("SUCCESS_MSG"), {
							onClose: function (oAction) {
								this.oRouter.navTo("RouteApp");
							}.bind(this)
						});
					}.bind(this),
					error: this._handleError.bind(this)
				});
			} else {
				if (oEntry.ReqAttachSet.length <= 0) {
					MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("MANDATORY_ATTACHMANE"));
					return;
				}

				if (!oEntry.Begda || !oEntry.Endda) {
					MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("MANDATORY_DATES"));
					return;
				}

			}


		}

	});
});

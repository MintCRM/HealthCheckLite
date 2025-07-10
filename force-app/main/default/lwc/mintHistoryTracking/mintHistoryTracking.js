import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord, deleteRecord } from 'lightning/uiRecordApi';
import historyModal from 'c/mintHistoryTrackingModal';
import TRACKING_OBJECT from "@salesforce/schema/Mint_Tracked_Field__c";
import OBJECTAPI_FIELD from "@salesforce/schema/Mint_Tracked_Field__c.Object_API_Name__c";
import OBJECTNAME_FIELD from "@salesforce/schema/Mint_Tracked_Field__c.Object_Name__c";
import FIELDAPI_FIELD from "@salesforce/schema/Mint_Tracked_Field__c.Field_API_Name__c";
import FIELDNAME_FIELD from "@salesforce/schema/Mint_Tracked_Field__c.Field_Name__c";
import isCurrentUserSysAdmin from '@salesforce/apex/MintHistoryTrackingController.isCurrentUserSysAdmin';
import getSObjects from '@salesforce/apex/MintHistoryTrackingController.getSObjects';
import getObjectFields from '@salesforce/apex/MintHistoryTrackingController.getObjectFields';
import getExistingTrackedFields from '@salesforce/apex/MintHistoryTrackingController.getExistingTrackedFields';
import getExistingTrackingObjects from '@salesforce/apex/MintHistoryTrackingController.getExistingTrackingObjects';
import deleteTrackingRecord from '@salesforce/apex/MintHistoryTrackingController.deleteTrackingRecord';
import getAutoArchiveDefaultRecord from '@salesforce/apex/MintHistoryTrackingController.getAutoArchiveDefaultRecord';
import createAutoArchiveDefaultRecord from '@salesforce/apex/MintHistoryTrackingController.createAutoArchiveDefaultRecord';
import updateAutoArchiveDefaultRecord from '@salesforce/apex/MintHistoryTrackingController.updateAutoArchiveDefaultRecord';
import checkTriggerIsPresent from '@salesforce/apex/MintHistoryTrackingController.checkTriggerIsPresent';
import createObjectTrigger from '@salesforce/apex/MintHistoryTrackingController.createObjectTrigger';
import deselectAllTrackedFields from '@salesforce/apex/MintHistoryTrackingController.deselectAllTrackedFields';
import getLogRecord from '@salesforce/apex/MintHistoryTrackingController.getLogRecord';

export default class MintHistoryTracking extends LightningElement {
    //#region VARIABLES
    isLoading = false;
    @track objectPicklistOptions = [];
    @track objectFieldOptions = [];
    @track currentObjectExistingTrackedFields = [];
    @track currentObjectExistingUnavailableTrackedFields = [];
    @track existingTrackingObjects = [];
    @track autoArchiveDefaultRecord = [];
    @track deploymentResult;
    disableAdminFeatures = true;
    isTriggerPresent = true;
    archivePeriod = null;
    autoArchiveActive = null;
    trackingActive = null;
    trackingStatus;
    trackingStatusStyle;
    trackingLimit;
    archiveScheduleChanged = false;
    jobId;
    searchResults;
    selectedSearchObject;
    currentSelectedObject = null;
    logRecordId;
    pollInterval;
    //#endregion


    //#region CALLBACKS & WIRES
    connectedCallback() {
        this.isLoading = true;
        this.getListOfObjects();
        this.getAutoArchiveDefaultRecord();
    }

    // Check if Current User is Sys Admin
    @wire(isCurrentUserSysAdmin)
    wiredSysAdmin({ error, data }) {
        if (data) {
            this.disableAdminFeatures = !data;
            console.log('Current User is Sys Admin: ' + data);
            console.log('this.disableAdminFeatures: ' + this.disableAdminFeatures);
        }
    }
    //#endregion

    //#region CORE FUNCTIONS
    // Connected Callback Get list of Objects for Searching / Selection / Tracking
    getListOfObjects(){
        this.objectPicklistOptions = [];
        getSObjects()
        .then(result => {
            for(var key in result){
                this.objectPicklistOptions.push({label:result[key], value:key});
            }
        })
        .catch(error => {
            this.isLoading = false;
        })
        .finally(error => {
            this.getExistingTrackingObjects();
        });
    }

    getExistingTrackingObjects(){
        this.existingTrackingObjects = [];
        getExistingTrackingObjects()
        .then(result => {
            // Create a map to store objectOccurrences of each Object_API_Name__c
            const objectOccurrences = new Map();

            result.forEach(record => {
                // Strip namespace from keys
                // const cleanRecord = this.stripNamespaceKeys(record);
                const objectName = record.Object_API_Name__c;
                if (objectOccurrences.has(objectName)) {
                    objectOccurrences.get(objectName).count += 1;
                } else {
                    objectOccurrences.set(objectName, {
                        count: 1,
                        fieldAPIName: record.Field_API_Name__c,
                        fieldLabel: record.Field_Name__c,
                        objectLabel: record.Object_Name__c,
                    });
                }
            });

            // Transform the map into an array of objects
            this.existingTrackingObjects = Array.from(objectOccurrences, ([key, value]) => ({
                objectName: key,
                count: value.count,
                fieldAPIName: value.fieldAPIName,
                fieldLabel: value.fieldLabel,
                objectLabel: value.objectLabel,
            }));
            
        })
        .catch(error => {
            // this.error = error;
            this.isLoading = false;
        });
    }

    //* SEARCH METHODS *//

    // OnChange Search Method
    search(event) {
        const searchTerm = event.detail.value.toLowerCase();
        if(searchTerm.length > 0){
            const result = this.objectPicklistOptions.filter((objectPicklistOptions) =>
                objectPicklistOptions.label.toLowerCase().includes(searchTerm)
            );
            this.searchResults = result;
        } else {
            this.clearAllObjectParams();
        }
    }

    clearAllObjectParams(){
        this.objectFieldOptions = [];
        this.selectedSearchObject = null;
        this.currentSelectedObject = null;
        this.isTriggerPresent = true;
        this.currentObjectExistingTrackedFields = [];
        this.currentObjectExistingUnavailableTrackedFields = [];
        this.clearSearchResults(); 
    }

    // Select Item from Object Search
    selectSearchResult(event) {
        this.isLoading = true;
        this.currentSelectedObject = event.currentTarget.dataset.value;
        this.selectedSearchObject = this.objectPicklistOptions.find(
            (pickListOption) => pickListOption.value === this.currentSelectedObject
        );
        this.clearSearchResults();   

        // Check if Trigger for Selected Object is Present
        this.checkTriggerIsPresent();
    }
    // Clear Search Results
    clearSearchResults() {
        this.searchResults = null;
    }

    
    //* TRIGGER MANAGEMENT METHODS *//
    
    checkTriggerIsPresent(){
        checkTriggerIsPresent({
            objectAPI: this.currentSelectedObject
        })
        .then(result => {
            if (result == true) {
                // Object Trigger found, get Object Fields
                this.isTriggerPresent = true;
                this.getExistingTrackedFields();
            } else {
                this.isTriggerPresent = false;
                this.isLoading = false;
                this.showToast(
                    'Object Trigger Missing',
                    'Use the button below to deploy the Trigger for this Object',
                    'info',
                    'dismissible'
                );
            }
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error checking Trigger Status!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    createObjectTrigger(){
        this.isLoading = true;
        console.log('Creating Trigger for Object: ' + this.currentSelectedObject);
        createObjectTrigger({
            objectAPI: this.currentSelectedObject
        })
        .then(logId => {
            if(logId) {
                this.logRecordId = logId;
                this.pollForProgress();
            }
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error creating Trigger!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    pollForProgress() {
        console.log('this.logRecordId: ' + this.logRecordId);
        this.pollInterval = setInterval(() => {
            getLogRecord({ logRecordId: this.logRecordId })
                .then(logRec => {
                    if (!logRec) {
                        clearInterval(this.pollInterval);
                        this.isLoading = false;
                        // Optionally show a toast or just silently stop polling
                        return;
                    }
                    
                    // const cleanRecord = this.stripNamespaceKeys(logRec);
                    // console.log('logRec.Trigger_Progress__c: ' + cleanRecord.Trigger_Progress__c);
                    if (logRec.Trigger_Progress__c === 100) {
                        clearInterval(this.pollInterval);
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Trigger creation complete!',
                                variant: 'success'
                            })
                        );
                        this.checkTriggerIsPresent();
                        this.deleteLogRecord();
                    } else if (logRec.Trigger_Progress__c === -1) {
                        clearInterval(this.pollInterval);
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error',
                                message: logRec.Message__c,
                                variant: 'error'
                            })
                        );
                        this.checkTriggerIsPresent();
                        this.deleteLogRecord();
                    }
                    
                });
        }, 2000); // Poll every 2 seconds
    }

    deleteLogRecord() {
        if (this.logRecordId) {
            deleteRecord(this.logRecordId)
                .then(() => {
                    console.log('Log Record Deleted Successfully');
                })
                .catch(error => {
                    console.error('Error Deleting Log Record: ', error);
                    this.showToast(
                        'Error Deleting Log Record',
                        'Error: ' + error.message,
                        'error',
                        'dismissible'
                    );
                }
            );
        }
    }


    //* SELECTED OBJECT METHODS *//

    // On Select Object - Get Existing Tracked Field Recordd
    getExistingTrackedFields(){
        this.isLoading = true;
        this.currentObjectExistingTrackedFields = [];
        this.currentObjectExistingUnavailableTrackedFields = [];
        getExistingTrackedFields({
            objectAPI: this.currentSelectedObject
        })
        .then(result => {
            result.forEach(record => {
                // const cleanRecord = this.stripNamespaceKeys(record);
                this.currentObjectExistingTrackedFields.push(record.Field_API_Name__c);
                if(record.Field_Unavailable__c){
                    this.currentObjectExistingUnavailableTrackedFields.push(record);
                }
            });
        })
        .catch(error => {
            this.showToast(
                'Error retrieving Existing Tracked Fields!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
            this.isLoading = false;
        })
        .finally(() => {
            this.getListOfObjectFields();
        });
    }
    // Get list of Object Fields
    getListOfObjectFields(){
        this.objectFieldOptions = [];
        getObjectFields({
            objectAPI: this.currentSelectedObject
        })
        .then(result => {
            for (let key in result) {
                // Use stripNamespaceKeys to clean the field API name
                // const cleanKey = this.stripNamespaceKeys({ [key]: null });
                const fieldApiName = Object.keys(key)[0];
                const isTracking = this.currentObjectExistingTrackedFields.includes(fieldApiName);

                this.objectFieldOptions.push({
                    label: result[key],
                    value: fieldApiName,
                    tracking: isTracking
                });
            }
        })
        .catch(error => {
            this.showToast(
                'Error retrieving Object Fields!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
            this.isLoading = false;
        })
        .finally(() => {
            this.isLoading = false;
        });
    }
    // On Field Tracking Toggle Event
    handleFieldTrackingToggle(event) {
        // this.isLoading = true;
        let isChecked = event.target.checked;
        let fieldValue = event.target.value;
        let fieldLabel = event.target.label;

        if (isChecked) {
            // Validate Tracking within limits
            if(this.validateFieldLimit()){
                // Create Tracking Record
                this.createTrackingRecord(fieldValue, fieldLabel);
            }
            else {
                this.showToast(
                    'Field Tracking Limit Reached!',
                    'You have reached the field tracking limit of ' + this.trackingLimit + '.',
                    'error',
                    'dismissible'
                );
                this.getExistingTrackedFields();
            }
        }
        else {
            // Delete Tracking Record
            this.deleteTrackingRecord(fieldValue);
        }
    }

    validateFieldLimit(){
        return this.currentObjectExistingTrackedFields?.length < this.trackingLimit;
    }

    handleSelectExistingObject(event){
        this.isLoading = true;

        // Clear previous Selected Object Data
        this.clearAllObjectParams();

        this.currentSelectedObject = event.currentTarget.dataset.value;

        this.selectedSearchObject = ({
            label: event.currentTarget.dataset.label,
            value: event.currentTarget.dataset.value
        });

        // Check if Trigger for Selected Object is Present
        this.checkTriggerIsPresent();
    }
    

    createTrackingRecord(fieldValue, fieldLabel) {
        // Add Field from currentObjectExistingTrackedFields Array
        this.currentObjectExistingTrackedFields.push(fieldValue);

        const fields = {};
        fields[OBJECTAPI_FIELD.fieldApiName] = this.selectedSearchObject?.value;
        fields[OBJECTNAME_FIELD.fieldApiName] = this.selectedSearchObject?.label;
        fields[FIELDAPI_FIELD.fieldApiName] = fieldValue;
        fields[FIELDNAME_FIELD.fieldApiName] = fieldLabel;
        
        const recordInput = {
            apiName: TRACKING_OBJECT.objectApiName,
            fields: fields
        };
            
        createRecord(recordInput)
        .then((record) => {
            // Add Field to currentObjectExistingTrackedFields Array
            const rowToUpdate = this.objectFieldOptions.find(record => record['value'] === fieldValue);
            if (rowToUpdate) {
                rowToUpdate.tracking = true;
            }
        })
        .catch(error => {
            this.showToast(
                'Error adding field to Tracking!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );

            this.isLoading = false;
        })
        .finally(() => {
            this.getExistingTrackingObjects();
        });
    }

    deleteTrackingRecord(fieldValue) {
        // Remove Field from currentObjectExistingTrackedFields Array
        this.currentObjectExistingTrackedFields = this.currentObjectExistingTrackedFields.filter(v => v !== fieldValue); 

        deleteTrackingRecord({
            objectApiName: this.selectedSearchObject?.value,
            fieldApiName: fieldValue
        })
        .then((record) => {
            // Find the row
            const rowToUpdate = this.objectFieldOptions.find(record => record['value'] === fieldValue);
            if (rowToUpdate) {
                rowToUpdate.tracking = false;
            }
        })
        .catch(error => {
            this.showToast(
                'Error disabling Tracking for this Field!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        })
        .finally(() => {
            this.getExistingTrackingObjects();
        });
    }

    handle_deselectAllFields(){
        this.isLoading = true;
        deselectAllTrackedFields({
            objectApiName: this.currentSelectedObject
        })
        .then((result) => {
            if(result == 'success'){
                this.getExistingTrackedFields();
            }
            else {
                this.showToast(
                    'Error deselecting all fields!',
                    'Error: ' + result,
                    'error',
                    'dismissible'
                )
            }
            this.isLoading = false;
        })
        .catch(error => {
            this.showToast(
                'Error deselecting all fields!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
            this.isLoading = false;
        });
    }

    async removeTrigger() {
        const result = await historyModal.open({
            size: 'medium',
            arrayData: null,
            modalTitle: 'Remove \'' + this.selectedSearchObject.label + '\' Trigger',
            mode: 'Remove Object Trigger',
            triggerObject: this.currentSelectedObject
        });

        if(result === 'success'){
            this.isLoading = true;

            // Sore current values
            let currentSelectedObject = this.currentSelectedObject;
            let selectedSearchObject = this.selectedSearchObject;
            
            // Clear previous Selected Object Data
            this.clearAllObjectParams();

            // Restore values
            this.currentSelectedObject = currentSelectedObject
            this.selectedSearchObject = selectedSearchObject;

            // Check if Trigger for Selected Object is Present
            this.checkTriggerIsPresent();
            // this.getExistingTrackedFields();
        }
    }

    async openSettingsModal() {
        const result = await historyModal.open({
            size: 'small',
            arrayData: null,
            modalTitle: 'Mint History Tracking Settings',
            mode: 'Settings',
            triggerObject: this.autoArchiveDefaultRecord.Id
        });
    }

    handleRemoveUnavailableField(event) {
        let fieldValue = event.target.value;

        deleteTrackingRecord({
            objectApiName: this.selectedSearchObject?.value,
            fieldApiName: fieldValue
        })
        .then((record) => {
            this.showToast(
                'Success Removing Unavailable Field!',
                null,
                'success',
                'dismissible'
            );
        })
        .catch(error => {
            this.showToast(
                'Error Removing Unavailable Field!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        })
        .finally(() => {
            this.getExistingTrackedFields();
        });
    }




    //* AUTOMATIC ARCHIVE METHODS *//

    getAutoArchiveDefaultRecord() {
    this.autoArchiveDefaultRecord = [];
    getAutoArchiveDefaultRecord()
        .then((result) => {
            console.log('getAutoArchiveDefaultRecord result: ', result);
            if (result != null && result != undefined) {
                // const cleanResult = this.stripNamespaceKeys(result);
                this.autoArchiveDefaultRecord = result;

                if (result.Archive_Schedule_Active__c === true) {
                    result.style = 'background-color: #05C9DB; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;';
                } else {
                    result.style = 'background-color: #c75d5d; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;';
                }

                this.archivePeriod = result.Archive_Period_Years__c;
                this.autoArchiveActive = result.Archive_Schedule_Active__c;
                this.trackingLimit = result.Field_Tracking_Limit__c;
                this.trackingActive = result.Tracking_Active__c;
                this.trackingStatus = this.trackingActive ? 'Tracking Active' : 'Tracking Inactive';
                this.trackingStatusStyle = this.trackingActive
                    ? 'background-color: #05C9DB; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;'
                    : 'background-color: #c75d5d; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;';
                this.checkArchiveSettingsChange();
                this.isLoading = false;
            } else {
                this.createAutoArchiveDefaultRecord();
            }
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error getting Auto Archive Default Record!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    createAutoArchiveDefaultRecord(){
        this.autoArchiveDefaultRecord = []
        createAutoArchiveDefaultRecord()
        .then((result) => {
            this.checkDeploymentSuccess();
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error creating Auto Archive Default Record!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    checkDeploymentSuccess() {
        this.autoArchiveDefaultRecord = [];
        getAutoArchiveDefaultRecord()
        .then((result) => {
            if(result != null && result != undefined){
                // const cleanResult = this.stripNamespaceKeys(result);
                this.autoArchiveDefaultRecord = result;

                if (result.Archive_Schedule_Active__c === true) {
                    result.style = 'background-color: #05C9DB; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;';
                } else {
                    result.style = 'background-color: #c75d5d; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;';
                }

                this.archivePeriod = result.Archive_Period_Years__c;
                this.autoArchiveActive = result.Archive_Schedule_Active__c;
                this.trackingLimit = result.Field_Tracking_Limit__c;
                this.trackingActive = result.Tracking_Active__c;
                this.trackingStatus = this.trackingActive ? 'Tracking Active' : 'Tracking Inactive';
                this.trackingStatusStyle = this.trackingActive
                    ? 'background-color: #05C9DB; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;'
                    : 'background-color: #c75d5d; color: white; padding: 5px 10px 5px 10px; border-radius: 6px;';
                this.checkArchiveSettingsChange();
                this.isLoading = false;

                this.showToast(
                    'Schedule Updated',
                    'The Automatic Archiving Settings have been updated',
                    'success',
                    'dismissible'
                );
            }
            else {
                setTimeout(() => this.checkDeploymentSuccess(), 1000);
            }
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error getting Auto Archive Default Record!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }
    
    archivePeriodOptions_handleChange(event) {
        this.archivePeriod = event.detail.value;
        this.checkArchiveSettingsChange();
    }
    
    archivePeriodActive_handleChange(event) {
        this.autoArchiveActive = event.detail.checked;
        this.checkArchiveSettingsChange();
    }
    
    checkArchiveSettingsChange(){
        if(this.archivePeriod != this.autoArchiveDefaultRecord.Archive_Period_Years__c 
            || this.autoArchiveActive != this.autoArchiveDefaultRecord.Archive_Schedule_Active__c
        ){
            this.archiveScheduleChanged = true;
        } 
        else {
            this.archiveScheduleChanged = false;
        }
    }
    
    saveArchiveSchedule(){
        this.isLoading = true;
        updateAutoArchiveDefaultRecord({
            archivePeriodValue: this.archivePeriod,
            activeValue: this.autoArchiveActive,
            trackingActiveValue: null,
            recordId: this.autoArchiveDefaultRecord.Id
        })
        .then((result) => {
            // this.autoArchiveDefaultRecord = result;
            setTimeout(() => this.checkDeploymentSuccess(), 1000);
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error updating Auto Archive Default Record!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }
    
    saveTrackingActiveToggle(event){
        this.trackingActive = event.detail.checked;
        this.isLoading = true;
        updateAutoArchiveDefaultRecord({
            archivePeriodValue: null,
            activeValue: null,
            trackingActiveValue: this.trackingActive,
            recordId: this.autoArchiveDefaultRecord.Id
        })
        .then((result) => {
            setTimeout(() => this.checkDeploymentSuccess(), 1000);
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast(
                'Error updating Tracking Toggle!',
                'Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    showPickListOptions() {
        if (!this.searchResults) {
            this.searchResults = this.objectPicklistOptions;
        }
    }
    //#endregion
    
    
    //#region GETTERS & SETTERS
    get archivePeriodOptions() {
        return [
            { label: '1 Year', value: '1' },
            { label: '2 Years', value: '2' },
            { label: '3 Years', value: '3' },
            { label: '4 Years', value: '4' },
            { label: '5 Years', value: '5' },
        ];
    }
    
    get selectedSearchValue() {
        return this.selectedSearchObject?.label ?? null;
    }
    
    get getAutoArchiveStatus(){
        return this.autoArchiveDefaultRecord?.Archive_Schedule_Active__c ? 'Archive Active' : 'Archive Inactive';
    }
    
    get get_isAutoArchiveActive(){
        return this.autoArchiveDefaultRecord?.Archive_Schedule_Active__c;
    }

    get get_currentObjectExistingTrackedFields(){
        return (this.currentSelectedObject != null) ? 
        this.currentObjectExistingTrackedFields?.length + ' / ' + this.trackingLimit + ' Fields'
        : '';
    }

    get get_existingTrackedFieldsOnSelectedObject(){
        return this.currentObjectExistingTrackedFields?.length > 0 ? true : false;
    }

    get get_existingTrackedFieldsOver20(){
        return this.currentObjectExistingTrackedFields?.length > 25 ? true : false;
    }

    get get_currentObjectExistingUnavailableTrackedFields(){
        return this.currentObjectExistingUnavailableTrackedFields?.length > 0 ? true : false;
    }

    get get_existingTrackingObjects(){
        return this.existingTrackingObjects?.length + ' Tracked Objects';
    }

    get found_existingTrackingObjects(){
        return this.existingTrackingObjects?.length > 0 ? true : false;
    }

    get get_showRemoveTrigger(){
        return this.isTriggerPresent && this.currentSelectedObject != null ? true : false;
    }
    //#endregion
    
    //#region UTILITY FUNCTIONS
    showToast(title, message, variant, mode) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(event);
    }

    // Namespace Stripper Method - to make the tool work namespace agnostic
    stripNamespaceKeys(record) {
        const clean = {};
        Object.keys(record).forEach((key) => {
            const doubleUnderscoreIndex = key.indexOf('__');
            const shouldStrip = doubleUnderscoreIndex !== -1 && doubleUnderscoreIndex < key.length - 4;
            const cleanKey = shouldStrip ? key.slice(doubleUnderscoreIndex + 2) : key;
            clean[cleanKey] = record[key];
        });
        return clean;
    }
    //#endregion
}
import { api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import LightningModal from 'lightning/modal';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import deleteObjectTrigger from '@salesforce/apex/MintHistoryTrackingController.deleteObjectTrigger';
import getLogRecord from '@salesforce/apex/MintHistoryTrackingController.getLogRecord';
// import deleteLogRecord from '@salesforce/apex/MintHistoryTrackingController.getLogRecord';
import MHTC_OBJECT from '@salesforce/schema/Mint_History_Tracking_Configuration__c';

export default class MintHistoryTrackingModal extends LightningModal {
    //#region VARIABLES
    @api arrayData = [];                // Data to be displayed in the Modal
    @track searchTerm = '';             // Search Term for Filtering Data
    @track filteredData = [];           // Filtered Data to be displayed in the Modal
    @api mode;                          // Mode of the Modal
    @api modalTitle;                    // Title of the Modal
    @api triggerObject;                 // Object of the Trigger to be removed
    isHistoryRecordsMode = false;       // Flag to check if the Modal is in History Records Mode
    isRemoveTriggerMode = false;        // Flag to check if the Modal is in Remove Trigger Mode
    isSettingsMode = false;             // Flag to check if the Modal is in Settings Mode
    logRecordId;                        // Record Id of the Log Record created when removing the trigger
    pollInterval;                       // Interval for polling the log record
    isLoading = false;                  // Flag to show loading spinner

    columns = [
        {
            label: 'Field',
            fieldName: 'recordURL',
            type: 'url',
            typeAttributes: { label: { fieldName: 'Field__c' }, target: '_blank' },
            sortable: true
        },
        { label: 'Old Value', fieldName: 'Old_Value__c' },
        { label: 'New Value', fieldName: 'New_Value__c' },
        { label: 'Change Made By', fieldName: 'Change_Made_By_Name__c' },
        { label: 'Change Date', fieldName: 'Change_Date_Time__c', type: 'date', typeAttributes: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }}
    ];
    //#endregion

    //#region CALLBACKS & WIRES
    // Mode Handling
    connectedCallback() { 
        if(this.mode === 'View History Records'){
            this.filteredData = this.arrayData;
            this.isHistoryRecordsMode = true;
        }
        if(this.mode === 'Remove Object Trigger'){
            this.isRemoveTriggerMode = true;
        } 
        if(this.mode === 'Settings'){
            this.isSettingsMode = true;
        } 

        console.log('arrayData ==> ', this.arrayData);
        console.log('mode ==> ', this.mode);
        console.log('triggerObject ==> ', this.triggerObject);
        console.log('isHistoryRecordsMode ==> ', this.isHistoryRecordsMode);
        console.log('isRemoveTriggerMode ==> ', this.isRemoveTriggerMode);
        console.log('isSettingsMode ==> ', this.isSettingsMode);

        console.log('objectApiNameWithNamespace ==> ', this.objectApiNameWithNamespace);
        console.log('trackingActiveField ==> ', this.trackingActiveField);
        console.log('fieldTrackingLimitField ==> ', this.fieldTrackingLimitField);
        console.log('postChangesToChatterField ==> ', this.postChangesToChatterField);
        console.log('archiveScheduleField ==> ', this.archiveScheduleField);
        console.log('archivePeriodField ==> ', this.archivePeriodField);
    } 
    
    @wire(getObjectInfo, { objectApiName: MHTC_OBJECT })
    objectInfo;
    //#endregion
    
    //#region CORE FUNCTIONS
    // Search On Change / Filter Data
    handleSearchChange(event) { 
        this.searchTerm = event.target.value.toLowerCase(); 
        this.filteredData = this.arrayData.filter(record => { 
            return Object.values(record).some(value => 
                value && value.toString().toLowerCase().includes(this.searchTerm)
            ); 
        }); 
    }

    // Remove Trigger
    handleRemoveTrigger(){
        this.isLoading = true;
        console.log('Removing Trigger: ' + this.triggerObject);
        deleteObjectTrigger({ 
            triggerName: this.triggerObject 
        })
        .then(logId => {
            if(logId) {
                this.logRecordId = logId;
                this.pollForProgress();
            }
        })
        .catch((error) => {
            this.showToast(
                'Error Removing Trigger!',
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

                    console.log('logRec: ', logRec);
                    // const cleanRecord = this.stripNamespaceKeys(logRec);
                    console.log('logRec.Trigger_Progress__c: ' + logRec.Trigger_Progress__c);
                    if (logRec.Trigger_Progress__c === 100) {
                        clearInterval(this.pollInterval);
                        this.isLoading = false;
                        this.showToast(
                            'Trigger Removed!',
                            'The ' + this.triggerObject + ' Trigger has been removed successfully.',
                            'success',
                            'dismissible'
                        );
                        this.close('success');
                        this.deleteLogRecord();
                        // this.checkTriggerIsPresent();
                    } else if (logRec.Trigger_Progress__c === -1) {
                        clearInterval(this.pollInterval);
                        this.isLoading = false;
                        this.showToast(
                            'Error Removing Trigger!',
                            'The ' + this.triggerObject + ' Trigger has not been removed.',
                            'error',
                            'dismissible'
                        );
                        this.close('success');
                        // this.checkTriggerIsPresent();
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

    saveSettingsOnSuccess(){
        this.showToast(
            'Settings Saved!',
            null,
            'success',
            'dismissible'
        );
    }

    saveSettingsOnError(){
        this.showToast(
            'Error Saving Settings!',
            'Error Message: ' + error.message,
            'success',
            'dismissible'
        );
    }

    // Close Modal
    handleClose(){
        this.close();
    }
    //#endregion

    //#region GETTERS & SETTERS
    get objectApiNameWithNamespace() {
        // Prefer the apiName from getObjectInfo (always correct, includes namespace if present)
        if (this.objectInfo?.data?.apiName) {
            return this.objectInfo.data.apiName;
        }
        // Fallback: try to get from the schema import (may not include namespace in all contexts)
        if (MHTC_OBJECT?.objectApiName) {
            return MHTC_OBJECT.objectApiName;
        }
        // Final fallback: hardcoded string (non-namespaced)
        return 'Mint_History_Tracking_Configuration__c';
    }

    get trackingActiveField() {
        // Use the namespace prefix if present in the org
        if (this.objectInfo?.data?.fields) {
            // Find the field whose apiName ends with 'Tracking_Active__c'
            for (const key in this.objectInfo.data.fields) {
                if (key.endsWith('Tracking_Active__c')) {
                    return this.objectInfo.data.fields[key].apiName;
                }
            }
        }
        // fallback
        return 'Tracking_Active__c';
    }

    get fieldTrackingLimitField() {
        // Use the namespace prefix if present in the org
        if (this.objectInfo?.data?.fields) {
            // Find the field whose apiName ends with 'Tracking_Active__c'
            for (const key in this.objectInfo.data.fields) {
                if (key.endsWith('Field_Tracking_Limit__c')) {
                    return this.objectInfo.data.fields[key].apiName;
                }
            }
        }
        // fallback
        return 'Field_Tracking_Limit__c';
    }

    get postChangesToChatterField() {
        // Use the namespace prefix if present in the org
        if (this.objectInfo?.data?.fields) {
            // Find the field whose apiName ends with 'Tracking_Active__c'
            for (const key in this.objectInfo.data.fields) {
                if (key.endsWith('Post_Changes_to_Chatter_Feed__c')) {
                    return this.objectInfo.data.fields[key].apiName;
                }
            }
        }
        // fallback
        return 'Post_Changes_to_Chatter_Feed__c';
    
    }

    get archiveScheduleField() {
        // Use the namespace prefix if present in the org
        if (this.objectInfo?.data?.fields) {
            // Find the field whose apiName ends with 'Tracking_Active__c'
            for (const key in this.objectInfo.data.fields) {
                if (key.endsWith('Archive_Schedule_Active__c')) {
                    return this.objectInfo.data.fields[key].apiName;
                }
            }
        }
        // fallback
        return 'Archive_Schedule_Active__c';
    
    }

    get archivePeriodField() {
        // Use the namespace prefix if present in the org
        if (this.objectInfo?.data?.fields) {
            // Find the field whose apiName ends with 'Tracking_Active__c'
            for (const key in this.objectInfo.data.fields) {
                if (key.endsWith('Archive_Period_Years__c')) {
                    return this.objectInfo.data.fields[key].apiName;
                }
            }
        }
        // fallback
        return 'Archive_Period_Years__c';
    
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
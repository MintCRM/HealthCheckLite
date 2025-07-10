import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from "lightning/uiRecordApi";
import historyModal from 'c/mintHistoryTrackingModal';
import getMintHistoryRecords from '@salesforce/apex/MintHistoryTrackingController.getMintHistoryRecords';

const FIELDS = ['Id'];

export default class MintHistoryTrackingRelatedList extends LightningElement {
    //#region VARIABLES
    @api recordId;              // Current Record Id from Page
    @track data = [];           // All History Records on Related List
    @track dataFirst30 = [];    // Display first 30 History Records on Related List
    columns = [
        {
            label: 'Field',
            fieldName: 'recordURL',
            type: 'url',
            typeAttributes: {label: { fieldName: 'Field__c' }, 
            target: '_blank'},
            sortable: true
        },
        { label: 'Old Value', fieldName: 'Old_Value__c' },
        { label: 'New Value', fieldName: 'New_Value__c' },
        { label: 'User', fieldName: 'Change_Made_By_Name__c' },
        { label: 'Date', fieldName: 'Change_Date_Time__c', type: 'date', typeAttributes: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }}
    ];
    //#endregion

    //#region CALLBACKS & WIRES
    // wire getRecord used to enable real-time refresh on page
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord(result) {
        if (result.data) {
            this.getMintHistoryRecords();
        }
    }
    //#endregion

    //#region CORE FUNCTIONS
    // Get the History Records for the current Record
    getMintHistoryRecords(){
        this.data = [];
        getMintHistoryRecords({ 
            relatedRecordId: this.recordId 
        })
        .then(result => {
            // Strip namespace from all records
            this.data = result.map(record => {
                const cleanRecord = this.stripNamespaceKeys(record);
                cleanRecord.recordURL = '/' + record.Id;
                return cleanRecord;
            });
            this.dataFirst30 = this.data.slice(0, 30);
        })
        .catch(error => {
            this.showToast(
                'Error Reterieving History Records',
                'Error: ' + error.message + ' You may not have the correct Permissions to view History Records.',
                'error',
                'dismissible'
            );
        });
    }

    // Open the History Modal and pass in History Records
    async openModal() {
        const result = await historyModal.open({
            size: 'medium',
            arrayData: this.data,
            modalTitle: 'All History Records',
            mode: 'View History Records',
            triggerObject: null
        });
    }
    //#endregion

    //#region GETTERS & SETTERS
    get get_checkForData(){
        return this.data?.length > 0 ? true : false;
    }

    get get_moreThan30Records(){
        return this.data?.length > 30 ? true : false;
    }

    get get_countOfRecords(){
        return this.data?.length == 1 ? this.data?.length + ' record' : this.data?.length + ' records';
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
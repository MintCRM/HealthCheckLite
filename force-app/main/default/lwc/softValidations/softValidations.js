/**
 * @description       : SoftValidations JS
 * @author            : david bradburn
 *
 * Modifications Log 
 * Ver   Date         Author                            Modification
 * 1.0   20-02-2022   David Bradburn                    Initial Version
 * 2.0   12-08-2024   David Bradburn                    Updated to allow for collating validations with notification count
**/

import { LightningElement, track, api, wire } from 'lwc';
import getValidations from '@salesforce/apex/SoftValidationsController.getValidations';
import {getRecord } from 'lightning/uiRecordApi';

export default class SoftValidations extends LightningElement {

    // setup api elements
    @api recordId;              // Grab current Page ID
    @api objectApiName;         // Grab current Page Object
    @api collateNotifications;  // Set by the user when adding the softValidations tool to pages
    collateRecords = false;     // Decides whether softValidations are collated or not
    numberOfValidations;
    expanded = false;
    message;
    errors;
    errorOccured = false;
    objectValidations = [];
    foundValidationsMessages = false;

    // Wire a record.
    @wire(getRecord, { recordId: '$recordId', fields: ['Id']})
    getCurrentRecord({ data, error }) {
        if (data) {
            this.handleSoftValidation();
        } else if (error) {
            console.error('ERROR => ', JSON.stringify(error)); // handle error properly
        }
    };

    handleSoftValidation(){
        this.objectValidations = [];

        getValidations({
            objectName: this.objectApiName,
            recordId: this.recordId
		}).then(result => {
			this.objectValidations = result;
            if(this.objectValidations.length > 0){
                this.foundValidationsMessages = true;
                this.numberOfValidations = this.objectValidations.length;

                if(this.collateNotifications == true) {
                    this.collateRecords = true;
                } else {
                    this.collateRecords = false;
                }

                this.objectValidations.forEach(element => {
                    if(element.Message__c != undefined){
                        element.showMessage = true;
                    } else {
                        element.showMessage = false;
                    }
                    
                });
            } else {
                // console.log('*** No results found ***');
                this.foundValidationsMessages = false;
            }
		}).catch(error => {
			// this.dispatchEvent(new ShowToastEvent({title: 'Error!', message: 'Oops!' + error, variant: 'error',}),);
			this.errors = error;
            this.errorOccured = true;
		});
    } 


    toggleExpand() {
        this.expanded = !this.expanded;
    }

}
import { LightningElement, track, wire} from 'lwc';
import getSObjects from '@salesforce/apex/softValidationsManagerController.getSObjects';
import getExistingValidations from '@salesforce/apex/softValidationsManagerController.getExistingValidations';
import cloneValidationRecord from '@salesforce/apex/softValidationsManagerController.cloneValidationRecord';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import VALIDATION_OBJECT from "@salesforce/schema/Soft_Validation__c";
import OBJECT_FIELD from "@salesforce/schema/Soft_Validation__c.Object__c";
import RECORD_ID from "@salesforce/schema/Soft_Validation__c.Id";
import STYLE_FIELD from "@salesforce/schema/Soft_Validation__c.Validation_Style__c";
import TITLE_FIELD from "@salesforce/schema/Soft_Validation__c.Title__c";
import MESSAGE_FIELD from "@salesforce/schema/Soft_Validation__c.Message__c";
import CLAUSE_FIELD from "@salesforce/schema/Soft_Validation__c.Where_Clause__c";
import POSITION_FIELD from "@salesforce/schema/Soft_Validation__c.Position__c";
import ACTIVE_FIELD from "@salesforce/schema/Soft_Validation__c.Active__c";
import SoftValidationsLogo from '@salesforce/resourceUrl/SoftValidationsLogo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SoftValidationsManager extends LightningElement {

    @track objectPicklistOptions = [];
    selectedSobject;
    @track existingValidations = [];
    selectedStyle;
    title;
    message;
    whereClause;
    position;
    logo = SoftValidationsLogo;
    showCreateNewValidation = false;        // Toggles the create new Validation window
    createValitionPrompt = false;           // Alert if any fields are empty when creating a Validation Record
    loading = false;

    /* Set list of Styles */
    get validationStyles() {
        return [
            { label: 'Hard Alert', value: 'HardAlert' },
            { label: 'Soft Alert', value: 'SoftAlert' },
            { label: 'Hard Prompt', value: 'HardPrompt' },
            { label: 'Soft Prompt', value: 'SoftPrompt' },
            { label: 'Subtle Prompt', value: 'SubtlePrompt' },
            { label: 'Info', value: 'Info' },
        ];
    }

    connectedCallback() {
        this.loading = true;
        this.getListOfObjects();
    }

    getListOfObjects(){
        // this.objectPicklistOptions = [];
        getSObjects()
        .then(result => {
            this.objectPicklistOptions = [];
            for(var key in result){
                this.objectPicklistOptions.push({label:result[key], value:key});
            }

        }).catch(error => {
            // this.error = error;
        }).finally(error => {
            this.grabExistingValidations();
        });
    }

    /* Get list of existing Soft Validation records */
    grabExistingValidations(){
        this.existingValidations = [];
        getExistingValidations()
        .then(result => {  
            let previousSobject = 'none';
            let currentStyle = 'lightbackground';

            if(result.length === 0) {
                this.foundValidationRecords = false;
            } else {
                this.foundValidationRecords = true;

                result.forEach(element => {

                    const validation = {};
                    validation.record = element;
                    
                    if(element.Object__c == previousSobject || previousSobject == 'none'){
                        validation.style = currentStyle;
                    } else {
                        if(currentStyle == 'lightbackground') {
                            validation.style = 'darkbackground';
                            currentStyle = 'darkbackground';
                        } else if (currentStyle == 'darkbackground') {
                            validation.style = 'lightbackground';
                            currentStyle = 'lightbackground';
                        }
                        
                    }
    
                    this.existingValidations.push(validation);
    
                    previousSobject = element.Object__c;
                });
            }
        }).catch(error => {
            // this.error = error;
        }).finally(error => {
            this.loading = false;
        });
    }

    /* Get Create Record Inputs */
    handleSobjectChange(event) { this.selectedSobject = event.detail.value; }
    handleStyleChange(event) { this.selectedStyle = event.detail.value; }
    handleTitleChange(event) { this.title = event.detail.value; }
    handleMessageChange(event) { this.message = event.detail.value; }
    handleWhereClauseChange(event) { this.whereClause = event.detail.value; }
    handlePositionChange(event) { this.position = event.detail.value; }

    /* Update Validation Active / Inactive */
    updateValidationToggle(event){
        let checkBoxFieldValue = event.target.checked;
        let recordId = event.target.dataset.recordId;
        console.log(checkBoxFieldValue);
        console.log(recordId);

        const fields = {};
            fields[RECORD_ID.fieldApiName] = recordId;
            fields[ACTIVE_FIELD.fieldApiName] = checkBoxFieldValue;
        
        const recordInput = { fields };

        updateRecord(recordInput)
        .then(() => {
            if(checkBoxFieldValue == true) {
                this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Validation Activated', variant: 'success' }));
            } else {
                this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Validation Deactivated', variant: 'info' }));
            }
            
        })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error creating softValidation', message: error.body.message, variant: 'error' }));
        });
    }

    /* Update Validation record Style */
    updateStyle(event){
        let style = event.target.value;
        let recordId = event.target.dataset.recordId;

        const fields = {};
            fields[RECORD_ID.fieldApiName] = recordId;
            fields[STYLE_FIELD.fieldApiName] = style;
        
        const recordInput = { fields };

        updateRecord(recordInput)
        // .then(() => {
        //     this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Record updated', variant: 'success' }));
        // })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error updating softValidation Style', message: error.body.message, variant: 'error' }));
        });
    }

    /* Update Validation record Title*/
    updateTitle(event){
        let title = event.target.value;
        let recordId = event.target.dataset.recordId;

        const fields = {};
            fields[RECORD_ID.fieldApiName] = recordId;
            fields[TITLE_FIELD.fieldApiName] = title;
        
        const recordInput = { fields };

        updateRecord(recordInput)
        // .then(() => {
        //     this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Record updated', variant: 'success' }));
        // })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error updating softValidation Title', message: error.body.message, variant: 'error' }));
        });
    }

    /* Update Validation record Message*/
    updateMessage(event){
        let message = event.target.value;
        let recordId = event.target.dataset.recordId;

        const fields = {};
            fields[RECORD_ID.fieldApiName] = recordId;
            fields[MESSAGE_FIELD.fieldApiName] = message;
        
        const recordInput = { fields };

        updateRecord(recordInput)
        // .then(() => {
        //     this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Record updated', variant: 'success' }));
        // })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error updating softValidation Message', message: error.body.message, variant: 'error' }));
        });
    }

    /* Update Validation record Title*/
    updateWhereClause(event){
        let whereClause = event.target.value;
        let recordId = event.target.dataset.recordId;

        const fields = {};
            fields[RECORD_ID.fieldApiName] = recordId;
            fields[CLAUSE_FIELD.fieldApiName] = whereClause;
        
        const recordInput = { fields };

        updateRecord(recordInput)
        // .then(() => {
        //     this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Record updated', variant: 'success' }));
        // })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error updating softValidation Where Clause', message: error.body.message, variant: 'error' }));
        });
    }

    /* Update Validation record Title*/
    updatePosition(event){
        let position = event.target.value;
        let recordId = event.target.dataset.recordId;

        const fields = {};
            fields[RECORD_ID.fieldApiName] = recordId;
            fields[POSITION_FIELD.fieldApiName] = position;
        
        const recordInput = { fields };

        updateRecord(recordInput)
        // .then(() => {
        //     this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'Record updated', variant: 'success' }));
        //     this.grabExistingValidations(); // Refresh Existing Validations List
        // })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error updating softValidation Position', message: error.body.message, variant: 'error' }));
        });
    }
    

    /** Delete Soft Validation Records */
    removeValidation(event){
        let recordId = event.target.dataset.recordId;
        console.log(recordId);

        deleteRecord(recordId)
        .then(() => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'softValidation Deleted', variant: 'success' }));
            this.grabExistingValidations(); // Refresh Existing Validations List
        })
        .catch(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Error deleting softValidation', message: error.body.message, variant: 'error' }));
        });
    }

    /* Create Soft Validation Records */
    createValidation(){

        if((this.selectedSobject == undefined || this.selectedSobject == null) || 
            (this.selectedStyle == undefined || this.selectedStyle == null) || 
            (this.title == undefined || this.title == null) || 
            // (this.message == undefined || this.message == null) || 
            (this.whereClause == undefined || this.whereClause == null) || 
            (this.position == undefined || this.position == null)) {
                this.createValitionPrompt = true;
        } else {
            const fields = {};
            fields[OBJECT_FIELD.fieldApiName] = this.selectedSobject;
            fields[STYLE_FIELD.fieldApiName] = this.selectedStyle;
            fields[TITLE_FIELD.fieldApiName] = this.title;
            fields[MESSAGE_FIELD.fieldApiName] = this.message;
            fields[CLAUSE_FIELD.fieldApiName] = this.whereClause;
            fields[POSITION_FIELD.fieldApiName] = this.position;

            const recordInput = {
                apiName: VALIDATION_OBJECT.objectApiName,
                fields: fields
            };
            
            createRecord(recordInput)
            .then((record) => {
                console.log(record);
                this.grabExistingValidations(); // Refresh Existing Validations List
            }).finally(() => {
                this.createValitionPrompt = false;
            });
        }
    }

    cloneValidation(event) {
        let recordId = event.target.dataset.recordId;
        cloneValidationRecord({
            recordToCloneId: recordId
        })
        .catch(error => {
            // this.error = error;
        }).finally(error => {
            this.dispatchEvent( new ShowToastEvent({ title: 'Success', message: 'softValidation Cloned', variant: 'success' }));
            this.grabExistingValidations(); // Refresh Existing Validations List
        });
    }

    toggleValidationCreation(){
        this.showCreateNewValidation = !this.showCreateNewValidation;
        this.createValitionPrompt = false;
    }
    

}
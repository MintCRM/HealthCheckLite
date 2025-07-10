import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import COLLABORATOR_OBJECT from "@salesforce/schema/Case_Collaborator__c";
import CASE_FIELD from "@salesforce/schema/Case_Collaborator__c.Case__c";
import CONTACT_FIELD from "@salesforce/schema/Case_Collaborator__c.Collaborator__c";
import MANUALLY_ADDED_FIELD from "@salesforce/schema/Case_Collaborator__c.Manually_Added__c";
import COLLAB_ID_FIELD from "@salesforce/schema/Case_Collaborator__c.Id";
import EXCLUDED_FIELD from "@salesforce/schema/Case_Collaborator__c.Excluded__c";
import COLLAB_NOTE_FIELD from "@salesforce/schema/Case_Collaborator__c.Collaborator_Note__c";
import ADHOC_EMAIL_FIELD from "@salesforce/schema/Case_Collaborator__c.AdHoc_Collaborators_Email__c";
import getExistingCollaborators from '@salesforce/apex/caseCollaboratorsController.getExistingCollaborators';

export default class CaseCollaboratorsModal extends LightningModal {
    @api modalTitle;
    @api descriptionText;
    @api mode;
    @api arrayData = [];
    @track _arrayData;
    @api caseId;
    @api recordToDelete;
    existingCollaborators;
    isSearchAddCollabs = false;
    isDeleteRecord = false;
    isExcludeCollabs = false;
    isAddAdhocCollab = false;
    isAboutTool = false;
    isLoading = false;

    connectedCallback(){
        switch(this.mode){
            case 'searchCollabs':
                this._arrayData = [];
                this._arrayData = JSON.parse(JSON.stringify(this.arrayData));

                this._arrayData.forEach(record => {
                    record.added = false;
                });

                this.isSearchAddCollabs = true;
                break;
            case 'deleteRecord':
                this.isDeleteRecord = true;
                break;
            case 'excludeCollabs':
                this._arrayData = [];
                this._arrayData = JSON.parse(JSON.stringify(this.arrayData));
                this.isExcludeCollabs = true;
                break;
            case 'addAdhocCollab':
                this.isAddAdhocCollab = true;
                break;
            case 'aboutTool':
                this.isAboutTool = true;
                break;
        }

        this.getExistingCollaborators();
    }

    collabNoteCount(){
        let notesField = this.refs.notesField;
        let char = this.refs.charCount;
        let content = notesField.value;
        char.textContent = 10000 - content.length;
    }

    checkIfCollabExists(email){
        let returnValue = false;
        this.existingCollaborators?.forEach(record => {
            if(record.mint__Collaborators_Email__c == email){
                console.log('record email ==> ' + record.mint__Collaborators_Email__c + ' | emailValue ==> ' + email);
                returnValue = true;
            }
        });
        return returnValue;
    }

    addAdhocCollab(){
        // Retrive Add Ad-hoc Collab Field Values
        let emailValue = this.template.querySelector('[data-id="emailInput"]').value;
        let notesValue = this.template.querySelector('[data-id="notesInput"]').value;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let validEmail = emailPattern.test(emailValue);

        let foundExistingCollab = this.checkIfCollabExists(emailValue);        

        // Validate Email Input  
        if(emailValue.length == 0 || validEmail == false){
            // TOAST ERROR / VALIDATION 
            this.showToast(
                'Email Validation',
                'Please enter a valid Email Address',
                'error',
                'dismissible'
            );
        } else if (foundExistingCollab){
            this.showToast(
                'Collaborator Validation',
                'The email address entered is already listed as a Collaborator',
                'error',
                'dismissible'
            );
        } else {
            // Process Add Collab
            if(this.get_activeCollaborators < 25){
    
                const fields = {};
                fields[CASE_FIELD.fieldApiName] = this.caseId;
                fields[ADHOC_EMAIL_FIELD.fieldApiName] = emailValue;
                fields[COLLAB_NOTE_FIELD.fieldApiName] = notesValue;
                fields[MANUALLY_ADDED_FIELD.fieldApiName] = true;
                
                const recordInput = {
                    apiName: COLLABORATOR_OBJECT.objectApiName,
                    fields: fields
                };
                    
                createRecord(recordInput)
                .then((record) => {
                    this.close('success');
                })
                .catch(error => {
                    this.showToast(
                        'Error Creating Ad-Hoc Collaborator',
                        'Error: ' + error.message,
                        'error',
                        'dismissible'
                    );
                });
            }
            else {
                this.showToast(
                    'Limit Reached',
                    'A Maximum of 25 Active Collaborators can be added to a Case',
                    'warning',
                    'dismissible'
                );
            }
        }
    }

    getExistingCollaborators(){
        this.existingCollaborators = [];
        getExistingCollaborators({
            caseId: this.caseId
        })
        .then(result => {
            this.existingCollaborators = result;
        })
        .catch(error => {
            this.showToast(
                'Oooops!',
                'Error retrieving existing Collaborators! Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    addCollaborator(event){
        if(this.get_activeCollaborators < 25){
            const selectedRecordId = event.target.recordid;

            const fields = {};
            fields[CASE_FIELD.fieldApiName] = this.caseId;
            fields[CONTACT_FIELD.fieldApiName] = selectedRecordId;
            fields[MANUALLY_ADDED_FIELD.fieldApiName] = true;
            
            const recordInput = {
                apiName: COLLABORATOR_OBJECT.objectApiName,
                fields: fields
            };
            
            createRecord(recordInput)
            .then((record) => {
                console.log('success => ', record);
                // Remove add button for this requirement
                let recordIndex = this._arrayData.findIndex((record => record.Id == selectedRecordId));
                this._arrayData[recordIndex].added = !this._arrayData[recordIndex].added;
            })
            .catch(error => {
                this.showToast(
                    'Oooops!',
                    'Error adding Collaborator: ' + error.message,
                    'error',
                    'dismissible'
                );
            })
            .finally(() => {
                this.getExistingCollaborators();
            });
        }
        else {
            this.showToast(
                'Limit Reached',
                'A Maximum of 25 Active Collaborators can be added to a Case',
                'warning',
                'dismissible'
            );
        }
    }


    removeRecord(){
        deleteRecord(this.recordToDelete)
        .then(result => {
            this.handleClose();
        });
    }
    
    async toggleRecord(event){
        const selectedRecordId = event.target.recordid;
        const isChecked = event.target.checked;

        const fields = {};
        fields[COLLAB_ID_FIELD.fieldApiName] = selectedRecordId;
        fields[EXCLUDED_FIELD.fieldApiName] = isChecked;

        const recordInput = { fields };

        await updateRecord(recordInput)
        .catch(error => {
            this.showToast(
                'Oooops!',
                'Error excluding this Collaborator. Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }

    handleClose() {
        this.close('success');
    }


    get boolean_arrayData(){
        return this.arrayData?.length > 0;
    }

    get boolean_showDescription(){
        return this.descriptionText?.length > 0;
    }

    get get_activeCollaborators() {
        let activeCollaboratorsCount = 0;

        // Count only Active Collabs
        this.existingCollaborators?.forEach(collab => {
            if(collab.mint__Excluded__c == false){
                activeCollaboratorsCount++;
            }
        });

        return activeCollaboratorsCount;
    }


    showToast(title, message, variant, mode) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(event);
    }

}
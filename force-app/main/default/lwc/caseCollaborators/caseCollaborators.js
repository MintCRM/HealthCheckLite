import { LightningElement, api, track } from 'lwc';
import collabModal from 'c/caseCollaboratorsModal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCaseDetails from '@salesforce/apex/caseCollaboratorsController.getCaseDetails';
import getExistingCollaborators from '@salesforce/apex/caseCollaboratorsController.getExistingCollaborators';
import searchContacts from '@salesforce/apex/caseCollaboratorsController.searchContacts';

export default class CaseCollaborators extends LightningElement {
    @api recordId;
    case;
    accoundId;
    existingCollaborators;
    searchTerm = '';
    contacts;
    @track collabCounterStyle = '';

    connectedCallback(){
        this.getCaseDetails();
    }

    //! Wire Connector to remove the need for the refresh button
    //! Connector based on CaseId and AccountID
    // Call getCaseDetail on success

    // Get Case Details and store key variables
    getCaseDetails(){
        getCaseDetails({
            recordId: this.recordId
        })
        .then(result => {
            this.case = result;
            this.accountId = this.case.AccountId;
        })
        .catch(error => {
            this.showToast(
                'Oooops!',
                'Error retrieving Case Details! Error: ' + error.message,
                'error',
                'dismissible'
            );
        })
        .finally(() => { 
            this.getExistingCollaborators();
        });
    }

    getExistingCollaborators(){
        this.existingCollaborators = [];
        getExistingCollaborators({
            caseId: this.recordId
        })
        .then(result => {
            this.existingCollaborators = result;
            this.existingCollaborators.forEach(element => {
                if(element.mint__Excluded__c){
                    element.style = 'background-color: #c78585';
                    element.altText = 'Collaborator Excluded from Emails for this Case';
                    element.iconType = 'utility:hide';
                }
                else if(element.mint__Manually_Added__c){
                    element.style = 'background-color: #dbdbdb';
                    element.altText = 'Collaborator Manually Added to this Case';
                    element.iconType = 'utility:sender_email';
                }
                else {
                    element.style = 'background-color: white;';
                    element.altText = 'Accout Collaborator Automatically Added to this Case';
                    element.iconType = 'utility:email';
                }
            });
        })
        .catch(error => {
            this.showToast(
                'Oooops!',
                'Error retrieving existing Case Collaborators! Error: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }


    handleSearchChange(event){
        this.searchTerm = event.target.value;      
    }

    searchCollaborators(event) {
        const isEnterKey = event.keyCode === 13;

        if (isEnterKey) {

            if(this.searchTerm.length > 0){
                this.contacts = [];
                // this.isLoading = true;
                searchContacts({
                    searchTerm: this.searchTerm,
                    accountId: this.accountId,
                    caseId: this.recordId
                })
                .then(result => {
                    this.contacts = result;

                    this.openModal(
                        'Search & Add Collaborators',
                        'small',
                        'Search results for \'' + this.searchTerm + '\'...',
                        'searchCollabs',
                        this.contacts,
                        null
                    );

                })
                .catch(error => {
                    this.showToast(
                        'Oooops!',
                        'Error Searching for Collaborators: ' + error.message,
                        'error',
                        'dismissible'
                    );
                });
            }
            else {
                this.showToast(
                    'Search Term too Short',
                    'You need at least 1 character in the search field to search',
                    'warning',
                    'dismissible'
                );
            }
        }
    }


    removeCollaborator(event) {
        const selectedRecordId = event.target.recordid;
        const selectedEmail = event.target.dataset.emailaddress;

        this.openModal(
            'Remove Collaborator',
            'small',
            'Are you sure you would like to remove:  \'' + selectedEmail + '\' as a Collaborator on this Case?',
            'deleteRecord',
            null,
            selectedRecordId
        );
    }

    handleMenuActions(event) {
        let selectedAction = event.detail.value;

        switch(selectedAction){
            case 'manageExclusions':
                this.excludeCollaborator();
                break;
            case 'adHocCollaborator':
                this.openModal(
                    'Add Ad-hoc Collaborator by Email',
                    'small',
                    'Enter the email address of the person (Non-Account Contact) you would like to add as a Case Collaborator:',
                    'addAdhocCollab',
                    null,
                    null
                );
                break;
            case 'aboutTool':
                this.openModal(
                    'About the Case Collaborator Tool',
                    'small',
                    null,
                    'aboutTool',
                    null,
                    null
                );
                break;
        }
    }

    excludeCollaborator(event) {
        this.existingCollaborators = [];
        getExistingCollaborators({
            caseId: this.recordId
        })
        .then(result => {
            this.existingCollaborators = result;
            this.existingCollaborators.forEach(element => {
                if(element.mint__Excluded__c){
                    element.style = 'background-color: #c78585;';
                    element.altText = 'Excluded Collaborator for this Case';
                    element.iconType = 'utility:warning';
                }
                else if(element.mint__Manually_Added__c){
                    element.style = 'background-color: #dbdbdb;';
                    element.altText = 'Manually Added Collaborator for this Case';
                    element.iconType = 'utility:add';
                }
                else {
                    element.style = 'background-color: white;';
                    element.altText = 'Accout Case Collaborator';
                    element.iconType = 'utility:email';
                }
            });
        })
        .then(() => {
            this.openModal(
                'Manage Collaborators',
                'small',
                null,
                'excludeCollabs',
                this.existingCollaborators,
                null
            );
        })
        .catch(error => {
            this.showToast(
                'Oooops!',
                'Error excluding Collaborators: ' + error.message,
                'error',
                'dismissible'
            );
        });
    }


    async openModal(modalTitle, modalSize, descriptionText, mode, arrayData, recordToDelete) {
        const result = await collabModal.open({
            modalTitle: modalTitle,
            size: modalSize,
            descriptionText: descriptionText,
            mode: mode,
            arrayData: arrayData,
            caseId: this.recordId,
            recordToDelete: recordToDelete
        })
        .then((result) => {
            console.log(result);
            if(result == 'success'){
                this.getCaseDetails();
            }
        });
    }


    get get_foundCollaborators() {
        return this.existingCollaborators?.length > 0
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

    // Set Collab Counter Styling based on limit
    get get_collabCounterStyle(){
        return this.get_activeCollaborators >= 25 ? 'color: #c78585;' : '';
    }

    // Collab Counter Over Limit Boolean
    get get_collabCounterOverLimit(){
        return this.get_activeCollaborators >= 25 ? true : false;
    }

    // Collab Counter Close to Limit Boolean
    get get_collabCounterCloseToLimit(){
        return this.get_activeCollaborators >= 20 ? true : false;
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
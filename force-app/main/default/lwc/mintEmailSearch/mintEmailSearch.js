import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import searchUsers from '@salesforce/apex/mintEmailSearchController.searchUsers';
import searchEmailsWithTerm from '@salesforce/apex/mintEmailSearchController.searchEmailsWithTerm';
import searchEmailsWithUserId from '@salesforce/apex/mintEmailSearchController.searchEmailsWithUserId';
import getAllObjects from '@salesforce/apex/mintEmailSearchController.getAllObjects';
import searchCongaSolutionsWithTerm from '@salesforce/apex/mintEmailSearchController.searchCongaSolutionsWithTerm';
import searchCongaSolutionsWithUserId from '@salesforce/apex/mintEmailSearchController.searchCongaSolutionsWithUserId';

export default class MintEmailSearch extends NavigationMixin(LightningElement) {
    baseUrl;
    users;
    showUserSearchFeedback = false;
    @track recordCount = 0;
    // priorRecordCount = 0;
    selectedUserId = null;
    selectedUserName = null;
    selectedUserEmail = null;
    searchingForMessage = null;
    searchTerm;
    showSearchBar = true;
    isLoading = false;
    foundUsers = false;
    filterFromAddress = true;
    filterToAddress = true;
    filterCCAddress = true;
    filterBCCAddress = true;
    filterFromName = true;
    filterSubject = true;
    filterCongaSolutions = true;
    // filterBody = true;
    // filterDate = true;

    // Arrays
    allObjects = [];
    emailMessages;
    congaSolutions;


    connectedCallback(){
        this.baseUrl = window.location.origin;

        getAllObjects()
        .then(result => {
            this.allObjects = result;
        })
        .catch(error => {
            console.error(error.message);
        });
        
    } 


    searchUsers(event) {
        const isEnterKey = event.keyCode === 13;

        if (isEnterKey) {
            if(this.searchTerm.length > 0){
                this.users = [];
                this.isLoading = true;
                searchUsers({
                    searchTerm: this.searchTerm
                })
                .then(result => {
                    this.users = result;
                    this.recordCount = result.length;

                    if(this.recordCount > 0){
                        this.showUserSearchFeedback = false;
                    }
                    else {
                        this.showUserSearchFeedback = true;
                    }

                    if(this.users.length > 0){
                        this.foundUsers = true;
                    }
                    else {
                        this.foundUsers = false;
                    }

                })
                .catch(error => {
                    this.recordCount = 0;
                    this.foundUsers = false;
                    console.error(error);
                })
                .finally(() => { 
                    this.isLoading = false;
                });
            }
            else {
                this.recordCount = 0;
            }
        }
    }

    handleSearchChange(event){
        this.searchTerm = event.target.value;

        if(this.searchTerm.length == 0){
            this.showUserSearchFeedback = false;
            this.recordCount = 0;
            this.users = [];
            this.foundUsers = false;
        } 
    }

    selectUser(event) {
        this.isLoading = true;
        this.selectedUserId = event.currentTarget.dataset.id;
        this.selectedUserName = event.currentTarget.dataset.username;
        this.selectedUserEmail = event.currentTarget.dataset.useremail;
        this.showSearchBar = false;
        
        this.searchEmailswithUserId(this.selectedUserId);
        
    }

    backToSearch(){
        this.selectedUserId = null;
        this.selectedUserName = null;
        this.selectedUserEmail = null;
        this.searchingForMessage = null;
        this.users = [];
        this.foundUsers = false;
        this.showSearchBar = true;
        this.recordCount = 0;
    }


    searchEmailswithUserId(userId){
        this.emailMessages = [];
        this.congaSolutions = [];
        this.showUserSearchFeedback = false;
        this.showSearchBar = false;

        searchEmailsWithUserId({
            userId: userId,
            filterFromAddress: this.filterFromAddress, 
            filterToAddress: this.filterToAddress, 
            filterCCAddress: this.filterCCAddress, 
            filterBCCAddress: this.filterBCCAddress, 
            filterFromName: this.filterFromName, 
            filterSubject: this.filterSubject
        })
        .then(result => {
            this.emailMessages = result;
            this.recordCount = result.length;
            // this.priorRecordCount = result.length;

            this.emailMessages?.forEach(message => {
                if(message.EmailTemplateId){
                    message.hasEmailTemplateID = true;
                    message.emailTemplateLink = this.baseUrl + '/lightning/r/EmailTemplate/' + message.EmailTemplateId + '/view';
                }
                else {
                    message.hasEmailTemplateID = false;
                }
                message.emailMessageLink = this.baseUrl + '/lightning/r/EmailMessage/' + message.Id + '/view';
            })

            // Get Conga Solutions
            if(!this.get_disableCongaFilter && this.filterCongaSolutions){
                this.searchCongaSolutionsWithUserId(this.selectedUserId);
            }
            
        })
        .catch(error => {
            console.error(error);
            this.recordCount = 0;
        })
        .finally(() => {
            this.isLoading = false;
        });
    }
    
    searchEmailsWithTerm(){
        this.isLoading = true;
        this.emailMessages = [];
        this.congaSolutions = [];
        this.showUserSearchFeedback = false;
        this.showSearchBar = false;
        this.searchingForMessage = 'Searching for: \'' + this.searchTerm + '\'';

        // Search using the this.searchTerm value
        searchEmailsWithTerm({
            searchTerm: this.searchTerm,
            filterFromAddress: this.filterFromAddress, 
            filterToAddress: this.filterToAddress, 
            filterCCAddress: this.filterCCAddress, 
            filterBCCAddress: this.filterBCCAddress, 
            filterFromName: this.filterFromName, 
            filterSubject: this.filterSubject
        })
        .then(result => {
            this.emailMessages = result;
            this.recordCount = result.length;
            // this.priorRecordCount = result.length;

            this.emailMessages?.forEach(message => {
                if(message.EmailTemplateId){
                    message.hasEmailTemplateID = true;
                    message.emailTemplateLink = this.baseUrl + '/lightning/r/EmailTemplate/' + message.EmailTemplateId + '/view';
                }
                else {
                    message.hasEmailTemplateID = false;
                }
                message.emailMessageLink = this.baseUrl + '/lightning/r/EmailMessage/' + message.Id + '/view';
            })
            this.searchingForMessage = 'Searching for: \'' + this.searchTerm + '\'';


            // Get Conga Solutions
            if(!this.get_disableCongaFilter && this.filterCongaSolutions){
                this.searchCongaSolutionsWithTerm();
            }


        })
        .catch(error => {
            console.error(error);
            this.recordCount = 0;
        })
        .finally(() => {
            this.isLoading = false;
        });
    }


    searchCongaSolutionsWithUserId(userId){
        this.isLoading = true;
        // this.congaSolutions = [];
        this.showUserSearchFeedback = false;
        this.showSearchBar = false;

        searchCongaSolutionsWithUserId({
            userId: userId
        })
        .then(result => {
            this.congaSolutions = result;
            this.recordCount += +result.length;
            // this.priorRecordCount = result.length;

            this.congaSolutions?.forEach(solution => {
                solution.solutionLink = this.baseUrl + '/lightning/r/APXTConga4__Conga_Solution__c/' + solution.Id + '/view';
                solution.solutionButtonLink = this.baseUrl + '/lightning/setup/ObjectManager/' + solution.APXTConga4__Master_Object_Type__c + '/ButtonsLinksActions/' + solution.APXTConga4__Weblink_Id__c + '/view';
            });

        })
        .catch(error => {
            console.error(error);
            this.recordCount = 0;
        })
        .finally(() => {
            this.isLoading = false;
        });
    }
    
    searchCongaSolutionsWithTerm(){
        this.isLoading = true;
        // this.congaSolutions = [];
        this.showUserSearchFeedback = false;
        this.showSearchBar = false;
        // this.searchingForMessage = 'Searching for: \'' + this.searchTerm + '\'';

        // Search using the this.searchTerm value
        searchCongaSolutionsWithTerm({
            searchTerm: this.searchTerm
        })
        .then(result => {
            this.congaSolutions = result;
            this.recordCount += +result.length;
            // this.priorRecordCount = result.length;

            this.congaSolutions?.forEach(solution => {
                solution.solutionLink = this.baseUrl + '/lightning/r/APXTConga4__Conga_Solution__c/' + solution.Id + '/view';
                solution.solutionButtonLink = this.baseUrl + '/lightning/setup/ObjectManager/' + solution.APXTConga4__Master_Object_Type__c + '/ButtonsLinksActions/' + solution.APXTConga4__Weblink_Id__c + '/view';
            });
        })
        .catch(error => {
            console.error(error);
            this.recordCount = 0;
        })
        .finally(() => {
            this.isLoading = false;
        });
    }


    goToRecord(event){
        let link = event.currentTarget.dataset.link;

        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: link
            }
        }).then(generatedUrl => {
            window.open(generatedUrl);
        });
    }



    // FIlTER TOGGLES

    toggleFilterFromAddress(){
        this.filterFromAddress = !this.filterFromAddress;
    }

    toggleFilterToAddress(){
        this.filterToAddress = !this.filterToAddress;
    }

    toggleFilterCCAddress(){
        this.filterCCAddress = !this.filterCCAddress;
    }

    toggleFilterBCCAddress(){
        this.filterBCCAddress = !this.filterBCCAddress;
    }

    toggleFilterFromName(){
        this.filterFromName = !this.filterFromName;
    }

    toggleFilterSubject(){
        this.filterSubject = !this.filterSubject;
    }

    // toggleFilterBody(){
    //     this.filterBody = !this.filterBody;
    //     console.log('this.filterBody', this.filterBody);
    // }

    // toggleFilterDate(){
    //     this.filterDate = !this.filterDate;
    //     console.log('this.filterDate', this.filterDate);
    // }

    toggleFilterCongaSolution(){
        this.filterCongaSolutions = !this.filterCongaSolutions;
    }




    // GETTERS 

    get get_recordCounter(){
        return this.recordCount;
    }

    get get_showBackButton(){
        if(this.selectedUserId || this.searchingForMessage){
            return true;
        }
        else {
            return false;
        }
    }
    
    get get_emailMessagesFound(){
        return this.emailMessages?.length > 0
    }
    
    get get_congaSolutionsFound(){
        return this.congaSolutions?.length > 0
    }


    // Ensure TO or FROM is selected in filters
    get get_validateSelectedFilters(){
        return (
            this.filterFromAddress ||
            this.filterToAddress 
        );
    }

    get get_disableCongaFilter(){
        if ('APXTConga4__Conga_Solution__c' in this.allObjects){
            return false;
        } 
        else {
            return true;
        }
    }

}
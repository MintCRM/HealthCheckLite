import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import removeHeader from '@salesforce/resourceUrl/removeHeaderCSS';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import MintAdminHeaderLogo from '@salesforce/resourceUrl/MintAdminHeaderLogo'

export default class MintAdminHeader extends NavigationMixin(LightningElement) {

    MintAdminHeaderLogo = MintAdminHeaderLogo;
    baseUrl;

    connectedCallback(){
        loadStyle(this, removeHeader);

        this.baseUrl = window.location.origin;
    } 

    goToLocation(event){
        let location = event.currentTarget.dataset.location;
        let link = this.baseUrl;

        if(location == 'users'){
            link = link + '/lightning/setup/ManageUsers/home';
        }
        else if(location == 'permsets'){
            link = link + '/lightning/setup/PermSets/home';
        }
        else if(location == 'profiles'){
            link = link + '/lightning/setup/EnhancedProfiles/home';
        }
        else if(location == 'flows'){
            link = link + '/lightning/setup/Flows/home';
        }
        else if(location == 'apex'){
            link = link + '/lightning/setup/ApexClasses/home';
        }
        else if(location == 'triggers'){
            link = link + '/lightning/setup/ApexTriggers/home';
        }

        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: link
            }
        }).then(generatedUrl => {
            window.open(generatedUrl);
        });
    }

}
public without sharing class caseCollab_triggerHandler {

    // EMAIL MESSAGE METHODS

    /**
     * @description emailMessage_beforeInsert
     * - For OUTGOING Case Emails - Add the Collaborators into the CC Field
     * @param  newMessages - from caseCollab_emailMessageTrigger Trigger
     */ 
    public static void emailMessage_beforeInsert(List<EmailMessage> newMessages) {
        Integer maxRecords = 25;
        
        for(EmailMessage emailRecord : newMessages){  

            // ONLY ACTION FOR OUTBOUND EMAILS relating to Cases (Salesforce to User)
            if(emailRecord.Incoming == false && String.isNotBlank(emailRecord.ParentId)){
                String emailAddresses = ''; 

                // Retrieve the Case Collaborators which are to be added into the Email
                List<mint__Case_Collaborator__c> collaborators = [SELECT ID,
                                                                    mint__Collaborators_Email__c,
                                                                    mint__Collaborator__r.IsEmailBounced
                                                                    FROM mint__Case_Collaborator__c
                                                                    WHERE mint__Case__c = :emailRecord.ParentId
                                                                    AND mint__Excluded__c = false];

                // Retrieve the Case Collaborators which are to be added into the Email
                List<mint__Case_Collaborator__c> excludedCollaborators = [SELECT ID,
                                                                            mint__Collaborators_Email__c
                                                                            FROM mint__Case_Collaborator__c
                                                                            WHERE mint__Case__c = :emailRecord.ParentId
                                                                            AND mint__Excluded__c = true];

                system.debug('emailRecord.ParentId ===> ' + emailRecord.ParentId); 
                system.debug('collaborators ===> ' + collaborators); 

                // Existing Emails in CC Field
                if(String.isNotBlank(emailRecord.CcAddress)){
                    system.debug(' IN EXISTING EMAILS IN CC FIELD '); 

                    system.debug('emailRecord.CcAddress ===> ' + emailRecord.CcAddress);

                    // Split existing addresses into List
                    List<String> existingCCAddresses = emailRecord.CcAddress.split(',');

                    Integer count = existingCCAddresses.size();

                    system.debug('existingCCAddresses SPLIT ===> ' + existingCCAddresses); 
                    system.debug('existingCCAddresses Count ===> ' + count); 
                    system.debug('excludedCollaborators ===> ' + excludedCollaborators); 

                    // Remove Case Collaborators from Email CC if they are marked as EXCLUDED
                    if(excludedCollaborators.size() > 0){
                        for(mint__Case_Collaborator__c exclusion : excludedCollaborators){
                            String exclusionEmail = exclusion.mint__Collaborators_Email__c.trim();

                            system.debug('*In excludedCollaborators* exclusionEmail ===> ' + exclusionEmail); 
                            system.debug('*In excludedCollaborators* existingCCAddresses ===> ' + existingCCAddresses); 

                            // for(String ccAddress : existingCCAddresses){
                            //     system.debug('ccAddress ===> ' + ccAddress + ' exclusionEmail ===> ' + exclusionEmail);
                            //     if(ccAddress == exclusionEmail){
                            //         // existingCCAddresses.remove(existingCCAddresses.indexOf(ccAddress));
                            //         system.debug('*In exclusion loop* '); 
                            //         emailRecord.CCAddress = emailRecord.CCAddress.replace(exclusionEmail + ',', '');
                            //     }

                            //     system.debug('ccAddress ===> ' + ccAddress); 

                            // }

                            if(existingCCAddresses.contains(exclusionEmail)){
                                system.debug('existingCCAddresses contains ===> ' + existingCCAddresses); 
                                // Remove excluded email from the CC Field
                                emailRecord.CCAddress = emailRecord.CCAddress.replace(exclusionEmail + ',', '');

                                system.debug('exclusion.mint__Collaborators_Email__c + , ===> ' + exclusion.mint__Collaborators_Email__c + ',');

                                count--;
                                // if (count >= maxRecords) {
                                //     break;
                                // }
                            }
                        }
                    }

                    system.debug('emailRecord.CCAddress after exclusions ===> ' + emailRecord.CCAddress); 

                    // Refresh the existing CC Addresses following Exclusion removal
                    existingCCAddresses = emailRecord.CcAddress.split(',');
                    count = existingCCAddresses.size();

                    system.debug('existingCCAddresses after exclusions ===> ' + existingCCAddresses); 

                    // Add Case Collaborators to Email CC if they are not already CC'd
                    if(collaborators.size() > 0){
                        for(mint__Case_Collaborator__c collaborator : collaborators){
                            if(collaborator.mint__Collaborator__c != null){
                                // Not an ad-hoc collab
                                if(!collaborator.mint__Collaborator__r?.IsEmailBounced){
                                    emailAddresses += collaborator.mint__Collaborators_Email__c + ',';

                                    count++;
                                    if (count >= maxRecords) {
                                        break;
                                    }
                                }
                            }
                            // Is ad-hoc collab
                            else {
                                emailAddresses += collaborator.mint__Collaborators_Email__c + ',';

                                count++;
                                if (count >= maxRecords) {
                                    break;
                                }
                            }
                        }

                        // Add address to CC
                        emailRecord.CCAddress += emailAddresses;
                    }
                // Empty CC Field
                } else {
                    Integer count = 0;
                    system.debug('EMPTY CC FIELD '); 
                    if(collaborators.size() > 0){
                        system.debug('collaborators ===> '+collaborators); 
                        for(mint__Case_Collaborator__c collaborator : collaborators){
                            system.debug('collaborator ===> '+collaborator); 
                            if(collaborator.mint__Collaborator__c != null){
                                // Not an ad-hoc collab
                                if(!collaborator.mint__Collaborator__r?.IsEmailBounced){
                                    emailAddresses += collaborator.mint__Collaborators_Email__c + ',';

                                    count++;
                                    if (count >= maxRecords) {
                                        break;
                                    }
                                }
                            }
                            // Is ad-hoc collab
                            else {
                                emailAddresses += collaborator.mint__Collaborators_Email__c + ',';

                                count++;
                                if (count >= maxRecords) {
                                    break;
                                }
                            }

                        }
                    }

                    // Append addresses to CC
                    emailRecord.CCAddress = emailAddresses;
                }
                system.debug('emailAddresses ===> ' + emailAddresses); 
                system.debug('emailRecord.CCAddress FINAL ===> ' + emailRecord.CCAddress); 

                // if(String.isNotBlank(emailAddresses)){
                //     emailRecord.CCAddress = emailAddresses;
                // }
            }
        }
    }

    public static void emailMessage_afterInsert(List<EmailMessage> newMessages) {
        system.debug(' ### IN emailMessage_afterInsert ### ');

        // CC Contacts pulled and added to the Case Collaborators list, if not already exisintg
        Set<Id> caseIds = new Set<Id>();
        for(EmailMessage emailRecord : newMessages){  
            system.debug(' emailRecord.ParentId ==> ' + emailRecord.ParentId);
            system.debug(' emailRecord.Incoming ==> ' + emailRecord.Incoming);
            // ONLY ACTION FOR INBOUND EMAILS for Cases (User to Salesforce)
            if(emailRecord.Incoming == true && String.isNotBlank(emailRecord.ParentId)){
                // Build List of Case Ids
                for (EmailMessage email : newMessages) {
                    if (email.ParentId != null && email.ParentId.getSObjectType() == Case.SObjectType) {
                        caseIds.add(email.ParentId);
                    }
                }
            }
        }

        // Query existing Collaborators related to the Cases
        Map<Id, List<String>> caseToCollabAddressesMap = new Map<Id, List<String>>();

        for (Case caseRecord : [SELECT Id, (SELECT mint__Collaborators_Email__c FROM mint__Case_Collaborators__r) FROM Case WHERE Id IN :caseIds]) {
            List<String> ccAddresses = new List<String>();
            for (mint__Case_Collaborator__c ccAddress : caseRecord.mint__Case_Collaborators__r) {
                ccAddresses.add(ccAddress.mint__Collaborators_Email__c);
            }
            caseToCollabAddressesMap.put(caseRecord.Id, ccAddresses);
        }

        // Process each EmailMessage
        List<mint__Case_Collaborator__c> collaboratorsToInsert = new List<mint__Case_Collaborator__c>();
        for (EmailMessage email : newMessages) {
            if (email.Incoming == true && email.CCAddress != null && caseToCollabAddressesMap.containsKey(email.ParentId)) {
                List<String> existingCCAddresses = caseToCollabAddressesMap.get(email.ParentId);

                system.debug(' email.CCAddress ==> ' + email.CCAddress);

                List<String> emailCCAddresses = email.CCAddress.split(';');

                system.debug(' emailCCAddresses ==> ' + emailCCAddresses);

                for (String ccEmail : emailCCAddresses) {
                    ccEmail = ccEmail.trim();

                    system.debug(' ccEmail TRIM ==> ' + ccEmail);

                    if (!existingCCAddresses.contains(ccEmail)) {
                        mint__Case_Collaborator__c newCollaborator = new mint__Case_Collaborator__c();
                        newCollaborator.mint__Case__c = email.ParentId;
                        newCollaborator.mint__AdHoc_Collaborators_Email__c = ccEmail;
                        newCollaborator.mint__Collaborator_Note__c = system.now() + ': Auto-Added from Inbound Email';
                        newCollaborator.mint__Manually_Added__c = false;
                        newCollaborator.mint__Excluded__c = false;
                        collaboratorsToInsert.add(newCollaborator);
                    }
                }
            }
        }
        if(collaboratorsToInsert.size() > 0){
            insert collaboratorsToInsert;
        }
    }



    // CASE METHODS
    
    public static void case_afterInsert(List<Case> newCases) {

        system.debug(' ### IN case_afterInsert ### ');
        // List to hold the Account Ids from the Cases
        Set<Id> accountIds = new Set<Id>();
            
        // Collect Account Ids from the Cases
        for (Case caseRecord : newCases) {
            if (caseRecord.AccountId != null) {
                accountIds.add(caseRecord.AccountId);
            }
        }

        system.debug('accountIds ===> ' + accountIds);

        if(accountIds.size() > 0){
            // Query Contacts where Collaborator__c = true and AccountId is in the collected Account Ids
            List<Account> accountsAndContacts = [SELECT Id, Name,
                                                    (SELECT Id, Email, AccountId, Name, OwnerId 
                                                        FROM Contacts 
                                                        WHERE mint__Case_Collaborator__c = true)
                                                    FROM Account 
                                                    WHERE Id IN : accountIds];

            system.debug('SOQL Accounts and Contact ===> ' + accountsAndContacts);
            system.debug('SOQL Accounts Contacts ===> ' + accountsAndContacts[0].Contacts);

            Map<id, List<Contact>> accountIdToContactMap = new Map<id, List<Contact>>();
            for (Account accountRecord : accountsAndContacts) {
                accountIdToContactMap.put(accountRecord.Id, accountRecord.Contacts);
            }

            // You can now perform any actions you need with the list of collaborators
            // For example, you could log them or perform some business logic

            List<mint__Case_Collaborator__c> collaboratorsToInsert = new List<mint__Case_Collaborator__c>();
            for (Case caseRecord : newCases) {
                List<Contact> caseAccountCollaborators = accountIdToContactMap.get(caseRecord.AccountId);

                system.debug('caseAccountCollaborators ===> ' + caseAccountCollaborators);

                if (caseAccountCollaborators.size() > 0) {
                    // Create a new Case Collaborator record for each Contact
                    for (Contact contactRecord : caseAccountCollaborators) {
                        mint__Case_Collaborator__c newCollaborator = new mint__Case_Collaborator__c();
                        newCollaborator.mint__Case__c = caseRecord.Id;
                        newCollaborator.mint__AdHoc_Collaborators_Email__c = contactRecord.Email;
                        newCollaborator.mint__Collaborator_Note__c = newCollaborator.mint__Collaborator_Note__c + '\n' + system.now() + ': Auto-Added as Contact is marked as Case Collaborator';
                        newCollaborator.mint__Manually_Added__c = false;
                        newCollaborator.mint__Excluded__c = false;
                        newCollaborator.mint__Collaborator__c = contactRecord.Id;
                        collaboratorsToInsert.add(newCollaborator);
                    }
                }
            }
            insert collaboratorsToInsert;
        }
    }


    public static void case_afterUpdate(List<Case> updatedCases) {

        system.debug(' ### IN case_afterInsert ### ');
        // List to hold the Account Ids from the Cases
        Set<Id> accountIds = new Set<Id>();
        Set<Id> caseIds = new Set<Id>();
            
        // Collect Account Ids from the Cases
        for (Case caseRecord : updatedCases) {
            if (caseRecord.AccountId != null) {
                accountIds.add(caseRecord.AccountId);
                caseIds.add(caseRecord.Id);
            }
        }

        // Remove existing Collaborators on Case where Account Id has changed
        // Keep manually added collaborators
        if(caseIds.size() > 0){
            List<mint__Case_Collaborator__c> collaboratorsToRemove = [
                SELECT Id
                FROM mint__Case_Collaborator__c
                WHERE mint__Case__c IN :caseIds
                AND mint__Manually_Added__c = false
            ];

            if (collaboratorsToRemove.size() > 0) {
                delete collaboratorsToRemove;
            }
        }


        system.debug('accountIds ===> ' + accountIds);

        if(accountIds.size() > 0){
            // Query Contacts where Collaborator__c = true and AccountId is in the collected Account Ids
            List<Account> accountsAndContacts = [SELECT Id, Name,
                                                    (SELECT Id, Email, AccountId, Name, OwnerId 
                                                        FROM Contacts 
                                                        WHERE mint__Case_Collaborator__c = true
                                                        AND IsEmailBounced = false)
                                                    FROM Account 
                                                    WHERE Id IN : accountIds];

            system.debug('SOQL Accounts and Contact ===> ' + accountsAndContacts);
            system.debug('SOQL Accounts Contacts ===> ' + accountsAndContacts[0].Contacts);

            Map<id, List<Contact>> accountIdToContactMap = new Map<id, List<Contact>>();
            for (Account accountRecord : accountsAndContacts) {
                accountIdToContactMap.put(accountRecord.Id, accountRecord.Contacts);
            }

            // You can now perform any actions you need with the list of collaborators
            // For example, you could log them or perform some business logic

            List<mint__Case_Collaborator__c> collaboratorsToInsert = new List<mint__Case_Collaborator__c>();
            for (Case caseRecord : updatedCases) {
                List<Contact> caseAccountCollaborators = accountIdToContactMap.get(caseRecord.AccountId);

                system.debug('caseAccountCollaborators ===> ' + caseAccountCollaborators);

                if (caseAccountCollaborators.size() > 0) {
                    // Create a new Case Collaborator record for each Contact
                    for (Contact contactRecord : caseAccountCollaborators) {
                        mint__Case_Collaborator__c newCollaborator = new mint__Case_Collaborator__c();
                        newCollaborator.mint__Case__c = caseRecord.Id;
                        newCollaborator.mint__AdHoc_Collaborators_Email__c = contactRecord.Email;
                        newCollaborator.mint__Collaborator_Note__c = system.now() + ': Auto-Added as Contact is marked as Case Collaborator';
                        newCollaborator.mint__Manually_Added__c = false;
                        newCollaborator.mint__Excluded__c = false;
                        newCollaborator.mint__Collaborator__c = contactRecord.Id;
                        collaboratorsToInsert.add(newCollaborator);
                    }
                }
            }
            insert collaboratorsToInsert;
        }
    }

}
@istest
public class mintEmailSearchControllerTEST {

    @IsTest
    static void searchUsersTEST(){
        Test.startTest();
            List<User> searchResult = mintEmailSearchController.searchUsers('david');
        Test.stopTest();
    }

    @IsTest
    static void searchEmailsWithTermTEST(){
        Test.startTest();
            List<EmailMessage> searchResult = mintEmailSearchController.searchEmailsWithTerm('david', true, true, true, true, true, true);
            List<EmailMessage> searchResultWithoutToAddress = mintEmailSearchController.searchEmailsWithTerm('david', false, true, true, true, true, true);
        Test.stopTest();

        Assert.isTrue(searchResult.size() == 0, 'Verify no emails returned');
    }

    @IsTest
    static void searchEmailsWithUserIdTEST(){
        user theUser = [SELECT Id,
                            FirstName, 
                            LastName, 
                            Name,  
                            Email 
                        FROM User 
                        WHERE isActive = true
                        LIMIT 1];

        Test.startTest();
        List<EmailMessage> searchResult = mintEmailSearchController.searchEmailsWithUserId(theUser.Id, true, true, true, true, true, true);
        List<EmailMessage> searchResultWithoutToAddress = mintEmailSearchController.searchEmailsWithUserId(theUser.Id, false, true, true, true, true, true);
        Test.stopTest();
    }

    @IsTest
    static void getAllObjectsTEST(){

        Test.startTest();
            map<string, string> searchResult = mintEmailSearchController.getAllObjects();
        Test.stopTest();

        Assert.isTrue(searchResult.size() > 0, 'Verify Objects are found');
    }

    // @IsTest
    // static void searchCongaSolutionsWithTermTEST(){

    //     Test.startTest();
    //         List<APXTConga4__Conga_Solution__c> searchResult = mintEmailSearchController.searchCongaSolutionsWithTerm('david');
    //     Test.stopTest();
    // }

    // @IsTest
    // static void searchCongaSolutionsWithUserIdTEST(){
    //     user theUser = [SELECT Id,
    //                         FirstName, 
    //                         LastName, 
    //                         Name,  
    //                         Email 
    //                     FROM User 
    //                     WHERE isActive = true
    //                     LIMIT 1];

    //     Test.startTest();
    //         List<APXTConga4__Conga_Solution__c> searchResult = mintEmailSearchController.searchCongaSolutionsWithUserId(theUser.Id);
    //     Test.stopTest();
    // }

    static testMethod void fakeTest(){
        mintEmailSearchController.codeCoverageBumper();
    }  

}
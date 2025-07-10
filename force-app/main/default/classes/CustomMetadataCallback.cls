/**
 * @File Name          : CustomMetadataCallback.cls
 * @Description        : This class is used to handle the deployment result of the Custom Metadata Records
 * @Author             : Mint CRM
 * @Test Class         : MintHistoryTrackingControllerTest
 * 
 * @Modification Log   :
 * Ver       Date            Author      		    Modification
 * 1.0       2025-01-01      Mint CRM               Initial Version
 */

public class CustomMetadataCallback implements Metadata.DeployCallback {

    /**
     * @description handleResult - This method is used to handle the deployment result of the Custom Metadata Records
     * @param  result  - Metadata.DeployResult
     * @param  context - Metadata.DeployCallbackContext
     */
    public void handleResult(Metadata.DeployResult result,
                                Metadata.DeployCallbackContext context) {

        if (result.status == Metadata.DeployStatus.Succeeded) {
            System.debug('Deployment succeeded.');
        } else {
            System.debug('Deployment failed: ' + result.errorMessage);
            for (Metadata.DeployMessage message : result.details.componentFailures) {
                System.debug('Error: ' + message.problem);
            }
        }
    }
}